#!/usr/bin/env npx tsx
/**
 * People-move pairs audit. Offline and read-only: it reads a saved pool
 * (scripts/roundup-audit.ts --save-pool pool.json) and writes nothing.
 *
 *   npx tsx scripts/people-pairs-audit.ts --pool pool.json [--days 30] [--gap 2] [--json out.json]
 *
 * Two reports of one hire are one story when they name the same person
 * (isSameStory, sameStoryLoose). When one of them names nobody ("Barings
 * expands private credit naming global head of asset-based finance") there is
 * no person to compare, and the pair is one story only if the headlines
 * happen to share enough words.
 *
 * This lists every pair of people-move rows from one firm, at most `gap` days
 * apart, that the site does not show as one story, sorted by who is named:
 *   one-named   one row names a person, the other names nobody
 *   none-named  neither names anybody
 *   two-named   each names a different person (two moves, as a rule)
 * with the words of the job the two share (roleWords) and what sameMove says
 * of the pair. Read them by eye: the ones still apart that are one move, and
 * — after any change to sameMove — every pair that has left the list.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { ALL_NEWSLETTER_TYPES, rowToArticle, screenArticle, isRoundupArticle } from '../lib/newsletter/query-articles'
import { entityKey, keysMatch, sameStoryLoose, storyFamily } from '../lib/newsletter/story-links'
import { isSameStory, roleWords, sameMove } from '../lib/news/story-dedup'
import { buildStories } from '../lib/news/stories'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any
const DAY_MS = 86_400_000

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name)
  return i > 0 ? process.argv[i + 1] : undefined
}

const poolPath = flag('--pool')
if (!poolPath) throw new Error('--pool pool.json is required (scripts/roundup-audit.ts --save-pool writes one)')
const days = Number(flag('--days')) || 30
const maxGap = Number(flag('--gap') ?? 2)
const jsonOut = flag('--json')

const pool: Row[] = JSON.parse(readFileSync(poolPath, 'utf8'))
const newest = pool.map((r) => String(r.published_date).slice(0, 10)).sort().pop()!
const since = new Date(new Date(`${newest}T12:00:00Z`).getTime() - days * DAY_MS).toISOString().slice(0, 10)

/** What the site's own query asks of a row before it can be a story. */
const canShow = (r: Row) =>
  r.classification_status === 'complete' && !r.is_duplicate &&
  (r.is_high_signal || Number(r.relevance_score ?? 0) >= 0.3) && ALL_NEWSLETTER_TYPES.includes(r.article_type)

const rows = pool.filter((r) => r.title && canShow(r) && String(r.published_date).slice(0, 10) >= since)
const stories = buildStories(rows.map((r) => ({ ...r, extracted_data: r.extracted_data ? { ...r.extracted_data } : r.extracted_data })))
const storyOf = new Map<string, string>()
for (const s of stories) for (const id of s.memberIds) storyOf.set(id, s.id)

const people = rows
  .map((row) => ({ row, a: rowToArticle(row), day: Math.floor(new Date(`${String(row.published_date).slice(0, 10)}T12:00:00Z`).getTime() / DAY_MS) }))
  .filter((c) => storyFamily(c.a.eventType) === 'people' && !screenArticle(c.a) && !isRoundupArticle(c.a) && c.a.firmName)

const named = (c: (typeof people)[number]) => !!c.a.personName || c.a.personKeys.length > 0

interface Pair {
  kind: 'one-named' | 'none-named' | 'two-named'
  gap: number
  firm: string
  shownApart: boolean
  joinedNow: boolean
  /** What sameMove says of the pair on its own, and the words of the job the two share. */
  oneMove: boolean
  sharedRole: string[]
  types: string
  a: { id: string; date: string; source: string | null; title: string; person: string | null; role: string | null; tldr: string | null }
  b: { id: string; date: string; source: string | null; title: string; person: string | null; role: string | null; tldr: string | null }
}
const side = (c: (typeof people)[number]) => ({
  id: c.a.id as string,
  date: String(c.row.published_date).slice(0, 10),
  source: c.a.sourceName,
  title: c.a.title,
  person: c.a.personName ?? (c.a.personKeys[0] ?? null),
  role: c.a.personTitle,
  tldr: c.a.tldr,
})

const pairs: Pair[] = []
for (let i = 0; i < people.length; i++) {
  for (let j = i + 1; j < people.length; j++) {
    const [x, y] = [people[i], people[j]]
    const gap = Math.abs(x.day - y.day)
    if (gap > maxGap) continue
    if (!keysMatch(entityKey(x.a.firmName), entityKey(y.a.firmName))) continue
    const sx = storyOf.get(x.a.id)
    const sy = storyOf.get(y.a.id)
    // One story already: nothing to look at.
    if (sx && sx === sy) continue
    const nx = named(x)
    const ny = named(y)
    pairs.push({
      kind: nx && ny ? 'two-named' : nx || ny ? 'one-named' : 'none-named',
      gap,
      firm: x.a.firmName!,
      // Both rows are on the site, as two stories. (A row the gate turned away is on no page.)
      shownApart: !!sx && !!sy,
      joinedNow: isSameStory(x.a, y.a) || sameStoryLoose(x.a, y.a, { crossEdition: gap > 1 }),
      oneMove: sameMove(x.a, y.a),
      sharedRole: [...roleWords(x.a)].filter((w) => roleWords(y.a).has(w)),
      types: `${x.a.eventType} / ${y.a.eventType}`,
      a: side(x),
      b: side(y),
    })
  }
}

const count = (k: Pair['kind']) => pairs.filter((p) => p.kind === k)
console.log(`rows the site can show since ${since}: ${rows.length}; people-move rows with a firm: ${people.length} (${people.filter(named).length} name a person, ${people.filter((c) => !named(c)).length} name nobody)`)
console.log(`stories: ${stories.length}, of which people ${stories.filter((s) => s.kind === 'people').length}`)
console.log(`same-firm people pairs at most ${maxGap} day(s) apart that are not one story: ${pairs.length}`)
for (const k of ['one-named', 'none-named', 'two-named'] as const) {
  const list = count(k)
  console.log(`  ${k}: ${list.length} (both shown, as two stories: ${list.filter((p) => p.shownApart).length}; the rules now join: ${list.filter((p) => p.joinedNow).length})`)
}

for (const k of ['one-named', 'none-named', 'two-named'] as const) {
  console.log(`\n══════ ${k} ══════`)
  for (const p of count(k).sort((m, n) => m.firm.localeCompare(n.firm))) {
    console.log(`\n[${p.firm}] gap ${p.gap}d${p.shownApart ? '  SHOWN AS TWO' : ''}${p.joinedNow ? '  → joined now' : ''}${p.oneMove ? '  ONE MOVE' : ''}  (${p.types}; shared job words: ${p.sharedRole.join(' ') || 'none'})`)
    for (const s of [p.a, p.b]) {
      console.log(`  ${s.date} ${String(s.source ?? '?').padEnd(28).slice(0, 28)} ${s.title}`)
      console.log(`      person: ${s.person ?? '—'} | role: ${s.role ?? '—'} | ${String(s.tldr ?? '').slice(0, 170)}`)
    }
  }
}
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(pairs, null, 1))
