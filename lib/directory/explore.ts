/**
 * The directory's table explorer (2026-10-24, Danny: "dense functionality almost like a table grid… like the Lead
 * Desk… filter by all sorts of different data fields"). One trade's people as rows, filtered by many facets at once,
 * searched with the hub's own forgiving matcher, sorted by any column, and kept in the address so a view can be shared.
 * Pure (no database, no browser), so every rule here is tested (lib/directory/__tests__/explore.test.ts); the page is
 * components/directory/explore/Explorer.tsx and the compact index it fetches is lib/directory/explore-index.ts.
 *
 * Columns that do not exist yet (migration 20261026_directory_fields.sql: career_start_year, primary_practice,
 * secondary_practices, prior_firms, schools, languages) read as empty. A facet or a column with nothing in it hides
 * itself, so the page lights up field by field as the data arrives, with no change here.
 */
import { bySurname, displayName, surname, type Education, type PersonCard } from './people'
import { cityOf, officeLabel, stateCode, CITIES, STATES } from './places'
import { displayTitle, seniority, visiblePractices } from './quality'
import { CATEGORIES, CLIENT_FOCUS, REPRESENTS, isPracticeId, practiceLabel, type Category } from './taxonomy'
import { fold, haystack, scoreQuery, type Haystack } from './search'

// ── The source row ──────────────────────────────────────────────────────────

/** A card plus the fields the explorer reads beyond it. Every extra is optional: before the migration they are absent. */
export type ExploreSource = PersonCard & {
  education?: Education[] | null
  career_start_year?: number | null
  primary_practice?: string | null
  secondary_practices?: string[] | null
  prior_firms?: string[] | null
  schools?: string[] | null
  languages?: string[] | null
}

/** The extra columns, as the loader asks for them (lib/directory/explore-data.ts). */
export const EXPLORE_EXTRA_COLUMNS = ['career_start_year', 'primary_practice', 'secondary_practices', 'prior_firms', 'schools', 'languages'] as const

/** A missing column, as PostgREST reports it (the read then asks again without the extra columns). */
export const isMissingColumn = (e: { code?: string; message?: string } | null | undefined) =>
  Boolean(e && (e.code === '42703' || e.code === 'PGRST204' || /column .* does not exist|could not find .* column/i.test(e.message ?? '')))

/** One person as the table needs them: short keys, display-ready values. */
export interface XRow {
  /** Profile slug. */
  s: string
  /** Name, as pages show it. */
  n: string
  /** Title, cased for display. */
  t: string | null
  /** Firm name and domain. */
  f: string
  d: string
  /** First office ("New York, NY") and how many more. */
  o: string | null
  om: number
  /** City slugs and state codes of every office. */
  c: string[]
  st: string[]
  /** Practices (any), in the trade's menu order; the primary one, when known. */
  p: string[]
  pp: string | null
  /** Client focus and the side they act for (ids). */
  cf: string[]
  rp: string[]
  /** Title rank (TITLE_RANKS id). */
  rk: RankId
  /** The year the career began, when known. */
  y: number | null
  /** Schools, prior firms and languages, normalised for grouping. */
  sc: string[]
  pf: string[]
  lg: string[]
  /** Partner or MD; claimed. */
  sr: boolean
  cl: boolean
  /** Last verified, as a day number (days since 1970-01-01, UTC), or null. */
  v: number | null
}

// ── Title rank ──────────────────────────────────────────────────────────────

export type RankId = 'leader' | 'partner' | 'md' | 'director' | 'vp' | 'counsel' | 'other'

export const TITLE_RANKS: { id: RankId; label: string }[] = [
  { id: 'leader', label: 'Chair, head or managing partner' },
  { id: 'partner', label: 'Partner or principal' },
  { id: 'md', label: 'Managing director' },
  { id: 'director', label: 'Director' },
  { id: 'vp', label: 'Vice president' },
  { id: 'counsel', label: 'Counsel' },
  { id: 'other', label: 'Other titles' },
]
const RANK_ORDER = new Map(TITLE_RANKS.map((r, i) => [r.id, i]))
export const isRankId = (v: unknown): v is RankId => RANK_ORDER.has(v as RankId)

/** A title's rank: the most senior word in it wins ("Managing Partner" leads, "Partner, Fund Advisory" is a partner). */
export function titleRank(title: string | null | undefined): RankId {
  const t = (title ?? '').toLowerCase()
  if (!t.trim()) return 'other'
  if (/\b(chair(man|woman|person)?|co-chair|managing partner|head of|global head|chief|founder|co-founder|president|ceo)\b/.test(t) && !/\bvice president\b/.test(t)) return 'leader'
  if (/\bmanaging director\b|\bsmd\b|\bmd\b/.test(t)) return 'md'
  if (/\b(partner|shareholder|member|principal)\b/.test(t) && !/\b(associate|paralegal|assistant)\b/.test(t)) return 'partner'
  if (/\bvice president\b|\bsvp\b|\bvp\b/.test(t)) return 'vp'
  if (/\bdirector\b/.test(t)) return 'director'
  if (/\bcounsel\b/.test(t)) return 'counsel'
  return 'other'
}

// ── Experience ──────────────────────────────────────────────────────────────

export type ExpBucket = '0-10' | '10-20' | '20+'
export const EXP_BUCKETS: { id: ExpBucket; label: string }[] = [
  { id: '0-10', label: 'Under 10 years' },
  { id: '10-20', label: '10 to 20 years' },
  { id: '20+', label: '20 years or more' },
]

/** Years in the field, from the career's first year; null when unknown or not believable. */
export function yearsIn(start: number | null | undefined, year: number): number | null {
  if (typeof start !== 'number' || !Number.isInteger(start) || start < 1950 || start > year) return null
  return year - start
}

export function expBucket(years: number | null): ExpBucket | null {
  if (years === null) return null
  return years < 10 ? '0-10' : years < 20 ? '10-20' : '20+'
}

// ── Normalising free text (schools, prior firms, languages) ────────────────

const squash = (s: string) => s.replace(/\s+/g, ' ').trim()
const DEGREE = /^(j\.?\s?d|ll\.?\s?m|ll\.?\s?b|b\.?\s?a|b\.?\s?s|m\.?\s?b\.?\s?a|m\.?\s?a|m\.?\s?s|ph\.?\s?d|m\.?\s?acc|b\.?\s?b\.?\s?a|cpa|bachelor|master|doctor|juris)\b/i

/** The famous schools whose names come in many forms: their law, business and undergraduate schools group as one. */
const SCHOOL_ALIASES: [RegExp, string][] = [
  [/^harvard\b/i, 'Harvard'],
  [/^yale\b/i, 'Yale'],
  [/^stanford\b/i, 'Stanford'],
  [/^columbia\b/i, 'Columbia'],
  [/^georgetown\b/i, 'Georgetown'],
  [/^duke\b/i, 'Duke'],
  [/^northwestern\b/i, 'Northwestern'],
  [/^cornell\b/i, 'Cornell'],
  [/^fordham\b/i, 'Fordham'],
  [/^vanderbilt\b/i, 'Vanderbilt'],
  [/^princeton\b/i, 'Princeton'],
  [/^(new york university|nyu)\b/i, 'NYU'],
  [/^(university of pennsylvania|penn\b|the wharton school|wharton)\b/i, 'University of Pennsylvania'],
  [/^(university of chicago|chicago booth)\b/i, 'University of Chicago'],
  [/^(university of michigan|michigan)\b/i, 'University of Michigan'],
  [/^(university of virginia|uva)\b/i, 'University of Virginia'],
  [/^(university of california,? berkeley|uc berkeley|berkeley law|boalt hall)\b/i, 'UC Berkeley'],
  [/^(university of california,? los angeles|ucla)\b/i, 'UCLA'],
  [/^(university of texas|ut austin)\b/i, 'University of Texas'],
  [/^(boston university)\b/i, 'Boston University'],
  [/^(boston college)\b/i, 'Boston College'],
  [/^(george washington university|gwu)\b/i, 'George Washington University'],
]

/** A school as the filter groups it: no degree, no "School of Law" suffix, the famous ones under one name. */
export function normalizeSchool(raw: string | null | undefined): string | null {
  let s = squash(String(raw ?? ''))
  if (!s || s.length > 120) return null
  // "Harvard Law School, J.D." / "J.D., Harvard Law School": keep the part that is not a degree.
  const parts = s.split(/\s*[,;(]\s*/).filter(Boolean)
  if (parts.length > 1) {
    const keep = parts.filter((x) => !DEGREE.test(x) && !/^\d{4}\)?$/.test(x) && !/^(cum|magna|summa)\b/i.test(x))
    // "University of California, Berkeley" is one name: rejoin what is left.
    s = keep.join(', ')
  }
  s = s.replace(/^the\s+/i, '').replace(/[)]+$/, '')
  // A degree or a licence on its own ("CPA", "J.D.") is not a school.
  if (!s || (DEGREE.test(s) && s.split(' ').length <= 2)) return null
  for (const [re, name] of SCHOOL_ALIASES) if (re.test(s)) return name
  s = s
    .replace(/\s+(law school|school of law|college of law|law center|business school|school of business|graduate school of business|school of management)$/i, '')
    .replace(/\s+-\s+.*$/, '')
  s = squash(s)
  return s.length >= 3 ? s : null
}

const FIRM_SUFFIX = /[,\s]+(llp|l\.l\.p\.|llc|l\.l\.c\.|lp|l\.p\.|inc\.?|p\.c\.|pllc|ltd\.?|limited|co\.)$/i

/** A prior firm as the filter groups it: no "LLP" or "Inc.". */
export function normalizeFirm(raw: string | null | undefined): string | null {
  let s = squash(String(raw ?? ''))
  if (!s || s.length > 100) return null
  for (let i = 0; i < 2; i++) s = s.replace(FIRM_SUFFIX, '').replace(/\s*(&|\band)$/i, '').trim()
  return s.length >= 2 ? s : null
}

export function normalizeLanguage(raw: string | null | undefined): string | null {
  const s = squash(String(raw ?? '')).toLowerCase()
  if (!s || s.length > 40 || /^english$/.test(s)) return null
  return s.replace(/(^|[\s-])([a-z])/g, (_m, p: string, c: string) => p + c.toUpperCase())
}

const uniq = (xs: (string | null)[]) => [...new Set(xs.filter((x): x is string => Boolean(x)))]

// ── Building rows (server side) ─────────────────────────────────────────────

const DAY = 86_400_000
const dayOf = (iso: string | null | undefined): number | null => {
  if (!iso) return null
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? null : Math.floor(t / DAY)
}

export function toExploreRow(p: ExploreSource, category: Category = CATEGORIES[p.category]): XRow {
  const offices = p.offices ?? []
  const office = offices.find((o) => cityOf(o)) ?? offices[0] ?? null
  const vocab = new Set<string>(category.practices)
  const primary = p.primary_practice && isPracticeId(p.primary_practice) && vocab.has(p.primary_practice) ? p.primary_practice : null
  const secondary = (p.secondary_practices ?? []).filter((x) => vocab.has(x))
  const mine = new Set([...visiblePractices(p, category), ...(primary ? [primary] : []), ...secondary])
  const schools = p.schools?.length ? p.schools : (p.education ?? []).map((e) => e?.school)
  return {
    s: p.slug,
    n: displayNameSafe(p.full_name),
    t: displayTitle(p.title),
    f: p.firm_name,
    d: p.firm_domain.toLowerCase(),
    o: office ? officeLabel(office) : null,
    om: Math.max(0, offices.length - 1),
    c: uniq(offices.map((o) => cityOf(o)?.slug ?? null)),
    st: uniq(offices.map((o) => stateCode(o.state))),
    p: category.practices.filter((id) => mine.has(id)),
    pp: primary,
    cf: (p.client_focus ?? []).filter((x) => CLIENT_FOCUS.some((c) => c.id === x)),
    rp: category.sides ? (p.represents ?? []).filter((x) => REPRESENTS.some((r) => r.id === x)) : [],
    rk: titleRank(p.title),
    y: typeof p.career_start_year === 'number' ? p.career_start_year : null,
    sc: uniq((schools ?? []).map(normalizeSchool)),
    pf: uniq((p.prior_firms ?? []).map(normalizeFirm)).filter((x) => fold(x) !== fold(p.firm_name)),
    lg: uniq((p.languages ?? []).map(normalizeLanguage)),
    sr: seniority(p.title) === 'senior',
    cl: Boolean(p.claimed_at),
    v: dayOf(p.fetched_at),
  }
}

const displayNameSafe = (s: string) => displayName(s ?? '')

// ── Facets ──────────────────────────────────────────────────────────────────

export type FacetKey = 'practice' | 'city' | 'state' | 'firm' | 'rank' | 'exp' | 'focus' | 'side' | 'school' | 'prior' | 'lang'

/** Menu order. The label is the facet's heading; `many`: a long list, searchable within. */
export const FACETS: { key: FacetKey; label: string; many?: boolean }[] = [
  { key: 'practice', label: 'Practice' },
  { key: 'city', label: 'City', many: true },
  { key: 'state', label: 'State', many: true },
  { key: 'firm', label: 'Firm', many: true },
  { key: 'rank', label: 'Title' },
  { key: 'exp', label: 'Experience' },
  { key: 'focus', label: 'Client focus' },
  { key: 'side', label: 'Represents' },
  { key: 'school', label: 'School', many: true },
  { key: 'prior', label: 'Prior firm', many: true },
  { key: 'lang', label: 'Languages', many: true },
]
export const FACET_KEYS = FACETS.map((f) => f.key)
const isFacetKey = (v: string): v is FacetKey => (FACET_KEYS as string[]).includes(v)

export type PracticeMode = 'any' | 'primary'

/** The keys a row holds for a facet. */
export function rowKeys(r: XRow, facet: FacetKey, year: number, pm: PracticeMode = 'any'): string[] {
  switch (facet) {
    case 'practice':
      return pm === 'primary' ? (r.pp ? [r.pp] : []) : r.p
    case 'city':
      return r.c
    case 'state':
      return r.st
    case 'firm':
      return [r.d]
    case 'rank':
      return [r.rk]
    case 'exp': {
      const b = expBucket(yearsIn(r.y, year))
      return b ? [b] : []
    }
    case 'focus':
      return r.cf
    case 'side':
      return r.rp
    case 'school':
      return r.sc
    case 'prior':
      return r.pf
    case 'lang':
      return r.lg
  }
}

const CITY_NAME = new Map(CITIES.map((c) => [c.slug, c.state === 'DC' ? c.name : `${c.name}, ${c.state}`]))
const STATE_NAME = new Map(STATES.map((s) => [s.code, s.name]))
const FOCUS_NAME = new Map(CLIENT_FOCUS.map((c) => [c.id, c.label]))
const SIDE_NAME = new Map(REPRESENTS.map((c) => [c.id, c.label]))
const RANK_NAME = new Map(TITLE_RANKS.map((c) => [c.id, c.label]))
const EXP_NAME = new Map(EXP_BUCKETS.map((c) => [c.id, c.label]))

/** A facet value as the menu shows it. Firms need the page's own firm list. */
export function facetLabel(facet: FacetKey, key: string, firmName?: (d: string) => string | undefined): string {
  switch (facet) {
    case 'practice':
      return practiceLabel(key)
    case 'city':
      return CITY_NAME.get(key) ?? key
    case 'state':
      return STATE_NAME.get(key) ?? key
    case 'firm':
      return firmName?.(key) ?? key
    case 'rank':
      return RANK_NAME.get(key as RankId) ?? key
    case 'exp':
      return EXP_NAME.get(key as ExpBucket) ?? key
    case 'focus':
      return FOCUS_NAME.get(key as never) ?? key
    case 'side':
      return SIDE_NAME.get(key as never) ?? key
    default:
      return key
  }
}

/** Facets whose values have a fixed order (the rest go biggest first). */
const FIXED_ORDER: Partial<Record<FacetKey, string[]>> = {
  rank: TITLE_RANKS.map((r) => r.id),
  exp: EXP_BUCKETS.map((b) => b.id),
  focus: CLIENT_FOCUS.map((c) => c.id),
  side: REPRESENTS.map((r) => r.id),
}

// ── The query ───────────────────────────────────────────────────────────────

export type SortCol = 'name' | 'firm' | 'title' | 'office' | 'practice' | 'exp' | 'school' | 'verified'
export const SORT_COLS: SortCol[] = ['name', 'firm', 'title', 'office', 'practice', 'exp', 'school', 'verified']
export const isSortCol = (v: unknown): v is SortCol => SORT_COLS.includes(v as SortCol)
/** A column's first direction when its header is clicked: most experienced and most recently verified first. */
export const firstDir = (c: SortCol): 1 | -1 => (c === 'exp' || c === 'verified' ? -1 : 1)

export interface XQuery {
  q: string
  f: Partial<Record<FacetKey, string[]>>
  pm: PracticeMode
  /** Null: best match when words are typed, else surname. */
  sort: SortCol | null
  dir: 1 | -1
}

export const emptyQuery = (): XQuery => ({ q: '', f: {}, pm: 'any', sort: null, dir: 1 })

/** How many values a query holds, across every facet. */
export const filterCount = (q: XQuery) => FACET_KEYS.reduce((n, k) => n + (q.f[k]?.length ?? 0), 0)

/** The haystack the search reads: name, firm, offices, practices, and (as places, weighted low) schools and prior firms. */
export function xHaystack(r: XRow): Haystack {
  const h = haystack({ n: r.n, f: r.f, o: r.o, p: r.p }, r.c)
  const extra = fold([...r.sc, ...r.pf, ...r.lg].join(' ')).split(' ').filter(Boolean)
  return extra.length ? { ...h, place: [...h.place, ...extra] } : h
}

const surnameKey = (n: string) => fold(surname(n))

function compare(a: XRow, b: XRow, col: SortCol, year: number): number {
  const byName = () => bySurname({ full_name: a.n }, { full_name: b.n })
  switch (col) {
    case 'name':
      return byName()
    case 'firm':
      return a.f.localeCompare(b.f, 'en') || surnameKey(a.n).localeCompare(surnameKey(b.n), 'en')
    case 'title':
      return (RANK_ORDER.get(a.rk)! - RANK_ORDER.get(b.rk)!) || (a.t ?? '').localeCompare(b.t ?? '', 'en')
    case 'office':
      return (a.o ?? '').localeCompare(b.o ?? '', 'en')
    case 'practice':
      return practiceLabel(a.pp ?? a.p[0] ?? '').localeCompare(practiceLabel(b.pp ?? b.p[0] ?? ''), 'en')
    case 'exp':
      return (yearsIn(a.y, year) ?? 0) - (yearsIn(b.y, year) ?? 0)
    case 'school':
      return (a.sc[0] ?? '').localeCompare(b.sc[0] ?? '', 'en')
    case 'verified':
      return (a.v ?? 0) - (b.v ?? 0)
  }
}

/** Is the sort value missing? Missing values go last whichever way the column is sorted. */
function missing(r: XRow, col: SortCol, year: number): boolean {
  switch (col) {
    case 'office':
      return !r.o
    case 'practice':
      return !r.pp && !r.p.length
    case 'exp':
      return yearsIn(r.y, year) === null
    case 'school':
      return !r.sc.length
    case 'verified':
      return r.v === null
    case 'title':
      return !r.t
    default:
      return false
  }
}

interface Pass {
  r: XRow
  score: number
  /** How many facets the row fails, and the one it fails (when just one). */
  fails: number
  failed: FacetKey | null
}

function evaluate(rows: XRow[], query: XQuery, year: number, hay?: Haystack[]): Pass[] {
  const active = FACET_KEYS.filter((k) => query.f[k]?.length).map((k) => [k, new Set(query.f[k])] as const)
  const out: Pass[] = []
  rows.forEach((r, i) => {
    const score = query.q ? scoreQuery(query.q, hay?.[i] ?? xHaystack(r)) : 1
    if (score <= 0) return
    let fails = 0
    let failed: FacetKey | null = null
    for (const [k, want] of active) {
      if (!rowKeys(r, k, year, query.pm).some((x) => want.has(x))) {
        fails++
        failed = k
        if (fails > 1) break
      }
    }
    out.push({ r, score, fails, failed })
  })
  return out
}

/** The rows a query shows, in order. Within a facet any chosen value will do; across facets, every facet must hold. */
export function runExplore(rows: XRow[], query: XQuery, year: number, hay?: Haystack[]): XRow[] {
  const kept = evaluate(rows, query, year, hay).filter((x) => x.fails === 0)
  const col = query.sort
  if (!col) {
    return kept.sort((a, b) => (query.q ? b.score - a.score : 0) || compare(a.r, b.r, 'name', year)).map((x) => x.r)
  }
  return kept
    .sort((a, b) => {
      const ma = missing(a.r, col, year)
      const mb = missing(b.r, col, year)
      if (ma !== mb) return ma ? 1 : -1
      return query.dir * compare(a.r, b.r, col, year) || compare(a.r, b.r, 'name', year)
    })
    .map((x) => x.r)
}

export interface FacetValue {
  key: string
  count: number
}

/**
 * Every facet's values with live counts: what choosing each would leave, given the search and every other facet
 * (a value already chosen counts what it holds now). One pass over the rows: a row failing no facet counts toward
 * every facet; a row failing exactly one counts toward that one only.
 */
export function exploreCounts(rows: XRow[], query: XQuery, year: number, hay?: Haystack[]): Record<FacetKey, FacetValue[]> {
  const maps = Object.fromEntries(FACET_KEYS.map((k) => [k, new Map<string, number>()])) as Record<FacetKey, Map<string, number>>
  const bump = (r: XRow, k: FacetKey) => {
    const m = maps[k]
    for (const x of new Set(rowKeys(r, k, year, query.pm))) m.set(x, (m.get(x) ?? 0) + 1)
  }
  for (const x of evaluate(rows, query, year, hay)) {
    if (x.fails === 0) for (const k of FACET_KEYS) bump(x.r, k)
    else if (x.fails === 1 && x.failed) bump(x.r, x.failed)
  }
  const out = {} as Record<FacetKey, FacetValue[]>
  for (const k of FACET_KEYS) {
    const list = [...maps[k]].map(([key, count]) => ({ key, count }))
    // A value chosen that now holds nobody still shows, at zero, so it can be unticked.
    for (const v of query.f[k] ?? []) if (!maps[k].has(v)) list.push({ key: v, count: 0 })
    const fixed = FIXED_ORDER[k]
    out[k] = fixed
      ? list.sort((a, b) => (fixed.indexOf(a.key) + 1 || 99) - (fixed.indexOf(b.key) + 1 || 99))
      : k === 'practice'
        ? list.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
        : list.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key, 'en'))
  }
  return out
}

/** The facets worth showing for a trade: two values or more in the whole list (or one already chosen). */
export function liveFacets(all: Record<FacetKey, FacetValue[]>, query: XQuery): FacetKey[] {
  return FACET_KEYS.filter((k) => all[k].length >= 2 || (query.f[k]?.length ?? 0) > 0)
}

/** Does any row have the field at all (a column with nothing in it hides itself)? */
export function fieldsPresent(rows: XRow[]): Record<'pp' | 'y' | 'sc' | 'pf' | 'lg' | 'cf' | 'rp' | 'v' | 'p', boolean> {
  const has = { pp: false, y: false, sc: false, pf: false, lg: false, cf: false, rp: false, v: false, p: false }
  for (const r of rows) {
    if (r.pp) has.pp = true
    if (r.y !== null) has.y = true
    if (r.sc.length) has.sc = true
    if (r.pf.length) has.pf = true
    if (r.lg.length) has.lg = true
    if (r.cf.length) has.cf = true
    if (r.rp.length) has.rp = true
    if (r.v !== null) has.v = true
    if (r.p.length) has.p = true
  }
  return has
}

// ── Addresses ───────────────────────────────────────────────────────────────

const MAX_VALUES = 40
const clip = (s: string) => s.trim().slice(0, 100)

type RawParams = Record<string, string | string[] | undefined>

const listOf = (v: string | string[] | undefined): string[] => (Array.isArray(v) ? v : v === undefined ? [] : [v]).map(clip).filter(Boolean)

/** The query an address holds. Anything it does not know is ignored; the hub's own `level=senior` means partner rank and up. */
export function parseExplore(sp: RawParams | URLSearchParams): XQuery {
  const get = (k: string): string[] => (sp instanceof URLSearchParams ? sp.getAll(k).map(clip).filter(Boolean) : listOf(sp[k]))
  const q = emptyQuery()
  q.q = (get('q')[0] ?? '').slice(0, 80)
  for (const k of FACET_KEYS) {
    const vals = [...new Set(get(k))].slice(0, MAX_VALUES)
    if (k === 'rank' && get('level')[0] === 'senior') vals.push(...(['leader', 'partner', 'md'] as const).filter((x) => !vals.includes(x)))
    const ok = k === 'rank' ? vals.filter(isRankId) : k === 'exp' ? vals.filter((x) => EXP_BUCKETS.some((b) => b.id === x)) : vals
    if (ok.length) q.f[k] = ok
  }
  q.pm = get('pm')[0] === 'primary' ? 'primary' : 'any'
  const sort = get('sort')[0]
  q.sort = isSortCol(sort) ? sort : null
  q.dir = get('dir')[0] === 'desc' ? -1 : 1
  if (q.sort && get('dir').length === 0) q.dir = firstDir(q.sort)
  return q
}

/** A query as an address: defaults left out, facets in menu order, each value its own parameter. */
export function exploreHref(path: string, q: XQuery): string {
  const sp = new URLSearchParams()
  if (q.q.trim()) sp.set('q', q.q.trim())
  for (const k of FACET_KEYS) for (const v of q.f[k] ?? []) sp.append(k, v)
  if (q.pm === 'primary') sp.set('pm', 'primary')
  if (q.sort) {
    sp.set('sort', q.sort)
    if (q.dir !== firstDir(q.sort)) sp.set('dir', q.dir < 0 ? 'desc' : 'asc')
  }
  const s = sp.toString()
  return s ? `${path}?${s}` : path
}

/** Toggle one value in a facet (a new query; the old one is left alone). */
export function toggleValue(q: XQuery, k: FacetKey, v: string): XQuery {
  const cur = q.f[k] ?? []
  const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]
  const f = { ...q.f }
  if (next.length) f[k] = next
  else delete f[k]
  return { ...q, f }
}

/** A hub or landing page's own filters, as the explorer's address (the "Table" side of the view toggle). */
export function tableHrefFrom(path: string, from: { q?: string; practice?: string; city?: string; state?: string; firm?: string; level?: string; focus?: string; side?: string }): string {
  const q = emptyQuery()
  q.q = (from.q ?? '').trim()
  if (from.practice) q.f.practice = [from.practice]
  if (from.city) q.f.city = [from.city]
  if (from.state) q.f.state = [from.state]
  if (from.firm) q.f.firm = [from.firm]
  if (from.focus) q.f.focus = [from.focus]
  if (from.side) q.f.side = [from.side]
  if (from.level === 'senior') q.f.rank = ['leader', 'partner', 'md']
  return exploreHref(path, q)
}

export { isFacetKey }

/** "Oct 24" (this year) or "Oct 24, 2025", from a day number. */
export function dayLabel(day: number | null, nowYear: number): string | null {
  if (day === null) return null
  const d = new Date(day * DAY + DAY / 2)
  const y = d.getUTCFullYear()
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(y !== nowYear ? { year: 'numeric' } : {}), timeZone: 'UTC' })
}
