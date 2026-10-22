#!/usr/bin/env npx tsx
/**
 * Read-only audit of board item 23's "a thin summary is never retried when a
 * fuller report arrives" (2026-10-22). Writes nothing, calls no model.
 *
 *   npx tsx scripts/thin-summary-audit.ts [--days 14] [--json out.json]
 *
 * Reads news_items with the site's own filters (front-page.ts), builds the
 * stories with the site's own code, and asks two questions.
 *
 *   1. The one-line summary (the classifier's `tldr`, shown under a headline
 *      and in the email). Is the one shown thin, saying under four words the
 *      headline does not, while another report of the story says more? And
 *      did any row's text arrive after its summary was written (enriched_at
 *      later than updated_at, which only classification stamps)?
 *   2. The long summary (story-summary.ts). Of the stories marked thin, which
 *      hold enough text now, and why has the job not looked again? Then the
 *      job's own selection, as it was and as it is, on today's marks.
 *
 * Measured 2026-10-22 over 14 days (1,213 rows, 611 stories): (1) 163 stories
 * show a thin one-liner, 12 of them beside a report that says more, and often
 * says something else (another deal, the parties reversed); 6 rows had text
 * arrive after their summary, none in a thin story. The site already shows the
 * longest summary any report carries (mergeStoryGroup), so nothing changed
 * there. (2) 24 of 378 thin stories now hold enough text; 7 had been looked at
 * again, 17 had not because the fuller report came 48 hours or more after the
 * story was first seen. Fixed in story-summary-job.ts (THIN_WINDOW_HOURS): on
 * that day's marks the job's candidates went from 3 to 28.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { ALL_NEWSLETTER_TYPES } from '../lib/newsletter/query-articles'
import { buildStories } from '../lib/news/stories'
import { STORY_COLUMNS } from '../lib/news/story-columns'
import { cleanSummary } from '../lib/news/summary-clean'
import { isThin, prepareRows, type SourceRow } from '../lib/news/story-summary'
import { selectable, selectStories, WINDOW_HOURS } from '../lib/news/story-summary-job'
import { loadMarks } from '../lib/news/story-summary-store'
import { loadRowTextState, loadThinStamps } from '../lib/news/story-text-store'

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name)
  return i > 0 ? process.argv[i + 1] : undefined
}
const days = Number(flag('--days')) || 14
const jsonOut = flag('--json')

function env(name: string): string {
  if (process.env[name]) return process.env[name] as string
  if (existsSync('.env.local')) {
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
      const m = line.match(new RegExp(`^${name}\\s*=\\s*"?([^"\\n]+)"?\\s*$`))
      if (m) return m[1].trim()
    }
  }
  throw new Error(`${name} is not set`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any

const STOP = new Set(['the', 'and', 'for', 'with', 'its', 'from', 'into', 'that', 'this', 'has', 'have', 'was', 'were', 'are', 'their', 'which', 'will', 'new', 'also'])
const wordsOf = (s: string): string[] =>
  s.toLowerCase().replace(/[’']s\b/g, '').replace(/[^a-z0-9$€£\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w))
/** Distinct words of the summary the headline does not have. */
function newWords(headline: string, summary: string | null | undefined): number {
  if (!summary) return 0
  const head = new Set(wordsOf(headline))
  return new Set(wordsOf(summary).filter((w) => !head.has(w))).size
}
const THIN_LINE_WORDS = 4

async function main() {
  const db = createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } })
  const now = Date.now()
  const since = new Date(now - days * 86_400_000).toISOString().slice(0, 10)
  const shown = () =>
    db.from('news_items')
      .select(`${STORY_COLUMNS}, description, updated_at, enriched_at, summary_long_status, summary_long_at`)
      .eq('classification_status', 'complete')
      .eq('is_duplicate', false)
      .gte('published_date', since)
      .or('is_high_signal.eq.true,relevance_score.gte.0.3')
      .in('article_type', ALL_NEWSLETTER_TYPES)
  const rows: Row[] = []
  for (let from = 0; from < 12000; from += 1000) {
    const { data, error } = await shown().order('published_date', { ascending: false }).order('id', { ascending: true }).range(from, from + 999)
    if (error) throw new Error(error.message)
    rows.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  // Which rows hold stored text: ids only.
  const withText = new Set<string>()
  for (let from = 0; from < 12000; from += 1000) {
    const { data, error } = await shown().not('full_text', 'is', null).order('id', { ascending: true }).range(from, from + 999)
    if (error) throw new Error(error.message)
    for (const r of data ?? []) withText.add(r.id)
    if (!data || data.length < 1000) break
  }

  const byId = new Map(rows.map((r) => [r.id as string, r]))
  const stories = buildStories(rows.map((r) => ({ ...r, extracted_data: r.extracted_data ? { ...r.extracted_data } : r.extracted_data })))
  const ms = (s: string | null | undefined) => (s ? Date.parse(s) : NaN)
  const textCameLater = (r: Row) => withText.has(r.id) && ms(r.enriched_at) > ms(r.updated_at)

  // ── 1. The one-line summary ──
  let thinLines = 0
  const fullerSibling: Row[] = []
  const lateTextInThin: Row[] = []
  for (const s of stories) {
    const members = s.memberIds.map((id) => byId.get(id)).filter(Boolean) as Row[]
    if (newWords(s.headline, s.summary) >= THIN_LINE_WORDS) continue
    thinLines++
    const better = members.find((m) => cleanSummary(m.tldr) !== s.summary && newWords(s.headline, cleanSummary(m.tldr)) >= THIN_LINE_WORDS)
    if (better) fullerSibling.push({ headline: s.headline, shown: s.summary, other: cleanSummary(better.tldr), otherSource: better.source_name })
    const late = members.find(textCameLater)
    if (late) lateTextInThin.push({ headline: s.headline, shown: s.summary, row: late.id })
  }

  // ── 2. The long summary ──
  const longThin = stories.filter((s) => s.memberIds.some((id) => byId.get(id)?.summary_long_status === 'thin') && !s.memberIds.some((id) => byId.get(id)?.summary_long_status === 'written'))
  const nowRich: Row[] = []
  for (const s of longThin) {
    if (s.memberIds.length < 2 && !s.memberIds.some((id) => withText.has(id))) continue
    const { data, error } = await db.from('news_items').select('id, title, description, full_text, source_name, published_date').in('id', s.memberIds)
    if (error) throw new Error(error.message)
    if (isThin(prepareRows((data ?? []) as SourceRow[]))) continue
    const members = s.memberIds.map((id) => byId.get(id)).filter(Boolean) as Row[]
    const markedAt = Math.max(...members.filter((m) => m.summary_long_status === 'thin').map((m) => ms(m.summary_long_at)).filter(Number.isFinite))
    const changeAt = Math.min(...members.map((m) => {
      const t = [ms(m.created_at), withText.has(m.id) ? ms(m.enriched_at) : NaN].filter((x) => Number.isFinite(x) && x > markedAt)
      return t.length ? Math.min(...t) : Infinity
    }))
    nowRich.push({
      headline: s.headline,
      firstSeen: s.firstSeen.slice(0, 16),
      markedAt: new Date(markedAt).toISOString().slice(0, 16),
      changeAt: Number.isFinite(changeAt) ? new Date(changeAt).toISOString().slice(0, 16) : null,
      retried: members.some((m) => m.summary_long_status === 'retry' || m.summary_long_status === 'failed'),
      afterWindow: Number.isFinite(changeAt) && changeAt > ms(s.firstSeen) + WINDOW_HOURS * 3_600_000,
      outlets: 1 + s.coverage.length,
    })
  }

  // ── The job's selection on today's marks, as it was (48 hours for thin stories too) and as it is ──
  const tenDays = stories.filter((s) => ms(s.firstSeen) >= now - 10 * 86_400_000)
  const marks = await loadMarks(db, now)
  const pool = selectable(tenDays, marks, now)
  const evidence = { thinAt: await loadThinStamps(db, now), rows: await loadRowTextState(db, pool.flatMap((s) => s.memberIds)) }
  const before = selectStories(tenDays, marks, now, WINDOW_HOURS, evidence, WINDOW_HOURS)
  const after = selectStories(tenDays, marks, now, WINDOW_HOURS, evidence)
  const added = after.filter((s) => !before.includes(s))

  const out = {
    days, rows: rows.length, rowsWithText: withText.size, stories: stories.length,
    oneLine: { thin: thinLines, fullerSibling: fullerSibling.length, lateTextRows: rows.filter(textCameLater).length, lateTextInThin: lateTextInThin.length },
    long: { markedThin: longThin.length, nowRich: nowRich.length, retried: nowRich.filter((x) => x.retried).length, afterWindow: nowRich.filter((x) => !x.retried && x.afterWindow).length },
    selection: { selectableNow: pool.length, before: before.length, after: after.length, added: added.map((s) => `${s.firstSeen.slice(0, 10)} ${s.headline}`) },
  }
  console.log(JSON.stringify(out, null, 2))
  console.log('\nThin one-liner beside a report that says more:'); for (const e of fullerSibling.slice(0, 12)) console.log(JSON.stringify(e))
  console.log('\nThin long summary, story now holds enough text:'); for (const e of nowRich) console.log(JSON.stringify(e))
  if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ ...out, fullerSibling, lateTextInThin, nowRich }, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
