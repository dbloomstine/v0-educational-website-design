/**
 * A directory profile, and the rules about what the site shows of it.
 * Pure: no database, so every rule here is tested (lib/directory/__tests__).
 *
 * Two kinds of fact live on a row and never mix:
 *   - from the firm's own public bio page (title, offices, practice areas,
 *     admissions, education, the bio link, the date we read it), refreshed by
 *     scripts/directory/load-people.ts;
 *   - from the person, once they have claimed the profile (headline,
 *     description, photo, contact link, practice tags, notable matters), each
 *     reviewed by the desk before it shows. The loader never writes these.
 */
import { CATEGORIES, type Category, type CategoryId, lowerNoun, practiceLabel } from './taxonomy'
import { cityOf, officeCity, officeLabel, stateCode, type Office } from './places'

export type Status = 'review' | 'published' | 'hidden' | 'removed'

export interface Education {
  school: string
  degree?: string | null
  year?: number | string | null
}

export interface Notable {
  text: string
  year?: number | null
}

/** The fields a list needs: everything the hubs, filters and counts read. Small, so a whole category caches. */
export interface PersonCard {
  id: string
  category: CategoryId
  slug: string
  full_name: string
  title: string | null
  firm_name: string
  firm_domain: string
  offices: Office[]
  practice_areas: string[]
  client_focus: string[]
  represents: string[]
  status: Status
  missing_since: string | null
  claimed_at: string | null
  claimed_practice_areas: string[] | null
}

/** A whole profile. */
export interface Person extends PersonCard {
  bar_admissions: string[]
  education: Education[]
  bio_url: string | null
  fetched_at: string | null
  headline: string | null
  description: string | null
  photo_url: string | null
  contact_url: string | null
  notable: Notable[]
}

export const CARD_COLUMNS =
  'id, category, slug, full_name, title, firm_name, firm_domain, offices, practice_areas, client_focus, represents, status, missing_since, claimed_at, claimed_practice_areas'

export const PERSON_COLUMNS = `${CARD_COLUMNS}, bar_admissions, education, bio_url, fetched_at, headline, description, photo_url, contact_url, notable`

/** A person whose bio page has gone stays listed (with a note) this long, then drops out. */
export const MISSING_GRACE_DAYS = 30

const daysSince = (ymd: string, now: Date) => (now.getTime() - new Date(`${ymd.slice(0, 10)}T00:00:00Z`).getTime()) / 86_400_000

/** On the site at all: published, and not gone from the firm's site for more than the grace period. */
export function isPublic(p: Pick<PersonCard, 'status' | 'missing_since'>, now = new Date()): boolean {
  if (p.status !== 'published') return false
  return !p.missing_since || daysSince(p.missing_since, now) <= MISSING_GRACE_DAYS
}

/** The practice areas the page shows: the person's own tags once claimed (and approved), else the firm's. */
export function practiceAreas(p: Pick<PersonCard, 'practice_areas' | 'claimed_at' | 'claimed_practice_areas'>): string[] {
  return p.claimed_at && p.claimed_practice_areas?.length ? p.claimed_practice_areas : (p.practice_areas ?? [])
}

/**
 * Offered to search engines (Danny, 2026-10-24): an unclaimed profile only once
 * it has substance, a title, a firm, an office and at least one real practice
 * area ("other" says nothing). A claimed profile always. Never one that is not
 * public, or whose bio page has gone missing.
 */
export function isIndexable(p: PersonCard, now = new Date()): boolean {
  if (!isPublic(p, now) || p.missing_since) return false
  if (p.claimed_at) return true
  return Boolean(p.title?.trim() && p.firm_name?.trim() && p.offices?.some((o) => o.city?.trim()) && practiceAreas(p).some((a) => a !== 'other'))
}

/** The office the page leads with: the first one in a city we know, else the first. */
export function primaryOffice(p: Pick<PersonCard, 'offices'>): Office | null {
  return p.offices?.find((o) => cityOf(o)) ?? p.offices?.[0] ?? null
}

const SUFFIX = /^(jr|sr|ii|iii|iv|esq|pc|p c|phd|llm|jd)\.?$/i

/** "Smith" from "Jane A. Smith Jr.": the name a directory sorts on. */
export function surname(full: string): string {
  const parts = full.trim().split(/\s+/).map((x) => x.replace(/,$/, ''))
  while (parts.length > 1 && SUFFIX.test(parts[parts.length - 1])) parts.pop()
  return parts[parts.length - 1] ?? full
}

export function bySurname(a: Pick<PersonCard, 'full_name'>, b: Pick<PersonCard, 'full_name'>): number {
  return surname(a.full_name).localeCompare(surname(b.full_name), 'en') || a.full_name.localeCompare(b.full_name, 'en')
}

// ── Search and filters ──────────────────────────────────────────────────────

const fold = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export interface Filters {
  q?: string
  practice?: string
  /** A city slug. */
  city?: string
  /** A firm, by its domain. */
  firm?: string
}

/** Every word typed must appear in the name, the firm or an office. */
export function matchesQuery(p: PersonCard, q: string): boolean {
  const words = fold(q).split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const hay = fold([p.full_name, p.firm_name, ...p.offices.flatMap((o) => [o.city, officeLabel(o)])].join(' '))
  return words.every((w) => hay.includes(w))
}

export function filterPeople<T extends PersonCard>(people: T[], f: Filters): T[] {
  return people.filter(
    (p) =>
      (!f.q || matchesQuery(p, f.q)) &&
      (!f.practice || practiceAreas(p).includes(f.practice)) &&
      (!f.city || p.offices.some((o) => cityOf(o)?.slug === f.city)) &&
      (!f.firm || p.firm_domain === f.firm),
  )
}

// ── Counts and sentences ────────────────────────────────────────────────────

export interface Tally {
  key: string
  label: string
  count: number
}

/** Count by a key, biggest first, ties alphabetical. */
export function tally<T>(items: T[], keys: (x: T) => { key: string; label: string }[]): Tally[] {
  const m = new Map<string, Tally>()
  for (const x of items) {
    const seen = new Set<string>()
    for (const k of keys(x)) {
      if (seen.has(k.key)) continue
      seen.add(k.key)
      const t = m.get(k.key) ?? { key: k.key, label: k.label, count: 0 }
      t.count++
      m.set(k.key, t)
    }
  }
  return [...m.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'en'))
}

export const firmTally = (people: PersonCard[]) => tally(people, (p) => [{ key: p.firm_domain, label: p.firm_name }])
export const cityTally = (people: PersonCard[]) =>
  tally(people, (p) => p.offices.flatMap((o) => (cityOf(o) ? [{ key: cityOf(o)!.slug, label: cityOf(o)!.name }] : [])))
export const practiceTally = (people: PersonCard[]) =>
  tally(people, (p) => practiceAreas(p).filter((a) => a !== 'other').map((a) => ({ key: a, label: practiceLabel(a) })))

const n = (x: number) => x.toLocaleString('en-US')

/** "1,234 fund lawyers at 48 firms in 12 US cities": the hub's computed line. */
export function countsSentence(people: PersonCard[], category: Category = CATEGORIES.fund_lawyer): string {
  const firms = firmTally(people).length
  const cities = cityTally(people).length
  const parts = [`${n(people.length)} ${lowerNoun(category, people.length)}`, `at ${n(firms)} ${firms === 1 ? 'firm' : 'firms'}`]
  if (cities) parts.push(`in ${n(cities)} US ${cities === 1 ? 'city' : 'cities'}`)
  return parts.join(' ')
}

// ── Titles, descriptions, structured data ───────────────────────────────────

/** "Jane Smith, Partner at Kirkland & Ellis: Fund Lawyer in New York". */
export function profileTitle(p: PersonCard, category: Category = CATEGORIES[p.category]): string {
  const office = primaryOffice(p)
  const city = office ? officeCity(office) : ''
  const who = p.title?.trim() ? `${p.full_name}, ${p.title.trim()} at ${p.firm_name}` : `${p.full_name}, ${p.firm_name}`
  return `${who}: ${category.singular}${city ? ` in ${city}` : ''}`
}

/** One factual sentence: what the page holds, nothing it does not. */
export function profileDescription(p: PersonCard, category: Category = CATEGORIES[p.category]): string {
  const office = primaryOffice(p)
  const areas = practiceAreas(p)
    .filter((a) => a !== 'other')
    .slice(0, 3)
    .map((a) => practiceLabel(a).toLowerCase())
  const role = p.title?.trim() ? `${p.title.trim()} at ${p.firm_name}` : `at ${p.firm_name}`
  const where = office ? ` in ${officeLabel(office)}` : ''
  const what = areas.length ? `, working on ${listJoin(areas)}` : ''
  return `${p.full_name} is a ${category.singular.toLowerCase()}, ${role}${where}${what}. Profile from the firm's own public bio, with a link to it.`
}

export function listJoin(xs: string[]): string {
  if (xs.length <= 1) return xs[0] ?? ''
  if (xs.length === 2) return `${xs[0]} and ${xs[1]}`
  return `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`
}

export function profilePath(p: Pick<PersonCard, 'slug' | 'category'>): string {
  return `/${CATEGORIES[p.category].slug}/people/${p.slug}`
}

const SITE = 'https://fundopshq.com'

/** A firm's site as a URL, from its domain ("kirkland.com" → https://www.kirkland.com is not guessed: https://kirkland.com). */
export function firmUrl(domain: string): string | null {
  const d = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d) ? `https://${d}` : null
}

/** The bare host for "From kirkland.com": no scheme, no www. */
export function displayDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
}

/** schema.org Person: only what the page itself shows. */
export function personJsonLd(p: Person) {
  const office = primaryOffice(p)
  const firmSite = firmUrl(p.firm_domain)
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.full_name,
    url: `${SITE}${profilePath(p)}`,
    ...(p.title?.trim() ? { jobTitle: p.title.trim() } : {}),
    worksFor: { '@type': 'Organization', name: p.firm_name, ...(firmSite ? { url: firmSite } : {}) },
    ...(office
      ? {
          address: {
            '@type': 'PostalAddress',
            addressLocality: officeCity(office),
            ...(stateCode(office.state) ? { addressRegion: stateCode(office.state) } : {}),
            addressCountry: 'US',
          },
        }
      : {}),
  }
}

/** "Oct 24, 2026" from a timestamp, or null. */
export function asOf(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
}

/** A link we will print: https only, no credentials. */
export function safeHttpsUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  try {
    const u = new URL(raw.trim())
    if (u.protocol !== 'https:' || u.username || u.password) return null
    return u.toString()
  } catch {
    return null
  }
}
