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
import { CATEGORIES, type Category, type CategoryId, lowerNoun, practiceLabel, practiceLower } from './taxonomy'
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
  /** When the facts were last read from the source (the "last verified" date), and when the row last changed. */
  fetched_at?: string | null
  updated_at?: string | null
}

/** A whole profile. */
export interface Person extends PersonCard {
  bar_admissions: string[]
  education: Education[]
  bio_url: string | null
  headline: string | null
  description: string | null
  photo_url: string | null
  contact_url: string | null
  notable: Notable[]
  /** Provenance (2026-10-25, lib/directory/provenance.ts): where the facts and the office city were read. */
  source?: string | null
  source_url?: string | null
  city_basis?: string | null
  office_source_url?: string | null
}

// fetched_at and updated_at joined the card on 2026-10-24 (the sitemap's lastmod and the "last verified" lines); the
// cache keys in lib/directory/data.ts moved with them.
export const CARD_COLUMNS =
  'id, category, slug, full_name, title, firm_name, firm_domain, offices, practice_areas, client_focus, represents, status, missing_since, claimed_at, claimed_practice_areas, fetched_at, updated_at'

export const PERSON_COLUMNS = `${CARD_COLUMNS}, bar_admissions, education, bio_url, headline, description, photo_url, contact_url, notable, source, source_url, city_basis, office_source_url`

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

/** A nickname in brackets: one short word ("(Jeff)", "(Chip)"), not "(she/her)" or "(Ret.)". */
const NICK = /^\(([A-Z][A-Za-z'’-]{1,14})\)$/

/**
 * A name as the pages show it (2026-10-24): a nickname a firm's page put at the end moves next to the first name,
 * where a reader expects it. "Jeffrey Misher (Jeff)" → "Jeffrey (Jeff) Misher"; "Charles (Chip) Parsons" is left alone.
 */
export function displayName(full: string): string {
  const parts = full.trim().split(/\s+/)
  const last = parts[parts.length - 1] ?? ''
  if (parts.length >= 3 && NICK.test(last) && !parts.slice(0, -1).some((x) => x.startsWith('('))) return [parts[0], last, ...parts.slice(1, -1)].join(' ')
  return parts.join(' ')
}

/** The nickname, if the name carries one: "Jeff". */
export function nickname(full: string): string | null {
  for (const x of full.trim().split(/\s+/)) {
    const m = NICK.exec(x)
    if (m) return m[1]
  }
  return null
}

/** "Jeff Misher": the name with the nickname in place of the first name, for structured data's alternateName. */
export function alternateName(full: string): string | null {
  const nick = nickname(full)
  if (!nick) return null
  const rest = full.trim().split(/\s+/).filter((x) => !x.startsWith('('))
  return rest.length >= 2 ? `${nick} ${rest[rest.length - 1]}` : null
}

/** "Smith" from "Jane A. Smith Jr." (or "Jane Smith (Janie)"): the name a directory sorts on. */
export function surname(full: string): string {
  const parts = full
    .trim()
    .split(/\s+/)
    .filter((x) => !/^\(.*\)$/.test(x))
    .map((x) => x.replace(/,$/, ''))
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
  const name = displayName(p.full_name)
  const who = p.title?.trim() ? `${name}, ${p.title.trim()} at ${p.firm_name}` : `${name}, ${p.firm_name}`
  return `${who}: ${category.singular}${city ? ` in ${city}` : ''}`
}

/** One factual sentence: what the page holds, nothing it does not. */
export function profileDescription(p: PersonCard, category: Category = CATEGORIES[p.category]): string {
  const office = primaryOffice(p)
  const areas = practiceAreas(p)
    .filter((a) => a !== 'other')
    .slice(0, 3)
    .map((a) => practiceLower(a))
  const role = p.title?.trim() ? `${p.title.trim()} at ${p.firm_name}` : `at ${p.firm_name}`
  const where = office ? ` in ${officeLabel(office)}` : ''
  const what = areas.length ? `, working on ${listJoin(areas)}` : ''
  return `${displayName(p.full_name)} is a ${category.singular.toLowerCase()}, ${role}${where}${what}. Profile from the firm's own public bio, with a link to it.`
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

export interface PersonLdExtras {
  /** The firm's own bio page for the person (only a firm page: a speaker page or a press release is not "the same person"). */
  sameAs?: string | null
  /** The practice areas the page shows, as labels. */
  knowsAbout?: string[]
  /** The page's one-sentence description. */
  description?: string | null
}

/**
 * schema.org Person: only what the page itself shows (2026-10-24: sameAs, knowsAbout, description and the nickname as
 * alternateName added). A claimed profile is the person's own page on the site, so it is wrapped in a ProfilePage with
 * its dates (Google: ProfilePage is for a person affiliated with the site; an unclaimed listing is not).
 */
export function personJsonLd(p: Person, extras: PersonLdExtras = {}) {
  const office = primaryOffice(p)
  const firmSite = firmUrl(p.firm_domain)
  const url = `${SITE}${profilePath(p)}`
  const alt = alternateName(p.full_name)
  const sameAs = safeHttpsUrl(extras.sameAs)
  const knows = (extras.knowsAbout ?? []).filter(Boolean)
  const person = {
    '@type': 'Person',
    name: displayName(p.full_name),
    ...(alt ? { alternateName: alt } : {}),
    url,
    ...(extras.description ? { description: extras.description } : {}),
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
    ...(knows.length ? { knowsAbout: knows } : {}),
    ...(sameAs ? { sameAs: [sameAs] } : {}),
  }
  if (!p.claimed_at) return { '@context': 'https://schema.org', ...person }
  const modified = latest([p.updated_at, p.claimed_at])
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url,
    ...(p.claimed_at ? { dateCreated: p.claimed_at } : {}),
    ...(modified ? { dateModified: modified } : {}),
    mainEntity: person,
  }
}

/** The newest of some timestamps (ISO strings compare as dates), or null. */
export function latest(xs: (string | null | undefined)[]): string | null {
  let best: string | null = null
  let bestT = -Infinity
  for (const x of xs) {
    if (!x) continue
    const t = new Date(x).getTime()
    if (!Number.isNaN(t) && t > bestT) {
      bestT = t
      best = x
    }
  }
  return best
}

/** When a page about these people last changed: the newest read or edit among them (the sitemap's lastmod). */
export function lastChanged(people: Pick<PersonCard, 'fetched_at' | 'updated_at'>[]): string | null {
  return latest(people.flatMap((p) => [p.fetched_at, p.updated_at]))
}

/**
 * When a list's facts were last read from the firms' sites, as the page says it: "Oct 24, 2026", or a span
 * "Oct 21–24, 2026" / "Sep 30 – Oct 24, 2026" when the reads were on different days. Null with no dates.
 */
export function verifiedSpan(people: Pick<PersonCard, 'fetched_at'>[]): string | null {
  const ts = people.map((p) => (p.fetched_at ? new Date(p.fetched_at).getTime() : NaN)).filter((t) => !Number.isNaN(t))
  if (!ts.length) return null
  const lo = new Date(Math.min(...ts))
  const hi = new Date(Math.max(...ts))
  const part = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-US', { ...o, timeZone: 'America/New_York' })
  const a = part(lo, { month: 'short', day: 'numeric', year: 'numeric' })
  const b = part(hi, { month: 'short', day: 'numeric', year: 'numeric' })
  if (a === b) return b
  const sameYear = part(lo, { year: 'numeric' }) === part(hi, { year: 'numeric' })
  const sameMonth = sameYear && part(lo, { month: 'short' }) === part(hi, { month: 'short' })
  if (sameMonth) return `${part(lo, { month: 'short' })} ${part(lo, { day: 'numeric' })}–${part(hi, { day: 'numeric' })}, ${part(hi, { year: 'numeric' })}`
  return sameYear ? `${part(lo, { month: 'short', day: 'numeric' })} – ${b}` : `${a} – ${b}`
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
