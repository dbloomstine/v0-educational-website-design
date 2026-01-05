'use client'

import { FAQBase, type FAQItem } from '@/components/tools/shared'

/**
 * FAQ data for Subscription Credit Line Calculator
 */
export const SUBSCRIPTION_LINE_FAQS: FAQItem[] = [
  {
    id: 'scl-1',
    question: 'What is a subscription credit line and why do funds use them?',
    answer: 'A subscription credit line (also called a capital call facility) is a revolving loan secured by LP capital commitments. Funds use them for operational flexibility: bridging time between investment decisions and capital calls, reducing the number of capital calls to LPs, providing liquidity for time-sensitive opportunities, and smoothing the J-curve. They\'ve become standard for PE, VC, and credit funds.'
  },
  {
    id: 'scl-2',
    question: 'How does a subscription line impact IRR?',
    answer: 'Subscription lines can significantly boost reported IRR by delaying when LP capital is called. Since IRR is time-weighted, starting the "clock" later on LP investments mechanically increases returns. A 15% gross IRR might show as 20%+ with aggressive line usage. This is why ILPA recommends reporting both levered and unlevered returns.'
  },
  {
    id: 'scl-3',
    question: 'Why doesn\'t MOIC change with subscription line usage?',
    answer: 'MOIC (Multiple on Invested Capital) measures total value returned divided by total capital invested. It doesn\'t factor in timing, so the subscription line\'s delay of capital calls has no impact. A 2.0x MOIC remains 2.0x regardless of subscription line usage. This makes MOIC a useful complement to IRR for evaluating true performance.'
  },
  {
    id: 'scl-4',
    question: 'What are ILPA\'s recommendations on subscription lines?',
    answer: 'ILPA recommends: (1) reporting IRR both with and without the subscription line effect, (2) disclosing line terms and usage in quarterly reports, (3) limiting line usage to bridging purposes rather than long-term leverage, (4) providing transparency on costs (interest, fees), and (5) establishing clear policies in the LPA about line usage.'
  },
  {
    id: 'scl-5',
    question: 'What are typical subscription line terms?',
    answer: 'Common terms include: advance rates of 65-90% of qualified LP commitments, commitment fees of 25-75 bps annually, interest at SOFR plus 150-250 bps, facility sizes of 15-25% of fund commitments, and 2-3 year tenors. Larger funds with higher-quality LP bases typically get better terms.'
  },
  {
    id: 'scl-6',
    question: 'How does LP creditworthiness affect the facility?',
    answer: 'Lenders evaluate each LP\'s creditworthiness to determine the "borrowing base." High-quality LPs (pension funds, sovereign wealth funds, endowments) may qualify for 90%+ advance rates, while lower-rated LPs may only qualify at 65% or be excluded entirely. This is why large funds with institutional LPs get the best terms.'
  },
  {
    id: 'scl-7',
    question: 'What is the difference between bridging and long-duration usage?',
    answer: 'Bridging (or short-term) usage involves drawing the line to fund investments then repaying within 30-180 days through capital calls. This is generally accepted practice. Long-duration usage (6+ months without repayment) is more controversial, as it has a larger IRR impact and can mask true performance. Many LPs now scrutinize extended line usage.'
  },
  {
    id: 'scl-8',
    question: 'Should we report returns with and without the subscription line?',
    answer: 'Yes. Best practice (per ILPA) is to report both "levered" returns (actual) and "unlevered" or "LP-level" returns (as if capital had been called without the line). This gives LPs a complete picture and demonstrates transparency. Some sophisticated LPs now require this disclosure.'
  },
  {
    id: 'scl-9',
    question: 'What happens if an LP defaults on a capital call backing the line?',
    answer: 'This is a key risk for subscription lines. Lenders typically exclude LPs who default from the borrowing base and may reduce availability. The fund must either reduce the outstanding balance or provide additional collateral. Fund documents usually include consequences for LP defaults (forced sale at discount, loss of committee rights, etc.).'
  },
  {
    id: 'scl-10',
    question: 'How should subscription line interest be allocated among LPs?',
    answer: 'Interest expense is typically allocated based on whose capital was effectively bridged. Some funds allocate pro-rata to all LPs; others allocate to specific deals or time periods. The methodology should be disclosed to LPs and applied consistently. Large institutional LPs often negotiate specific allocation terms in side letters.'
  },
  {
    id: 'scl-11',
    question: 'What is a "clean-down" provision?',
    answer: 'A clean-down requires the borrower to fully repay (bring to zero) the outstanding balance for a specified period each year (typically 30-90 days). This prevents the line from becoming permanent leverage and ensures it\'s being used for bridging rather than ongoing funding. Most lenders require this.'
  },
  {
    id: 'scl-12',
    question: 'When in the fund lifecycle are subscription lines most useful?',
    answer: 'Lines are most valuable during the investment period when deals are being made. They provide flexibility for competitive situations, allow efficient capital call management, and smooth out the J-curve. After the investment period, lines are less commonly used since there are fewer new investments requiring bridge financing.'
  }
]

export function FAQSection() {
  return (
    <FAQBase
      items={SUBSCRIPTION_LINE_FAQS}
      title="Frequently Asked Questions"
      collapsible
      defaultCollapsed
      iconVariant="plus-minus"
    />
  )
}
