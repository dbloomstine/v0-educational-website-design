/**
 * Everything the /directory front page needs, from the live trades' public lists (2026-10-24, design pass): the
 * finder's entries (every page, firm and ranking a reader can be sent to), the strategy and city tables, the popular
 * searches, the firms with the most partners and the trust facts. Pure, so tested; cached small on its own key
 * (lib/directory/data.ts loadFinder).
 *
 * Learnt from (structure, not looks):
 *   - Zocdoc's home and search: one box that takes a name, a speciality or a place, with typed suggestions grouped by
 *     kind and popular searches under it; the reasons to trust it in a strip straight after;
 *   - Zillow's agent finder: the place-and-count entry points before any list;
 *   - Chambers and Partners' rankings: a practice-by-trade table, the basis of every number said in words;
 *   - Crunchbase's discover page: a grid of ready-made searches with their counts;
 *   - Airbnb's search: the suggestions open on focus with recent and popular entries before anything is typed.
 */
import { allLandings, landingSet, type Landing } from './landing'
import { firmListSet } from './firm-lists'
import { FIRM_MIN, firmPath, firmsOf } from './firms'
import { practiceWords } from './intent'
import { CITIES } from './places'
import { isPublic, verifiedSpan, type PersonCard } from './people'
import { seniority } from './quality'
import { fold } from './search'
import { LIVE_CATEGORIES, PRACTICE_BY_ID, type CategoryId, type PracticeId } from './taxonomy'
import type { FinderEntry } from './finder-match'

export interface FinderLink {
  path: string
  title: string
  count: number
}

export interface TradeCard {
  id: CategoryId
  count: number
  firms: number
  cities: number
  /** The firms with the most people listed, for the marks on the trade's card. */
  topFirms: { name: string; domain: string; count: number; href: string }[]
}

/** One row of a strategy or city table: a cell per trade, a page when one exists. */
export interface MatrixRow {
  key: string
  label: string
  cells: Partial<Record<CategoryId, FinderLink>>
  total: number
}

export interface TopFirm {
  name: string
  domain: string
  /** People across the live trades. */
  count: number
  /** Its page in the trade where it has the most people. */
  href: string
  /** The trades it is listed in, biggest first ("Fund Auditors", "Fund Tax Advisors"). */
  trades: string[]
}

export interface Finder {
  entries: FinderEntry[]
  trades: TradeCard[]
  strategies: MatrixRow[]
  cities: MatrixRow[]
  popular: FinderLink[]
  firms: TopFirm[]
  trust: { people: number; firms: number; senior: number; verified: string | null }
}

const cityWords = (slug: string): string => {
  const c = CITIES.find((x) => x.slug === slug)
  const short: Record<string, string> = { 'new-york': 'ny', 'san-francisco': 'sf', 'los-angeles': 'la', 'washington-dc': 'dc' }
  return [...(c?.aliases ?? []), short[slug] ?? ''].map(fold).join(' ').trim()
}

function entryWords(l: Pick<Landing, 'topic' | 'place'>): string | undefined {
  const w = [
    l.topic?.kind === 'practice' ? practiceWords([l.topic.id]).join(' ') : '',
    l.place?.kind === 'city' ? cityWords(l.place.slug) : '',
  ]
    .filter(Boolean)
    .join(' ')
  return w || undefined
}

export const FINDER_MATRIX_ROWS = 8
export const FINDER_POPULAR = 6
export const FINDER_FIRMS = 12

/** `lists`: each live trade's people (public or not: only the public ones count). */
export function buildFinder(lists: ReadonlyMap<CategoryId, PersonCard[]>, now = new Date()): Finder {
  const entries: FinderEntry[] = []
  const trades: TradeCard[] = []
  const strategies = new Map<string, MatrixRow>()
  const cities = new Map<string, MatrixRow>()
  const combos: (FinderLink & { trade: CategoryId; city: string })[] = []
  const firmTotals = new Map<string, { name: string; domain: string; count: number; best: { href: string; count: number }; trades: { plural: string; count: number }[] }>()
  const everyone: PersonCard[] = []

  for (const c of LIVE_CATEGORIES) {
    const people = (lists.get(c.id) ?? []).filter((p) => isPublic(p, now))
    if (!people.length) continue
    everyone.push(...people)
    const set = landingSet(c, people, now)
    const pages = allLandings(c, people, now)
    const firms = firmsOf(people, c, now)
    const hub = `/${c.slug}`
    const cityCount = new Set(pages.filter((l) => !l.topic && l.place?.kind === 'city').map((l) => l.place!.slug)).size

    entries.push({ k: 'trade', t: c.plural, h: hub, n: people.length, c: c.plural })
    for (const l of pages) {
      if (l.path === hub) continue
      entries.push({ k: 'page', t: l.title, h: l.path, n: l.count, c: c.plural, w: entryWords(l) })
      const link = { path: l.path, title: l.title, count: l.count }
      if (l.topic?.kind === 'practice' && !l.place) {
        const row = strategies.get(l.topic.id) ?? { key: l.topic.id, label: PRACTICE_BY_ID.get(l.topic.id as PracticeId)?.label ?? l.topic.id, cells: {}, total: 0 }
        row.cells[c.id] = link
        row.total += l.count
        strategies.set(l.topic.id, row)
      }
      if (!l.topic && l.place?.kind === 'city') {
        const row = cities.get(l.place.slug) ?? { key: l.place.slug, label: l.place.name, cells: {}, total: 0 }
        row.cells[c.id] = link
        row.total += l.count
        cities.set(l.place.slug, row)
      }
      if (l.topic?.kind === 'practice' && l.place?.kind === 'city' && l.indexable) combos.push({ ...link, trade: c.id, city: l.place.slug })
    }
    // A folded practice (fund formation, for lawyers) is the hub itself: its row points there.
    if (set.hubFolded) {
      const id = 'fund_formation'
      const row = strategies.get(id) ?? { key: id, label: PRACTICE_BY_ID.get(id)?.label ?? id, cells: {}, total: 0 }
      if (!row.cells[c.id]) {
        row.cells[c.id] = { path: hub, title: c.plural, count: set.hubFolded.count }
        row.total += set.hubFolded.count
        strategies.set(id, row)
      }
    }
    for (const f of firms) {
      if (f.count < FIRM_MIN) continue
      const href = firmPath(c, f.slug)
      entries.push({ k: 'firm', t: f.name, h: href, n: f.count, c: c.plural })
      const t = firmTotals.get(f.domain) ?? { name: f.name, domain: f.domain, count: 0, best: { href, count: 0 }, trades: [] }
      t.count += f.count
      t.trades.push({ plural: c.plural, count: f.count })
      if (f.count > t.best.count) t.best = { href, count: f.count }
      firmTotals.set(f.domain, t)
    }
    for (const x of firmListSet(c, people, set, now).lists) {
      if (x.indexable) entries.push({ k: 'ranking', t: x.title, h: x.path, n: x.firms, c: c.plural, w: entryWords(x.key) })
    }
    trades.push({
      id: c.id,
      count: people.length,
      firms: new Set(people.map((p) => p.firm_domain.toLowerCase())).size,
      cities: cityCount,
      topFirms: firms
        .filter((f) => f.count >= FIRM_MIN)
        .slice(0, 6)
        .map((f) => ({ name: f.name, domain: f.domain, count: f.count, href: firmPath(c, f.slug) })),
    })
  }

  const rows = (m: Map<string, MatrixRow>) => [...m.values()].filter((r) => Object.keys(r.cells).length > 0).sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, 'en'))

  // Popular: the biggest strategy-in-a-city pages, taken in turn from each trade so no trade fills the row, and no
  // city more than twice (New York would otherwise take every slot).
  const queues = LIVE_CATEGORIES.map((c) => combos.filter((x) => x.trade === c.id).sort((a, b) => b.count - a.count))
  const popular: FinderLink[] = []
  const perCity = new Map<string, number>()
  while (popular.length < FINDER_POPULAR && queues.some((q) => q.length)) {
    for (const q of queues) {
      const i = q.findIndex((x) => (perCity.get(x.city) ?? 0) < 2)
      if (i < 0) {
        q.length = 0
        continue
      }
      const [x] = q.splice(i, 1)
      perCity.set(x.city, (perCity.get(x.city) ?? 0) + 1)
      if (popular.length < FINDER_POPULAR) popular.push({ path: x.path, title: x.title, count: x.count })
    }
  }

  const firms: TopFirm[] = [...firmTotals.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'en'))
    .slice(0, FINDER_FIRMS)
    .map((f) => ({ name: f.name, domain: f.domain, count: f.count, href: f.best.href, trades: f.trades.sort((a, b) => b.count - a.count).map((t) => t.plural) }))

  return {
    entries,
    trades,
    strategies: rows(strategies).slice(0, FINDER_MATRIX_ROWS),
    cities: rows(cities).slice(0, FINDER_MATRIX_ROWS),
    popular,
    firms,
    trust: {
      people: everyone.length,
      firms: new Set(everyone.map((p) => p.firm_domain.toLowerCase())).size,
      senior: everyone.filter((p) => seniority(p.title) === 'senior').length,
      verified: verifiedSpan(everyone),
    },
  }
}

export const EMPTY_FINDER: Finder = { entries: [], trades: [], strategies: [], cities: [], popular: [], firms: [], trust: { people: 0, firms: 0, senior: 0, verified: null } }
