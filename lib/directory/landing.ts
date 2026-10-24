/**
 * The directory's generated landing pages (Danny, 2026-10-24): one template,
 * many keyword addresses.
 *
 *   /fund-lawyers/<topic>             Venture Fund Lawyers
 *   /fund-lawyers/<place>             Fund Lawyers in New York, Fund Lawyers in Texas
 *   /fund-lawyers/<topic>/<place>     Venture Fund Lawyers in San Francisco
 *
 * A topic is a practice area (strategy), a client focus (stage: emerging
 * managers, first-time funds…) or the side the lawyer acts for (GP or LP
 * counsel). A place is a known city or a state (lib/directory/places.ts).
 * Every slug comes from a closed list, and the lists never share a slug, so
 * an address resolves one way only. Profiles live apart, at
 * /fund-lawyers/people/<slug>, and cannot collide with any of this.
 *
 * Guardrails for Google's scaled-content and doorway policies (tightened
 * 2026-10-24, the SEO audit: fewer, better pages):
 *   - a page EXISTS only with at least LANDING_MIN public people at
 *     LANDING_MIN_FIRMS firms or more; below that it is a 404 and is not in
 *     the sitemap (a one-firm list is that firm's page);
 *   - a state page exists only when it adds people beyond its main city: when
 *     the biggest city holds STATE_CITY_MAX of its list or more, the state
 *     address redirects to the city's (New York State was New York City, to
 *     the person);
 *   - a page whose list is more than OVERLAP_MAX the same as a broader page's
 *     (the hub, its topic, its place) or a sibling's is kept for readers but
 *     noindexed and left out of the sitemap: "Fund Formation Lawyers" when
 *     82% of all fund lawyers list fund formation is the hub again;
 *   - it opens with a sentence computed from its own list (count, firms, the
 *     practices and cities that list actually holds), so no two read alike;
 *   - it links up to its parents and across to the nearby combinations that
 *     exist, and lists the people in pages of PAGE_SIZE.
 */
import { CATEGORIES, CLIENT_FOCUS, PRACTICES, REPRESENTS, RESERVED_SLUGS, type Category, lowerNoun, practiceLower } from './taxonomy'
import { PLACES, officeIn, placeBySlug, type Place } from './places'
import { SENIOR_ONLY } from './taxonomy'
import { bySurname, cityTally, displayName, firmTally, isPublic, lastChanged, listJoin, practiceAreas, practiceTally, profilePath, type PersonCard } from './people'

/** People a page needs to exist (5 until 2026-10-24). */
export const LANDING_MIN = 8
/** Firms a page needs to exist: one firm's people are its firm page. */
export const LANDING_MIN_FIRMS = 2
/** A state page exists only while its biggest city holds less than this share of its people. */
export const STATE_CITY_MAX = 0.9
/** A page this similar (people in common over people in either) to a broader page or a sibling is not indexed. */
export const OVERLAP_MAX = 0.8
export const PAGE_SIZE = 50

/**
 * A practice so near to the whole trade that its page and the trade's page are one (2026-10-24, the coordinator's
 * call on the SEO plan): nearly every fund lawyer does fund formation, and "fund formation lawyer" is the search.
 * Where the overlap rule flags /fund-lawyers/fund-formation[/<place>] as a copy of the hub or of the place page, the
 * copy is not built: its address 308-redirects there, and the hub or place page takes its words as its heading.
 */
export const FOLDED_PRACTICE: Partial<Record<string, string>> = { fund_lawyer: 'fund_formation' }

export type Topic =
  | { kind: 'practice'; id: string; slug: string; adj: string; noun: string; work: string }
  | { kind: 'focus'; id: string; slug: string; label: string }
  | { kind: 'side'; id: string; slug: string; label: string }

/** Every topic any trade can have: one slug space, so no address means two things in two trades. */
export const TOPICS: Topic[] = [
  ...PRACTICES.flatMap((p): Topic[] => (p.slug ? [{ kind: 'practice', id: p.id, slug: p.slug, adj: p.adj, noun: p.noun, work: p.work }] : [])),
  ...CLIENT_FOCUS.map((c): Topic => ({ kind: 'focus', id: c.id, slug: c.slug, label: c.label })),
  ...REPRESENTS.map((r): Topic => ({ kind: 'side', id: r.id, slug: r.slug, label: r.label })),
]

const TOPIC_BY_SLUG = new Map(TOPICS.map((t) => [t.slug, t]))

/**
 * The topics one trade has pages for (2026-10-24 night): its own practice
 * areas, every client focus (stage: emerging managers, first-time funds…),
 * and GP or LP counsel for lawyers only.
 */
export function topicsFor(category: Category): Topic[] {
  return TOPICS.filter((t) => (t.kind === 'practice' ? (category.practices as string[]).includes(t.id) : t.kind === 'focus' ? true : category.sides))
}

const topicsCache = new Map<string, Map<string, Topic>>()
function topicMap(category: Category): Map<string, Topic> {
  let m = topicsCache.get(category.id)
  if (!m) topicsCache.set(category.id, (m = new Map(topicsFor(category).map((t) => [t.slug, t]))))
  return m
}

/** A topic by its address, within a trade (default: any trade's). */
export const topicBySlug = (slug: string, category?: Category): Topic | null => (category ? topicMap(category).get(slug) : TOPIC_BY_SLUG.get(slug)) ?? null

export interface LandingKey {
  topic: Topic | null
  place: Place | null
}

/**
 * The page an address names, or null for none. One segment is a topic or a
 * place; two are a topic then a place. Nothing else resolves.
 */
export function resolveLanding(segments: string[], category: Category = CATEGORIES.fund_lawyer): LandingKey | null {
  if (segments.some((s) => RESERVED_SLUGS.has(s))) return null
  if (segments.length === 1) {
    const [a] = segments
    const topic = topicBySlug(a, category)
    if (topic) return { topic, place: null }
    const place = placeBySlug(a)
    return place ? { topic: null, place } : null
  }
  if (segments.length === 2) {
    const topic = topicBySlug(segments[0], category)
    const place = placeBySlug(segments[1])
    return topic && place ? { topic, place } : null
  }
  return null
}

export function landingPath(category: Category, k: LandingKey): string {
  return `/${[category.slug, k.topic?.slug, k.place?.slug].filter(Boolean).join('/')}`
}

/**
 * The topic's own name: "Venture Fund Lawyers", "Venture Fund Auditors",
 * "Placement Agents for Venture Funds", "Fund Finance Bankers for NAV
 * Lending", "Fund Lawyers for Emerging Managers".
 */
export function topicTitle(category: Category, topic: Topic | null): string {
  if (!topic) return category.plural
  if (topic.kind === 'practice') return category.topicStyle === 'for' ? `${category.plural} for ${topic.noun}` : `${topic.adj} ${category.trade}`
  return `${category.plural} for ${topic.label}`
}

/** The H1 and the title: "Venture Fund Lawyers in San Francisco". */
export function landingTitle(category: Category, k: LandingKey): string {
  return `${topicTitle(category, k.topic)}${k.place ? ` in ${k.place.name}` : ''}`
}

export function hasTopic(p: PersonCard, topic: Topic): boolean {
  if (topic.kind === 'practice') return practiceAreas(p).includes(topic.id)
  if (topic.kind === 'focus') return (p.client_focus ?? []).includes(topic.id)
  return (p.represents ?? []).includes(topic.id)
}

/** The public people a page lists, sorted by surname. */
export function peopleFor<T extends PersonCard>(people: T[], k: LandingKey, now = new Date()): T[] {
  return people
    .filter((p) => isPublic(p, now) && (!k.topic || hasTopic(p, k.topic)) && (!k.place || p.offices.some((o) => officeIn(o, k.place!))))
    .sort(bySurname)
}

export interface Landing extends LandingKey {
  path: string
  title: string
  count: number
  firms: number
  /** Offered to search engines and listed in the sitemap. */
  indexable: boolean
  /** When not indexable: the page whose list it repeats (the hub's path for the hub). */
  duplicateOf: string | null
  /** The newest read or edit among its people (the sitemap's lastmod). */
  lastmod: string | null
  /** The practice page folded into this one (FOLDED_PRACTICE): its people and firms, for the heading and title. */
  folded: Folded | null
}

export interface Folded {
  /** "Fund Formation". */
  adj: string
  noun: string
  /** People and firms on the folded practice's own list (a part of this page's list). */
  count: number
  firms: number
}

export interface LandingSet {
  /** Every page that exists, biggest first. */
  pages: Landing[]
  /** State addresses that do not exist because their main city is the same list: where each one goes instead. */
  merged: { path: string; into: string; share: number }[]
  /** The hub's folded practice, when it has one (the hub is not a Landing). */
  hubFolded: Folded | null
}

/** People in common over people in either: 1 for the same list, 0 for none in common. Both sorted ascending. */
export function jaccard(a: number[], b: number[]): number {
  let i = 0
  let j = 0
  let both = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      both++
      i++
      j++
    } else if (a[i] < b[j]) i++
    else j++
  }
  const either = a.length + b.length - both
  return either ? both / either : 0
}

const intersect = (a: number[], b: number[]) => {
  let i = 0
  let j = 0
  let both = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      both++
      i++
      j++
    } else if (a[i] < b[j]) i++
    else j++
  }
  return both
}

const keyOf = (t: Topic | null, pl: Place | null) => `${t?.slug ?? ''}|${pl?.slug ?? ''}`

/**
 * Every page that exists for a category, and which of them are indexed (the rules in the header). One pass over the
 * list for the members of every key, then the state rule, then the overlap rule. A few thousand people and a few
 * hundred keys: milliseconds.
 */
export function landingSet(category: Category, people: PersonCard[], now = new Date()): LandingSet {
  const live = people.filter((p) => isPublic(p, now))
  const members = new Map<string, number[]>()
  const firmsOf = new Map<string, Set<string>>()
  const topics0 = topicsFor(category)
  const add = (t: Topic | null, pl: Place | null, i: number, firm: string) => {
    const key = keyOf(t, pl)
    let m = members.get(key)
    if (!m) members.set(key, (m = []))
    m.push(i)
    let f = firmsOf.get(key)
    if (!f) firmsOf.set(key, (f = new Set()))
    f.add(firm)
  }
  live.forEach((p, i) => {
    const firm = p.firm_domain.toLowerCase()
    const topics = topics0.filter((t) => hasTopic(p, t))
    const places = PLACES.filter((pl) => p.offices.some((o) => officeIn(o, pl)))
    for (const t of topics) add(t, null, i, firm)
    for (const pl of places) {
      add(null, pl, i, firm)
      for (const t of topics) add(t, pl, i, firm)
    }
  })

  const big = (key: string) => (members.get(key)?.length ?? 0) >= LANDING_MIN && (firmsOf.get(key)?.size ?? 0) >= LANDING_MIN_FIRMS
  const parse = (key: string): LandingKey => {
    const [ts, ps] = key.split('|')
    return { topic: ts ? topicBySlug(ts, category) : null, place: ps ? placeBySlug(ps) : null }
  }

  // The state rule: a state page is its biggest city again when that city holds STATE_CITY_MAX of its people.
  const merged: LandingSet['merged'] = []
  const exists = new Set<string>()
  for (const key of members.keys()) {
    if (!big(key)) continue
    const k = parse(key)
    if (k.place?.kind === 'state') {
      const list = members.get(key)!
      let best: { key: string; both: number } | null = null
      for (const c of PLACES) {
        if (c.kind !== 'city' || c.state !== k.place.state) continue
        const ck = keyOf(k.topic, c)
        const cl = members.get(ck)
        if (!cl) continue
        const both = intersect(list, cl)
        if (!best || both > best.both) best = { key: ck, both }
      }
      if (best && best.both / list.length >= STATE_CITY_MAX) {
        const into = parse(best.key)
        if (big(best.key)) merged.push({ path: landingPath(category, k), into: landingPath(category, into), share: best.both / list.length })
        continue
      }
    }
    exists.add(key)
  }

  // The overlap rule. Each page against the broader pages it sits under, then against its siblings.
  const dup = new Map<string, string>()
  const hubPath = `/${category.slug}`
  const all = live.map((_, i) => i)
  const note = (key: string, of: string) => {
    if (!dup.has(key)) dup.set(key, of)
  }
  for (const key of exists) {
    const k = parse(key)
    const list = members.get(key)!
    // The hub: every page is inside it.
    if (list.length / all.length > OVERLAP_MAX) note(key, hubPath)
    const broader: string[] = []
    if (k.topic && k.place) broader.push(keyOf(k.topic, null), keyOf(null, k.place))
    for (const b of broader) if (exists.has(b) && jaccard(list, members.get(b)!) > OVERLAP_MAX) note(key, landingPath(category, parse(b)))
    // A city and its state: the state is the extra page (people search the city), so the state gives way.
    if (k.place?.kind === 'city') {
      const sk = PLACES.find((x) => x.kind === 'state' && x.state === k.place!.state)
      const skey = sk ? keyOf(k.topic, sk) : null
      if (skey && exists.has(skey) && jaccard(list, members.get(skey)!) > OVERLAP_MAX) note(skey, landingPath(category, k))
    }
  }
  // Siblings: the same place with another topic, or the same topic in another place. The smaller list gives way.
  const keys = [...exists].sort((a, b) => members.get(b)!.length - members.get(a)!.length || a.localeCompare(b))
  for (let x = 0; x < keys.length; x++) {
    // Only against a page that is itself indexed: two pages that both repeat a third must not take each other out.
    if (dup.has(keys[x])) continue
    const a = parse(keys[x])
    const la = members.get(keys[x])!
    for (let y = x + 1; y < keys.length; y++) {
      const lb = members.get(keys[y])!
      if (lb.length / la.length <= OVERLAP_MAX) continue // cannot be that similar: b is too much smaller
      const b = parse(keys[y])
      const sameTopic = (a.topic?.slug ?? null) === (b.topic?.slug ?? null)
      const samePlace = (a.place?.slug ?? null) === (b.place?.slug ?? null)
      const sibling = (sameTopic && !samePlace && Boolean(a.place) && Boolean(b.place) && a.place!.kind === b.place!.kind) || (samePlace && !sameTopic && Boolean(a.topic) && Boolean(b.topic))
      if (sibling && !dup.has(keys[y]) && jaccard(la, lb) > OVERLAP_MAX) note(keys[y], landingPath(category, a))
    }
  }

  // The folded practice: a flagged copy of the hub or of its own place page is not built; it redirects there.
  const foldId = FOLDED_PRACTICE[category.id]
  const foldInto = new Map<string, Folded>()
  if (foldId) {
    for (const key of [...exists]) {
      const k = parse(key)
      if (k.topic?.kind !== 'practice' || k.topic.id !== foldId) continue
      const parentKey = keyOf(null, k.place)
      const parentPath = k.place ? landingPath(category, { topic: null, place: k.place }) : hubPath
      // Flagged by the overlap rule, and a copy of this very parent (it may have been noted first against the hub).
      if (!dup.has(key)) continue
      if (k.place ? !exists.has(parentKey) || jaccard(members.get(key)!, members.get(parentKey)!) <= OVERLAP_MAX : dup.get(key) !== hubPath) continue
      exists.delete(key)
      dup.delete(key)
      foldInto.set(parentKey, { adj: k.topic.adj, noun: k.topic.noun, count: members.get(key)!.length, firms: firmsOf.get(key)!.size })
      merged.push({ path: landingPath(category, k), into: parentPath, share: members.get(key)!.length / (k.place ? members.get(parentKey)!.length : all.length) })
    }
    // A merged state that pointed at a page now folded goes straight to where that page went (no redirect chains).
    const target = new Map(merged.map((m) => [m.path, m.into]))
    for (const m of merged) while (target.has(m.into) && target.get(m.into) !== m.into) m.into = target.get(m.into)!
  }

  const pages: Landing[] = []
  for (const key of exists) {
    const k = parse(key)
    const list = members.get(key)!
    const path = landingPath(category, k)
    const folded = foldInto.get(key) ?? null
    pages.push({
      ...k,
      path,
      title: folded ? foldedTitle(category, k, folded) : landingTitle(category, k),
      folded,
      count: list.length,
      firms: firmsOf.get(key)!.size,
      indexable: !dup.has(key),
      duplicateOf: dup.get(key) ?? null,
      lastmod: lastChanged(list.map((i) => live[i])),
    })
  }
  pages.sort((a, b) => b.count - a.count || a.path.localeCompare(b.path))
  merged.sort((a, b) => a.path.localeCompare(b.path))
  return { pages, merged, hubFolded: foldInto.get(keyOf(null, null)) ?? null }
}

/** "Fund Formation Lawyers in New York": a page's heading once a practice is folded into it. */
export function foldedTitle(category: Category, k: LandingKey, f: Pick<Folded, 'adj'>): string {
  return `${f.adj} ${category.trade}${k.place ? ` in ${k.place.name}` : ''}`
}

/** Every page that exists for a category (lib/directory/landing.ts landingSet), biggest first. */
export function allLandings(category: Category, people: PersonCard[], now = new Date()): Landing[] {
  return landingSet(category, people, now).pages
}

/** The pages offered to search engines: the sitemap's list. */
export const indexableLandings = (category: Category, people: PersonCard[], now = new Date()) => allLandings(category, people, now).filter((l) => l.indexable)

const count = (x: number) => x.toLocaleString('en-US')

/** "Partners" for the trades listed at partner level only; "People" for the rest. */
const whoWord = (category: Category, n: number) => (SENIOR_ONLY.includes(category.id) ? (n === 1 ? 'Partner' : 'Partners') : n === 1 ? 'Person' : 'People')

/**
 * The search title (2026-10-24): the words people type, then the count. "Fund Formation Lawyers in New York: 412
 * Partners at 31 Firms". Shortened to fit a result (60 characters) by dropping the firms, then the count; the
 * brand goes on only when it still fits (lib/seo.ts brandedTitle, applied by the caller).
 */
export function searchTitle(name: string | string[], category: Category, people: number, firms: number, absorbed?: { noun: string; count: number } | null, max = 60): string {
  const names = Array.isArray(name) ? name : [name]
  const who = `${count(people)} ${whoWord(category, people)}`
  // The absorbed practice's words first (they are the search the noindexed page would have answered), then the firms.
  const tries = [
    ...(absorbed ? names.map((nm) => `${nm}: ${who}, ${count(absorbed.count)} in ${absorbed.noun}`) : []),
    ...names.map((nm) => `${nm}: ${who} at ${count(firms)} ${firms === 1 ? 'Firm' : 'Firms'}`),
    ...names.map((nm) => `${nm}: ${who}`),
  ]
  return tries.find((t) => t.length <= max) ?? names[names.length - 1]
}

/** The practice page a page stands in for (its near-copy, noindexed in its favour), for the title: the biggest. */
export function absorbedTopic(path: string, pages: Landing[]): { noun: string; count: number } | null {
  const l = pages.filter((x) => x.duplicateOf === path && x.topic?.kind === 'practice').sort((a, b) => b.count - a.count)[0]
  return l?.topic?.kind === 'practice' ? { noun: l.topic.noun, count: l.count } : null
}

/**
 * Links out of a page: up to its parents, and across to the combinations next
 * to it that exist (the same topic elsewhere, other topics here, the cities of
 * a state, the state of a city).
 */
export function nearby(k: LandingKey, all: Landing[], max = 10): { parents: Landing[]; samePlace: Landing[]; sameTopic: Landing[] } {
  const same = (a: Landing) => a.topic?.slug === k.topic?.slug && a.place?.slug === k.place?.slug
  const parents = all.filter(
    (a) => !same(a) && ((k.topic && k.place && ((a.topic?.slug === k.topic.slug && !a.place) || (!a.topic && a.place?.slug === k.place.slug))) ||
      (k.place?.kind === 'city' && !a.topic && a.place?.kind === 'state' && a.place.state === k.place.state) ||
      (k.topic && k.place?.kind === 'city' && a.topic?.slug === k.topic.slug && a.place?.kind === 'state' && a.place.state === k.place.state)),
  )
  // Other topics in this place (or, on a topic page with no place, other topics).
  const samePlace = all.filter((a) => !same(a) && a.topic && (a.place?.slug ?? null) === (k.place?.slug ?? null) && a.topic.slug !== k.topic?.slug).slice(0, max)
  // This topic (or none) in other places: a state page lists its cities first.
  const sameTopic = all
    .filter((a) => !same(a) && a.place && (a.topic?.slug ?? null) === (k.topic?.slug ?? null) && a.place.slug !== k.place?.slug)
    .sort((a, b) => {
      const inState = (x: Landing) => (k.place?.kind === 'state' && x.place?.state === k.place.state ? 0 : 1)
      return inState(a) - inState(b) || b.count - a.count
    })
    .slice(0, max)
  return { parents, samePlace, sameTopic }
}

const num = (x: number) => x.toLocaleString('en-US')

/**
 * The page's opening sentence, from its own list: "27 fund lawyers at 9 firms
 * list venture fund work in San Francisco. Most also list fund formation and
 * secondaries. The most are at Cooley (8), Gunderson Dettmer (6) and Wilson
 * Sonsini (5)." Facts only, and only ones the list below bears out.
 */
export function landingSentence(category: Category, k: LandingKey, people: PersonCard[]): string {
  const firms = firmTally(people)
  const noun = lowerNoun(category, people.length)
  const where = k.place ? ` in ${k.place.name}` : ''
  let first: string
  if (!k.topic) first = `${num(people.length)} ${noun} at ${num(firms.length)} ${firms.length === 1 ? 'firm' : 'firms'} have an office${where}.`
  else if (k.topic.kind === 'practice')
    first = `${num(people.length)} ${noun} at ${num(firms.length)} ${firms.length === 1 ? 'firm' : 'firms'} list ${k.topic.work} work${where}.`
  else if (k.topic.kind === 'focus')
    first = `${num(people.length)} ${noun} at ${num(firms.length)} ${firms.length === 1 ? 'firm' : 'firms'}${where} name ${k.topic.label.toLowerCase()} among their clients.`
  else first = `${num(people.length)} ${noun} at ${num(firms.length)} ${firms.length === 1 ? 'firm' : 'firms'}${where} act for ${k.topic.label.replace(/ and (\w)/, (_m, c: string) => ` and ${c.toLowerCase()}`)}.`

  const parts = [first]
  const practices = practiceTally(people)
    .filter((t) => !(k.topic?.kind === 'practice' && t.key === k.topic.id))
    .slice(0, 3)
  if (practices.length) parts.push(`The practices listed most${k.topic?.kind === 'practice' ? ' alongside it' : ''}: ${listJoin(practices.map((t) => `${practiceLower(t.key)} (${num(t.count)})`))}.`)
  const top = firms.slice(0, 3)
  if (top.length > 1) parts.push(`The most are at ${listJoin(top.map((t) => `${t.label} (${num(t.count)})`))}.`)
  if (!k.place || k.place.kind === 'state') {
    const cities = cityTally(people)
      .filter((t) => !k.place || PLACES.find((p) => p.slug === t.key)?.state === k.place.state)
      .slice(0, 3)
    if (cities.length > 1) parts.push(`Main offices: ${listJoin(cities.map((t) => `${t.label} (${num(t.count)})`))}.`)
  }
  return parts.join(' ')
}

/** The search snippet: the first sentence and as much more as fits. */
export function landingDescription(sentence: string, max = 158): string {
  if (sentence.length <= max) return sentence
  const sentences = sentence.split(/(?<=\.)\s+/)
  let out = sentences[0]
  for (const s of sentences.slice(1)) {
    if (`${out} ${s}`.length > max) break
    out = `${out} ${s}`
  }
  return out.length <= max ? out : `${out.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}

/** A page of the list: null when `page` is not one of its pages. */
export function paginate<T>(items: T[], page: number, size = PAGE_SIZE): { items: T[]; page: number; pages: number } | null {
  const pages = Math.max(1, Math.ceil(items.length / size))
  if (!Number.isInteger(page) || page < 1 || page > pages) return null
  return { items: items.slice((page - 1) * size, page * size), page, pages }
}

/** ?page=2 as a number; anything that is not a plain positive integer is NaN (and a 404). */
export function parsePage(raw: string | string[] | undefined): number {
  if (raw === undefined) return 1
  if (typeof raw !== 'string' || !/^[1-9]\d{0,4}$/.test(raw)) return Number.NaN
  return Number(raw)
}

export const pageHref = (path: string, page: number) => (page <= 1 ? path : `${path}?page=${page}`)

const SITE = 'https://fundopshq.com'

/** schema.org ItemList of the people on this page of the list. */
export function itemListJsonLd(name: string, path: string, people: PersonCard[], offset = 0) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: `${SITE}${path}`,
    itemListElement: people.map((p, i) => ({ '@type': 'ListItem', position: offset + i + 1, url: `${SITE}${profilePath(p)}`, name: displayName(p.full_name) })),
  }
}

/** The breadcrumb trail: the hub, then the topic, then the place. */
export function landingCrumbs(category: Category, k: LandingKey): { name: string; path?: string }[] {
  const crumbs: { name: string; path?: string }[] = [{ name: category.plural, path: `/${category.slug}` }]
  if (k.topic && k.place) crumbs.push({ name: topicTitle(category, k.topic), path: landingPath(category, { topic: k.topic, place: null }) })
  if (k.topic || k.place) crumbs.push({ name: k.place ? (k.topic ? k.place.name : landingTitle(category, k)) : topicTitle(category, k.topic) })
  return crumbs
}

