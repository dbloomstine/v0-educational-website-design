/**
 * The refresh (2026-10-25): diff a crawl (scripts/directory/crawl/run.ts) against
 * directory_people, print it, and only with --apply write it.
 *
 *   npx tsx --env-file=.env.local scripts/directory/crawl/refresh.ts .directory-crawl/2026-10-25            # dry run
 *   npx tsx --env-file=.env.local scripts/directory/crawl/refresh.ts .directory-crawl/2026-10-25 --apply
 *   npx tsx scripts/directory/crawl/refresh.ts <run dir> --against old.jsonl          # file vs file, no DB
 *
 * The rules (lib/directory/crawl/diff.ts, tested):
 *   - new people arrive as `review` (nobody is public until the desk publishes them)
 *   - a changed person gets the changed crawled fields only; a claimed profile's own
 *     fields (headline, photo, contact, practice tags, notable…) and the status are never written
 *   - a removed person is never brought back
 *   - missing_since is stamped only for firms the crawl covered completely (summary.json
 *     `complete`), and not for a firm whose crawl found under 60% of what is stored
 *   - 30 days after missing_since the site stops showing the person (lib/directory/people.ts);
 *     the refresh lists them as expired
 *   - every line is re-checked by the loader's own parser (lib/directory/loader.ts) first
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { FIRM_SITE_FIELDS, assignSlug, parseRecord } from '@/lib/directory/loader'
import { assertCrawledOnly, compareFiles, diffCrawl, type Diff, type StoredRow } from '@/lib/directory/crawl/diff'
import type { CategoryId } from '@/lib/directory/taxonomy'
import type { DirectoryRow } from '@/lib/directory/crawl/types'

const args = process.argv.slice(2)
const opt = (n: string) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : undefined)
const runDir = args.find((a, i) => !a.startsWith('--') && !['--against', '--today'].includes(args[i - 1]))
const apply = args.includes('--apply')
const today = opt('today') ?? new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

const readJsonl = (p: string): Record<string, unknown>[] =>
  readFileSync(p, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as Record<string, unknown>)

function printDiff(d: Diff) {
  console.log(`  new (arrive as review): ${d.added.length}`)
  console.log(`  changed: ${d.changed.length} (claimed among them: ${d.changed.filter((c) => c.claimed).length})   date only: ${d.touched.length}   back after missing: ${d.returned.length}`)
  console.log(`  to stamp missing_since ${today}: ${d.missing.length}   expired (missing > 30 days, off the site): ${d.expired.length}`)
  console.log(`  read but refused this time (not stamped): ${d.refused.length}`)
  console.log(`  skipped: ${d.skipped.length}   firms not stamped (crawl found too few): ${d.suppressed.length}`)
  for (const r of d.added.slice(0, 30)) console.log(`    + ${r.slug}  ${r.full_name}, ${r.title} (${r.firm_name})`)
  for (const c of d.changed.slice(0, 40)) console.log(`    ~ ${c.slug}: ${c.fields.map((f) => `${f} ${JSON.stringify(c.before[f])} -> ${JSON.stringify(c.set[f])}`).join('; ')}${c.claimed ? '  [CLAIMED]' : ''}`)
  for (const m of d.missing.slice(0, 30)) console.log(`    ? ${m.slug} (${m.firm_domain}) not in this crawl`)
  for (const m of d.refused.slice(0, 30)) console.log(`    r ${m.slug}: still on the site, refused this time (see rejected.jsonl); not stamped, desk to look`)
  for (const m of d.expired.slice(0, 30)) console.log(`    x ${m.slug} missing since ${m.missing_since}`)
  for (const s of d.suppressed) console.log(`    ! ${s.firm_domain}: crawl found ${s.crawled} of ${s.stored} stored; nobody stamped (redesign or block?)`)
  for (const s of d.skipped) console.log(`    - ${s.slug}: ${s.reason}`)
}

async function main() {
  if (!runDir) throw new Error('usage: refresh.ts <run dir> [--apply] [--against old.jsonl] [--today YYYY-MM-DD]')
  const dir = resolve(runDir)
  const summary = JSON.parse(readFileSync(join(dir, 'summary.json'), 'utf8')) as { complete: { firm_domain: string; categories: CategoryId[] }[] }

  // Every line through the loader's own parser too: one bad line never half-loads.
  const crawled: DirectoryRow[] = []
  const refused: string[] = []
  for (const raw of readJsonl(join(dir, 'people.jsonl'))) {
    const p = parseRecord(raw)
    if (!p.ok) refused.push(p.error)
    else crawled.push({ ...(raw as unknown as DirectoryRow), ...p.value, title: p.value.title ?? '', bio_url: p.value.bio_url ?? '', fetched_at: p.value.fetched_at ?? '', source: p.value.source ?? 'firm_site', source_url: p.value.source_url ?? null, city_basis: p.value.city_basis ?? 'person', office_source_url: p.value.office_source_url ?? null })
  }
  if (refused.length) throw new Error(`the loader refuses ${refused.length} lines (first: ${refused[0]}): fix the crawl, nothing written`)
  const categories = new Set(crawled.map((r) => r.category))
  const refusedSlugs = new Set(readJsonl(join(dir, 'rejected.jsonl')).map((r) => String(r.slug ?? '')).filter(Boolean))
  const firms = new Set(summary.complete.map((c) => c.firm_domain))

  const against = opt('against')
  if (against) {
    const old = readJsonl(resolve(against)) as unknown as DirectoryRow[]
    const cmp = compareFiles(old, crawled)
    console.log(`${against} (${old.length}) vs ${dir}/people.jsonl (${crawled.length}): ${cmp.both} in both, ${cmp.onlyOld.length} only old, ${cmp.onlyNew.length} only new`)
    for (const [f, xs] of Object.entries(cmp.fieldChanges)) console.log(`  ${f}: ${xs.length} changed`)
    // Treat the old file as the table: what would a load do?
    const stored: StoredRow[] = old.map((r, i) => ({ ...r, id: String(i), status: 'published', missing_since: null }))
    printDiff(diffCrawl(stored, crawled, { today, firms, categories, refused: refusedSlugs }))
    return
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  // source_url arrives with 20261025_directory_sources.sql; before it, the refresh reads and writes without it.
  const PROV = ['source_url', 'city_basis', 'office_source_url']
  let cols = ['id', 'slug', 'category', 'status', 'missing_since', 'claimed_at', ...FIRM_SITE_FIELDS, 'source', ...PROV]
  const stored: StoredRow[] = []
  for (let from = 0; ; from += 1000) {
    let { data, error } = await db.from('directory_people').select(cols.join(', ')).order('slug').range(from, from + 999)
    if (error && /source_url|city_basis|office_source_url/.test(error.message) && from === 0) {
      cols = cols.filter((c) => !PROV.includes(c))
      ;({ data, error } = await db.from('directory_people').select(cols.join(', ')).order('slug').range(from, from + 999))
    }
    if (error) throw new Error(`reading directory_people failed: ${error.message}`)
    stored.push(...((data ?? []) as unknown as StoredRow[]))
    if (!data || data.length < 1000) break
  }
  const withUrl = cols.includes('source_url')
  if (!withUrl && crawled.some((r) => r.source !== 'firm_site' || r.city_basis !== 'person')) {
    console.log('note: provenance columns missing (apply 20261025_directory_sources.sql); speaker, press-release and borrowed-office rows will not be written')
  }
  // Slugs are unique across trades: one another trade holds gets this trade's suffix (the loader's rule).
  const bySlug = new Map(stored.map((s) => [s.slug, s]))
  const taken = new Map<string, DirectoryRow>()
  for (const r of crawled) {
    const slot = assignSlug(r, bySlug, taken)
    if (!slot || 'duplicate' in slot) throw new Error(`no slug for ${r.slug}: nothing written`)
    r.slug = slot.slug
    taken.set(r.slug, r)
  }
  const d = diffCrawl(stored, crawled, { today, firms, categories, refused: refusedSlugs })
  console.log(`${dir}: ${crawled.length} people; table holds ${stored.length} in ${[...categories].join(', ')}; ${firms.size} firms fully crawled`)
  printDiff(d)
  if (!apply) {
    console.log('\nDry run: nothing written. Add --apply to write.')
    return
  }

  const strip = (r: DirectoryRow) => {
    const { source_url, city_basis, office_source_url, ...rest } = r
    return withUrl ? { ...rest, source_url, city_basis, office_source_url } : rest
  }
  // Without the provenance columns a row that needs them is never written (it would lose where it came from).
  const storable = d.added.filter((r) => withUrl || (r.source === 'firm_site' && r.city_basis === 'person'))
  for (let i = 0; i < storable.length; i += 200) {
    const { error } = await db.from('directory_people').insert(storable.slice(i, i + 200).map((r) => ({ ...strip(r), status: 'review' })))
    if (error) throw new Error(`insert failed at ${i}: ${error.message}`)
  }
  for (const c of [...d.changed, ...d.touched]) {
    const set = { ...c.set } as Record<string, unknown>
    if (!withUrl) for (const k of PROV) delete set[k]
    assertCrawledOnly(set)
    const { error } = await db.from('directory_people').update(set).eq('id', c.id).neq('status', 'removed')
    if (error) throw new Error(`update of ${c.slug} failed: ${error.message}`)
  }
  for (let i = 0; i < d.missing.length; i += 200) {
    const { error } = await db.from('directory_people').update({ missing_since: today }).in('id', d.missing.slice(i, i + 200).map((m) => m.id)).is('missing_since', null)
    if (error) throw new Error(`missing stamp failed: ${error.message}`)
  }
  console.log(`\nWritten: ${d.added.length} new (review), ${d.changed.length + d.touched.length} updated, ${d.missing.length} stamped missing.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
