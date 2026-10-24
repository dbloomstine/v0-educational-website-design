/**
 * One source, end to end (2026-10-25): discover → fetch → extract → validate.
 * Writes nothing itself; the CLI (scripts/directory/crawl/run.ts) writes the
 * files and the QA report from what this returns.
 */
import type { CategoryId } from '../taxonomy'
import { discoverSource, type Discovery } from './discover'
import { createHash } from 'node:crypto'
import { BudgetExceeded, EXTRACT_MODEL, extractPeople, schema, systemPrompt, type Budget, type ExtractResult } from './extract'
import type { PoliteFetcher } from './fetcher'
import { chunkText, filterLines, htmlToText } from './parse'
import type { Candidate, DirectoryRow, PageJob, SourceRow, SourceStatus } from './types'
import { cleanName, setFlags, slugFor, tradeOf, validateCandidate } from './validate'

/** Where earlier readings are kept (scripts/directory/crawl/run.ts backs it with files next to the page cache). */
export interface ReadingCache {
  get(key: string): ExtractResult | undefined
  set(key: string, value: ExtractResult): void
}

/** The reading's identity: the model, its instructions and the exact text it reads. */
export function readingKey(a: { categories: CategoryId[]; url: string; text: string; firmName: string; purePlay: boolean }): string {
  return createHash('sha256')
    .update(JSON.stringify([EXTRACT_MODEL, systemPrompt(a.categories), schema(a.categories), a.url, a.firmName, a.purePlay, a.text]))
    .digest('hex')
}

export interface Rejected {
  source_key: string
  /** The slug the row would have had: a stored person read but refused is not "missing" (they are still on the site). */
  slug: string
  category: CategoryId
  full_name: string
  bio_url: string
  errors: string[]
}

export interface SourceResult {
  source: SourceRow
  discovery: Discovery
  status: SourceStatus
  pages: { read: number; failed: number; model_errors: number }
  extracted: number
  candidates: Candidate[]
  rows: DirectoryRow[]
  flags: Map<string, string[]>
  rejected: Rejected[]
  rejectReasons: Record<string, number>
  duplicates: number
  /** Pages whose earlier reading was reused (unchanged text). */
  cachedReadings: number
  stopped?: string
  /** Every model reading of a kept row, for QA (evidence fields). */
  evidence: Map<string, Candidate>
}

/** A JSON body with an HTML field (Umbraco, WordPress APIs): unescape it so the text reads. */
export function bodyText(body: string): string {
  const t = body.trimStart()
  const html = t.startsWith('{') || t.startsWith('[') ? body.replace(/\\u003c/gi, '<').replace(/\\u003e/gi, '>').replace(/\\"/g, '"').replace(/\\\//g, '/').replace(/\\n|\\r|\\t/g, '\n') : body
  return htmlToText(html)
}

/** The reason without its specifics, for the counts ("title: out-of-scope title" not each title). */
export const reasonKey = (e: string) => (e.startsWith('out of scope') ? 'out of scope (the model read the role)' : e).replace(/\s*\(.*$/, '').replace(/".*?"/g, '…').replace(/https?:\S+/g, 'URL').slice(0, 80)

export async function crawlSource(
  s: SourceRow,
  f: PoliteFetcher,
  budget: Budget,
  opt: { apiKey: string; allowRender: boolean; limit?: number; log?: (m: string) => void; concurrency?: number; readingCache?: ReadingCache },
): Promise<SourceResult> {
  const log = opt.log ?? (() => {})
  const categories: CategoryId[] = s.selectors.categories?.length ? s.selectors.categories : [s.category]
  const discovery = await discoverSource(s, f, { allowRender: opt.allowRender, log })
  const res: SourceResult = {
    source: s,
    discovery,
    status: 'ok',
    pages: { read: 0, failed: 0, model_errors: 0 },
    extracted: 0,
    candidates: [],
    rows: [],
    flags: new Map(),
    rejected: [],
    rejectReasons: {},
    duplicates: 0,
    cachedReadings: 0,
    evidence: new Map(),
  }
  const jobs = discovery.jobs.slice(0, opt.limit ?? Infinity)
  log(`${s.key}: ${jobs.length} pages to read${discovery.notes.length ? ` (${discovery.notes.slice(0, 3).join('; ')})` : ''}`)

  let failRun = 0
  let readError: unknown
  const inflight = new Set<Promise<void>>()
  const read = async (job: PageJob, text: string, fetched_at: string, chunk: number): Promise<void> => {
    // An unchanged page under an unchanged prompt gets its earlier reading back: no spend, and no
    // week-to-week churn from the model reading the same words two ways.
    const cacheKey = readingKey({ categories, url: job.bio_url, text, firmName: s.firm_name, purePlay: !!s.selectors.pure_play })
    const cached = opt.readingCache?.get(cacheKey)
    const r = cached ?? (await extractPeople({ apiKey: opt.apiKey, categories, url: job.bio_url, text, firmName: s.firm_name, budget, purePlay: s.selectors.pure_play }))
    if (cached) res.cachedReadings++
    else if (!('error' in r)) opt.readingCache?.set(cacheKey, r)
    if ('error' in r && r.error === 'max_tokens' && text.length > 3000) {
      // Too many people for one answer: read the chunk in two halves (overlapping by a few lines).
      for (const [h, half] of chunkText(text, Math.ceil(text.length / 2)).entries()) await read(job, half, fetched_at, chunk + (h + 1) / 10)
      return
    }
    if ('error' in r) {
      res.pages.model_errors++
      log(`  ${s.key} model error on ${job.bio_url}: ${r.error}`)
      return
    }
    // A bio page is one person: a second name on it is someone the bio mentions.
    const people = job.kind === 'bio' ? r.people.slice(0, 1) : r.people
    people.forEach((person, order) => res.candidates.push({ source_key: s.key, page: job, fetched_at, person, chunk, order }))
  }

  try {
    for (const job of jobs) {
      if (failRun >= 6) {
        res.stopped = `stopped after ${failRun} failed fetches in a row (a block?)`
        res.status = 'blocked'
        break
      }
      const r = await f.get(job.url, { method: job.method, body: job.body, headers: job.headers, render: job.render })
      if (r.status !== 200) {
        res.pages.failed++
        failRun++
        continue
      }
      failRun = 0
      res.pages.read++
      let text = bodyText(r.body)
      if (s.selectors.text_filter) text = filterLines(text, s.selectors.text_filter)
      const chunks = job.kind === 'bio' ? [text.slice(0, 20000)] : chunkText(text, 8000)
      const fetched_at = new Date().toISOString()
      for (const [ci, c] of chunks.entries()) {
        if (c.trim().length < 40) continue
        // A failed reading is caught here, never left as an unhandled rejection (that crashed the
        // 2026-10-24 CI run at the budget cap instead of stopping cleanly with what it had).
        const p: Promise<void> = read(job, c, fetched_at, ci).catch((e) => {
          readError ??= e
        })
        inflight.add(p)
        void p.finally(() => inflight.delete(p))
        while (inflight.size >= (opt.concurrency ?? 4)) await Promise.race(inflight)
        if (readError) throw readError
      }
      if (readError) throw readError
    }
    await Promise.all(inflight)
    if (readError) throw readError
  } catch (e) {
    await Promise.allSettled(inflight)
    if (e instanceof BudgetExceeded) res.stopped = e.message
    else throw e
  }

  // Validate, slug, dedupe. Bios before team pages: a bio is the better reading of a person.
  res.extracted = res.candidates.length
  const kindRank = (c: Candidate) => (c.page.kind === 'bio' ? 0 : 1)
  const ordered = [...res.candidates].sort((a, b) => kindRank(a) - kindRank(b) || a.page.url.localeCompare(b.page.url) || (a.chunk ?? 0) - (b.chunk ?? 0) || (a.order ?? 0) - (b.order ?? 0))
  const bySlug = new Map<string, DirectoryRow>()
  const flags = new Map<string, string[]>()
  for (const c of ordered) {
    const base = slugFor(cleanName(c.person.full_name).name, s.selectors.slug_suffix)
    const v = validateCandidate(c, { source: s, slug: base })
    if (!v.ok || !v.row) {
      // A team page read in overlapping chunks returns the same person twice: count them once.
      if (res.rejected.some((r) => r.full_name === c.person.full_name && r.bio_url === c.page.bio_url)) continue
      res.rejected.push({ source_key: s.key, slug: base, category: tradeOf(c, s) ?? s.category, full_name: c.person.full_name, bio_url: c.page.bio_url, errors: v.errors })
      for (const e of v.errors) res.rejectReasons[reasonKey(e)] = (res.rejectReasons[reasonKey(e)] ?? 0) + 1
      continue
    }
    let row = v.row
    const prev = bySlug.get(row.slug)
    if (prev) {
      // Same name at the same firm read twice (two pages, or a team page and a bio): one person.
      if (prev.full_name === row.full_name || prev.bio_url === row.bio_url || c.page.kind === 'team') {
        res.duplicates++
        continue
      }
      let n = 2
      while (bySlug.has(`${base}-${n}`)) n++
      row = { ...row, slug: `${base}-${n}` }
      v.flags.push(`two different people share the name slug ${base}: check they are not one person`)
    }
    bySlug.set(row.slug, row)
    flags.set(row.slug, v.flags)
    res.evidence.set(row.slug, c)
  }
  res.rows = [...bySlug.values()].sort((a, b) => a.full_name.localeCompare(b.full_name))
  for (const [slug, fl] of setFlags(res.rows)) flags.set(slug, [...(flags.get(slug) ?? []), ...fl])
  res.flags = flags
  if (res.status === 'ok' && !res.rows.length) res.status = (discovery.failures && !res.pages.read) || res.pages.model_errors ? 'error' : 'empty'
  return res
}
