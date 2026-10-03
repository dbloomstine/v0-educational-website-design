/**
 * Misfiled-classification audit. Read-only: it never writes a row.
 *
 *   npx tsx scripts/alignment-audit.ts                         # last 365 days, 20 examples
 *   npx tsx scripts/alignment-audit.ts --save-pool pool.json   # also keep what was read
 *   npx tsx scripts/alignment-audit.ts --pool pool.json        # re-run offline, no database
 *   npx tsx scripts/alignment-audit.ts --days 90 --examples 40 --ids shifted.json
 *
 * Until 2026-10-01 the classifier paired its answers with a batch's articles
 * by position, so one skipped or reordered answer gave every later article in
 * the batch its neighbour's whole result: firm, fund, size, person, event type
 * and summary. lib/news/classification-align.ts stops that for new rows; this
 * finds the rows written before it.
 *
 * A row is SHIFTED when its result describes an article classified beside it
 * rather than its own:
 *   1. no name it carries is in its own article (headline + the body the
 *      classifier was shown) and one is in a neighbour's — the pipeline's own
 *      rule, alignClassifications — and
 *   2. its summary, names left out, is not about its own article: it shares
 *      no telling word or amount with it, or far fewer than with the neighbour.
 * Test 2 matters for old rows. The classifier read a whole batch at once, so
 * it often wrote out a name that another article in the batch spelled in full
 * ("QIA" → "Qatar Investment Authority", "a16z", "BofA"), filed a commentary
 * piece under a publisher another article named, or met two outlets' reports
 * of one story in one batch. Those rows carry a neighbour's words but describe
 * their own article; test 1 alone counted 196 rows, most of them like that.
 *
 * A shifted row can also name someone its own article mentions too, and then
 * test 1 passes it. Those are looked for among the rows the newsletter's
 * screen flags (every one found by a wider scan was there): a summary that
 * plainly describes a neighbour and not its own article counts as shifted.
 *
 * It also says which shifted rows still reach the site. Every site page is
 * built by buildStories, which drops rows that screenArticle flags (the
 * newsletter's extractionMisaligned: firm and summary against the headline);
 * that screen sees no article body and catches only some of them.
 *
 * The database is small and shared: rows are read a week at a time, 250 per
 * request, with a pause between requests, and bodies are fetched only where a
 * headline cannot settle the question.
 */
process.loadEnvFile('.env.local')

import { readFileSync, writeFileSync } from 'node:fs'
import type { AlignableResult } from '../lib/news/classification-align'

const DAY_MS = 86_400_000
const PAGE = 250
const BODY_CHUNK = 40
const PAUSE_MS = 150
/** How much of an article's body the classifier is shown (classify-articles.ts). */
const SNIPPET = 1500
/** A batch is at most 15 rows taken in created_at order, so a batch-mate sits at most 14 places away. */
const QUEUE_REACH = 14
/** One classifier call writes its rows back within a second or two. */
const SAME_CALL_MS = 10_000
/** More rows than this written inside one window is a bulk update, not a classifier call. */
const SAME_CALL_MAX = 40
/** An amount the summary shares with an article counts like one rare word. */
const AMOUNT_WEIGHT = 6
/**
 * Evidence that a summary is about its own article: shared words weighted by
 * rarity (a word in 1% of rows ≈ 4.6, in 10% ≈ 2.3). Below this it is too weak
 * to outweigh the names, and the pipeline's rule decides.
 */
const OWN_EVIDENCE = 5

const COLUMNS = [
  'id', 'title', 'source_name', 'published_date', 'created_at', 'updated_at',
  'article_type', 'event_type', 'fund_categories', 'is_high_signal', 'relevance_score', 'tldr', 'entities_raw',
  'firm_name:extracted_data->>firm_name',
  'fund_name:extracted_data->>fund_name',
  'person_name:extracted_data->>person_name',
  'fund_size_usd_millions:extracted_data->fund_size_usd_millions',
  'close_type:extracted_data->>close_type',
  'fund_strategy:extracted_data->>fund_strategy',
].join(', ')

interface AuditRow {
  id: string
  title: string
  source_name: string | null
  published_date: string
  created_at: string
  updated_at: string | null
  article_type: string | null
  event_type: string | null
  fund_categories: string[] | null
  is_high_signal: boolean | null
  relevance_score: number | string | null
  tldr: string | null
  entities_raw: unknown
  firm_name: string | null
  fund_name: string | null
  person_name: string | null
  fund_size_usd_millions: number | null
  close_type: string | null
  fund_strategy: string | null
}

/** What was read, so the analysis can be re-run without the database. */
interface Pool {
  readAt: string
  since: string
  rows: AuditRow[]
  /** id → the start of full_text and of description, as the classifier could have seen them. */
  bodies: Record<string, string>
}

type Verdict =
  | 'shifted'      // names and summary are a neighbour's
  | 'name only'    // names are a neighbour's, the summary its own: a written-out name, a publisher, one story twice
  | 'unexplained'  // names are in neither its article nor a neighbour's

interface Finding {
  row: AuditRow
  verdict: Verdict
  /** The neighbouring article the result belongs to (shifted, name only). */
  source: AuditRow | null
  /** Weighted evidence that the summary is about its own article, and about the source. */
  own: number
  other: number
}

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name)
  return i > 0 ? process.argv[i + 1] : undefined
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

type Answer = { data: unknown; error: { message: string } | null }

/** One request, one retry after a pause; then stop rather than queue more work on a busy database. */
async function ask<T>(what: string, run: () => PromiseLike<Answer>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const { data, error } = await run()
    await sleep(PAUSE_MS)
    if (!error) return (data ?? []) as T
    if (attempt >= 2) throw new Error(`${what}: ${error.message}`)
    console.error(`  ${what} failed (${error.message}); trying once more in 10 s`)
    await sleep(10_000)
  }
}

function resultOf(r: AuditRow): AlignableResult {
  const entities = Array.isArray(r.entities_raw) ? (r.entities_raw as { name?: string | null }[]) : []
  return { firm_name: r.firm_name, fund_name: r.fund_name, person_name: r.person_name, entities }
}

/** The row in the shape rowToArticle reads. */
function asNewsRow(r: AuditRow) {
  return {
    ...r,
    extracted_data: {
      firm_name: r.firm_name, fund_name: r.fund_name, person_name: r.person_name,
      fund_size_usd_millions: r.fund_size_usd_millions, close_type: r.close_type, fund_strategy: r.fund_strategy,
    },
  }
}

// ─── What a summary and an article can share ────────────────────────────────
// Common English and the trade's own vocabulary carry no identity: every other
// headline says "fund", "capital", "raises".
const COMMON = new Set([
  'the', 'and', 'for', 'with', 'from', 'into', 'onto', 'over', 'after', 'amid', 'its', 'his', 'her', 'their', 'this', 'that',
  'these', 'those', 'has', 'have', 'had', 'was', 'were', 'are', 'will', 'would', 'could', 'should', 'not', 'but', 'also',
  'than', 'then', 'about', 'out', 'who', 'what', 'why', 'how', 'when', 'which', 'while', 'more', 'most', 'new', 'first',
  'final', 'says', 'said', 'say', 'year', 'years', 'per', 'via', 'our', 'your', 'all', 'one', 'two', 'can', 'may',
  'fund', 'capital', 'private', 'equity', 'credit', 'investment', 'invest', 'investor', 'firm', 'partner', 'group',
  'management', 'manager', 'asset', 'global', 'market', 'million', 'billion', 'deal', 'company', 'raise', 'rais', 'clos',
  'launch', 'business', 'portfolio', 'financial', 'finance', 'strategy', 'news', 'report', 'announc', 'target',
])

function stem(w: string): string {
  let s = w
  if (s.length > 4 && s.endsWith('ies')) s = `${s.slice(0, -3)}y`
  else if (s.length > 4 && /(ch|sh|x|ss)es$/.test(s)) s = s.slice(0, -2)
  else if (s.length > 5 && s.endsWith('ing')) s = s.slice(0, -3)
  else if (s.length > 4 && s.endsWith('ed')) s = s.slice(0, -2)
  else if (s.length > 3 && s.endsWith('s') && !s.endsWith('ss')) s = s.slice(0, -1)
  if (s.length > 4 && s.endsWith('e')) s = s.slice(0, -1)
  return s
}

function words(text: string | null): Set<string> {
  const out = new Set<string>()
  for (const raw of (text ?? '').toLowerCase().replace(/[’']s\b/g, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)) {
    if (raw.length < 3 || /^\d/.test(raw)) continue // figures are compared as amounts
    const w = stem(raw)
    if (w.length >= 3 && !COMMON.has(w) && !COMMON.has(raw)) out.add(w)
  }
  return out
}

/** Money amounts in millions, currency aside: "$2.2B" and "2.2 billion" → "2200", "€60m" → "60". */
function amounts(text: string | null): Set<string> {
  const out = new Set<string>()
  for (const m of (text ?? '').matchAll(/(\d+(?:\.\d+)?)\s?(bn|billion|b|mn|million|m)\b/gi)) {
    const n = Number(m[1]) * (m[2].toLowerCase().startsWith('b') ? 1000 : 1)
    out.add(String(Math.round(n * 10) / 10))
  }
  return out
}

async function main() {
  const { resultFitsArticle } = await import('../lib/news/classification-align')
  const news = await import('../lib/newsletter/query-articles')
  const { LEAGUE_CLOSE_TYPES } = await import('../lib/news/league')
  const { LEAGUE_SINCE } = await import('../lib/news/league-data')

  const days = Number(flag('--days') ?? 365)
  const exampleCount = Number(flag('--examples') ?? 20)
  const idsOut = flag('--ids')
  const poolIn = flag('--pool')
  const poolOut = flag('--save-pool')

  // ─── 1. Every classified row in the window, a week at a time ──────────────
  let pool: Pool
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any = null
  if (poolIn) {
    pool = JSON.parse(readFileSync(poolIn, 'utf8')) as Pool
    console.error(`  pool ${poolIn}: ${pool.rows.length} rows read ${pool.readAt}, ${Object.keys(pool.bodies).length} bodies`)
  } else {
    const { getSupabaseAdmin } = await import('../lib/supabase/client')
    db = getSupabaseAdmin()
    const todayMs = Date.parse(`${isoDay(Date.now())}T00:00:00Z`)
    const sinceMs = todayMs - days * DAY_MS
    pool = { readAt: new Date().toISOString(), since: isoDay(sinceMs), rows: [], bodies: {} }
    for (let t = sinceMs; t <= todayMs; t += 7 * DAY_MS) {
      const from = isoDay(t)
      // The last week stays open: some feeds date their items ahead.
      const to = t + 7 * DAY_MS > todayMs ? null : isoDay(t + 7 * DAY_MS)
      for (let offset = 0; ; offset += PAGE) {
        const page = await ask<AuditRow[]>(`rows from ${from}`, () => {
          let q = db
            .from('news_items')
            .select(COLUMNS)
            .eq('classification_status', 'complete')
            .eq('is_duplicate', false)
            .gte('published_date', from)
          if (to) q = q.lt('published_date', to)
          return q.order('published_date', { ascending: false }).order('id', { ascending: true }).range(offset, offset + PAGE - 1)
        })
        pool.rows.push(...page)
        if (page.length < PAGE) break
      }
      process.stderr.write(`\r  read ${pool.rows.length} rows (to ${to ?? 'today'})   `)
    }
    process.stderr.write('\n')
  }
  const rows = pool.rows
  const bodies = new Map(Object.entries(pool.bodies))
  let bodiesMissing = 0

  /** Make sure these rows' bodies are loaded (from the database; offline, from the pool). */
  async function need(ids: string[]) {
    const missing = Array.from(new Set(ids.filter((id) => !bodies.has(id))))
    if (!db) {
      bodiesMissing += missing.length
      return
    }
    for (let i = 0; i < missing.length; i += BODY_CHUNK) {
      const chunk = missing.slice(i, i + BODY_CHUNK)
      const data = await ask<{ id: string; description: string | null; full_text: string | null }[]>('bodies', () =>
        db.from('news_items').select('id, description, full_text').in('id', chunk),
      )
      // The classifier was shown `full_text ?? description`, but the full text
      // is often fetched after the row was classified: a name in either counts.
      for (const b of data) bodies.set(b.id, `${(b.full_text ?? '').slice(0, SNIPPET)}\n${(b.description ?? '').slice(0, SNIPPET)}`)
      for (const id of chunk) if (!bodies.has(id)) bodies.set(id, '')
      process.stderr.write(`\r  bodies ${Math.min(i + BODY_CHUNK, missing.length)}/${missing.length}   `)
    }
    if (missing.length) process.stderr.write('\n')
  }
  const text = (r: AuditRow) => `${r.title}\n${bodies.get(r.id) ?? ''}`
  const namesFit = (article: AuditRow, r: AuditRow, withBody: boolean) =>
    resultFitsArticle({ title: article.title, text: withBody ? (bodies.get(article.id) ?? '') : '' }, resultOf(r))

  // How telling a word is: rarer across every headline and summary, more telling.
  const seenIn = new Map<string, number>()
  for (const r of rows) for (const w of new Set([...words(r.title), ...words(r.tldr)])) seenIn.set(w, (seenIn.get(w) ?? 0) + 1)
  const weight = (w: string) => Math.log(rows.length / (1 + (seenIn.get(w) ?? 0)))
  /** Evidence that a summary (its words and amounts) is about this article. */
  function evidence(summaryWords: Set<string>, summaryAmounts: Set<string>, article: AuditRow): number {
    const t = text(article)
    const has = words(t)
    const amts = amounts(t)
    let e = 0
    for (const w of summaryWords) if (has.has(w)) e += weight(w)
    for (const a of summaryAmounts) if (amts.has(a)) e += AMOUNT_WEIGHT
    return e
  }

  // ─── 2. Batch-mates: the classifier's queue order, or the same write ──────
  const byQueue = [...rows].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id))
  const place = new Map(byQueue.map((r, i) => [r.id, i]))
  const byWrite = rows.filter((r) => r.updated_at).sort((a, b) => Date.parse(a.updated_at!) - Date.parse(b.updated_at!))
  const writeTimes = byWrite.map((r) => Date.parse(r.updated_at!))
  function batchMates(r: AuditRow): AuditRow[] {
    const i = place.get(r.id)!
    const mates = new Map(byQueue.slice(Math.max(0, i - QUEUE_REACH), i + QUEUE_REACH + 1).map((m) => [m.id, m]))
    if (r.updated_at) {
      const t = Date.parse(r.updated_at)
      let lo = 0
      let hi = writeTimes.length
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (writeTimes[mid] < t - SAME_CALL_MS) lo = mid + 1
        else hi = mid
      }
      const sameCall: AuditRow[] = []
      for (let j = lo; j < writeTimes.length && writeTimes[j] <= t + SAME_CALL_MS; j++) sameCall.push(byWrite[j])
      if (sameCall.length <= SAME_CALL_MAX) for (const m of sameCall) mates.set(m.id, m)
    }
    mates.delete(r.id)
    return Array.from(mates.values())
  }

  // ─── 3. Whose article does each result describe? ──────────────────────────
  // Names first, on headlines; bodies only where a headline cannot settle it.
  const headlineMiss = rows.filter((r) => !namesFit(r, r, false))
  await need(headlineMiss.map((r) => r.id))
  const nameSuspects = headlineMiss.filter((r) => !namesFit(r, r, true))
  const mateByTitle = new Map<string, AuditRow[]>()
  for (const r of nameSuspects) mateByTitle.set(r.id, batchMates(r).filter((m) => namesFit(m, r, false)))
  // A possible source's body is read too: the summary is then compared with a
  // whole article on both sides, headline and body.
  await need(nameSuspects.flatMap((r) => {
    const byTitle = mateByTitle.get(r.id)!
    return (byTitle.length > 0 ? byTitle : batchMates(r)).map((m) => m.id)
  }))

  /**
   * The summary without the names: the names are what is in question, and a
   * neighbour that spells one out ("Bank of America" for "BofA") would
   * otherwise always look like the better fit.
   */
  function summaryOf(r: AuditRow) {
    const { firm_name, fund_name, person_name, entities } = resultOf(r)
    const nameWords = words([firm_name, fund_name, person_name, ...(entities ?? []).map((e) => e?.name)].filter(Boolean).join(' '))
    return { summaryWords: new Set(Array.from(words(r.tldr)).filter((w) => !nameWords.has(w))), summaryAmounts: amounts(r.tldr) }
  }

  const findings: Finding[] = []
  for (const r of nameSuspects) {
    let candidates = mateByTitle.get(r.id)!
    if (candidates.length === 0) candidates = batchMates(r).filter((m) => namesFit(m, r, true))
    const { summaryWords, summaryAmounts } = summaryOf(r)
    const own = evidence(summaryWords, summaryAmounts, r)
    if (candidates.length === 0) {
      findings.push({ row: r, verdict: 'unexplained', source: null, own, other: 0 })
      continue
    }
    // The neighbour whose article the summary describes best.
    let source = candidates[0]
    let other = -1
    for (const m of candidates) {
      const e = evidence(summaryWords, summaryAmounts, m)
      if (e > other) { source = m; other = e }
    }
    // Clearly about its own article, unless the neighbour fits far better; or,
    // on weak evidence, at least as much about its own as the neighbour's.
    const summaryIsOwn = own >= OWN_EVIDENCE ? own * 2 >= other : own > 0 && own >= other
    findings.push({ row: r, verdict: summaryIsOwn ? 'name only' : 'shifted', source, own, other })
  }

  // A shifted result can also name someone both articles mention (two
  // Situational Awareness stories in one batch), and then the names prove
  // nothing. The newsletter's screen is where those surface: of the rows it
  // flags, count the ones whose summary is plainly a neighbour's.
  const screenFlags = rows.filter((r) => {
    const a = news.rowToArticle(asNewsRow(r))
    return news.extractionMisaligned(a.title, a.firmName, a.tldr)
  })
  const suspectIds = new Set(nameSuspects.map((r) => r.id))
  const namesAlsoOwn = screenFlags.filter((r) => !suspectIds.has(r.id))
  await need(namesAlsoOwn.map((r) => r.id))
  const coincident = new Set<string>()
  for (const r of namesAlsoOwn) {
    const { summaryWords, summaryAmounts } = summaryOf(r)
    const own = evidence(summaryWords, summaryAmounts, r)
    if (own >= OWN_EVIDENCE) continue
    let source: AuditRow | null = null
    let other = 0
    for (const m of batchMates(r)) {
      const e = evidence(summaryWords, summaryAmounts, m)
      if (e > other) { source = m; other = e }
    }
    // A stricter bar than above: with no names to go by, a summary in other
    // words (a translated headline, "no substantive content") must not count.
    if (source && other >= 3 * OWN_EVIDENCE && other >= 2 * own) {
      findings.push({ row: r, verdict: 'shifted', source, own, other })
      coincident.add(r.id)
    }
  }

  // ─── 4. Would the site show it? ───────────────────────────────────────────
  const siteTypes = new Set<string>(news.ALL_NEWSLETTER_TYPES)
  function siteStatus(r: AuditRow): string {
    if (!(r.is_high_signal || Number(r.relevance_score ?? 0) >= 0.3) || !siteTypes.has(r.article_type ?? '')) return 'outside the site pool'
    const a = news.rowToArticle(asNewsRow(r))
    const screened = news.screenArticle(a)
    if (screened) return `screened: ${screened}`
    if (news.gateArticle(a)) return 'quality gate'
    if (!news.placeArticle(a)) return 'no section'
    return 'SHOWN'
  }
  const inLeague = (r: AuditRow) =>
    ['fund_close', 'capital_raise'].includes(r.event_type ?? '') &&
    LEAGUE_CLOSE_TYPES.includes(r.close_type ?? '') &&
    r.published_date >= LEAGUE_SINCE

  const shifted = findings.filter((f) => f.verdict === 'shifted')
  const status = new Map(shifted.map((f) => [f.row.id, siteStatus(f.row)]))
  const shown = shifted.filter((f) => status.get(f.row.id) === 'SHOWN')
  const unexplained = findings.filter((f) => f.verdict === 'unexplained')
  const verdictOf = new Map(findings.map((f) => [f.row.id, f.verdict]))
  // Hidden by the screen alone: every other screen, the gate and a section would have let it through.
  const hiddenByScreen = screenFlags.filter((r) => siteStatus(r) === 'screened: extraction belongs to another article')

  // ─── 5. Report ────────────────────────────────────────────────────────────
  const pct = (n: number, d: number) => (d ? `${((100 * n) / d).toFixed(1)}%` : '—')
  const count = (v: Verdict) => findings.filter((f) => f.verdict === v).length
  console.log(`\nnews_items, classification complete, not duplicate, published ${pool.since} → ${pool.readAt.slice(0, 10)}`)
  console.log(`  rows read                                          ${rows.length}`)
  console.log(`  names not in own headline (body checked)           ${headlineMiss.length}`)
  console.log(`  names in neither headline nor body                 ${nameSuspects.length}`)
  console.log(`    shifted: names and summary are a neighbour's     ${count('shifted') - coincident.size}`)
  console.log(`    name only: names a neighbour's, summary its own  ${count('name only')}  (written-out names, publishers, one story twice)`)
  console.log(`    unexplained: names in no article nearby          ${count('unexplained')}  (the pipeline keeps these), of which the summary is not its own either: ${unexplained.filter((f) => f.own === 0 && words(f.row.tldr).size >= 3).length}`)
  console.log(`  flagged by the newsletter's screen, names in own article ${namesAlsoOwn.length}`)
  console.log(`    shifted: summary plainly a neighbour's           ${coincident.size}`)
  console.log(`  SHIFTED in all                                     ${shifted.length}  (${pct(shifted.length, rows.length)})`)
  if (bodiesMissing) console.log(`  (offline: ${bodiesMissing} bodies were not in the pool and counted as empty)`)

  const tally = (xs: string[]) => {
    const t = new Map<string, number>()
    for (const x of xs) t.set(x, (t.get(x) ?? 0) + 1)
    return Array.from(t.entries()).sort((a, b) => b[1] - a[1])
  }
  console.log('\nshifted rows on the site today:')
  for (const [k, n] of tally(shifted.map((f) => status.get(f.row.id)!))) console.log(`  ${String(n).padStart(5)}  ${k}`)
  console.log(`  in league-table scope (a close since ${LEAGUE_SINCE}): ${shifted.filter((f) => inLeague(f.row)).length}, of which shown ${shown.filter((f) => inLeague(f.row)).length}`)

  console.log(`\nthe newsletter's screen (extractionMisaligned) over all ${rows.length} rows flags ${screenFlags.length}`)
  console.log(`  of which shifted                                   ${screenFlags.filter((r) => verdictOf.get(r.id) === 'shifted').length}`)
  console.log(`  that only this screen keeps off the site           ${hiddenByScreen.length}  (of which shifted ${hiddenByScreen.filter((r) => verdictOf.get(r.id) === 'shifted').length})`)

  const months = new Map<string, { rows: number; shifted: number; shown: number }>()
  for (const r of rows) {
    const m = r.published_date.slice(0, 7)
    const e = months.get(m) ?? { rows: 0, shifted: 0, shown: 0 }
    e.rows++
    months.set(m, e)
  }
  for (const f of shifted) {
    const e = months.get(f.row.published_date.slice(0, 7))!
    e.shifted++
    if (status.get(f.row.id) === 'SHOWN') e.shown++
  }
  console.log('\nby month (published)     rows   shifted   rate  shown on site')
  for (const [m, e] of Array.from(months.entries()).sort()) {
    console.log(`  ${m}            ${String(e.rows).padStart(7)}  ${String(e.shifted).padStart(8)}  ${pct(e.shifted, e.rows).padStart(5)}  ${String(e.shown).padStart(13)}`)
  }

  const types = new Map<string, { shifted: number; shown: number }>()
  for (const f of shifted) {
    const k = f.row.event_type ?? '(none)'
    const e = types.get(k) ?? { shifted: 0, shown: 0 }
    e.shifted++
    if (status.get(f.row.id) === 'SHOWN') e.shown++
    types.set(k, e)
  }
  console.log('\nby event_type (as stored)           shifted  shown on site')
  for (const [k, e] of Array.from(types.entries()).sort((a, b) => b[1].shifted - a[1].shifted)) {
    console.log(`  ${k.padEnd(32)} ${String(e.shifted).padStart(8)}  ${String(e.shown).padStart(13)}`)
  }

  // Examples: what a reader can see first, newest first.
  const examples = [...shifted]
    .sort((a, b) => Number(status.get(b.row.id) === 'SHOWN') - Number(status.get(a.row.id) === 'SHOWN') || b.row.published_date.localeCompare(a.row.published_date))
    .slice(0, exampleCount)
  const clip = (s: string | null, n: number) => (!s ? '—' : s.length > n ? `${s.slice(0, n - 1)}…` : s)
  const carries = (r: AuditRow) =>
    [r.firm_name && `firm ${r.firm_name}`, r.person_name && `person ${r.person_name}`, r.fund_name && `fund ${r.fund_name}`, r.fund_size_usd_millions && `$${r.fund_size_usd_millions}M`]
      .filter(Boolean)
      .join(' · ') || '(entities only)'
  console.log(`\n${examples.length} examples (shown on the site first, newest first):`)
  examples.forEach((f, i) => {
    const r = f.row
    console.log(`\n${String(i + 1).padStart(2)}. ${r.published_date}  ${r.event_type}  [${status.get(r.id)}]  ${r.id}`)
    console.log(`    headline:   ${clip(r.title, 110)}  (${r.source_name ?? '?'})`)
    console.log(`    carries:    ${carries(r)}`)
    console.log(`    summary:    ${clip(r.tldr, 140)}`)
    console.log(`    belongs to: ${clip(f.source!.title, 110)}  (${f.source!.published_date})`)
  })

  if (idsOut) {
    const out = (f: Finding) => ({
      id: f.row.id, published_date: f.row.published_date, event_type: f.row.event_type, source_name: f.row.source_name,
      title: f.row.title, firm_name: f.row.firm_name, person_name: f.row.person_name, fund_name: f.row.fund_name,
      fund_size_usd_millions: f.row.fund_size_usd_millions, tldr: f.row.tldr, own: Number(f.own.toFixed(1)), other: Number(f.other.toFixed(1)),
      source_id: f.source?.id ?? null, source_title: f.source?.title ?? null, site: siteStatus(f.row), league: inLeague(f.row),
    })
    writeFileSync(idsOut, JSON.stringify({
      readAt: pool.readAt,
      since: pool.since,
      rowsRead: rows.length,
      shifted: shifted.map(out),
      nameOnly: findings.filter((f) => f.verdict === 'name only').map(out),
      unexplained: unexplained.map(out),
      hiddenByScreen: hiddenByScreen.map((r) => ({ id: r.id, published_date: r.published_date, event_type: r.event_type, title: r.title, firm_name: r.firm_name, tldr: r.tldr, verdict: verdictOf.get(r.id) ?? 'fits' })),
    }, null, 2))
    console.log(`\nwrote ${shifted.length} shifted rows (and the near-misses) to ${idsOut}`)
  }

  if (poolOut) {
    writeFileSync(poolOut, JSON.stringify({ ...pool, bodies: Object.fromEntries(bodies) }))
    console.error(`  saved ${rows.length} rows and ${bodies.size} bodies to ${poolOut}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
