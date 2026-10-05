/**
 * Roundup audit. Read-only: it never writes a row.
 *
 *   npx tsx scripts/roundup-audit.ts --save-pool pool.json     # read the last 35 days once, keep what was read
 *   npx tsx scripts/roundup-audit.ts --pool pool.json          # re-run offline
 *   npx tsx scripts/roundup-audit.ts --pool pool.json --days 100 --all
 *
 * Some headlines carry several stories: PE Hub's daily wire ("A backs X; B to
 * acquire Y"), and columns under their own name ("Field Notes: A; B", "Loan
 * Note: …", "Blueprint: A, B and more"). The classifier writes one record for
 * such a row, which can pair one item's firm and size with another item's
 * fund, so the site must know them (isRoundup, lib/newsletter/story-links.ts):
 * it knows the outlets and the columns it has been told about, and otherwise
 * looks for a later clause that opens with another named party.
 *
 * This prints what a person should read to find the ones it does not know:
 *   1. lead-ins ("Something: …") that recur with several items after them and
 *      are not recognised — a new column for COLUMN_LABEL;
 *   2. outlets whose headlines with a semicolon are mostly not recognised —
 *      a candidate for WIRE_OUTLETS, if every one of them is a wire;
 *   3. every headline with a semicolon that the site can show and does not
 *      treat as a roundup. Most are one story ("TPG Gets $10 Billion for
 *      Climate PE Fund; to Close for New Cash"): a semicolon is not the test.
 *
 * The database is small and shared: rows are read a week at a time, 250 per
 * request, with a pause between requests. Read it once and work from the file.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { ALL_NEWSLETTER_TYPES, isRoundupArticle, rowToArticle, screenArticle } from '../lib/newsletter/query-articles'
import { isDigest } from '../lib/newsletter/story-links'

const DAY_MS = 86_400_000
const PAGE = 250
const PAUSE_MS = 200
const COLUMNS = 'id, title, source_name, source_url, published_date, created_at, article_type, event_type, fund_categories, is_high_signal, relevance_score, tldr, entities_raw, extracted_data, classification_status, is_duplicate'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name)
  return i > 0 ? process.argv[i + 1] : undefined
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

async function readRows(since: string): Promise<Row[]> {
  process.loadEnvFile('.env.local')
  const { getSupabaseAdmin } = await import('../lib/supabase/client')
  const db = getSupabaseAdmin()
  const rows: Row[] = []
  const end = Date.now() + DAY_MS
  for (let from = new Date(`${since}T00:00:00Z`).getTime(); from < end; from += 7 * DAY_MS) {
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await db
        .from('news_items')
        .select(COLUMNS)
        .gte('published_date', isoDay(from))
        .lt('published_date', isoDay(from + 7 * DAY_MS))
        .order('published_date', { ascending: false })
        .order('id', { ascending: true })
        .range(offset, offset + PAGE - 1)
      if (error) throw new Error(`${isoDay(from)} @${offset}: ${error.message}`)
      rows.push(...(data ?? []))
      await sleep(PAUSE_MS)
      if (!data || data.length < PAGE) break
    }
  }
  return rows
}

/** What the site's own query asks of a row before it can be a story. */
const canShow = (r: Row) =>
  r.classification_status === 'complete' && !r.is_duplicate &&
  (r.is_high_signal || Number(r.relevance_score ?? 0) >= 0.3) && ALL_NEWSLETTER_TYPES.includes(r.article_type)

async function main() {
  const days = Number(flag('--days')) || 35
  const since = isoDay(Date.now() - days * DAY_MS)
  const poolIn = flag('--pool')
  const poolOut = flag('--save-pool')
  const pool: Row[] = poolIn ? JSON.parse(readFileSync(poolIn, 'utf8')) : await readRows(since)
  if (poolOut) writeFileSync(poolOut, JSON.stringify(pool))
  const all = process.argv.includes('--all')

  const rows = pool.filter((r) => String(r.published_date).slice(0, 10) >= since && r.title).map((row) => {
    const a = rowToArticle(row)
    return { row, a, roundup: isRoundupArticle(a), dropped: isDigest(a.title) || !!screenArticle(a), shown: canShow(row), semi: /;\s/.test(a.title) }
  })
  const semi = rows.filter((r) => r.semi)
  console.log(`rows since ${since}: ${rows.length}, of which the site can show ${rows.filter((r) => r.shown).length}`)
  console.log(`headlines with a semicolon: ${semi.length} (can show ${semi.filter((r) => r.shown).length}); treated as roundups: ${semi.filter((r) => r.roundup).length} (can show ${semi.filter((r) => r.roundup && r.shown).length})`)
  console.log(`roundups of any shape: ${rows.filter((r) => r.roundup).length} (can show ${rows.filter((r) => r.roundup && r.shown).length})`)

  // 1. Lead-ins that recur with several items after them.
  const several = (rest: string) => /;\s/.test(rest) || rest.split(/,\s/).length >= 3 || /\b(and|&) more\b\.?$/i.test(rest) || /,\s*while\b/i.test(rest)
  const labels = new Map<string, { n: number; multi: number; unknown: string[]; canShow: number; outlets: Set<string> }>()
  for (const r of rows) {
    const m = r.a.title.match(/^([A-Z][\w'’&.\- ]{1,30}):\s+(.*)$/)
    if (!m) continue
    const e = labels.get(m[1].toLowerCase()) ?? { n: 0, multi: 0, unknown: [], canShow: 0, outlets: new Set<string>() }
    e.n++
    e.outlets.add(r.row.source_name ?? '?')
    if (several(m[2])) {
      e.multi++
      if (!r.roundup && !r.dropped) {
        e.unknown.push(r.a.title)
        if (r.shown) e.canShow++
      }
    }
    labels.set(m[1].toLowerCase(), e)
  }
  const fresh = [...labels.entries()].filter(([, e]) => e.multi >= 2 && e.unknown.length > 0).sort((x, y) => y[1].canShow - x[1].canShow || y[1].unknown.length - x[1].unknown.length)
  console.log(`\n1. lead-ins seen twice or more with several items after them, and not recognised: ${fresh.length} (the ones the site can show matter)`)
  for (const [label, e] of fresh) {
    console.log(`   "${label}:"  ${e.n} headlines, ${e.multi} with several items, ${e.unknown.length} not recognised, ${e.canShow} of those the site can show  [${[...e.outlets].slice(0, 3).join(', ')}]`)
    for (const t of e.unknown.slice(0, all ? 50 : 3)) console.log(`       ${t.slice(0, 150)}`)
  }

  // 2. Outlets whose semicolon headlines are mostly not recognised.
  const byOutlet = new Map<string, typeof semi>()
  for (const r of semi) byOutlet.set(r.row.source_name ?? '?', [...(byOutlet.get(r.row.source_name ?? '?') ?? []), r])
  const outlets = [...byOutlet.entries()].filter(([, list]) => list.length >= 3 && list.some((r) => !r.roundup && !r.dropped)).sort((x, y) => y[1].length - x[1].length)
  console.log(`\n2. outlets with three or more semicolon headlines, some not recognised: ${outlets.length}`)
  for (const [outlet, list] of outlets) {
    const open = list.filter((r) => !r.roundup && !r.dropped)
    console.log(`   ${outlet}: ${list.length} headlines, ${open.length} not recognised`)
    for (const r of open.slice(0, all ? 50 : 4)) console.log(`       ${r.a.title.slice(0, 150)}`)
  }

  // 3. What the site can show and does not treat as a roundup.
  const open = semi.filter((r) => r.shown && !r.roundup && !r.dropped)
  console.log(`\n3. semicolon headlines the site can show as ordinary stories: ${open.length} (read them: most are one story)`)
  for (const r of open) console.log(`   ${String(r.row.published_date).slice(0, 10)} [${r.row.source_name}] ${r.a.title.slice(0, 170)}`)
}

main().catch((err) => { console.error(err); process.exit(1) })
