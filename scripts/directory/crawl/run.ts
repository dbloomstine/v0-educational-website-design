/**
 * The directory crawler (2026-10-25). Reads the source registry, crawls each
 * source politely, extracts with Claude Haiku 5.5, validates every row, and
 * writes the crawl plus a QA report. It never writes people to the database:
 * scripts/directory/crawl/refresh.ts diffs a crawl against the table and
 * loads it (only with --apply).
 *
 *   npx tsx scripts/directory/crawl/run.ts --category placement_agent,fund_finance_banker
 *   npx tsx scripts/directory/crawl/run.ts --source parkhill,rede --limit 5
 *
 * Options
 *   --registry <file>|db    the registry (default: db when SUPABASE env is set, else
 *                           scripts/directory/crawl/sources.seed.json)
 *   --source a,b            only these keys      --category a,b   only these trades
 *   --ci                    no headless Chrome: headless sources are listed for a local run
 *   --retry-empty           also run sources marked empty
 *   --budget 5              stop before the model call that would pass $5 (default 5)
 *   --limit N               at most N pages a source (a test)
 *   --out <dir>             run folder (default .directory-crawl/<date>)
 *   --category-files <dir> [--suffix platform] [--overwrite]
 *                           also write <dir>/<trade file>.<suffix>.jsonl (placement-agents.platform.jsonl …).
 *                           An existing file is never replaced without --overwrite, and *.v2.jsonl never
 *                           (those are hand-checked files other work owns; 2026-10-25)
 *   --fresh-readings        ask the model again even for pages whose text has not changed
 *   --update-registry       write last_run_at / last_counts / status / robots_ok to directory_sources
 *
 * Env: ANTHROPIC_API_KEY (else read from ~/v0-educational-website-design/.env.local, never printed),
 *      NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for --registry db / --update-registry,
 *      DIRECTORY_CRAWL_CACHE (page cache, default ~/.cache/fundopshq-directory).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { isCategoryId, type CategoryId } from '@/lib/directory/taxonomy'
import { crawlSource, type ReadingCache, type SourceResult } from '@/lib/directory/crawl/crawl'
import type { ExtractResult } from '@/lib/directory/crawl/extract'
import { Budget } from '@/lib/directory/crawl/extract'
import { PoliteFetcher } from '@/lib/directory/crawl/fetcher'
import { qaReport } from '@/lib/directory/crawl/qa'
import { parseSource, runnable } from '@/lib/directory/crawl/sources'
import type { SourceRow } from '@/lib/directory/crawl/types'

export const CATEGORY_FILES: Record<CategoryId, string> = {
  fund_lawyer: 'fund-lawyers',
  fund_auditor: 'fund-auditors',
  fund_tax_advisor: 'fund-tax-advisors',
  placement_agent: 'placement-agents',
  fund_finance_banker: 'fund-finance-bankers',
}

const args = process.argv.slice(2)
const opt = (n: string) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : undefined)
const flag = (n: string) => args.includes(`--${n}`)
const list = (n: string) => (opt(n) ?? '').split(',').map((s) => s.trim()).filter(Boolean)

function apiKey(): string {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY
  const p = join(homedir(), 'v0-educational-website-design/.env.local')
  const m = existsSync(p) ? readFileSync(p, 'utf8').match(/^ANTHROPIC_API_KEY\s*=\s*"?([^"\n]+)"?/m) : null
  if (!m) throw new Error('ANTHROPIC_API_KEY is not set')
  return m[1].trim()
}

const hasDb = () => !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function loadRegistry(): Promise<{ rows: SourceRow[]; from: string }> {
  const reg = opt('registry') ?? (hasDb() ? 'db' : 'scripts/directory/crawl/sources.seed.json')
  let raw: unknown[]
  if (reg === 'db') {
    const { data, error } = await db().from('directory_sources').select('*').order('key')
    if (error) throw new Error(`reading directory_sources failed (is the migration applied?): ${error.message}`)
    raw = data ?? []
  } else raw = JSON.parse(readFileSync(resolve(reg), 'utf8')) as unknown[]
  const rows: SourceRow[] = []
  for (const r of raw) {
    const p = parseSource(r)
    if (p.ok) rows.push(p.value)
    else console.log(`registry: skipping ${p.key}: ${p.error}`)
  }
  return { rows, from: reg }
}

async function main() {
  const started_at = new Date().toISOString()
  const today = started_at.slice(0, 10)
  const ci = flag('ci') || !!process.env.CI
  const budget = new Budget(Number(opt('budget') ?? 5))
  const only = new Set(list('source'))
  const cats = list('category')
  for (const c of cats) if (!isCategoryId(c)) throw new Error(`unknown category ${c}`)
  const limit = opt('limit') ? Number(opt('limit')) : undefined
  const outDir = resolve(opt('out') ?? `.directory-crawl/${today}`)
  mkdirSync(outDir, { recursive: true })

  const { rows: registry, from } = await loadRegistry()
  const picked = registry.filter((s) => (!only.size || only.has(s.key)) && (!cats.length || cats.includes(s.category) || s.selectors.categories?.some((c) => cats.includes(c))))
  const skipped: { key: string; why: string }[] = []
  const todo = picked.filter((s) => {
    // A source named with --source runs even when it was empty last time; blocked and (in CI) headless never do.
    const r = runnable(s, { ci, retryEmpty: flag('retry-empty') || only.has(s.key) })
    if (!r.run) skipped.push({ key: s.key, why: r.why ?? '' })
    return r.run
  })
  console.log(`registry ${from}: ${registry.length} sources; running ${todo.length}${skipped.length ? `, skipping ${skipped.length}` : ''}; budget $${budget.limitUsd}${ci ? '; CI mode' : ''}`)

  const fetcher = new PoliteFetcher({ allowRender: !ci })
  // Earlier model readings, one file each, beside the page cache (--fresh-readings ignores them).
  const readingDir = join(fetcher.cacheDir, '_readings')
  mkdirSync(readingDir, { recursive: true })
  const readingCache: ReadingCache | undefined = flag('fresh-readings')
    ? undefined
    : {
        get: (k) => (existsSync(join(readingDir, `${k}.json`)) ? (JSON.parse(readFileSync(join(readingDir, `${k}.json`), 'utf8')) as ExtractResult) : undefined),
        set: (k, v) => writeFileSync(join(readingDir, `${k}.json`), JSON.stringify(v)),
      }
  const key = apiKey()
  const results: SourceResult[] = []
  let i = 0
  let stopped: string | undefined
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (i < todo.length) {
        const s = todo[i++]
        try {
          const r = await crawlSource(s, fetcher, budget, { apiKey: key, allowRender: !ci, limit, log: (m) => console.log(m), readingCache })
          results.push(r)
          if (r.stopped?.startsWith('budget')) stopped = r.stopped
          console.log(`${s.key}: ${r.status}; ${r.pages.read}/${r.discovery.jobs.length} pages read, ${r.extracted} people read, ${r.rows.length} kept, ${r.rejected.length} rejected; $${budget.usd.toFixed(4)} so far`)
        } catch (e) {
          console.log(`${s.key}: ERROR ${e instanceof Error ? e.message : e}`)
        }
      }
    }),
  )
  results.sort((a, b) => a.source.key.localeCompare(b.source.key))

  // Files: the crawl in the loader's shape, rejects, raw readings, the QA report, a summary.
  const all = results.flatMap((r) => r.rows)
  const jsonl = (rows: unknown[]) => rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : '')
  writeFileSync(join(outDir, 'people.jsonl'), jsonl(all))
  writeFileSync(join(outDir, 'rejected.jsonl'), jsonl(results.flatMap((r) => r.rejected)))
  writeFileSync(join(outDir, 'readings.jsonl'), jsonl(results.flatMap((r) => r.candidates.map((c) => ({ source: c.source_key, bio_url: c.page.bio_url, kind: c.page.kind, fetched_at: c.fetched_at, ...c.person })))))
  const finished_at = new Date().toISOString()
  writeFileSync(join(outDir, 'qa.md'), qaReport(results, { started_at, finished_at, spend: budget.toJSON(), ci, stopped }, today))
  // A source counts as fully crawled (its missing people may be stamped) only when nothing stopped it.
  const complete = results.filter((r) => r.status === 'ok' && !r.stopped && !r.pages.failed && !r.pages.model_errors && !r.discovery.needsHeadless)
  const summary = {
    started_at,
    finished_at,
    spend: budget.toJSON(),
    stopped: stopped ?? null,
    skipped,
    complete_sources: complete.map((r) => r.source.key),
    complete: complete.map((r) => ({ firm_domain: r.source.firm_domain, categories: r.source.selectors.categories?.length ? r.source.selectors.categories : [r.source.category] })),
    sources: results.map((r) => ({
      key: r.source.key,
      status: r.status,
      method: r.source.method,
      needs_headless: r.discovery.needsHeadless,
      counts: { pages: r.discovery.jobs.length, read: r.pages.read, reused_readings: r.cachedReadings, failed: r.pages.failed, model_errors: r.pages.model_errors, extracted: r.extracted, kept: r.rows.length, rejected: r.rejected.length, duplicates: r.duplicates, flagged: [...r.flags.values()].filter((f) => f.length).length },
      notes: [r.stopped, ...r.discovery.notes].filter(Boolean),
    })),
    fetch: fetcher.stats,
  }
  writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2))

  const filesDir = opt('category-files')
  if (filesDir) {
    const suffix = opt('suffix') ?? 'platform'
    if (suffix === 'v2') throw new Error('--suffix v2 is refused: *.v2.jsonl files are hand-checked and owned by other work')
    const ran = new Set(results.flatMap((r) => (r.source.selectors.categories?.length ? r.source.selectors.categories : [r.source.category])))
    for (const c of ran) {
      const rows = all.filter((r) => r.category === c).sort((a, b) => a.firm_name.localeCompare(b.firm_name) || a.full_name.localeCompare(b.full_name))
      const p = join(resolve(filesDir), `${CATEGORY_FILES[c]}.${suffix}.jsonl`)
      if (existsSync(p) && !flag('overwrite')) {
        console.log(`not written: ${p} exists (add --overwrite to replace it)`)
        continue
      }
      writeFileSync(p, jsonl(rows))
      console.log(`wrote ${rows.length} rows to ${p}`)
    }
  }

  if (flag('update-registry')) {
    if (!hasDb()) throw new Error('--update-registry needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    for (const r of results) {
      const c = summary.sources.find((x) => x.key === r.source.key)!.counts
      const robotsOk = r.discovery.notes.some((n) => /: robots/.test(n)) ? false : r.pages.read > 0 ? true : r.source.robots_ok
      const { error } = await db().from('directory_sources').update({ last_run_at: finished_at, last_counts: c, status: r.status, robots_ok: robotsOk }).eq('key', r.source.key)
      if (error) console.log(`registry update ${r.source.key}: ${error.message}`)
    }
  }

  console.log(`\n${all.length} people kept from ${results.length} sources; $${budget.usd.toFixed(4)} spent (${budget.calls} calls)`)
  console.log(`files: ${outDir}/{people.jsonl, rejected.jsonl, readings.jsonl, qa.md, summary.json}`)
  if (skipped.length) console.log(`not run: ${skipped.map((s) => `${s.key} (${s.why})`).join(', ')}`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
