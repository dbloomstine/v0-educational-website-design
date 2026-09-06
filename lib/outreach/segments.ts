/**
 * Lookalike targeting segments for FundOps Daily outreach.
 *
 * Derived from a month of Resend engagement (2026-08-09 → 2026-09-06,
 * 3,680 sends, 133 recipients): 83 subscribers open or click ≥40% of the
 * time, and by roughly two to one they are people who SELL TO funds —
 * fund lawyers, fund admins and accountants, fund-finance bankers, and
 * fund-software vendors — plus CFO/COO types at smaller managers. Firms
 * with several subscribers each (Maybern ×5, Ultimus ×3, Chronograph ×2)
 * show the forwarding behaviour we want. Mega-fund executives, which the
 * old article-driven mode targeted, are absent from the engaged set.
 *
 * Each segment maps to Apollo people-search parameters. One segment runs
 * per day, rotating, so a cap of 2/day spreads across all five in a week.
 */
export interface LookalikeSegment {
  key: string
  /** Short noun phrase used in copy, e.g. "fund lawyers". */
  label: string
  /** Sentence used in the email to establish peer relevance. */
  audienceLine: string
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
    audienceLine: 'A lot of readers are fund lawyers',
    titles: ['Partner', 'Counsel', 'Of Counsel'],
    keywords: 'private funds investment funds fund formation law firm',
  },
  {
    key: 'fund_admin_accounting',
    label: 'fund administration and fund accounting people',
    audienceLine: 'A lot of readers are in fund administration and fund accounting',
    titles: ['Partner', 'Managing Director', 'Director', 'Head of Business Development', 'Business Development'],
    keywords: 'fund administration fund accounting private equity audit',
  },
  {
    key: 'fund_finance_banking',
    label: 'fund-finance bankers',
    audienceLine: 'A lot of readers are in fund finance and private-markets banking',
    titles: ['Managing Director', 'Director', 'Vice President', 'Relationship Manager'],
    keywords: 'fund finance subscription line private equity banking',
  },
  {
    key: 'fund_software',
    label: 'people at private-markets software companies',
    audienceLine: 'A lot of readers are at private-markets software companies',
    titles: ['Head of Sales', 'VP Sales', 'Account Executive', 'Head of Business Development', 'Head of Marketing', 'Chief Revenue Officer'],
    keywords: 'private markets software fund administration software portfolio monitoring',
  },
  {
    key: 'emerging_gp_ops',
    label: 'CFOs and COOs at smaller and emerging managers',
    audienceLine: 'A lot of readers are CFOs and COOs at smaller and emerging managers',
    titles: ['Chief Financial Officer', 'CFO', 'Chief Operating Officer', 'COO', 'Controller', 'Head of Finance'],
    keywords: 'private equity venture capital fund',
    employeeRanges: ['1,10', '11,20', '21,50', '51,100', '101,200'],
  },
]

/** Day-of-year rotation so each segment gets a turn every five days. */
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
