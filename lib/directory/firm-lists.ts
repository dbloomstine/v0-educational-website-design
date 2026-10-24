/**
 * Firm lists (2026-10-24): the answer to "hedge fund law firms", "private equity fund audit firms", "fund formation
 * law firms in New York". One page per landing page that has enough firms, at its address plus /firms:
 *
 *   /fund-lawyers/firms                         Private Fund Law Firms (the trade's whole list)
 *   /fund-lawyers/hedge-funds/firms             Hedge Fund Law Firms
 *   /fund-lawyers/hedge-funds/new-york/firms    Hedge Fund Law Firms in New York
 *   /fund-lawyers/new-york/firms                Private Fund Law Firms in New York
 *
 * Firms are in order of how many partners each one's own website lists for that practice and place: a count, not
 * a rating (Chambers and Legal 500 rank by judgment; we rank by a number anyone can check). Ties share a rank.
 *
 * Guardrails, the landing pages' own (lib/directory/landing.ts), plus one:
 *   - a list exists only for a landing page that exists, by practice or by place (not client focus or side), with at
 *     least FIRMLIST_MIN_FIRMS firms, and a place's with FIRMLIST_PLACE_MIN_FIRMS firms and FIRMLIST_PLACE_MIN_PEOPLE
 *     partners; the trade's whole list with two firms or more. Anything else is a 404;
 *   - it is indexed only when its landing page is (a near-copy page's firms are the near-copy's firms again);
 *   - the address of a page that redirects (a folded practice, a merged state) redirects to where that page went.
 * Pure, so tested.
 */
import { CATEGORIES, type Category } from './taxonomy'
import { FIRM_MIN, firmPath, type FirmCount, type FirmSummary } from './firms'
import { landingPath, landingSet, resolveLanding, type LandingKey, type LandingSet } from './landing'
import { cityOf } from './places'
import { intentFor } from './intent'
import { isPublic, lastChanged, listJoin, type PersonCard } from './people'
import { SENIOR_ONLY } from './taxonomy'

/** Firms a national list needs (beyond the trade's whole list): fewer is a sentence on the people page, not a ranking. */
export const FIRMLIST_MIN_FIRMS = 5
/**
 * A city's or a state's list needs more: at least this many firms and partners. Below it ("6 firms, 8 partners in
 * Dallas") the ranking is ones and twos, which the people page already shows; the address is a 404, not a page.
 */
export const FIRMLIST_PLACE_MIN_FIRMS = 8
export const FIRMLIST_PLACE_MIN_PEOPLE = 20

export interface RankedFirm {
  /** 1 for the most partners; ties share a rank ("1, 2, 2, 4"). */
  rank: number
  domain: string
  name: string
  /** The firm's directory slug, and whether it has a page (FIRM_MIN people in the trade). */
  slug: string
  page: boolean
  /** Partners on this list. */
  count: number
  /** Partners the firm has in the whole trade. */
  tradeCount: number
  /** Where this list's partners sit, biggest first. */
  cities: FirmCount[]
}

/** The firms behind a list of people, most partners first. `tradeFirms` names them and says which have a page. */
export function rankFirms(people: PersonCard[], tradeFirms: FirmSummary[]): RankedFirm[] {
  const known = new Map(tradeFirms.map((f) => [f.domain, f]))
  const by = new Map<string, PersonCard[]>()
  for (const p of people) {
    const d = p.firm_domain.toLowerCase()
    by.set(d, [...(by.get(d) ?? []), p])
  }
  const out: RankedFirm[] = []
  for (const [domain, list] of by) {
    const f = known.get(domain)
    const cityCount = new Map<string, FirmCount>()
    for (const p of list) {
      const seen = new Set<string>()
      for (const o of p.offices) {
        const c = cityOf(o)
        if (!c || seen.has(c.slug)) continue
        seen.add(c.slug)
        const t = cityCount.get(c.slug) ?? { key: c.slug, label: c.name, count: 0 }
        t.count++
        cityCount.set(c.slug, t)
      }
    }
    out.push({
      rank: 0,
      domain,
      name: f?.name ?? list[0].firm_name,
      slug: f?.slug ?? '',
      page: (f?.count ?? 0) >= FIRM_MIN,
      count: list.length,
      tradeCount: f?.count ?? list.length,
      cities: [...cityCount.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'en')),
    })
  }
  out.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'en'))
  out.forEach((f, i) => (f.rank = i > 0 && out[i - 1].count === f.count ? out[i - 1].rank : i + 1))
  return out
}

export interface FirmList {
  key: LandingKey
  path: string
  /** "Hedge Fund Law Firms in New York". */
  title: string
  /** The people page this list sits under ("/fund-lawyers" for the trade's whole list). */
  peoplePath: string
  people: number
  firms: number
  indexable: boolean
  lastmod: string | null
}

export const firmListPath = (category: Category, k: LandingKey) => `${landingPath(category, k)}/firms`

/** "Hedge Fund Law Firms", "Fund Formation Law Firms in New York". */
export function firmListTitle(category: Category, k: LandingKey): string {
  const base = intentFor(category, k.topic?.kind === 'practice' ? k.topic.id : null).firms
  return `${base}${k.place ? ` in ${k.place.name}` : ''}`
}

/** The address's list: the segments before /firms name a landing page, or none (the trade's whole list). */
export function resolveFirmList(segments: string[], category: Category = CATEGORIES.fund_lawyer): LandingKey | null {
  if (!segments.length) return { topic: null, place: null }
  const k = resolveLanding(segments, category)
  if (!k || (k.topic && k.topic.kind !== 'practice')) return null
  return k
}

export interface FirmListSet {
  lists: FirmList[]
  /** Addresses whose landing page redirects: where each goes instead. */
  redirects: { path: string; into: string }[]
}

/** Every firm list a trade has, and which are indexed. Milliseconds: it reuses the landing pages' own pass. */
export function firmListSet(category: Category, people: PersonCard[], set: LandingSet = landingSet(category, people), now = new Date()): FirmListSet {
  const live = people.filter((p) => isPublic(p, now))
  const hub = `/${category.slug}`
  const lists: FirmList[] = []
  const tradeFirms = new Set(live.map((p) => p.firm_domain.toLowerCase())).size
  if (tradeFirms >= 2) {
    const root = { topic: null, place: null }
    lists.push({ key: root, path: firmListPath(category, root), title: firmListTitle(category, root), peoplePath: hub, people: live.length, firms: tradeFirms, indexable: true, lastmod: lastChanged(live) })
  }
  for (const l of set.pages) {
    if (l.topic && l.topic.kind !== 'practice') continue
    if (l.firms < FIRMLIST_MIN_FIRMS) continue
    if (l.place && (l.firms < FIRMLIST_PLACE_MIN_FIRMS || l.count < FIRMLIST_PLACE_MIN_PEOPLE)) continue
    const k = { topic: l.topic, place: l.place }
    lists.push({ key: k, path: firmListPath(category, k), title: firmListTitle(category, k), peoplePath: l.path, people: l.count, firms: l.firms, indexable: l.indexable, lastmod: l.lastmod })
  }
  const at = new Set(lists.map((x) => x.path))
  const redirects: FirmListSet['redirects'] = []
  for (const m of set.merged) {
    const into = m.into === hub ? `${hub}/firms` : `${m.into}/firms`
    if (at.has(into)) redirects.push({ path: `${m.path}/firms`, into })
  }
  return { lists, redirects }
}

/** The firm list for a landing page, when it has one. */
export const firmListFor = (fl: FirmListSet, category: Category, k: LandingKey) => fl.lists.find((x) => x.path === firmListPath(category, k)) ?? null

const n = (x: number) => x.toLocaleString('en-US')
const who = (category: Category, x: number) => (SENIOR_ONLY.includes(category.id) ? (x === 1 ? 'partner' : 'partners') : x === 1 ? 'person' : 'people')

/** The title tag: "Hedge Fund Law Firms: 38 Firms, 214 Partners", shortened to fit. */
export function firmListSearchTitle(category: Category, title: string, firms: number, people: number, max = 60): string {
  const w = who(category, people)
  const W = w[0].toUpperCase() + w.slice(1)
  const tries = [`${title}: ${n(firms)} Firms, ${n(people)} ${W}`, `${title}: ${n(firms)} Firms`, title]
  return tries.find((t) => t.length <= max) ?? title
}

/**
 * The list's opening answer: "38 firms have partners listed for hedge fund work, 214 in all. Schulte Roth & Zabel
 * has the most (24), then Seward & Kissel (19) and Akin (15)." Facts from the list below it.
 */
export function firmListSentence(category: Category, k: LandingKey, ranked: RankedFirm[]): string {
  const total = ranked.reduce((s, f) => s + f.count, 0)
  const where = k.place ? ` in ${k.place.name}` : ''
  const what = k.topic?.kind === 'practice' ? ` for ${k.topic.work} work` : ''
  const first = `${n(ranked.length)} ${ranked.length === 1 ? 'firm has' : 'firms have'} ${category.plural.toLowerCase()} listed${what}${where}: ${n(total)} ${who(category, total)} in all.`
  const [a, ...rest] = ranked
  if (!a || ranked.length < 2) return first
  const tied = ranked.filter((f) => f.rank === 1)
  const lead =
    tied.length > 1
      ? `${listJoin(tied.slice(0, 3).map((f) => f.name))} have the most (${n(a.count)} each).`
      : `${a.name} has the most (${n(a.count)})${rest.length ? `, then ${listJoin(rest.slice(0, 2).map((f) => `${f.name} (${n(f.count)})`))}` : ''}.`
  return `${first} ${lead}`
}

const SITE = 'https://fundopshq.com'

/** schema.org ItemList of the firms, in rank order: a firm with a directory page links to it. */
export function firmItemListJsonLd(name: string, path: string, firms: RankedFirm[], category: Category) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: `${SITE}${path}`,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: firms.length,
    itemListElement: firms.map((f, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: f.name,
      ...(f.page ? { url: `${SITE}${firmPath(category, f.slug)}` } : {}),
    })),
  }
}
