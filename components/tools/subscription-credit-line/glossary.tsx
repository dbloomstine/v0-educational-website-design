'use client'

import { GlossaryBase, type GlossaryTerm } from '@/components/tools/shared'

/**
 * Glossary terms for Subscription Credit Line Calculator
 */
export const SUBSCRIPTION_LINE_GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'Subscription Credit Line (SCL)',
    definition: 'A revolving credit facility secured by the uncalled capital commitments of limited partners. Also known as a capital call facility or subscription line facility.'
  },
  {
    term: 'Uncalled Capital',
    definition: 'The portion of LP commitments that has not yet been called by the GP. This serves as collateral for the subscription line.'
  },
  {
    term: 'Internal Rate of Return (IRR)',
    definition: 'The annualized effective compounded return rate that makes the net present value of all cash flows equal to zero. SCLs can significantly impact reported IRR.'
  },
  {
    term: 'Multiple on Invested Capital (MOIC)',
    definition: 'Total value returned to investors divided by total capital invested. Unlike IRR, MOIC is unaffected by timing manipulation via subscription lines.'
  },
  {
    term: 'J-Curve',
    definition: 'The typical pattern of fund returns over time, showing negative returns early (fees, investments at cost) followed by positive returns as investments mature. SCLs can smooth or mask the J-curve.'
  },
  {
    term: 'Capital Call',
    definition: 'A demand by the GP for LPs to fund a portion of their committed capital, typically for investments, fees, or expenses.'
  },
  {
    term: 'Borrowing Base',
    definition: 'The maximum amount available to borrow under the facility, typically calculated as a percentage of qualified LP commitments.'
  },
  {
    term: 'Advance Rate',
    definition: 'The percentage of uncalled capital that can be borrowed against. Typically 65-90% depending on LP credit quality.'
  },
  {
    term: 'ILPA Guidelines',
    definition: 'Recommendations from the Institutional Limited Partners Association regarding best practices for subscription line usage, including disclosure requirements.'
  },
  {
    term: 'Commitment Period',
    definition: 'The period during which the GP may make new investments using LP capital. SCLs are primarily used during this period.'
  },
  {
    term: 'Facility Fee',
    definition: 'An ongoing fee (typically 25-75 bps annually) paid to the lender for maintaining the credit facility, regardless of utilization.'
  },
  {
    term: 'Utilization Rate',
    definition: 'The percentage of the available credit facility that is currently drawn. Higher utilization generally means higher interest costs.'
  },
  {
    term: 'Clean-Down Period',
    definition: 'A requirement to fully repay (clean down) the facility for a specified period (typically 30-90 days) each year.'
  },
  {
    term: 'Investor-Level Reporting',
    definition: 'Performance metrics calculated as if the subscription line did not exist, showing returns based on when capital calls would have occurred without the facility.'
  },
  {
    term: 'Bridge Financing',
    definition: 'Short-term use of the subscription line to fund investments before capital is called from LPs, typically repaid within 30-180 days.'
  },
  {
    term: 'Long-Duration Borrowing',
    definition: 'Extended use of the subscription line (often 6+ months) that can significantly enhance IRR but may be scrutinized by LPs.'
  }
]

export function GlossarySection() {
  return (
    <GlossaryBase
      terms={SUBSCRIPTION_LINE_GLOSSARY_TERMS}
      title="Glossary"
      subtitle="Key terms for understanding subscription credit lines and their impact on fund performance."
      collapsible
      defaultCollapsed
      sortAlphabetically={false}
      showSearch={false}
    />
  )
}
