/**
 * Foreign-amount audit. Read-only: it never writes a row.
 *
 *   npx tsx scripts/amount-audit.ts --save-pool pool.json     # read the database once, keep what was read
 *   npx tsx scripts/amount-audit.ts --pool pool.json          # re-run offline
 *   npx tsx scripts/amount-audit.ts --pool pool.json --list borrowed.json --examples 40
 *
 * The classifier reads up to fifteen articles in one call, and now and then
 * gives an article a sum of money that belongs to another article of the same
 * call (lib/news/amount-guard.ts tells the story of the row that showed it).
 * That guard stops it for new rows. This finds the rows written before it:
 * every classified row since the batch went to fifteen (2026-06-27) whose
 * size, or whose summary, states a sum that its own headline, description and
 * stored body do not.
 *
 * Each such row is then explained, if it can be:
 *   borrowed     the sum is stated by an article classified beside it (within
 *                fourteen places in the queue, or written back in the same
 *                few seconds). This is the bug.
 *   unexplained  no neighbour states it. The model's memory (a firm's AUM),
 *                arithmetic (two tranches added up), or a body we never stored.
 *
 * The database is small and shared: rows are read a week at a time, 250 per
 * request, with a pause between requests. Read it once (--save-pool) and work
 * from the file.
 */
process.loadEnvFile('.env.local')

import { readFileSync, writeFileSync } from 'node:fs'

const DAY_MS = 86_400_000
const PAGE = 250
const PAUSE_MS = 150
/** The batch went from ten to fifteen articles on this day (a35ecf73). */
const SINCE = '2026-06-27'
/** A batch is at most 15 rows taken in created_at order, so a batch-mate sits at most 14 places away. */
const QUEUE_REACH = 14
/** One classifier call writes its rows back within a few seconds. */
const SAME_CALL_MS = 10_000

const COLUMNS = [
  'id', 'title', 'description', 'full_text', 'source_name', 'source_url', 'published_date', 'created_at', 'updated_at',
  'event_type', 'relevance_score', 'is_duplicate', 'tldr',
  'size:extracted_data->fund_size_usd_millions',
  'original_currency:extracted_data->>original_currency',
  'original_amount:extracted_data->original_amount_millions',
  'firm_name:extracted_data->>firm_name',
  'close_type:extracted_data->>close_type',
].join(', ')

interface Row {
  id: string
  title: string
  description: string | null
  full_text: string | null
  source_name: string | null
  source_url: string | null
  published_date: string
  created_at: string
  updated_at: string | null
  event_type: string | null
  relevance_score: number | string | null
  is_duplicate: boolean | null
  tldr: string | null
  size: number | null
  original_currency: string | null
  original_amount: number | null
  firm_name: string | null
  close_type: string | null
}

interface Pool { readAt: string; since: string; rows: Row[] }

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name)
  return i > 0 ? process.argv[i + 1] : undefined
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

type Answer = { data: unknown; error: { message: string } | null }
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

async function main() {
  const { foreignAmounts, figuresIn, isClean } = await import('../lib/news/amount-guard')

  const poolIn = flag('--pool')
  const poolOut = flag('--save-pool')
  const listOut = flag('--list')
  const exampleCount = Number(flag('--examples') ?? 25)

  let pool: Pool
  const addLate = process.argv.includes('--add-late')
  if (poolIn && !addLate) {
    pool = JSON.parse(readFileSync(poolIn, 'utf8')) as Pool
    console.error(`  pool ${poolIn}: ${pool.rows.length} rows read ${pool.readAt}`)
  } else {
    const { getSupabaseAdmin } = await import('../lib/supabase/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = getSupabaseAdmin()
    const todayMs = Date.parse(`${isoDay(Date.now())}T00:00:00Z`)
    // Two weeks before the first day of interest: a row can be published before it reaches us.
    const sinceMs = Date.parse(`${SINCE}T00:00:00Z`) - 14 * DAY_MS
    // --pool X --add-late: the weeks are already in the file; only the late rows are read and added to it.
    pool = poolIn ? (JSON.parse(readFileSync(poolIn, 'utf8')) as Pool) : { readAt: new Date().toISOString(), since: SINCE, rows: [] }
    for (let t = sinceMs; !poolIn && t <= todayMs; t += 7 * DAY_MS) {
      const from = isoDay(t)
      const to = t + 7 * DAY_MS > todayMs ? null : isoDay(t + 7 * DAY_MS)
      for (let offset = 0; ; offset += PAGE) {
        const page = await ask<Row[]>(`rows from ${from}`, () => {
          let q = db.from('news_items').select(COLUMNS).eq('classification_status', 'complete').gte('published_date', from)
          if (to) q = q.lt('published_date', to)
          return q.order('published_date', { ascending: false }).order('id', { ascending: true }).range(offset, offset + PAGE - 1)
        })
        pool.rows.push(...page)
        if (page.length < PAGE) break
      }
      process.stderr.write(`\r  read ${pool.rows.length} rows (to ${to ?? 'today'})   `)
    }
    process.stderr.write('\n')
    // Rows that reached us late: created in the window, dated before it (a feed that back-fills, a bad date).
    // Read by publication month, where the index is, keeping only those created since SINCE.
    const lateBefore = isoDay(sinceMs)
    const edges: (string | null)[] = []
    for (let d = new Date(`${lateBefore}T00:00:00Z`); d.getTime() > Date.parse('2025-01-01T00:00:00Z'); d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, d.getUTCDate()))) edges.push(isoDay(d.getTime()))
    edges.push(null) // everything older, bad dates included
    let late = 0
    for (let i = 0; i + 1 < edges.length; i++) {
      const to = edges[i] as string, from = edges[i + 1]
      for (let offset = 0; ; offset += PAGE) {
        const page = await ask<Row[]>(`late rows before ${to}`, () => {
          let q = db.from('news_items').select(COLUMNS).eq('classification_status', 'complete').lt('published_date', to).gte('created_at', `${SINCE}T00:00:00Z`)
          if (from) q = q.gte('published_date', from)
          return q.order('published_date', { ascending: false }).order('id', { ascending: true }).range(offset, offset + PAGE - 1)
        })
        pool.rows.push(...page)
        late += page.length
        if (page.length < PAGE) break
      }
      process.stderr.write(`\r  late rows: ${late} (back to ${from ?? 'the beginning'})   `)
    }
    process.stderr.write('\n')
    // The classifier was shown at most the first 1,500 characters; 6,000 are stored. Keep what is stored, no more.
    for (const r of pool.rows) if (r.full_text && r.full_text.length > 6000) r.full_text = r.full_text.slice(0, 6000)
    const seen = new Set<string>()
    pool.rows = pool.rows.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
    const saveTo = poolOut ?? (addLate ? poolIn : undefined)
    if (saveTo) { writeFileSync(saveTo, JSON.stringify(pool)); console.error(`  pool saved to ${saveTo} (${pool.rows.length} rows)`) }
  }

  const rows = pool.rows.filter((r) => r.created_at >= SINCE).sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
  const place = new Map(rows.map((r, i) => [r.id, i]))
  const ownText = (r: Row) => `${r.title}\n${r.description ?? ''}\n${r.full_text ?? ''}`
  const ownFigures = new Map<string, ReturnType<typeof figuresIn>>()
  const figuresOf = (r: Row) => { if (!ownFigures.has(r.id)) ownFigures.set(r.id, figuresIn(ownText(r))); return ownFigures.get(r.id)! }
  const claimsOf = (r: Row) => ({ summary_ai: r.tldr, fund_size_usd_millions: r.size, original_currency: r.original_currency, original_amount_millions: r.original_amount })

  // Rows written back within a few seconds of each other were one classifier call (unless something has
  // touched the row since). A recovered or requeued row sits far from its batch-mates in the queue, so
  // the queue alone would miss them.
  const byWrite = rows.filter((r) => r.updated_at).map((r) => ({ r, t: Date.parse(r.updated_at!) })).sort((a, b) => a.t - b.t)
  const writeTimes = byWrite.map((x) => x.t)
  const lowerBound = (t: number) => { let lo = 0, hi = writeTimes.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (writeTimes[mid] < t) lo = mid + 1; else hi = mid } return lo }
  const sameCall = (a: Row, b: Row) => Boolean(a.updated_at && b.updated_at) && Math.abs(Date.parse(a.updated_at!) - Date.parse(b.updated_at!)) <= SAME_CALL_MS
  /** The rows that could have been in the same classifier call as this one. */
  function neighbours(r: Row): Row[] {
    const i = place.get(r.id)!
    const near = new Set<Row>()
    for (let j = Math.max(0, i - QUEUE_REACH); j <= Math.min(rows.length - 1, i + QUEUE_REACH); j++) if (j !== i) near.add(rows[j])
    if (r.updated_at) {
      const t = Date.parse(r.updated_at)
      const together: Row[] = []
      for (let j = lowerBound(t - SAME_CALL_MS); j < byWrite.length && byWrite[j].t <= t + SAME_CALL_MS; j++) if (byWrite[j].r.id !== r.id) together.push(byWrite[j].r)
      // More than a batch or two written in one window is a bulk update, not a classifier call.
      if (together.length <= 40) for (const n of together) near.add(n)
    }
    return [...near]
  }

  // Two reports of one story name the same firm, or share the proper nouns of their headlines.
  const GENERIC = new Set(['capital', 'partners', 'group', 'management', 'fund', 'funds', 'investment', 'investments', 'asset', 'global', 'private', 'equity', 'credit', 'ventures', 'the', 'and', 'for', 'with', 'first', 'close', 'closes', 'raises', 'launches', 'new'])
  const nameTokens = (s: string | null) => new Set((s ?? '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 3 && !GENERIC.has(w)))
  // Many outlets set headlines In Title Case, so a capital proves nothing. A word is a name if the
  // articles themselves (their descriptions, in running prose) hardly ever write it in lower case.
  const lower = new Map<string, number>(), upper = new Map<string, number>()
  for (const r of rows) {
    for (const w of (r.description ?? '').match(/\b[A-Za-z][A-Za-z0-9&'’-]{2,}\b/g) ?? []) {
      const k = w.toLowerCase()
      if (w === k) lower.set(k, (lower.get(k) ?? 0) + 1)
      else upper.set(k, (upper.get(k) ?? 0) + 1)
    }
  }
  const isName = (k: string) => (lower.get(k) ?? 0) <= 0.1 * ((lower.get(k) ?? 0) + (upper.get(k) ?? 0))
  const properNouns = (title: string) => new Set((title.match(/\b[A-Z][A-Za-z0-9&'’-]{2,}\b/g) ?? []).map((w) => w.toLowerCase()).filter((w) => !GENERIC.has(w) && isName(w)))
  /** In how many headlines each proper noun appears: one seen in few is a story's own word. */
  const nounSeen = new Map<string, number>()
  for (const r of rows) for (const w of properNouns(r.title)) nounSeen.set(w, (nounSeen.get(w) ?? 0) + 1)
  const RARE_NOUN = 40
  const whole = (s: string | null) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
  function sameStory(a: Row, b: Row): boolean {
    // "Partners Group" is all generic words; as a whole name it is still a name.
    if (whole(a.firm_name).length >= 4 && whole(a.firm_name) === whole(b.firm_name)) return true
    const fa = nameTokens(a.firm_name), fb = nameTokens(b.firm_name)
    if (fa.size && fb.size && [...fa].some((w) => fb.has(w))) return true
    const ta = properNouns(a.title), tb = properNouns(b.title)
    const shared = [...ta].filter((w) => tb.has(w))
    // Two proper nouns in common, or one that few headlines carry ("Databricks", "Acuon").
    if (shared.length >= 2 || shared.some((w) => (nounSeen.get(w) ?? 0) <= RARE_NOUN)) return true
    // A firm one row extracted, named in the other's headline.
    const inTitle = (firm: Set<string>, title: string) => firm.size > 0 && [...firm].every((w) => title.toLowerCase().includes(w))
    return inTitle(fa, b.title) || inTitle(fb, a.title)
  }

  interface Finding {
    row: Row
    size: boolean
    sums: { currency: string; amountM: number }[]
    /** For each foreign sum, the neighbour that states it (if one does). */
    sources: (Row | null)[]
    verdict: 'same story' | 'another story' | 'unexplained'
    /** Would a 2% tolerance also have flagged it? (The guard uses 5%.) */
    strict: boolean
  }
  const findings: Finding[] = []
  let withMoney = 0
  let strictOnly = 0
  for (const r of rows) {
    const claims = claimsOf(r)
    const hasMoney = (typeof r.size === 'number' && r.size > 0) || /[$€£¥₹₩]|\b(?:USD|EUR|GBP|KRW|JPY|INR)\b/.test(r.tldr ?? '')
    if (!hasMoney) continue
    withMoney++
    const foreign = foreignAmounts(r, claims)
    if (isClean(foreign)) {
      if (!isClean(foreignAmounts(r, claims, 0.02))) strictOnly++
      continue
    }
    const sums: { currency: string; amountM: number }[] = [
      ...(foreign.size ? [{ currency: (r.original_currency && r.original_currency.toUpperCase() !== 'USD' && r.original_amount ? r.original_currency.toUpperCase() : 'USD'), amountM: (r.original_currency && r.original_currency.toUpperCase() !== 'USD' && r.original_amount ? r.original_amount : r.size!) }] : []),
      ...foreign.summary.map((m) => ({ currency: m.currency ?? '?', amountM: m.amountM })),
    ]
    const near = neighbours(r)
    // A neighbour gives the sum only if it prints that very figure: same currency, same number.
    const prints = (n: Row, s: { currency: string; amountM: number }) => figuresOf(n).some((f) => !f.unitless && f.currency === s.currency && Math.abs(f.amountM - s.amountM) <= 0.02 * Math.max(f.amountM, s.amountM))
    // Of the neighbours that print it, another report of the same story explains it best; then one written back in the same call.
    const sources = sums.map((s) => {
      const printing = near.filter((n) => prints(n, s))
      return printing.find((n) => sameStory(r, n) && sameCall(r, n)) ?? printing.find((n) => sameStory(r, n)) ?? printing.find((n) => sameCall(r, n)) ?? printing[0] ?? null
    })
    // Is the article that states it the same story from another outlet (a true fact on the wrong row), or another story (a wrong fact)?
    const given = sources.filter(Boolean) as Row[]
    const verdict = !given.length ? 'unexplained' : given.every((n) => sameStory(r, n)) ? 'same story' : 'another story'
    findings.push({ row: r, size: foreign.size, sums, sources, verdict, strict: true })
  }

  // ─── Report ───────────────────────────────────────────────────────────────
  const fmt = (s: { currency: string; amountM: number }) => `${s.currency} ${s.amountM >= 1000 ? `${+(s.amountM / 1000).toFixed(2)}B` : `${+s.amountM.toFixed(1)}M`}`
  const another = findings.filter((f) => f.verdict === 'another story')
  const sibling = findings.filter((f) => f.verdict === 'same story')
  const unexplained = findings.filter((f) => f.verdict === 'unexplained')
  const byMonth = (list: Finding[]) => {
    const m = new Map<string, number>()
    for (const f of list) m.set(f.row.created_at.slice(0, 7), (m.get(f.row.created_at.slice(0, 7)) ?? 0) + 1)
    return [...m].sort().map(([k, v]) => `${k}: ${v}`).join(', ')
  }
  const byType = (list: Finding[]) => {
    const m = new Map<string, number>()
    for (const f of list) m.set(f.row.event_type ?? '(none)', (m.get(f.row.event_type ?? '(none)') ?? 0) + 1)
    return [...m].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')
  }
  const line = (label: string, list: Finding[]) => {
    console.log(`  ${label}: ${list.length}   [by month: ${byMonth(list)}]`)
    console.log(`    wrong size: ${list.filter((f) => f.size).length}; a sum in the summary only: ${list.filter((f) => !f.size).length}; relevance 0.5 or more: ${list.filter((f) => Number(f.row.relevance_score) >= 0.5).length}`)
    console.log(`    by type: ${byType(list)}`)
  }
  console.log(`Rows classified since ${SINCE}: ${rows.length}. Rows that state a sum of money (a size, or one in the summary): ${withMoney}.`)
  console.log(`Rows stating a sum their own article does not give: ${findings.length} (${(100 * findings.length / Math.max(1, withMoney)).toFixed(1)}% of those).`)
  line('the sum belongs to ANOTHER STORY classified beside it (a wrong fact)', another)
  line('the sum is from another outlet\'s report of the SAME STORY, classified beside it (a true fact, on the wrong row)', sibling)
  line('no article classified beside it states the sum (arithmetic, a guess, or memory)', unexplained)
  console.log(`  (a further ${strictOnly} rows differ from their article by between 2% and 5%: rounding, left alone)`)

  const show = (f: Finding) => {
    const r = f.row
    console.log(`\n- ${r.created_at.slice(0, 16)}  ${r.id}  [${r.event_type}, relevance ${r.relevance_score}${r.is_duplicate ? ', duplicate' : ''}]  ${r.source_name ?? ''}`)
    console.log(`  headline: ${r.title.slice(0, 150)}`)
    console.log(`  summary:  ${(r.tldr ?? '').slice(0, 300)}`)
    console.log(`  size: ${r.size ?? '—'}${r.original_currency ? ` (${r.original_currency} ${r.original_amount})` : ''}   foreign: ${f.size ? 'SIZE ' : ''}${f.sums.map(fmt).join(', ')}`)
    f.sources.forEach((s, i) => { if (s) console.log(`  ${fmt(f.sums[i])} is stated by: ${s.title.slice(0, 120)}  [${s.created_at.slice(0, 16)}${sameCall(r, s) ? ', written back together' : ''}]`) })
    const own = figuresOf(r)
    console.log(`  its own article states: ${own.length ? own.slice(0, 8).map((o) => `${o.currency ?? '?'} ${o.amountM >= 1000 ? `${+(o.amountM / 1000).toFixed(2)}B` : `${+o.amountM.toFixed(3)}M`}${o.unitless ? '(no unit)' : ''}`).join(', ') : 'no sum at all'}`)
  }
  console.log(`\n══ ANOTHER STORY'S SUM (${another.length}) ══`)
  for (const f of another) show(f)
  console.log(`\n══ NO ARTICLE BESIDE IT STATES THE SUM (${unexplained.length}), first ${Math.min(exampleCount, unexplained.length)} ══`)
  for (const f of unexplained.slice(0, exampleCount)) show(f)
  console.log(`\n══ THE SAME STORY FROM ANOTHER OUTLET (${sibling.length}), first ${Math.min(exampleCount, sibling.length)} ══`)
  for (const f of sibling.slice(0, exampleCount)) show(f)

  if (listOut) {
    writeFileSync(listOut, JSON.stringify(findings.map((f) => ({
      id: f.row.id, verdict: f.verdict, created_at: f.row.created_at, title: f.row.title, tldr: f.row.tldr, size: f.row.size, event_type: f.row.event_type,
      relevance_score: f.row.relevance_score, is_duplicate: f.row.is_duplicate, sizeForeign: f.size, sums: f.sums, sources: f.sources.map((s) => s && { id: s.id, title: s.title }),
    })), null, 1))
    console.error(`  list written to ${listOut}`)
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
