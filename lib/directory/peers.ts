/**
 * A profile's "at other firms" list (2026-10-24, the SEO audit's "richer profiles, without padding"): partners in the
 * same city who list practices in common, at firms other than the person's own. Facts the page did not have before,
 * each a link a reader can use; nothing written to fill space. Pure, so tested.
 */
import { cityOf } from './places'
import { bySurname, isPublic, type PersonCard } from './people'
import { visiblePractices } from './quality'
import type { Category } from './taxonomy'

export interface Peer<T extends PersonCard = PersonCard> {
  person: T
  /** The practices both list, in the trade's order. */
  shared: string[]
}

/** Up to `max` people, no more than `perFirm` from one firm, most practices in common first, then A to Z. */
export function peersOf<T extends PersonCard>(p: PersonCard, people: T[], citySlug: string, category: Category, max = 6, perFirm = 2, now = new Date()): Peer<T>[] {
  const mine = visiblePractices(p, category)
  if (!mine.length) return []
  const firm = p.firm_domain.toLowerCase()
  const found: Peer<T>[] = []
  for (const x of people) {
    if (x.id === p.id || x.firm_domain.toLowerCase() === firm || !isPublic(x, now)) continue
    if (!x.offices.some((o) => cityOf(o)?.slug === citySlug)) continue
    const theirs = new Set(visiblePractices(x, category))
    const shared = mine.filter((a) => theirs.has(a))
    if (shared.length) found.push({ person: x, shared })
  }
  found.sort((a, b) => b.shared.length - a.shared.length || bySurname(a.person, b.person))
  const perFirmCount = new Map<string, number>()
  const out: Peer<T>[] = []
  for (const f of found) {
    const d = f.person.firm_domain.toLowerCase()
    const k = perFirmCount.get(d) ?? 0
    if (k >= perFirm) continue
    perFirmCount.set(d, k + 1)
    out.push(f)
    if (out.length >= max) break
  }
  return out
}
