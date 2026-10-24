/**
 * The refresh diff (2026-10-25): what a new crawl of some sources changes in
 * what is stored. Pure, so the rules are tested; scripts/directory/crawl/refresh.ts
 * reads the table, calls this, prints it and (only with --apply) writes it.
 *
 *   new        in the crawl, not stored → inserted as `review` (never public until the desk publishes)
 *   changed    stored, a crawled field differs → those fields only
 *   returned   stored with missing_since, back in the crawl → the stamp clears
 *   missing    stored, at a firm this crawl covered, not in it → stamped missing_since today
 *   expired    missing more than 30 days → off the site (lib/directory/people.ts isPublic
 *              hides it at read time; listed here so the desk sees who went)
 *   suppressed a firm whose crawl found under `minShare` of what is stored: a site
 *              redesign or a block, not mass departures, so nobody there is stamped
 *
 * Never touched by a refresh: anything a person claimed (CLAIM_FIELDS), the
 * status, a `removed` row (it never comes back), and other trades' rows.
 */
import { MISSING_GRACE_DAYS } from '../people'
import type { CategoryId } from '../taxonomy'
import type { DirectoryRow } from './types'

/** The crawled fields a refresh may write. */
export const CRAWLED_FIELDS = [
  'full_name', 'title', 'firm_name', 'firm_domain', 'offices', 'practice_areas', 'client_focus', 'represents',
  'bar_admissions', 'education', 'bio_url', 'source', 'source_url', 'city_basis', 'office_source_url',
] as const
export type CrawledField = (typeof CRAWLED_FIELDS)[number]

/** What the person owns once they claim the profile: a refresh never writes these. */
export const CLAIM_FIELDS = [
  'headline', 'description', 'photo_url', 'contact_url', 'claimed_practice_areas', 'notable', 'pending_edits',
  'pending_edits_at', 'claimed_at', 'claimed_email_domain', 'status', 'hidden_by',
] as const

export interface StoredRow extends Partial<Pick<DirectoryRow, CrawledField>> {
  id: string
  slug: string
  category: CategoryId
  firm_domain: string
  full_name: string
  status: 'review' | 'published' | 'hidden' | 'removed'
  missing_since: string | null
  claimed_at?: string | null
  fetched_at?: string | null
}

export interface Change {
  id: string
  slug: string
  fields: CrawledField[]
  /** Only CRAWLED_FIELDS, plus fetched_at and missing_since. */
  set: Partial<Record<CrawledField, unknown>> & { fetched_at?: string; missing_since?: null }
  /** The person claimed the profile: the change is applied, the desk is told. */
  claimed: boolean
  before: Partial<Record<CrawledField, unknown>>
}

export interface Diff {
  added: DirectoryRow[]
  changed: Change[]
  /** Only the date we read it moved on. */
  touched: Change[]
  returned: string[]
  missing: StoredRow[]
  /** Still on the firm's site, but this crawl refused the row (scope, title, office): for the desk, never stamped. */
  refused: StoredRow[]
  expired: StoredRow[]
  skipped: { slug: string; reason: string }[]
  suppressed: { firm_domain: string; crawled: number; stored: number }[]
}

export interface DiffOptions {
  /** YYYY-MM-DD. */
  today: string
  /** Firms this crawl covered completely (a firm absent here says nothing about its people). */
  firms: ReadonlySet<string>
  /** The trades this crawl covered. */
  categories: ReadonlySet<CategoryId>
  /** Slugs the crawl read on the firm's site but refused: not missing. */
  refused?: ReadonlySet<string>
  /** Below this share of stored people found, a firm's missing are not stamped. Default 0.6. */
  minShare?: number
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

const daysBetween = (from: string, to: string) => Math.floor((Date.parse(to) - Date.parse(from)) / 86400e3)

export function diffCrawl(stored: StoredRow[], crawled: DirectoryRow[], opt: DiffOptions): Diff {
  const minShare = opt.minShare ?? 0.6
  const d: Diff = { added: [], changed: [], touched: [], returned: [], missing: [], refused: [], expired: [], skipped: [], suppressed: [] }
  const bySlug = new Map(stored.map((s) => [s.slug, s]))
  const seen = new Set<string>()

  for (const row of crawled) {
    seen.add(row.slug)
    const s = bySlug.get(row.slug)
    if (!s) {
      d.added.push(row)
      continue
    }
    if (s.category !== row.category) {
      d.skipped.push({ slug: row.slug, reason: `slug belongs to a ${s.category}` })
      continue
    }
    if (s.status === 'removed') {
      d.skipped.push({ slug: row.slug, reason: 'removed: never re-added by a crawl' })
      continue
    }
    const set: Change['set'] = {}
    const before: Change['before'] = {}
    const fields: CrawledField[] = []
    for (const f of CRAWLED_FIELDS) {
      // A field the table does not hold yet (source_url before the migration) is not a change.
      if (!(f in s)) continue
      const next = row[f]
      if (!same(s[f], next)) {
        set[f] = next
        before[f] = s[f]
        fields.push(f)
      }
    }
    if (row.fetched_at && (!s.fetched_at || row.fetched_at > s.fetched_at)) set.fetched_at = row.fetched_at
    if (s.missing_since) {
      set.missing_since = null
      d.returned.push(row.slug)
    }
    const change: Change = { id: s.id, slug: row.slug, fields, set, before, claimed: !!s.claimed_at }
    if (fields.length || s.missing_since) d.changed.push(change)
    else if (set.fetched_at) d.touched.push(change)
  }

  // Per firm: how much of what is stored did this crawl find?
  const storedAt = new Map<string, number>()
  const foundAt = new Map<string, number>()
  for (const s of stored) {
    if (!opt.categories.has(s.category) || !opt.firms.has(s.firm_domain) || s.status === 'removed') continue
    storedAt.set(s.firm_domain, (storedAt.get(s.firm_domain) ?? 0) + 1)
    if (seen.has(s.slug)) foundAt.set(s.firm_domain, (foundAt.get(s.firm_domain) ?? 0) + 1)
  }
  const suppressed = new Set<string>()
  for (const [firm, n] of storedAt) {
    const found = foundAt.get(firm) ?? 0
    if (n >= 3 && found / n < minShare) {
      suppressed.add(firm)
      d.suppressed.push({ firm_domain: firm, crawled: found, stored: n })
    }
  }

  for (const s of stored) {
    if (!opt.categories.has(s.category) || !opt.firms.has(s.firm_domain) || s.status === 'removed' || seen.has(s.slug)) continue
    if (opt.refused?.has(s.slug)) {
      d.refused.push(s)
      continue
    }
    if (s.missing_since) {
      if (daysBetween(s.missing_since, opt.today) > MISSING_GRACE_DAYS) d.expired.push(s)
      continue
    }
    if (!suppressed.has(s.firm_domain)) d.missing.push(s)
  }
  return d
}

/** Assert a write names only crawled fields: the guard every apply runs before it writes. */
export function assertCrawledOnly(set: Record<string, unknown>): void {
  const allowed = new Set<string>([...CRAWLED_FIELDS, 'fetched_at', 'missing_since'])
  for (const k of Object.keys(set)) if (!allowed.has(k)) throw new Error(`refresh would write "${k}", which is not a crawled field`)
}

/** File-to-file comparison (a re-crawl against the published file): by slug, field by field. */
export function compareFiles(oldRows: DirectoryRow[], newRows: DirectoryRow[]) {
  const o = new Map(oldRows.map((r) => [r.slug, r]))
  const n = new Map(newRows.map((r) => [r.slug, r]))
  const onlyOld = oldRows.filter((r) => !n.has(r.slug))
  const onlyNew = newRows.filter((r) => !o.has(r.slug))
  const fieldChanges: Record<string, { slug: string; before: unknown; after: unknown }[]> = {}
  for (const [slug, a] of o) {
    const b = n.get(slug)
    if (!b) continue
    for (const f of ['full_name', 'title', 'firm_name', 'offices', 'practice_areas', 'client_focus', 'represents', 'education', 'bio_url'] as const) {
      if (!same(a[f], b[f])) (fieldChanges[f] ??= []).push({ slug, before: a[f], after: b[f] })
    }
  }
  return { onlyOld, onlyNew, both: [...o.keys()].filter((k) => n.has(k)).length, fieldChanges }
}
