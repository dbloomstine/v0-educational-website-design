/**
 * The hub's rows, made on the server (lib/directory/search.ts says what each key holds). Kept apart from the search
 * so the browser's bundle carries the matching code and not the logo manifest.
 */
import { cityOf, officeLabel, type Office } from './places'
import { displayName, type PersonCard } from './people'
import { displayTitle, seniority, visiblePractices } from './quality'
import { logoFor, monogram } from './logos'
import { FIRM_MIN, firmSlug, type FirmSummary } from './firms'
import { CATEGORIES } from './taxonomy'
import type { Row, RowFirm } from './search'

const primary = (offices: Office[]) => offices.find((o) => cityOf(o)) ?? offices[0] ?? null

export function toRow(p: PersonCard): Row {
  const office = primary(p.offices)
  return {
    s: p.slug,
    n: displayName(p.full_name),
    t: displayTitle(p.title),
    f: p.firm_name,
    d: p.firm_domain.toLowerCase(),
    o: office ? officeLabel(office) : null,
    om: Math.max(0, p.offices.length - 1),
    c: [...new Set(p.offices.flatMap((o) => (cityOf(o) ? [cityOf(o)!.slug] : [])))],
    p: visiblePractices(p, CATEGORIES[p.category]),
    sr: seniority(p.title) === 'senior',
    cl: Boolean(p.claimed_at),
  }
}

/** The firms on a list, once each, for the rows' logos (sent apart from the rows so a logo is not repeated 35 times). */
export function rowFirms(people: PersonCard[], firms: FirmSummary[] = []): Record<string, RowFirm> {
  const known = new Map(firms.map((f) => [f.domain, f]))
  const out: Record<string, RowFirm> = {}
  for (const p of people) {
    const d = p.firm_domain.toLowerCase()
    if (out[d]) continue
    const f = known.get(d)
    const name = f?.name ?? p.firm_name
    out[d] = { domain: d, name, slug: f?.slug ?? firmSlug(name), page: (f?.count ?? 0) >= FIRM_MIN, logo: logoFor(d), mono: monogram(name) }
  }
  return out
}

