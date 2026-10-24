/**
 * The hub's search index, compact (2026-10-24 night). A hub page no longer carries its whole list: it renders its
 * first page (fifty people) on the server, and the browser fetches this index from /api/directory/index?trade=…
 * (edge-cached) the first time a reader searches, filters, sorts or pages. Pure, so tested; the test measures the
 * gzipped size of a 3,000-person index.
 *
 * Every repeated string is sent once, in a dictionary, and a person refers to it by number:
 *   firms     ["evercore.com", …]          (the firm's name, page and mark travel with the page itself)
 *   titles    ["Managing Director", …]
 *   offices   ["New York, NY", …]          (the label shown for a person's first office)
 *   cities    ["new-york", …]              (city slugs: the city filter)
 *   practices ["secondaries", …]
 * and a person is one short array: [slug, name, firm, title, office, more offices, cities, practices, flags], with
 * -1 for none, `cities` and `practices` as arrays of numbers, and flags 1 = partner or MD, 2 = claimed.
 */
import type { Row } from './search'

export const INDEX_VERSION = 1

export type PersonTuple = [s: string, n: string, f: number, t: number, o: number, om: number, c: number[], p: number[], flags: number]

export interface CompactIndex {
  v: number
  firms: string[]
  titles: string[]
  offices: string[]
  cities: string[]
  practices: string[]
  people: PersonTuple[]
}

class Dict {
  list: string[] = []
  private at = new Map<string, number>()
  id(x: string | null | undefined): number {
    if (!x) return -1
    let i = this.at.get(x)
    if (i === undefined) {
      i = this.list.length
      this.list.push(x)
      this.at.set(x, i)
    }
    return i
  }
}

export function encodeIndex(rows: Row[]): CompactIndex {
  const firms = new Dict()
  const titles = new Dict()
  const offices = new Dict()
  const cities = new Dict()
  const practices = new Dict()
  const people = rows.map(
    (r): PersonTuple => [r.s, r.n, firms.id(r.d), titles.id(r.t), offices.id(r.o), r.om, r.c.map((c) => cities.id(c)), r.p.map((p) => practices.id(p)), (r.sr ? 1 : 0) | (r.cl ? 2 : 0)],
  )
  return { v: INDEX_VERSION, firms: firms.list, titles: titles.list, offices: offices.list, cities: cities.list, practices: practices.list, people }
}

/** Back to rows; anything malformed is dropped, never thrown. Firm names come from the page's own firm list. */
export function decodeIndex(ix: CompactIndex, firmName: (domain: string) => string): Row[] {
  if (!ix || ix.v !== INDEX_VERSION || !Array.isArray(ix.people)) return []
  const at = <T,>(list: T[], i: number): T | null => (i >= 0 && i < list.length ? list[i] : null)
  const out: Row[] = []
  for (const t of ix.people) {
    if (!Array.isArray(t) || t.length < 9) continue
    const [s, n, f, ti, o, om, c, p, flags] = t
    const d = at(ix.firms, f)
    if (typeof s !== 'string' || typeof n !== 'string' || !d) continue
    out.push({
      s,
      n,
      t: at(ix.titles, ti),
      f: firmName(d),
      d,
      o: at(ix.offices, o),
      om: Number(om) || 0,
      c: (Array.isArray(c) ? c : []).map((i) => at(ix.cities, i)).filter((x): x is string => Boolean(x)),
      p: (Array.isArray(p) ? p : []).map((i) => at(ix.practices, i)).filter((x): x is string => Boolean(x)),
      sr: (flags & 1) === 1,
      cl: (flags & 2) === 2,
    })
  }
  return out
}

export const indexUrl = (tradeSlug: string) => `/api/directory/index?trade=${encodeURIComponent(tradeSlug)}&v=${INDEX_VERSION}`
