/**
 * Lookalike targeting segments for FundOps Daily outreach.
 *
 * Derived from a month of Resend engagement (2026-08-09 → 2026-09-06,
 * 3,680 sends, 133 recipients): 83 subscribers open or click ≥40% of the
 * time, and by roughly two to one they are people who SELL TO funds.
 * Firms with several subscribers each (Maybern ×5, Ultimus ×3,
 * Chronograph ×2) show the forwarding behaviour we want.
 *
 * Scope rule (Danny, 2026-09-06): only invite REFERRAL PARTNERS that do
 * not compete with IQ-EQ. Fund administrators, fund accountants-for-hire,
 * and compliance / regulatory consultants are out, even though they read
 * the newsletter heavily. In: lawyers, bankers, auditors, tech vendors,
 * placement agents, insurance brokers. GP executives are the Lead Desk's
 * prospects, so they are out here too; the hashed suppression list is the
 * backstop, this is the front door.
 *
 * Each segment maps to Apollo people-search parameters. One segment runs
 * per day, rotating, so a cap of 2/day spreads across all six in a week.
 */
/**
 * One Apollo people-search call. Apollo ANDs every token of `keywords`
 * against the person + firm text, so keep it to a short, title-shaped
 * phrase ("fund finance", not "fund finance subscription line banking" —
 * the long form returns zero). `orgTags` narrows to firms Apollo has
 * tagged that way (OR across tags); it is how a "private funds" search
 * stays at law firms instead of in-house counsel at Ares.
 */
export interface SegmentQuery {
  keywords?: string
  orgTags?: string[]
}

export interface LookalikeSegment {
  key: string
  /** Short noun phrase used in the run summary, e.g. "fund lawyers". */
  label: string
  /** Apollo `person_titles`, also the post-match title screen (case-insensitive substring). */
  titles: string[]
  /** Free searches, run in order and unioned. Verified 2026-09-06 against the live index. */
  queries: SegmentQuery[]
  /**
   * Post-match screen on Apollo's `organization.industry` (lower-cased
   * substring, only applied when Apollo reports one). Keeps an
   * "alternative investments" accounting search from returning a wealth
   * manager, and a "private funds" search from returning a GP.
   */
  orgIndustries?: string[]
  /** Optional Apollo `organization_num_employees_ranges`, e.g. "1,10". */
  employeeRanges?: string[]
}

export const LOOKALIKE_SEGMENTS: LookalikeSegment[] = [
  {
    key: 'fund_lawyers',
    label: 'fund lawyers',
    titles: ['Partner', 'Counsel', 'Of Counsel'],
    queries: [
      { keywords: 'investment funds', orgTags: ['law firm', 'legal services'] },
      { keywords: 'private funds', orgTags: ['law firm', 'legal services'] },
      { keywords: 'fund formation', orgTags: ['law firm', 'legal services'] },
    ],
    orgIndustries: ['law practice', 'legal services'],
  },
  {
    key: 'fund_finance_banking',
    label: 'fund-finance and sponsor-coverage bankers',
    titles: ['Managing Director', 'Director', 'Senior Vice President', 'Vice President', 'Relationship Manager', 'Head of'],
    queries: [
      { keywords: 'fund finance', orgTags: ['banking', 'bank'] },
      { keywords: 'financial sponsors', orgTags: ['banking', 'investment banking'] },
      { keywords: 'fund banking', orgTags: ['banking', 'bank'] },
      { keywords: 'subscription finance' },
    ],
    orgIndustries: ['banking', 'financial services', 'investment banking', 'capital markets'],
  },
  {
    key: 'fund_auditors',
    label: 'audit and tax partners serving funds',
    titles: ['Audit Partner', 'Assurance Partner', 'Tax Partner', 'Partner', 'Principal', 'Managing Director'],
    queries: [
      { keywords: 'alternative investments', orgTags: ['accounting'] },
      { keywords: 'asset management tax', orgTags: ['accounting'] },
      { keywords: 'private equity audit', orgTags: ['accounting'] },
      { keywords: 'investment management', orgTags: ['accounting'] },
    ],
    orgIndustries: ['accounting'],
  },
  {
    key: 'fund_software',
    label: 'people at private-markets software companies',
    titles: ['Head of Sales', 'VP Sales', 'VP of Sales', 'Vice President of Sales', 'Vice President, Sales', 'Director of Sales', 'Account Executive', 'Head of Business Development', 'Head of Marketing', 'Chief Revenue Officer', 'Head of Partnerships', 'Head of Strategic Partnerships'],
    queries: [
      { orgTags: ['private equity software'] },
      { keywords: 'private markets', orgTags: ['software'] },
      { orgTags: ['investor reporting'] },
    ],
    orgIndustries: ['computer software', 'information technology', 'financial services', 'internet', 'software'],
  },
  {
    key: 'placement_agents',
    label: 'placement agents and capital-raising advisers',
    titles: ['Managing Director', 'Partner', 'Director', 'Principal', 'Vice President'],
    queries: [
      { orgTags: ['placement agent'] },
      { keywords: 'private capital advisory' },
      { keywords: 'fund placement' },
    ],
    orgIndustries: ['financial services', 'investment banking', 'capital markets', 'venture capital', 'private equity'],
  },
  {
    key: 'fund_insurance',
    label: 'insurance brokers serving fund managers',
    titles: ['Managing Director', 'Senior Vice President', 'Vice President', 'Partner', 'Broker', 'Practice Leader'],
    queries: [
      { keywords: 'private equity', orgTags: ['insurance', 'insurance brokerage'] },
      { keywords: 'management liability', orgTags: ['insurance', 'insurance brokerage'] },
      { keywords: 'transaction liability' },
      { keywords: 'financial institutions', orgTags: ['insurance brokerage'] },
    ],
    orgIndustries: ['insurance'],
  },
]

/**
 * IQ-EQ competitor screen. Applied to the person's title AND their
 * organization name, free of charge, before any Apollo credit is spent.
 * Deliberately broad: a missed lawyer costs nothing, an invite to a fund
 * administrator is a problem.
 */
export const COMPETITOR_TITLE_TERMS = [
  'fund administration', 'fund administrator', 'fund admin', 'fund services',
  'fund accounting', 'fund accountant', 'investor services',
  'compliance consult', 'regulatory consult', 'regulatory compliance',
  'corporate services', 'depositary', 'aifm',
]

export const COMPETITOR_ORG_PATTERNS: RegExp[] = [
  // direct fund-admin / corporate-services competitors
  /\biq[\s-]?eq\b/i, /\bss&c\b/i, /\bcitco\b/i, /\balter domus\b/i, /\bapex\b/i, /\bgen ii\b/i,
  /\bultimus\b/i, /\bjtc\b/i, /\baztec\b/i, /\bvistra\b/i, /\btmf group\b/i, /\bcsc\b/i,
  /\bsei\b/i, /\bnorthern trust\b/i, /\bstate street\b/i, /\bbny\b/i, /\bmufg investor/i,
  /\bstandish\b/i, /\bnav fund\b/i, /\bjuniper square\b/i, /\bcarta\b/i, /\bformidium\b/i,
  /\bopus fund\b/i, /\bsanne\b/i, /\bocorian\b/i, /\bzedra\b/i, /\bintertrust\b/i, /\bwaystone\b/i,
  /\bbolder\b/i, /\btrident\b/i, /\bharmonic fund\b/i, /\bpef services\b/i, /\bsocium\b/i,
  /\bpetra funds\b/i, /\bstrata fund\b/i, /\bgryphon fund\b/i, /\bkaufman rossin\b/i,
  // compliance / regulatory consulting competitors
  /\baca group\b/i, /\baca compliance\b/i, /\boptima partners\b/i, /\bcordium\b/i, /\bkroll\b/i,
  /\bduff & phelps\b/i, /\bic compliance\b/i, /\bcompliance solutions\b/i, /\bregulatory compliance\b/i,
  /\bfund administration\b/i, /\bfund services\b/i, /\bfund admin\b/i,
]

/** True when the title or firm name reads as an IQ-EQ competitor. */
export function isCompetitor(title: string | null | undefined, orgName: string | null | undefined): boolean {
  const t = (title ?? '').toLowerCase()
  if (COMPETITOR_TITLE_TERMS.some((term) => t.includes(term))) return true
  const o = orgName ?? ''
  return COMPETITOR_ORG_PATTERNS.some((re) => re.test(o))
}

/** Day-of-year rotation so each segment gets a turn every N days. */
export function segmentForDate(dateISO: string): LookalikeSegment {
  const d = new Date(dateISO + 'T12:00:00Z')
  const start = Date.UTC(d.getUTCFullYear(), 0, 0)
  const dayOfYear = Math.floor((d.getTime() - start) / 86_400_000)
  return LOOKALIKE_SEGMENTS[dayOfYear % LOOKALIKE_SEGMENTS.length]
}

export function segmentByKey(key: string): LookalikeSegment | undefined {
  return LOOKALIKE_SEGMENTS.find((s) => s.key === key)
}

/** Industry screen: pass when Apollo reports nothing, or when it matches. */
export function industryMatchesSegment(industry: string | null | undefined, seg: LookalikeSegment): boolean {
  if (!seg.orgIndustries?.length || !industry) return true
  const i = industry.toLowerCase()
  return seg.orgIndustries.some((x) => i.includes(x.toLowerCase()))
}

/** Title must contain one of the segment's titles (case-insensitive). */
export function titleMatchesSegment(title: string | null | undefined, seg: LookalikeSegment): boolean {
  if (!title) return false
  const t = title.toLowerCase()
  return seg.titles.some((s) => t.includes(s.toLowerCase()))
}
