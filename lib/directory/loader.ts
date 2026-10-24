/**
 * The merge rules for loading people from a crawl (scripts/directory/load-people.ts).
 * Pure, so the rules are tested.
 *
 *   - Upsert by slug. A new person arrives as `review`: nobody is public until
 *     the desk publishes them.
 *   - Only the firm-site fields are ever written. The claim fields (headline,
 *     description, photo, contact link, practice tags, notable matters, the
 *     claim itself, pending edits) and the status are never touched.
 *   - A person once `removed` is never brought back by a crawl.
 *   - A person missing from a refresh is not deleted: they are stamped
 *     `missing_since` (only for firms this file covers: a file of five firms
 *     says nothing about the sixth). Back in a later crawl, the stamp clears.
 *   - US only: offices outside the US are dropped, and a person with no US
 *     office left is refused.
 *   - Five trades, one file or several (2026-10-24 night): a line may name its
 *     own `category`, else the file's (--category). Slugs are unique across
 *     trades: a slug another trade already holds gets the trade's suffix
 *     ("jane-smith-ey" the tax advisor becomes "jane-smith-ey-tax"), the same
 *     one on every run, so a refresh finds the row it made.
 */
import { CATEGORIES, RESERVED_SLUGS, isCategoryId, isClientFocusId, isPracticeId, isRepresentsId, type CategoryId } from './taxonomy'
import { stateCode, type Office } from './places'
import type { Education, Status } from './people'

export interface SourceRecord {
  full_name: string
  title: string | null
  firm_name: string
  firm_domain: string
  offices: Office[]
  practice_areas: string[]
  client_focus: string[]
  represents: string[]
  bar_admissions: string[]
  education: Education[]
  bio_url: string | null
  fetched_at: string | null
  slug: string
  /** The trade: the line's own `category`, else the file's. Never changed on an existing row. */
  category: CategoryId
}

/** What the loader may write. Nothing else, ever. */
export const FIRM_SITE_FIELDS = [
  'full_name',
  'title',
  'firm_name',
  'firm_domain',
  'offices',
  'practice_areas',
  'client_focus',
  'represents',
  'bar_admissions',
  'education',
  'bio_url',
  'fetched_at',
] as const satisfies readonly (keyof SourceRecord)[]

export type FirmSiteField = (typeof FIRM_SITE_FIELDS)[number]

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const str = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null
  const t = v.replace(/\s+/g, ' ').trim()
  return t ? t.slice(0, max) : null
}
const strList = (v: unknown, max: number, cap = 30): string[] =>
  Array.isArray(v) ? [...new Set(v.map((x) => str(x, max)).filter((x): x is string => !!x))].slice(0, cap) : []

export function normalizeDomain(raw: unknown): string | null {
  const s = str(raw, 200)?.toLowerCase()
  if (!s) return null
  const host = s.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : null
}

function httpUrl(v: unknown): string | null {
  const s = str(v, 500)
  if (!s) return null
  try {
    const u = new URL(s)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null
  } catch {
    return null
  }
}

export type Parsed = { ok: true; value: SourceRecord; warnings: string[] } | { ok: false; error: string }

/** One line of the crawl, checked. `fallback`: the trade for a line that names none (the --category flag). */
export function parseRecord(raw: unknown, fallback: CategoryId = 'fund_lawyer'): Parsed {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'not an object' }
  const r = raw as Record<string, unknown>
  const warnings: string[] = []
  const full_name = str(r.full_name, 120)
  const firm_name = str(r.firm_name, 160)
  const firm_domain = normalizeDomain(r.firm_domain)
  const slug = str(r.slug, 120)?.toLowerCase() ?? null
  if (!full_name) return { ok: false, error: 'no full_name' }
  if (!firm_name) return { ok: false, error: `${full_name}: no firm_name` }
  if (!firm_domain) return { ok: false, error: `${full_name}: no usable firm_domain` }
  if (!slug || !SLUG_RE.test(slug)) return { ok: false, error: `${full_name}: bad slug ${JSON.stringify(r.slug)}` }
  if (RESERVED_SLUGS.has(slug)) return { ok: false, error: `${full_name}: slug "${slug}" is reserved` }
  const rawCategory = r.category === undefined || r.category === null || r.category === '' ? fallback : r.category
  if (!isCategoryId(rawCategory)) return { ok: false, error: `${slug}: unknown category ${JSON.stringify(r.category)}` }
  const category: CategoryId = rawCategory

  const rawOffices = Array.isArray(r.offices) ? r.offices : []
  const offices: Office[] = []
  for (const o of rawOffices) {
    if (!o || typeof o !== 'object') continue
    const city = str((o as Record<string, unknown>).city, 80)
    const code = stateCode(str((o as Record<string, unknown>).state, 40))
    if (city && code) offices.push({ city, state: code })
    else warnings.push(`${slug}: dropped office ${JSON.stringify(o)} (not a US city and state)`)
  }
  if (!offices.length) return { ok: false, error: `${slug}: no US office (US only)` }

  const areas = strList(r.practice_areas, 40)
  const practice_areas = areas.filter(isPracticeId)
  for (const a of areas) if (!isPracticeId(a)) warnings.push(`${slug}: unknown practice area "${a}" dropped`)
  const own = CATEGORIES[category].practices as string[]
  for (const a of practice_areas) if (a !== 'other' && !own.includes(a)) warnings.push(`${slug}: "${a}" is not a ${CATEGORIES[category].singular.toLowerCase()} practice (kept as a tag, no page)`)

  const education: Education[] = Array.isArray(r.education)
    ? r.education.flatMap((e) => {
        if (!e || typeof e !== 'object') return []
        const x = e as Record<string, unknown>
        const school = str(x.school, 160)
        if (!school) return []
        const year = typeof x.year === 'number' || typeof x.year === 'string' ? Number(x.year) : null
        return [{ school, degree: str(x.degree, 80), year: year && year > 1900 && year < 2100 ? year : null }]
      }).slice(0, 8)
    : []

  const fetched = str(r.fetched_at, 40)
  const fetched_at = fetched && !Number.isNaN(new Date(fetched).getTime()) ? new Date(fetched).toISOString() : null

  return {
    ok: true,
    warnings,
    value: {
      full_name,
      title: str(r.title, 160),
      firm_name,
      firm_domain,
      offices,
      practice_areas,
      client_focus: strList(r.client_focus, 40).filter(isClientFocusId),
      represents: strList(r.represents, 40).filter(isRepresentsId),
      bar_admissions: strList(r.bar_admissions, 80),
      education,
      bio_url: httpUrl(r.bio_url),
      fetched_at,
      slug,
      category,
    },
  }
}

/** The suffix a trade adds to a slug another trade holds. */
export const CATEGORY_SLUG_SUFFIX: Record<CategoryId, string> = {
  fund_lawyer: 'law',
  fund_auditor: 'audit',
  fund_tax_advisor: 'tax',
  placement_agent: 'placement',
  fund_finance_banker: 'banking',
}

type SlugOwner = Pick<ExistingRow, 'category' | 'full_name' | 'firm_domain'>

/**
 * The slug a line is stored under: its own, unless another trade holds it
 * (in the table or earlier in this load); then `<slug>-<suffix>`, then
 * `<slug>-<suffix>-2`… A suffixed slug is reused only by the same person (name
 * and firm), so a refresh lands on the row it made and never on a stranger's.
 * Null when every candidate is taken; `duplicate` when this trade already has
 * the slug earlier in this load.
 */
export function assignSlug(
  rec: Pick<SourceRecord, 'slug' | 'category' | 'full_name' | 'firm_domain'>,
  existing: ReadonlyMap<string, SlugOwner>,
  taken: ReadonlyMap<string, SlugOwner>,
): { slug: string } | { duplicate: true } | null {
  const suffix = CATEGORY_SLUG_SUFFIX[rec.category]
  const candidates = [rec.slug, `${rec.slug}-${suffix}`, ...[2, 3, 4, 5, 6, 7, 8, 9].map((n) => `${rec.slug}-${suffix}-${n}`)]
  for (const [i, c] of candidates.entries()) {
    if (c.length > 120 || RESERVED_SLUGS.has(c)) continue
    const inLoad = taken.get(c)
    if (inLoad) {
      if (i === 0 && inLoad.category === rec.category) return { duplicate: true }
      continue
    }
    const row = existing.get(c)
    if (!row) return { slug: c }
    if (row.category !== rec.category) continue
    if (i === 0 || (row.full_name === rec.full_name && row.firm_domain === rec.firm_domain)) return { slug: c }
  }
  return null
}

/** The row as the loader reads it back: firm-site fields plus what decides the merge. */
export type ExistingRow = Pick<SourceRecord, FirmSiteField> & {
  id: string
  slug: string
  category: CategoryId
  status: Status
  missing_since: string | null
}

export type Merge =
  | { kind: 'insert'; row: SourceRecord & { category: CategoryId; status: 'review'; source: 'firm_site' } }
  /** `fields` names what really changed; empty when only the date we read the bio moved on. */
  | { kind: 'update'; id: string; slug: string; changes: Partial<Pick<SourceRecord, FirmSiteField>> & { missing_since?: null }; fields: string[] }
  | { kind: 'unchanged'; slug: string }
  | { kind: 'skip'; slug: string; reason: string }

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

export function mergeRecord(existing: ExistingRow | null, rec: SourceRecord, category: CategoryId = rec.category): Merge {
  if (!existing) return { kind: 'insert', row: { ...rec, category, status: 'review', source: 'firm_site' } }
  if (existing.category !== category) return { kind: 'skip', slug: rec.slug, reason: `slug belongs to a ${existing.category}` }
  if (existing.status === 'removed') return { kind: 'skip', slug: rec.slug, reason: 'removed: never re-added by a crawl' }
  const changes: Record<string, unknown> = {}
  for (const f of FIRM_SITE_FIELDS) if (!same(existing[f], rec[f])) changes[f] = rec[f]
  // An older read never replaces a newer one: the "as of" date only moves forward.
  if ('fetched_at' in changes && existing.fetched_at && (!rec.fetched_at || rec.fetched_at < existing.fetched_at)) delete changes.fetched_at
  const fields = Object.keys(changes).filter((f) => f !== 'fetched_at')
  if (existing.missing_since) {
    changes.missing_since = null
    fields.push('missing_since')
  }
  if (!Object.keys(changes).length) return { kind: 'unchanged', slug: rec.slug }
  return { kind: 'update', id: existing.id, slug: rec.slug, changes, fields }
}

/**
 * The people to stamp `missing_since`: in this category, at a firm this file
 * covers, not in the file, not already stamped, not removed.
 */
export function missingFrom(existing: ExistingRow[], seen: ReadonlySet<string>, firms: ReadonlySet<string>, category: CategoryId): ExistingRow[] {
  return existing.filter((e) => e.category === category && e.status !== 'removed' && !e.missing_since && firms.has(e.firm_domain) && !seen.has(e.slug))
}
