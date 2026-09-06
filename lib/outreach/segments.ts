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
export interface LookalikeSegment {
  key: string
  /** Short noun phrase used in the run summary, e.g. "fund lawyers". */
  label: string
  /** Apollo `person_titles`. Matching is case-insensitive substring. */
  titles: string[]
  /** Apollo `q_keywords` (free text across person + organization). */
  keywords: string
  /** Optional Apollo `organization_num_employees_ranges`, e.g. "1,10". */
  employeeRanges?: string[]
}

export const LOOKALIKE_SEGMENTS: LookalikeSegment[] = [
  {
    key: 'fund_lawyers',
    label: 'fund lawyers',
    titles: ['Partner', 'Counsel', 'Of Counsel'],
    keywords: 'private funds investment funds fund formation law firm',
  },
  {
    key: 'fund_finance_banking',
    label: 'fund-finance and private-markets bankers',
    titles: ['Managing Director', 'Director', 'Vice President', 'Relationship Manager'],
    keywords: 'fund finance subscription line NAV lending private equity banking',
  },
  {
    key: 'fund_auditors',
    label: 'audit and tax partners serving funds',
    titles: ['Audit Partner', 'Assurance Partner', 'Tax Partner', 'Partner', 'Principal', 'Managing Director'],
    keywords: 'audit assurance tax private equity venture capital funds accounting firm',
  },
  {
    key: 'fund_software',
    label: 'people at private-markets software companies',
    titles: ['Head of Sales', 'VP Sales', 'Account Executive', 'Head of Business Development', 'Head of Marketing', 'Chief Revenue Officer', 'Head of Partnerships'],
    keywords: 'private markets software portfolio monitoring investor portal fund software',
  },
  {
    key: 'placement_agents',
    label: 'placement agents and capital-raising advisers',
    titles: ['Managing Director', 'Partner', 'Director', 'Principal', 'Vice President'],
    keywords: 'placement agent fund placement capital raising private equity',
  },
  {
    key: 'fund_insurance',
    label: 'insurance brokers serving fund managers',
    titles: ['Managing Director', 'Senior Vice President', 'Vice President', 'Partner', 'Broker', 'Practice Leader'],
    keywords: 'insurance broker private equity management liability GPL transaction liability',
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

/** Title must contain one of the segment's titles (case-insensitive). */
export function titleMatchesSegment(title: string | null | undefined, seg: LookalikeSegment): boolean {
  if (!title) return false
  const t = title.toLowerCase()
  return seg.titles.some((s) => t.includes(s.toLowerCase()))
}
