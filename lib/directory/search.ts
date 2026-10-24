/**
 * The hub's list, searched and sorted in the browser (2026-10-24 night): every keystroke answers at once, with no
 * trip to the server. Pure, so tested; the client component (components/directory/DirectoryBrowser.tsx) and the
 * server's first render use the same functions, so the page a crawler reads is the page a reader starts on.
 *
 * Search is forgiving the way a reader types: every word must find a home in the person's name, firm or city, as a
 * whole word, the start of one, a piece of one (three letters or more), or a word one slip away ("Evercor",
 * "Evrecore", "Bostn": two slips for a long word). Names count for more than firms, firms more than cities.
 */
import { bySurname, surname } from './people'
import type { FirmLogo } from './logos'

/** One person as the browser needs them: short keys, display-ready values. */
export interface Row {
  /** Profile slug (the path is /<trade>/people/<slug>). */
  s: string
  /** Full name. */
  n: string
  /** Title, cased for display. */
  t: string | null
  /** Firm name. */
  f: string
  /** Firm domain (the firm filter's value; old links use it). */
  d: string
  /** Primary office label ("New York, NY"), and how many more. */
  o: string | null
  om: number
  /** Known city slugs (the city filter). */
  c: string[]
  /** Practices within the trade's vocabulary. */
  p: string[]
  /** Partner or MD. */
  sr: boolean
  /** Claimed. */
  cl: boolean
}

export interface RowFirm {
  domain: string
  name: string
  slug: string
  /** Has a firm page of its own (FIRM_MIN people or more). */
  page: boolean
  logo: FirmLogo | null
  mono: string
}

// ── Matching ────────────────────────────────────────────────────────────────

export const fold = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/** Damerau-Levenshtein distance (adjacent swaps count once), stopping early past `max`. */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      rowMin = Math.min(rowMin, d[i][j])
    }
    if (rowMin > max) return max + 1
  }
  return d[a.length][b.length]
}

/** Slips allowed for a word this long: none under four letters, one to six, two from seven. */
const slips = (len: number) => (len < 4 ? 0 : len < 7 ? 1 : 2)

/** How well one typed word fits one word of the record: 4 whole, 3 start, 2 inside, 1 near, 0 not at all. */
export function wordScore(q: string, w: string): number {
  if (w === q) return 4
  if (w.startsWith(q)) return 3
  if (q.length >= 3 && w.includes(q)) return 2
  const k = slips(q.length)
  if (!k) return 0
  // Near the whole word, or near its start (a word still being typed: "evrec" for "evercore").
  if (editDistance(q, w, k) <= k) return 1
  if (w.length > q.length && editDistance(q, w.slice(0, q.length), k) <= k && q.length >= 5) return 1
  return 0
}

export interface Haystack {
  name: string[]
  firm: string[]
  place: string[]
}

export const haystack = (r: Pick<Row, 'n' | 'f' | 'o'>, cities: string[] = []): Haystack => ({
  name: fold(r.n).split(' ').filter(Boolean),
  firm: fold(r.f).split(' ').filter(Boolean),
  place: fold([r.o ?? '', ...cities.map((c) => c.replace(/-/g, ' '))].join(' ')).split(' ').filter(Boolean),
})

/** The record's score for a query: 0 when any word finds no home, else higher for better fits (names first). */
export function scoreQuery(q: string, h: Haystack): number {
  const words = fold(q).split(' ').filter((w) => w && w !== 'and')
  if (!words.length) return 1
  let total = 0
  for (const w of words) {
    const best = Math.max(
      ...h.name.map((x) => wordScore(w, x) * 3),
      ...h.firm.map((x) => wordScore(w, x) * 2),
      ...h.place.map((x) => wordScore(w, x)),
      0,
    )
    if (!best) return 0
    total += best
  }
  return total
}

// ── Filtering and sorting ───────────────────────────────────────────────────

export type SortKey = 'name' | 'firm'
export const SORTS: { id: SortKey; label: string }[] = [
  { id: 'name', label: 'Surname, A to Z' },
  { id: 'firm', label: 'Firm, A to Z' },
]
export const isSortKey = (v: unknown): v is SortKey => v === 'name' || v === 'firm'

export interface Query {
  q?: string
  practice?: string
  city?: string
  /** A firm's domain. */
  firm?: string
  /** 'senior': partners and MDs only. */
  level?: string
  sort?: SortKey
}

const surnameKey = (n: string) => fold(surname(n))

/**
 * The rows a query shows, in order. With words typed, the best fits come first (ties in the chosen order);
 * without, the chosen order: surname, or firm then surname.
 */
export function runQuery(rows: Row[], query: Query, hay?: Haystack[]): Row[] {
  const sort = query.sort ?? 'name'
  const scored: { r: Row; score: number }[] = []
  rows.forEach((r, i) => {
    if (query.practice && !r.p.includes(query.practice)) return
    if (query.city && !r.c.includes(query.city)) return
    if (query.firm && r.d !== query.firm) return
    if (query.level === 'senior' && !r.sr) return
    const score = query.q ? scoreQuery(query.q, hay?.[i] ?? haystack(r, r.c)) : 1
    if (score > 0) scored.push({ r, score })
  })
  const order = (a: Row, b: Row) =>
    sort === 'firm'
      ? a.f.localeCompare(b.f, 'en') || surnameKey(a.n).localeCompare(surnameKey(b.n), 'en') || a.n.localeCompare(b.n, 'en')
      : bySurname({ full_name: a.n }, { full_name: b.n })
  return scored.sort((a, b) => (query.q ? b.score - a.score : 0) || order(a.r, b.r)).map((x) => x.r)
}

/** Counts for each filter value, given the other filters (so a menu shows what choosing it would leave). */
export function facetCounts(rows: Row[], query: Query, facet: 'practice' | 'city' | 'firm' | 'level'): Map<string, number> {
  const rest = { ...query, [facet]: undefined }
  const m = new Map<string, number>()
  for (const r of runQuery(rows, { ...rest, sort: 'name' })) {
    const keys = facet === 'practice' ? r.p : facet === 'city' ? r.c : facet === 'firm' ? [r.d] : r.sr ? ['senior'] : []
    for (const k of keys) m.set(k, (m.get(k) ?? 0) + 1)
  }
  return m
}

export const QUERY_PAGE = 50

// ── Addresses ───────────────────────────────────────────────────────────────

const cleanQuery = (q: Query) => Object.fromEntries(Object.entries(q).filter(([k, v]) => v && !(k === 'sort' && v === 'name'))) as Record<string, string>

/** A view's address: its query (defaults left out) and its page. The browser's address and its "has it changed" test. */
export function queryHref(path: string, q: Query, page: number): string {
  const sp = new URLSearchParams(cleanQuery(q))
  if (page > 1) sp.set('page', String(page))
  const s = sp.toString()
  return s ? `${path}?${s}` : path
}

/** The query the server rendered, in exactly the fields the browser's live query has (nothing else, no page). */
export function normalQuery(i: Query): Query {
  return { q: (i.q ?? '').trim(), practice: i.practice ?? '', city: i.city ?? '', firm: i.firm ?? '', level: i.level === 'senior' ? 'senior' : '', sort: isSortKey(i.sort) ? i.sort : 'name' }
}
