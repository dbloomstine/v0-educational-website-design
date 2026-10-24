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
  /**
   * How a practice page is named: 'adj' gives "Venture Fund Lawyers" (the
   * practice's adjective before the trade); 'for' gives "Placement Agents for
   * Venture Funds" (the plural, then the practice's noun), for trades where
   * "Venture Fund Placement Agents" is not what anyone types.
   */
  topicStyle: 'adj' | 'for'
  /** The practice areas that make sense for the trade, in menu order: its filter, its edit form, its landing pages. */
  practices: PracticeId[]
  /** GP counsel / LP counsel pages: a lawyer's distinction only. */
  sides: boolean
  /** The heading over a profile's bar admissions or licences. */
  credentialLabel: string
  /** The hub's one-line description. */
  intro: string
  /** The search box's example ("e.g. Smith, Kirkland, Boston"). */
  searchHint: string
  /** Short firm name for the "nobody matches" hint ("Kirkland", not "Kirkland & Ellis LLP"). */
  firmHint: [string, string]
  /** Built and switched on (2026-10-24 night: all five, Danny). */
  live: boolean
}

/** Strategies every trade works on: the fund types. */
const STRATEGIES: PracticeId[] = ['venture_funds', 'private_credit_funds', 'real_estate_funds', 'infrastructure_funds', 'hedge_funds', 'secondaries']

export const CATEGORIES: Record<CategoryId, Category> = {
  fund_lawyer: {
    id: 'fund_lawyer',
    slug: 'fund-lawyers',
    plural: 'Fund Lawyers',
    singular: 'Fund Lawyer',
    trade: 'Lawyers',
    topicStyle: 'adj',
    practices: ['fund_formation', ...STRATEGIES, 'fund_finance', 'funds_regulatory', 'tax_funds'],
    sides: true,
    credentialLabel: 'Admitted',
    intro: 'US lawyers who form, finance and advise private funds, each profile drawn from the firm’s own public bio page.',
    searchHint: 'e.g. Smith, Kirkland, Boston',
    firmHint: ['Kirkland', 'Kirkland & Ellis LLP'],
    live: true,
  },
  fund_auditor: {
    id: 'fund_auditor',
    slug: 'fund-auditors',
    plural: 'Fund Auditors',
    singular: 'Fund Auditor',
    trade: 'Auditors',
    topicStyle: 'adj',
    practices: [...STRATEGIES, 'funds_regulatory'],
    sides: false,
    credentialLabel: 'Licensed',
    intro: 'US audit partners and directors with a private funds practice, each profile drawn from the firm’s own public bio page.',
    searchHint: 'e.g. Smith, Deloitte, Chicago',
    firmHint: ['Deloitte', 'Deloitte & Touche LLP'],
    live: true,
  },
  placement_agent: {
    id: 'placement_agent',
    slug: 'placement-agents',
    plural: 'Placement Agents',
    singular: 'Placement Agent',
    trade: 'Placement Agents',
    topicStyle: 'for',
    practices: [...STRATEGIES],
    sides: false,
    credentialLabel: 'Registrations',
    intro: 'US placement agents who raise capital for private funds, each profile drawn from the firm’s own public bio page.',
    searchHint: 'e.g. Smith, Evercore, New York',
    firmHint: ['Evercore', 'Evercore Group L.L.C.'],
    live: true,
  },
  fund_finance_banker: {
    id: 'fund_finance_banker',
    slug: 'fund-finance-bankers',
    plural: 'Fund Finance Bankers',
    singular: 'Fund Finance Banker',
    trade: 'Bankers',
    topicStyle: 'for',
    practices: ['subscription_lines', 'nav_lending', 'gp_financing', ...STRATEGIES],
    sides: false,
    credentialLabel: 'Licenses',
    intro: 'US bankers who lend to private funds and their managers (subscription lines, NAV loans, GP financing), each profile drawn from the firm’s own public bio page.',
    searchHint: 'e.g. Smith, Wells Fargo, Charlotte',
    firmHint: ['Wells Fargo', 'Wells Fargo Bank, N.A.'],
    live: true,
  },
  fund_tax_advisor: {
    id: 'fund_tax_advisor',
    slug: 'fund-tax-advisors',
    plural: 'Fund Tax Advisors',
    singular: 'Fund Tax Advisor',
    trade: 'Tax Advisors',
    topicStyle: 'adj',
    practices: ['fund_formation', ...STRATEGIES],
    sides: false,
    credentialLabel: 'Licensed',
    intro: 'US tax partners and principals who advise private funds and their managers, each profile drawn from the firm’s own public bio page.',
    searchHint: 'e.g. Smith, KPMG, New York',
    firmHint: ['KPMG', 'KPMG LLP'],
    live: true,
  },
}

/** Directory order: the index page, the menu, the footer and the sitemap list the trades this way. */
export const CATEGORY_IDS: CategoryId[] = ['fund_lawyer', 'fund_auditor', 'fund_tax_advisor', 'placement_agent', 'fund_finance_banker']

export const LIVE_CATEGORIES: Category[] = CATEGORY_IDS.map((id) => CATEGORIES[id]).filter((c) => c.live)

export const isCategoryId = (v: unknown): v is CategoryId => typeof v === 'string' && v in CATEGORIES

export const categoryBySlug = (slug: string): Category | null => Object.values(CATEGORIES).find((c) => c.slug === slug) ?? null

/** The directory's index page. */
export const DIRECTORY_PATH = '/directory'

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
  | 'subscription_lines'
  | 'nav_lending'
  | 'gp_financing'
  | 'other'

export interface Practice {
  id: PracticeId
  /** The chip: "Venture funds". */
  label: string
  /** Its landing page, or null for none ("other"). */
  slug: string | null
  /** The landing page's words before the trade: "Venture Fund" → "Venture Fund Lawyers". */
  adj: string
  /** After "for", in a 'for'-style trade: "Placement Agents for Venture Funds". */
  noun: string
  /** In a sentence: "list venture fund work". */
  work: string
}

export const PRACTICES: Practice[] = [
  { id: 'fund_formation', label: 'Fund formation', slug: 'fund-formation', adj: 'Fund Formation', noun: 'Fund Formation', work: 'fund formation' },
  { id: 'venture_funds', label: 'Venture funds', slug: 'venture-funds', adj: 'Venture Fund', noun: 'Venture Funds', work: 'venture fund' },
  { id: 'private_credit_funds', label: 'Private credit funds', slug: 'private-credit-funds', adj: 'Private Credit Fund', noun: 'Private Credit Funds', work: 'private credit fund' },
  { id: 'real_estate_funds', label: 'Real estate funds', slug: 'real-estate-funds', adj: 'Real Estate Fund', noun: 'Real Estate Funds', work: 'real estate fund' },
  { id: 'infrastructure_funds', label: 'Infrastructure funds', slug: 'infrastructure-funds', adj: 'Infrastructure Fund', noun: 'Infrastructure Funds', work: 'infrastructure fund' },
  { id: 'hedge_funds', label: 'Hedge funds', slug: 'hedge-funds', adj: 'Hedge Fund', noun: 'Hedge Funds', work: 'hedge fund' },
  { id: 'secondaries', label: 'Secondaries', slug: 'secondaries', adj: 'Secondaries', noun: 'Secondaries', work: 'secondaries' },
  { id: 'fund_finance', label: 'Fund finance', slug: 'fund-finance', adj: 'Fund Finance', noun: 'Fund Finance', work: 'fund finance' },
  { id: 'funds_regulatory', label: 'Funds regulatory', slug: 'funds-regulatory', adj: 'Funds Regulatory', noun: 'Funds Regulatory Work', work: 'funds regulatory' },
  { id: 'tax_funds', label: 'Fund tax', slug: 'fund-tax', adj: 'Fund Tax', noun: 'Fund Tax', work: 'fund tax' },
  // Fund finance's own products (2026-10-24 night): a banker's pages split subscription lines from NAV lending.
  { id: 'subscription_lines', label: 'Subscription lines', slug: 'subscription-lines', adj: 'Subscription Line', noun: 'Subscription Lines', work: 'subscription line' },
  { id: 'nav_lending', label: 'NAV lending', slug: 'nav-lending', adj: 'NAV Lending', noun: 'NAV Lending', work: 'NAV lending' },
  { id: 'gp_financing', label: 'GP financing', slug: 'gp-financing', adj: 'GP Financing', noun: 'GP Financing', work: 'GP financing' },
  { id: 'other', label: 'Other', slug: null, adj: '', noun: '', work: '' },
]

export const PRACTICE_BY_ID = new Map(PRACTICES.map((p) => [p.id, p]))
export const isPracticeId = (v: unknown): v is PracticeId => typeof v === 'string' && PRACTICE_BY_ID.has(v as PracticeId)
export const practiceLabel = (id: string) => PRACTICE_BY_ID.get(id as PracticeId)?.label ?? id

/** A practice in a sentence, lower case but for its acronyms: "NAV lending", "venture funds". */
export const practiceLower = (id: string) =>
  practiceLabel(id)
    .split(' ')
    .map((w) => (/^[A-Z]{2,}$/.test(w) ? w : w.toLowerCase()))
    .join(' ')

/** A trade's practice areas, in its own order (its filter, its edit form, its landing pages). */
export const practicesFor = (c: Category): Practice[] => c.practices.flatMap((id) => PRACTICE_BY_ID.get(id) ?? [])

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
