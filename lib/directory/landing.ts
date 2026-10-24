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
 * Guardrails for Google's scaled-content policy:
 *   - a page EXISTS only with at least LANDING_MIN public people; below that it
 *     is a 404 and is not in the sitemap;
 *   - it opens with a sentence computed from its own list (count, firms, the
 *     practices and cities that list actually holds), so no two read alike;
 *   - it links up to its parents and across to the nearby combinations that
 *     exist, and lists the people in pages of PAGE_SIZE.
 */
import { CLIENT_FOCUS, PRACTICES, REPRESENTS, RESERVED_SLUGS, type Category, lowerNoun } from './taxonomy'
import { PLACES, officeIn, placeBySlug, type Place } from './places'
import { bySurname, cityTally, firmTally, isPublic, listJoin, practiceAreas, practiceTally, profilePath, type PersonCard } from './people'

export const LANDING_MIN = 5
export const PAGE_SIZE = 50

export type Topic =
  | { kind: 'practice'; id: string; slug: string; adj: string }
  | { kind: 'focus'; id: string; slug: string; label: string }
  | { kind: 'side'; id: string; slug: string; label: string }

export const TOPICS: Topic[] = [
  ...PRACTICES.flatMap((p): Topic[] => (p.slug ? [{ kind: 'practice', id: p.id, slug: p.slug, adj: p.adj }] : [])),
  ...CLIENT_FOCUS.map((c): Topic => ({ kind: 'focus', id: c.id, slug: c.slug, label: c.label })),
  ...REPRESENTS.map((r): Topic => ({ kind: 'side', id: r.id, slug: r.slug, label: r.label })),
]

const TOPIC_BY_SLUG = new Map(TOPICS.map((t) => [t.slug, t]))
export const topicBySlug = (slug: string): Topic | null => TOPIC_BY_SLUG.get(slug) ?? null

export interface LandingKey {
  topic: Topic | null
  place: Place | null
}

/**
 * The page an address names, or null for none. One segment is a topic or a
 * place; two are a topic then a place. Nothing else resolves.
 */
export function resolveLanding(segments: string[]): LandingKey | null {
  if (segments.some((s) => RESERVED_SLUGS.has(s))) return null
  if (segments.length === 1) {
    const [a] = segments
    const topic = topicBySlug(a)
    if (topic) return { topic, place: null }
    const place = placeBySlug(a)
    return place ? { topic: null, place } : null
  }
  if (segments.length === 2) {
    const topic = topicBySlug(segments[0])
    const place = placeBySlug(segments[1])
    return topic && place ? { topic, place } : null
  }
  return null
}

export function landingPath(category: Category, k: LandingKey): string {
  return `/${[category.slug, k.topic?.slug, k.place?.slug].filter(Boolean).join('/')}`
}

/** "Venture Fund Lawyers", "Fund Lawyers for Emerging Managers": the topic's own name. */
export function topicTitle(category: Category, topic: Topic | null): string {
  if (!topic) return category.plural
  if (topic.kind === 'practice') return `${topic.adj} ${category.trade}`
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
}

/**
 * Every page that exists for a category: each topic, each place and each
 * topic in each place, with at least LANDING_MIN people. Computed in one pass
 * over the list (a few thousand people, a few hundred keys).
 */
export function allLandings(category: Category, people: PersonCard[], now = new Date()): Landing[] {
  const live = people.filter((p) => isPublic(p, now))
  const counts = new Map<string, number>()
  const bump = (t: Topic | null, pl: Place | null) => {
    const key = `${t?.slug ?? ''}|${pl?.slug ?? ''}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  for (const p of live) {
    const topics = TOPICS.filter((t) => hasTopic(p, t))
    const places = PLACES.filter((pl) => p.offices.some((o) => officeIn(o, pl)))
    for (const t of topics) bump(t, null)
    for (const pl of places) {
      bump(null, pl)
      for (const t of topics) bump(t, pl)
    }
  }
  const out: Landing[] = []
  for (const [key, count] of counts) {
    if (count < LANDING_MIN) continue
    const [ts, ps] = key.split('|')
    const k: LandingKey = { topic: ts ? topicBySlug(ts) : null, place: ps ? placeBySlug(ps) : null }
    out.push({ ...k, path: landingPath(category, k), title: landingTitle(category, k), count })
  }
  return out.sort((a, b) => b.count - a.count || a.path.localeCompare(b.path))
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
    first = `${num(people.length)} ${noun} at ${num(firms.length)} ${firms.length === 1 ? 'firm' : 'firms'} list ${k.topic.adj.toLowerCase()} work${where}.`
  else if (k.topic.kind === 'focus')
    first = `${num(people.length)} ${noun} at ${num(firms.length)} ${firms.length === 1 ? 'firm' : 'firms'}${where} name ${k.topic.label.toLowerCase()} among their clients.`
  else first = `${num(people.length)} ${noun} at ${num(firms.length)} ${firms.length === 1 ? 'firm' : 'firms'}${where} act for ${k.topic.label.replace(/ and (\w)/, (_m, c: string) => ` and ${c.toLowerCase()}`)}.`

  const parts = [first]
  const practices = practiceTally(people)
    .filter((t) => !(k.topic?.kind === 'practice' && t.key === k.topic.id))
    .slice(0, 3)
  if (practices.length) parts.push(`The practices listed most${k.topic?.kind === 'practice' ? ' alongside it' : ''}: ${listJoin(practices.map((t) => `${t.label.toLowerCase()} (${num(t.count)})`))}.`)
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
    itemListElement: people.map((p, i) => ({ '@type': 'ListItem', position: offset + i + 1, url: `${SITE}${profilePath(p)}`, name: p.full_name })),
  }
}

/** The breadcrumb trail: the hub, then the topic, then the place. */
export function landingCrumbs(category: Category, k: LandingKey): { name: string; path?: string }[] {
  const crumbs: { name: string; path?: string }[] = [{ name: category.plural, path: `/${category.slug}` }]
  if (k.topic && k.place) crumbs.push({ name: topicTitle(category, k.topic), path: landingPath(category, { topic: k.topic, place: null }) })
  if (k.topic || k.place) crumbs.push({ name: k.place ? (k.topic ? k.place.name : landingTitle(category, k)) : topicTitle(category, k.topic) })
  return crumbs
}

