/**
 * Firms, as an index over stories.
 *
 * There is no firm table. A firm is whatever name the stories carry, grouped
 * by the same key the story clustering uses (lib/news/league.ts firmSlug), so
 * the "firms in the news" line, the directory at /firms and each firm's own
 * page agree on who is who.
 *
 * Pure: no I/O.
 */
import type { Story, StoryKind } from './stories'
import { firmHref, firmSlug } from './league'
import { entityKey, isRegulatorName, keysMatch } from '@/lib/newsletter/story-links'
import { splitHeadlineByEntities } from './constants'

export interface FirmEntry {
  slug: string
  /** The fuller common spelling: "Ares Management". For a page title or a directory. */
  name: string
  /** The spelling the reports use most: "Ares". For a tight line of names. */
  shortName: string
  /** Stories in which the firm is the subject. */
  stories: number
  /** Outlets across those stories — how widely it was reported. */
  outlets: number
  /** ISO date of the newest of them. */
  lastSeen: string
  /** What it is mostly in the news for. */
  topKind: StoryKind
  regulator: boolean
}

/** A description the classifier returned as a name: "New London private equity firm". */
const looksLikeDescription = (name: string) => /\b[a-z]{3,}\s+[a-z]{3,}\b/.test(name)

/** Every firm that is the subject of at least one story, most covered first. */
export function firmIndex(stories: Story[]): FirmEntry[] {
  const groups = new Map<string, { names: Map<string, number>; stories: Story[] }>()
  for (const s of stories) {
    if (s.roundup || !s.firmName) continue
    const name = s.firmName.trim()
    if (!name || looksLikeDescription(name) || !firmHref(name)) continue
    const slug = firmSlug(name)
    const g = groups.get(slug) ?? { names: new Map<string, number>(), stories: [] }
    g.names.set(name, (g.names.get(name) ?? 0) + 1)
    g.stories.push(s)
    groups.set(slug, g)
  }

  const out: FirmEntry[] = []
  for (const [slug, g] of groups) {
    const ranked = Array.from(g.names.entries()).sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)
    const shortName = ranked[0][0]
    // The fuller form when the reports use it often too: "Ares Management" over "Ares".
    const fuller = ranked.find(([n, c]) => n.length > shortName.length && c >= ranked[0][1] / 3 && n.toLowerCase().startsWith(shortName.toLowerCase()))
    const kinds = new Map<StoryKind, number>()
    for (const s of g.stories) kinds.set(s.kind, (kinds.get(s.kind) ?? 0) + 1)
    out.push({
      slug,
      name: (fuller ?? ranked[0])[0],
      shortName,
      stories: g.stories.length,
      outlets: g.stories.reduce((n, s) => n + s.coverage.length + 1, 0),
      lastSeen: g.stories.map((s) => s.publishedDate ?? s.firstSeen.slice(0, 10)).sort().pop() as string,
      topKind: Array.from(kinds.entries()).sort((a, b) => b[1] - a[1])[0][0],
      // "Abu Dhabi Investment Authority" is an investor, whatever its name says.
      regulator: isRegulatorName(shortName) && !/\binvestment (authority|corporation|board)\b/i.test(shortName),
    })
  }
  return out.sort(byCoverage)
}

function byCoverage(a: FirmEntry, b: FirmEntry): number {
  return b.stories - a.stories || b.outlets - a.outlets || b.lastSeen.localeCompare(a.lastSeen) || a.name.localeCompare(b.name)
}

/**
 * The firms most in the news over the last `days`: by how many stories they
 * are the subject of, then by how widely those were reported. Regulators are
 * left out — the SEC is in the news every week, and this is a line about firms.
 */
export function firmsInTheNews(stories: Story[], nowMs: number, days = 7, limit = 10): FirmEntry[] {
  const since = nowMs - days * 86_400_000
  const recent = stories.filter((s) => new Date(s.firstSeen).getTime() >= since)
  return firmIndex(recent).filter((f) => !f.regulator).slice(0, limit)
}

/** The directory: every firm, grouped under its first letter ("#" for a digit or symbol). */
export function firmsByLetter(firms: FirmEntry[]): { letter: string; firms: FirmEntry[] }[] {
  const groups = new Map<string, FirmEntry[]>()
  for (const f of firms) {
    const first = f.name.trim()[0]?.toUpperCase() ?? '#'
    const letter = /[A-Z]/.test(first) ? first : '#'
    groups.set(letter, [...(groups.get(letter) ?? []), f])
  }
  return Array.from(groups.entries())
    .sort((a, b) => (a[0] === '#' ? 1 : b[0] === '#' ? -1 : a[0].localeCompare(b[0])))
    .map(([letter, list]) => ({ letter, firms: list.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })) }))
}

/**
 * The firm pages worth a link (2026-10-22). Every name a story carries has a
 * page (lib/news/firm-data.ts), but a page with one story on it is the story
 * the reader came from. These are the pages the sitemap lists: every manager
 * in the league table, which has at least a close to show, and every firm that
 * is the subject of two stories or more in the thirty days. The 2026-10-22 SEO
 * audit found 706 of them that no news list linked to.
 */
export function firmPageSlugs(archive: Story[], league: { firmSlug: string }[]): string[] {
  const active = firmIndex(archive).filter((f) => f.stories >= 2)
  return Array.from(new Set([...league.map((c) => c.firmSlug), ...active.map((f) => f.slug)]))
}

/**
 * The firm page a name should link to, or null for none.
 *
 * The name's own page when it is one of `pages`: every spelling with the same
 * key lands there ("H.I.G. Capital", "HIG" → /firm/hig; "Ares Management
 * Corp." → /firm/ares). Otherwise the page of the firm it is a part of, by the
 * rule the firm page itself uses to collect stories (isFirmName: the key, or a
 * longer form of it), so the page linked to carries the story: "Goldman Sachs
 * Alternatives" → /firm/goldman-sachs. Never a page that is not in `pages`.
 */
export function firmPageHref(name: string | null | undefined, pages: ReadonlySet<string>): string | null {
  const clean = name?.trim()
  if (!clean || looksLikeDescription(clean)) return null
  const href = firmHref(clean)
  if (!href) return null
  const tokens = firmSlug(clean).split('-')
  for (let n = tokens.length; n >= 1; n--) {
    const slug = tokens.slice(0, n).join('-')
    if (!pages.has(slug)) continue
    // A shorter key must still be this firm: not three letters or fewer, not "Korea" or "First" (keysMatch).
    if (n === tokens.length || keysMatch(tokens.slice(0, n).join(' '), tokens.join(' '))) return `/firm/${slug}`
  }
  return null
}

/** A firm's name and its page, for a link beside a story. */
export interface FirmRef {
  name: string
  href: string
}

/**
 * The link a story's row carries to its firm, or null. A wire is several
 * stories under one headline and names no one firm; a name that is also the
 * story's person is a person (never linked).
 */
export function storyFirmRef(story: Pick<Story, 'firmName' | 'personName' | 'roundup'>, pages: ReadonlySet<string>): FirmRef | null {
  const name = story.firmName?.trim()
  if (story.roundup || !name) return null
  if (story.personName && entityKey(story.personName) === entityKey(name)) return null
  const href = firmPageHref(name, pages)
  return href ? { name, href } : null
}

/** A run of a headline: bold for a name, with the firm's page when the name is a firm that has one. */
export interface HeadlineRun {
  text: string
  bold: boolean
  href?: string
}

/** Where each bold run of `title` starts and ends, for these names. */
function boldRanges(title: string, names: (string | null | undefined)[]): [number, number][] {
  const out: [number, number][] = []
  let at = 0
  for (const seg of splitHeadlineByEntities(title, names)) {
    if (seg.bold) out.push([at, at + seg.text.length])
    at += seg.text.length
  }
  return out
}

/**
 * A headline split as the site sets it (bold names, lib/news/constants.ts
 * splitHeadlineByEntities), with each bold firm name given its page. Only a
 * name the story lists as a FIRM is linked (`firmName`, `firms`); `entities`
 * mixes in the people, and a run that is, or overlaps, a person's name is
 * never linked. For a headline that is not itself a link: the story page's.
 */
export function headlineRuns(
  story: Pick<Story, 'headline' | 'entities' | 'firmName' | 'personName' | 'firms'>,
  hrefFor: (name: string) => string | null,
): HeadlineRun[] {
  const title = story.headline
  const segments = splitHeadlineByEntities(title, story.entities.length ? story.entities : [story.firmName, story.personName])
  const firms = Array.from(new Set([story.firmName, ...(story.firms ?? [])].map((n) => n?.trim()).filter((n): n is string => !!n)))
  const firmKeys = new Set(firms.map((n) => entityKey(n)))
  const people = [story.personName, ...story.entities.filter((e) => !firmKeys.has(entityKey(e)))]
  const personRanges = boldRanges(title, people)
  // Each firm's runs, found with that firm alone; the subject first, so it wins a tie.
  const firmAt = new Map<string, string>()
  for (const name of firms) {
    for (const [s, e] of boldRanges(title, [name])) if (!firmAt.has(`${s}:${e}`)) firmAt.set(`${s}:${e}`, name)
  }
  const runs: HeadlineRun[] = []
  let at = 0
  for (const seg of segments) {
    const start = at
    const end = at + seg.text.length
    at = end
    const firm = seg.bold ? firmAt.get(`${start}:${end}`) : undefined
    const person = personRanges.some(([s, e]) => start < e && end > s)
    const href = firm && !person ? hrefFor(firm) : null
    runs.push(href ? { ...seg, href } : { ...seg })
  }
  return runs
}
