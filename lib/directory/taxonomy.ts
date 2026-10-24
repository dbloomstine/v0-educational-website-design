/**
 * The directory's fixed vocabulary (2026-10-24, Danny: GO on phase 1, US only,
 * simple keyword names, menu label "Directory").
 *
 * Every list here is closed: a page, a filter or a landing-page address exists
 * only for a value named here. That is what keeps the routes unambiguous and
 * the generated pages from multiplying past what the data supports.
 */

// ── The flag ────────────────────────────────────────────────────────────────

/**
 * DIRECTORY_ENABLED, default off. Off: the menu links are gone and every
 * directory route answers 404. next.config.mjs inlines it into the browser
 * bundle too (the header is a client component), so turning it on or off is
 * an env change plus a redeploy.
 */
export function directoryEnabled(): boolean {
  const v = (process.env.DIRECTORY_ENABLED ?? '').trim().toLowerCase()
  return v === 'true' || v === '1' || v === 'on' || v === 'yes'
}

// ── Categories ──────────────────────────────────────────────────────────────

export type CategoryId = 'fund_lawyer' | 'fund_auditor' | 'placement_agent' | 'fund_finance_banker' | 'fund_tax_advisor'

export interface Category {
  id: CategoryId
  /** The hub's address: /fund-lawyers. */
  slug: string
  /** "Fund Lawyers": the H1 and the menu entry. */
  plural: string
  /** "Fund Lawyer": in a profile's title. */
  singular: string
  /** The trade's own word, for a strategy page: "Venture Fund" + " Lawyers". */
  trade: string
  /** Built and switched on. Only fund lawyers in phase 1. */
  live: boolean
}

export const CATEGORIES: Record<CategoryId, Category> = {
  fund_lawyer: { id: 'fund_lawyer', slug: 'fund-lawyers', plural: 'Fund Lawyers', singular: 'Fund Lawyer', trade: 'Lawyers', live: true },
  fund_auditor: { id: 'fund_auditor', slug: 'fund-auditors', plural: 'Fund Auditors', singular: 'Fund Auditor', trade: 'Auditors', live: false },
  placement_agent: { id: 'placement_agent', slug: 'placement-agents', plural: 'Placement Agents', singular: 'Placement Agent', trade: 'Placement Agents', live: false },
  fund_finance_banker: { id: 'fund_finance_banker', slug: 'fund-finance-bankers', plural: 'Fund Finance Bankers', singular: 'Fund Finance Banker', trade: 'Bankers', live: false },
  fund_tax_advisor: { id: 'fund_tax_advisor', slug: 'fund-tax-advisors', plural: 'Fund Tax Advisors', singular: 'Fund Tax Advisor', trade: 'Tax Advisors', live: false },
}

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[]

/** "fund lawyers", "fund lawyer": the words in a sentence. */
export const lowerNoun = (c: Category, n: number) => (n === 1 ? c.singular : c.plural).toLowerCase()

// ── Practice areas (strategies) ─────────────────────────────────────────────

export type PracticeId =
  | 'fund_formation'
  | 'fund_finance'
  | 'funds_regulatory'
  | 'secondaries'
  | 'private_credit_funds'
  | 'hedge_funds'
  | 'real_estate_funds'
  | 'venture_funds'
  | 'infrastructure_funds'
  | 'tax_funds'
  | 'other'

export interface Practice {
  id: PracticeId
  /** The chip: "Venture funds". */
  label: string
  /** Its landing page, or null for none ("other"). */
  slug: string | null
  /** The landing page's words before the trade: "Venture Fund" → "Venture Fund Lawyers". */
  adj: string
}

export const PRACTICES: Practice[] = [
  { id: 'fund_formation', label: 'Fund formation', slug: 'fund-formation', adj: 'Fund Formation' },
  { id: 'venture_funds', label: 'Venture funds', slug: 'venture-funds', adj: 'Venture Fund' },
  { id: 'private_credit_funds', label: 'Private credit funds', slug: 'private-credit-funds', adj: 'Private Credit Fund' },
  { id: 'real_estate_funds', label: 'Real estate funds', slug: 'real-estate-funds', adj: 'Real Estate Fund' },
  { id: 'infrastructure_funds', label: 'Infrastructure funds', slug: 'infrastructure-funds', adj: 'Infrastructure Fund' },
  { id: 'hedge_funds', label: 'Hedge funds', slug: 'hedge-funds', adj: 'Hedge Fund' },
  { id: 'secondaries', label: 'Secondaries', slug: 'secondaries', adj: 'Secondaries' },
  { id: 'fund_finance', label: 'Fund finance', slug: 'fund-finance', adj: 'Fund Finance' },
  { id: 'funds_regulatory', label: 'Funds regulatory', slug: 'funds-regulatory', adj: 'Funds Regulatory' },
  { id: 'tax_funds', label: 'Fund tax', slug: 'fund-tax', adj: 'Fund Tax' },
  { id: 'other', label: 'Other', slug: null, adj: '' },
]

export const PRACTICE_BY_ID = new Map(PRACTICES.map((p) => [p.id, p]))
export const isPracticeId = (v: unknown): v is PracticeId => typeof v === 'string' && PRACTICE_BY_ID.has(v as PracticeId)
export const practiceLabel = (id: string) => PRACTICE_BY_ID.get(id as PracticeId)?.label ?? id

// ── Client focus (stage) and the side they act for ──────────────────────────

export type ClientFocusId = 'emerging_managers' | 'first_time_funds' | 'mid_market_sponsors' | 'large_sponsors' | 'family_offices'

export const CLIENT_FOCUS: { id: ClientFocusId; slug: string; label: string }[] = [
  { id: 'emerging_managers', slug: 'emerging-managers', label: 'Emerging Managers' },
  { id: 'first_time_funds', slug: 'first-time-funds', label: 'First-Time Funds' },
  { id: 'mid_market_sponsors', slug: 'mid-market-sponsors', label: 'Mid-Market Sponsors' },
  { id: 'large_sponsors', slug: 'large-sponsors', label: 'Large Sponsors' },
  { id: 'family_offices', slug: 'family-offices', label: 'Family Offices' },
]
export const isClientFocusId = (v: unknown): v is ClientFocusId => CLIENT_FOCUS.some((c) => c.id === v)

export type RepresentsId = 'sponsors_gps' | 'investors_lps'

export const REPRESENTS: { id: RepresentsId; slug: string; label: string }[] = [
  { id: 'sponsors_gps', slug: 'gp-counsel', label: 'GPs and Sponsors' },
  { id: 'investors_lps', slug: 'lp-counsel', label: 'LPs and Investors' },
]
export const isRepresentsId = (v: unknown): v is RepresentsId => REPRESENTS.some((r) => r.id === v)

/** Words that can never be a landing page, a person or a place: the routes the directory owns. */
export const RESERVED_SLUGS = new Set(['people', 'claim', 'edit', 'request', 'search', 'page', 'all', 'about'])
