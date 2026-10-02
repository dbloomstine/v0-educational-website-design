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
import { isRegulatorName } from '@/lib/newsletter/story-links'

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
