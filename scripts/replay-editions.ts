#!/usr/bin/env npx tsx
/**
 * Replay past editions against a saved article pool. Offline: reads two JSON
 * files, touches no database, sends nothing.
 *
 * Why: selection rules (dedup, sectioning, quality gates) can only be judged
 * against real days. This re-runs each historical edition's assembly with the
 * current code, chaining its own output as the "prior editions" memory, and
 * prints what readers would have received.
 *
 * Usage:
 *   npx tsx scripts/replay-editions.ts <pool.json> <editions.json> [fromDate] [--actual-prior] [--json out.json]
 *
 * pool.json     — news_items rows (id, title, source_*, published_date,
 *                 article_type, event_type, fund_categories, is_high_signal,
 *                 relevance_score, tldr, entities_raw, extracted_data,
 *                 classification_status, is_duplicate, created_at)
 * editions.json — newsletter_editions rows (edition_date, article_ids, sent_at, status)
 * --actual-prior  use what really shipped as the memory (isolates one day's
 *                 assembly; default chains the replayed output instead)
 */
import { readFileSync, writeFileSync } from 'fs'
import { assembleNewsletter, buildPriorExclusions, ALL_NEWSLETTER_TYPES } from '../lib/newsletter/query-articles'
import { buildSubject } from '../lib/newsletter/send-daily'
import { splitHeadlineByEntities } from '../lib/news/constants'

const [poolPath, editionsPath, ...rest] = process.argv.slice(2)
const fromDate = rest.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) ?? '0000-00-00'
const actualPrior = rest.includes('--actual-prior')
const jsonOut = rest.includes('--json') ? rest[rest.indexOf('--json') + 1] : null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pool: any[] = JSON.parse(readFileSync(poolPath, 'utf8'))
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const editions: any[] = JSON.parse(readFileSync(editionsPath, 'utf8'))
  .filter((e: { status?: string }) => (e.status ?? 'sent') === 'sent')
  .sort((a: { edition_date: string }, b: { edition_date: string }) => a.edition_date.localeCompare(b.edition_date))
const rowsById = new Map(pool.map((r) => [r.id, r]))

function candidates(sentAt: string, hoursBack: number) {
  const until = new Date(sentAt).getTime()
  const since = until - hoursBack * 3600_000
  return pool
    .filter((r) => r.classification_status === 'complete' && !r.is_duplicate)
    // published_date is a DATE column: the live query's `gte(published_date,
    // <timestamp>)` compares against the timestamp's calendar day.
    .filter((r) => String(r.published_date).slice(0, 10) >= new Date(since).toISOString().slice(0, 10)
      && new Date(r.created_at).getTime() <= until)
    .filter((r) => r.is_high_signal || (r.relevance_score ?? 0) >= 0.3)
    .filter((r) => ALL_NEWSLETTER_TYPES.includes(r.article_type))
    .sort((a, b) => new Date(b.published_date).getTime() - new Date(a.published_date).getTime())
    .slice(0, 500)
}

const shipped: string[][] = [] // oldest first, replayed or actual
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const out: any[] = []
for (const ed of editions) {
  if (ed.edition_date < fromDate) { shipped.push(ed.article_ids ?? []); continue }
  const prior = buildPriorExclusions([...shipped].reverse(), rowsById)
  const sentAt = ed.sent_at ?? `${ed.edition_date}T11:30:00Z`
  let content = assembleNewsletter(candidates(sentAt, 26), prior)
  const dow = new Date(`${ed.edition_date}T12:00:00Z`).getUTCDay()
  if ((dow === 0 || dow === 6) && content.totalArticles < 8) content = assembleNewsletter(candidates(sentAt, 72), prior)
  const actual = new Set<string>(ed.article_ids ?? [])
  const mine = new Set(content.articleIds)
  const both = [...mine].filter((i) => actual.has(i)).length
  console.log(`\n===== ${ed.edition_date}  replay ${mine.size} | actual ${actual.size} | shared ${both}`)
  console.log(`subject: ${buildSubject(content)}`)
  for (const g of content.groups) {
    console.log(`── ${g.label} (${g.articles.length})`)
    for (const a of g.articles) {
      const mark = actual.has(a.id) ? ' ' : '+'
      const marked = splitHeadlineByEntities(a.title, a.headlineEntities).map((x) => (x.bold ? `**${x.text}**` : x.text)).join('')
      console.log(` ${mark} ${marked.slice(0, 140)}`)
    }
  }
  const why = new Map((content.dropped ?? []).map((d) => [d.id, d.reason]))
  const dropped = [...actual].filter((i) => !mine.has(i)).map((i) => `${String(rowsById.get(i)?.title ?? i).slice(0, 84)}  ⟵ ${why.get(i) ?? (shipped.some((ids) => ids.includes(i)) ? 'already ran in an earlier replayed edition' : 'not a candidate at replay send time')}`)
  if (dropped.length) { console.log(`── no longer included (${dropped.length})`); for (const t of dropped) console.log(`  - ${t}`) }
  out.push({ date: ed.edition_date, subject: buildSubject(content), groups: content.groups.map((g) => ({ label: g.label, titles: g.articles.map((a) => a.title) })), dropped })
  shipped.push(actualPrior ? (ed.article_ids ?? []) : content.articleIds)
}
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(out, null, 1))
