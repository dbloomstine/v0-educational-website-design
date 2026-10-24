/**
 * The explorer's compact index (2026-10-24): every person in a trade with every field the table filters, sorts or
 * shows, sent once and edge-cached (/api/directory/explore?trade=…). Built like the hub's index
 * (lib/directory/search-index.ts): each repeated string travels once in a dictionary and a person refers to it by
 * number. Pure, so tested; the test holds a 3,000-person trade under 80 KB gzipped.
 *
 * A person is one array, trailing defaults left off (so a person with no schools, prior firms or languages costs
 * nothing for them):
 *   [slug, name, firm, title, office, more offices, cities, states, practices, primary practice,
 *    client focus (bits), represents (bits), flags (1 partner/MD, 2 claimed), title rank, career start year,
 *    verified (days after d0), schools, prior firms, languages]
 * -1 is "none" for a single reference, 0 for a year.
 */
import { CLIENT_FOCUS, REPRESENTS } from './taxonomy'
import { CITIES } from './places'
import { TITLE_RANKS, type XRow } from './explore'

// ── Slugs, sent as a difference ─────────────────────────────────────────────
// A profile's slug is almost always its first and last name and a short tag for the firm ("aalok-virmani-cooley"), so
// the index sends 0 for "the usual", "~tag" for the usual name with another tag, and the slug itself otherwise.

const SUFFIX = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'esq', 'phd', 'cpa', 'jd', 'llm'])

/** "Bridget R. O'Neill" → "bridget-oneill"; "Charles \"Chuck\" Charpentier" → "charles-charpentier". */
export function nameSlug(name: string): string {
  const words = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\(.*?\)|"[^"]*"|“[^”]*”/g, ' ')
    .replace(/['’]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !SUFFIX.has(w))
  return words.length >= 2 ? `${words[0]}-${words[words.length - 1]}` : words.join('-')
}

const CITY_STATE = new Map(CITIES.map((c) => [c.slug, c.state]))

export const EXPLORE_VERSION = 1

export type XTuple = (string | number | number[])[]

export interface ExploreIndex {
  v: number
  /** The year the index was built (experience is counted from it). */
  year: number
  /** The day "verified" counts from. */
  d0: number
  firms: string[]
  /** Each firm's usual slug tag (parallel to firms). */
  tags: string[]
  titles: string[]
  offices: string[]
  cities: string[]
  states: string[]
  practices: string[]
  schools: string[]
  priors: string[]
  langs: string[]
  people: XTuple[]
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

const FOCUS_IDS = CLIENT_FOCUS.map((c) => c.id as string)
const SIDE_IDS = REPRESENTS.map((r) => r.id as string)
const RANK_IDS = TITLE_RANKS.map((r) => r.id)
const bits = (ids: string[], order: string[]) => ids.reduce((m, id) => (order.indexOf(id) >= 0 ? m | (1 << order.indexOf(id)) : m), 0)
const unbits = (m: number, order: string[]) => order.filter((_, i) => (m & (1 << i)) !== 0)

/** Each slot's value when it is left off the end (the title rank's is "partner", the commonest). */
const RANK_DEFAULT = RANK_IDS.indexOf('partner')
const DEFAULTS: unknown[] = [null, null, null, -1, -1, 0, [], [], [], -1, 0, 0, 0, RANK_DEFAULT, 0, -1, [], [], []]
const isDefault = (x: unknown, i: number) => {
  const d = DEFAULTS[i]
  return Array.isArray(d) ? Array.isArray(x) && x.length === 0 : x === d
}

export function encodeExplore(rows: XRow[], year: number): ExploreIndex {
  const d = { firms: new Dict(), titles: new Dict(), offices: new Dict(), cities: new Dict(), states: new Dict(), practices: new Dict(), schools: new Dict(), priors: new Dict(), langs: new Dict() }
  const d0 = rows.reduce((m, r) => (r.v !== null && r.v < m ? r.v : m), Number.POSITIVE_INFINITY)
  const base = Number.isFinite(d0) ? d0 : 0
  // Each firm's usual slug tag: the commonest ending after the name.
  const tagCount = new Map<string, Map<string, number>>()
  for (const r of rows) {
    const g = nameSlug(r.n)
    if (!r.s.startsWith(`${g}-`)) continue
    const m = tagCount.get(r.d) ?? new Map<string, number>()
    const tag = r.s.slice(g.length + 1)
    m.set(tag, (m.get(tag) ?? 0) + 1)
    tagCount.set(r.d, m)
  }
  const tagOf = (domain: string) => [...(tagCount.get(domain) ?? [])].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? ''
  const slugCode = (r: XRow): string | number => {
    const g = nameSlug(r.n)
    if (!r.s.startsWith(`${g}-`)) return r.s
    const rest = r.s.slice(g.length + 1)
    return rest === tagOf(r.d) ? 0 : `~${rest}`
  }
  const people = rows.map((r): XTuple => {
    // States a known city already implies are not sent (the decoder adds them back).
    const implied = new Set(r.c.map((c) => CITY_STATE.get(c)))
    const t: XTuple = [
      slugCode(r),
      r.n,
      d.firms.id(r.d),
      d.titles.id(r.t),
      d.offices.id(r.o),
      r.om,
      r.c.map((x) => d.cities.id(x)),
      r.st.filter((x) => !implied.has(x)).map((x) => d.states.id(x)),
      r.p.map((x) => d.practices.id(x)),
      d.practices.id(r.pp),
      bits(r.cf, FOCUS_IDS),
      bits(r.rp, SIDE_IDS),
      (r.sr ? 1 : 0) | (r.cl ? 2 : 0),
      RANK_IDS.indexOf(r.rk),
      r.y ?? 0,
      r.v === null ? -1 : r.v - base,
      r.sc.map((x) => d.schools.id(x)),
      r.pf.map((x) => d.priors.id(x)),
      r.lg.map((x) => d.langs.id(x)),
    ]
    while (t.length > 3 && isDefault(t[t.length - 1], t.length - 1)) t.pop()
    return t
  })
  return {
    v: EXPLORE_VERSION,
    year,
    d0: base,
    firms: d.firms.list,
    tags: d.firms.list.map(tagOf),
    titles: d.titles.list,
    offices: d.offices.list,
    cities: d.cities.list,
    states: d.states.list,
    practices: d.practices.list,
    schools: d.schools.list,
    priors: d.priors.list,
    langs: d.langs.list,
    people,
  }
}

/** Back to rows; anything malformed is dropped, never thrown. Firm names come from the page's own firm list. */
export function decodeExplore(ix: ExploreIndex, firmName: (domain: string) => string): XRow[] {
  if (!ix || ix.v !== EXPLORE_VERSION || !Array.isArray(ix.people)) return []
  const at = (list: string[] | undefined, i: unknown): string | null => (Array.isArray(list) && typeof i === 'number' && i >= 0 && i < list.length ? list[i] : null)
  const many = (list: string[] | undefined, xs: unknown): string[] => (Array.isArray(xs) ? xs.map((i) => at(list, i)).filter((x): x is string => Boolean(x)) : [])
  const num = (x: unknown, dflt: number) => (typeof x === 'number' && Number.isFinite(x) ? x : dflt)
  // A slot left off the end holds its default (DEFAULTS above).
  const out: XRow[] = []
  for (const t of ix.people) {
    if (!Array.isArray(t) || t.length < 3) continue
    const [code, n, f] = t
    const domain = at(ix.firms, f)
    if (typeof n !== 'string' || !domain) continue
    const tag = at(ix.tags, f) ?? ''
    const s = code === 0 ? `${nameSlug(n)}-${tag}` : typeof code === 'string' && code.startsWith('~') ? `${nameSlug(n)}-${code.slice(1)}` : code
    if (typeof s !== 'string' || !s || s.endsWith('-')) continue
    const cities = many(ix.cities, t[6])
    const v = num(t[15], -1)
    const y = num(t[14], 0)
    out.push({
      s,
      n,
      t: at(ix.titles, num(t[3], -1)),
      f: firmName(domain),
      d: domain,
      o: at(ix.offices, t[4]),
      om: num(t[5], 0),
      c: cities,
      st: [...new Set([...cities.map((c) => CITY_STATE.get(c)).filter((x): x is string => Boolean(x)), ...many(ix.states, t[7])])],
      p: many(ix.practices, t[8]),
      pp: at(ix.practices, t[9]),
      cf: unbits(num(t[10], 0), FOCUS_IDS),
      rp: unbits(num(t[11], 0), SIDE_IDS),
      sr: (num(t[12], 0) & 1) === 1,
      cl: (num(t[12], 0) & 2) === 2,
      rk: RANK_IDS[num(t[13], RANK_DEFAULT)] ?? 'other',
      y: y > 0 ? y : null,
      v: v >= 0 ? v + num(ix.d0, 0) : null,
      sc: many(ix.schools, t[16]),
      pf: many(ix.priors, t[17]),
      lg: many(ix.langs, t[18]),
    })
  }
  return out
}

export const exploreIndexUrl = (tradeSlug: string) => `/api/directory/explore?trade=${encodeURIComponent(tradeSlug)}&v=${EXPLORE_VERSION}`
