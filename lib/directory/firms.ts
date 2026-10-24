/**
 * Firms inside the directory (2026-10-24 night): /<trade>/firms and /<trade>/firms/<slug>, "Placement Agents at
 * Evercore". A firm is its domain within a trade; its address is its name, made a slug. Pure, so tested.
 *
 * A firm page exists only with FIRM_MIN public people or more: a page about one person is that person's profile.
 */
import { cityOf } from './places'
import { bySurname, isPublic, type PersonCard } from './people'
import { seniority, visiblePractices } from './quality'
import { CATEGORIES, type Category } from './taxonomy'
import { practiceLabel } from './taxonomy'

export const FIRM_MIN = 2

const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** "Eaton Partners (Stifel)" → "eaton-partners"; "Moelis & Company" → "moelis-company"; "Frank, Rimerman + Co." → "frank-rimerman-co". */
export function firmSlug(name: string): string {
  return slugify(name.replace(/\(.*?\)/g, ' ').replace(/\b(llp|llc|l\.l\.c\.|inc\.?|p\.c\.)$/i, '')) || 'firm'
}

export interface FirmCount {
  key: string
  label: string
  count: number
}

export interface FirmSummary {
  slug: string
  name: string
  domain: string
  count: number
  senior: number
  /** Known cities, biggest first. */
  cities: FirmCount[]
  /** The trade's practices its people list, biggest first. */
  practices: FirmCount[]
}

const tallyOf = (items: string[][], label: (k: string) => string): FirmCount[] => {
  const m = new Map<string, number>()
  for (const keys of items) for (const k of new Set(keys)) m.set(k, (m.get(k) ?? 0) + 1)
  return [...m].map(([key, count]) => ({ key, label: label(key), count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'en'))
}

/**
 * Every firm in a trade's public list, biggest first. Two domains whose names make one slug (rare) are told apart by
 * the domain's own name: "smith-partners" and "smith-partners-smithlaw".
 */
export function firmsOf(people: PersonCard[], category: Category = CATEGORIES[people[0]?.category ?? 'fund_lawyer'], now = new Date()): FirmSummary[] {
  const by = new Map<string, PersonCard[]>()
  for (const p of people) {
    if (!isPublic(p, now)) continue
    const d = p.firm_domain.toLowerCase()
    by.set(d, [...(by.get(d) ?? []), p])
  }
  const out: FirmSummary[] = []
  for (const [domain, list] of by) {
    // The firm's name as most of its rows spell it.
    const names = tallyOf(list.map((p) => [p.firm_name.trim()]), (k) => k)
    const cityName = new Map<string, string>()
    const cities = tallyOf(
      list.map((p) => p.offices.flatMap((o) => { const c = cityOf(o); if (c) cityName.set(c.slug, c.name); return c ? [c.slug] : [] })),
      (k) => cityName.get(k) ?? k,
    )
    out.push({
      slug: firmSlug(names[0]?.label ?? domain),
      name: names[0]?.label ?? domain,
      domain,
      count: list.length,
      senior: list.filter((p) => seniority(p.title) === 'senior').length,
      cities,
      practices: tallyOf(list.map((p) => visiblePractices(p, category)), practiceLabel),
    })
  }
  out.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'en'))
  const seen = new Map<string, number>()
  for (const f of out) seen.set(f.slug, (seen.get(f.slug) ?? 0) + 1)
  for (const f of out) if ((seen.get(f.slug) ?? 0) > 1) f.slug = `${f.slug}-${slugify(f.domain.split('.')[0] ?? '')}`
  return out
}

/** The firms that get a page of their own. */
export const firmsWithPages = (firms: FirmSummary[]) => firms.filter((f) => f.count >= FIRM_MIN)

export const firmPath = (category: Category, slug: string) => `/${category.slug}/firms/${slug}`
export const firmsIndexPath = (category: Category) => `/${category.slug}/firms`

/** A firm's people, A to Z. */
export function peopleAtFirm<T extends PersonCard>(people: T[], domain: string, now = new Date()): T[] {
  return people.filter((p) => isPublic(p, now) && p.firm_domain.toLowerCase() === domain.toLowerCase()).sort(bySurname)
}

/** The firm page's heading: "Placement Agents at Evercore". */
export const firmTitle = (category: Category, name: string) => `${category.plural} at ${name}`
