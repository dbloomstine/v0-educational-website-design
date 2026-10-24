/**
 * The source registry (table directory_sources; seed in
 * scripts/directory/crawl/sources.seed.json). A row is checked before a crawl
 * uses it: a bad pattern or a missing slug suffix stops that source, never
 * the run.
 */
import { isCategoryId } from '../taxonomy'
import type { SourceMethod, SourceRow, SourceStatus } from './types'

const METHODS: SourceMethod[] = ['sitemap', 'listing', 'json', 'headless']
const STATUSES: SourceStatus[] = ['ok', 'blocked', 'empty', 'error']

export type ParsedSource = { ok: true; value: SourceRow } | { ok: false; key: string; error: string }

export function parseSource(raw: unknown): ParsedSource {
  const r = (raw ?? {}) as Record<string, unknown>
  const key = typeof r.key === 'string' ? r.key : '(no key)'
  const bad = (error: string): ParsedSource => ({ ok: false, key, error })
  if (!/^[a-z0-9][a-z0-9_-]{0,60}$/.test(key)) return bad('key must be lower-case letters, digits, - or _')
  if (typeof r.firm_name !== 'string' || !r.firm_name.trim()) return bad('no firm_name')
  if (typeof r.firm_domain !== 'string' || !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(r.firm_domain)) return bad(`bad firm_domain ${JSON.stringify(r.firm_domain)}`)
  if (!isCategoryId(r.category)) return bad(`bad category ${JSON.stringify(r.category)}`)
  if (!METHODS.includes(r.method as SourceMethod)) return bad(`bad method ${JSON.stringify(r.method)}`)
  if (!STATUSES.includes(r.status as SourceStatus)) return bad(`bad status ${JSON.stringify(r.status)}`)
  const sel = (r.selectors ?? {}) as SourceRow['selectors']
  if (typeof sel.slug_suffix !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(sel.slug_suffix)) return bad('selectors.slug_suffix missing or not a slug')
  for (const [name, re] of [['person_url_pattern', r.person_url_pattern], ['exclude_pattern', sel.exclude_pattern], ['json.slug_regex', sel.json?.slug_regex], ['text_filter.line', sel.text_filter?.line]] as const) {
    if (re == null) continue
    try {
      new RegExp(re as string)
    } catch {
      return bad(`${name} is not a valid regex`)
    }
  }
  if (sel.categories) for (const c of sel.categories) if (!isCategoryId(c)) return bad(`selectors.categories has ${c}`)
  if (r.listing_url != null) {
    try {
      new URL(r.listing_url as string)
    } catch {
      return bad('listing_url is not a URL')
    }
  }
  return {
    ok: true,
    value: {
      id: typeof r.id === 'string' ? r.id : undefined,
      key,
      firm_name: r.firm_name.trim(),
      firm_domain: r.firm_domain,
      category: r.category,
      listing_url: (r.listing_url as string | null) ?? null,
      method: r.method as SourceMethod,
      person_url_pattern: (r.person_url_pattern as string | null) ?? null,
      selectors: sel,
      robots_ok: typeof r.robots_ok === 'boolean' ? r.robots_ok : null,
      status: r.status as SourceStatus,
      last_run_at: (r.last_run_at as string | null) ?? null,
      last_counts: (r.last_counts as Record<string, number> | null) ?? null,
      notes: (r.notes as string | null) ?? null,
      source: r.source === 'event_speaker' || r.source === 'press_release' ? r.source : 'firm_site',
    },
  }
}

/** Sources a run may use: status ok (or empty, re-tried), and not headless in CI. */
export function runnable(s: SourceRow, opt: { ci: boolean; retryEmpty?: boolean }): { run: boolean; why?: string } {
  if (s.status === 'blocked') return { run: false, why: 'blocked: never bypassed' }
  if (s.status === 'empty' && !opt.retryEmpty) return { run: false, why: 'empty last time (use --retry-empty)' }
  if (opt.ci && (s.method === 'headless' || s.selectors.render_bios || s.selectors.listings?.some((l) => l.render))) return { run: false, why: 'headless: local monthly run' }
  return { run: true }
}
