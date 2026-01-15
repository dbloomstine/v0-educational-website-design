'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, ChevronRight, BookOpen, HelpCircle } from 'lucide-react'

// Glossary terms for Subscription Credit Line
const GLOSSARY_TERMS = [
  {
    term: 'Subscription Credit Line (SCL)',
    definition:
      "A revolving credit facility secured by the uncalled capital commitments of limited partners. Also known as a capital call facility or subscription line facility."
  },
  {
    term: 'Uncalled Capital',
    definition:
      'The portion of LP commitments that has not yet been called by the GP. This serves as collateral for the subscription line.'
  },
  {
    term: 'Internal Rate of Return (IRR)',
    definition:
      'The annualized effective compounded return rate that makes the net present value of all cash flows equal to zero. SCLs can significantly impact reported IRR.'
  },
  {
    term: 'Multiple on Invested Capital (MOIC)',
    definition:
      'Total value returned to investors divided by total capital invested. Unlike IRR, MOIC is unaffected by timing manipulation via subscription lines.'
  },
  {
    term: 'J-Curve',
    definition:
      'The typical pattern of fund returns over time, showing negative returns early (fees, investments at cost) followed by positive returns as investments mature. SCLs can smooth or mask the J-curve.'
  },
  {
    term: 'Capital Call',
    definition:
      "A demand by the GP for LPs to fund a portion of their committed capital, typically for investments, fees, or expenses."
  },
  {
    term: 'Borrowing Base',
    definition:
      'The maximum amount available to borrow under the facility, typically calculated as a percentage of qualified LP commitments.'
  },
  {
    term: 'Advance Rate',
    definition:
      'The percentage of uncalled capital that can be borrowed against. Typically 65-90% depending on LP credit quality.'
  },
  {
    term: 'ILPA Guidelines',
    definition:
      'Recommendations from the Institutional Limited Partners Association regarding best practices for subscription line usage, including disclosure requirements.'
  },
  {
    term: 'Commitment Period',
    definition:
      'The period during which the GP may make new investments using LP capital. SCLs are primarily used during this period.'
  },
  {
    term: 'Facility Fee',
    definition:
      'An ongoing fee (typically 25-75 bps annually) paid to the lender for maintaining the credit facility, regardless of utilization.'
  },
  {
    term: 'Utilization Rate',
    definition:
      'The percentage of the available credit facility that is currently drawn. Higher utilization generally means higher interest costs.'
  },
  {
    term: 'Clean-Down Period',
    definition:
      'A requirement to fully repay (clean down) the facility for a specified period (typically 30-90 days) each year.'
  },
  {
    term: 'Investor-Level Reporting',
    definition:
      'Performance metrics calculated as if the subscription line did not exist, showing returns based on when capital calls would have occurred without the facility.'
  },
  {
    term: 'Bridge Financing',
    definition:
      'Short-term use of the subscription line to fund investments before capital is called from LPs, typically repaid within 30-180 days.'
  },
  {
    term: 'Long-Duration Borrowing',
    definition:
      'Extended use of the subscription line (often 6+ months) that can significantly enhance IRR but may be scrutinized by LPs.'
  }
]

// FAQ items
const FAQ_ITEMS = [
  {
    question: 'What is a subscription credit line and why do funds use them?',
    answer:
      "A subscription credit line (also called a capital call facility) is a revolving loan secured by LP capital commitments. Funds use them for operational flexibility: bridging time between investment decisions and capital calls, reducing the number of capital calls to LPs, providing liquidity for time-sensitive opportunities, and smoothing the J-curve. They've become standard for PE, VC, and credit funds."
  },
  {
    question: 'How does a subscription line impact IRR?',
    answer:
      "Subscription lines can significantly boost reported IRR by delaying when LP capital is called. Since IRR is time-weighted, starting the \"clock\" later on LP investments mechanically increases returns. A 15% gross IRR might show as 20%+ with aggressive line usage. This is why ILPA recommends reporting both levered and unlevered returns."
  },
  {
    question: "Why doesn't MOIC change with subscription line usage?",
    answer:
      "MOIC (Multiple on Invested Capital) measures total value returned divided by total capital invested. It doesn't factor in timing, so the subscription line's delay of capital calls has no impact. A 2.0x MOIC remains 2.0x regardless of subscription line usage. This makes MOIC a useful complement to IRR for evaluating true performance."
  },
  {
    question: "What are ILPA's recommendations on subscription lines?",
    answer:
      "ILPA recommends: (1) reporting IRR both with and without the subscription line effect, (2) disclosing line terms and usage in quarterly reports, (3) limiting line usage to bridging purposes rather than long-term leverage, (4) providing transparency on costs (interest, fees), and (5) establishing clear policies in the LPA about line usage."
  },
  {
    question: 'What are typical subscription line terms?',
    answer:
      'Common terms include: advance rates of 65-90% of qualified LP commitments, commitment fees of 25-75 bps annually, interest at SOFR plus 150-250 bps, facility sizes of 15-25% of fund commitments, and 2-3 year tenors. Larger funds with higher-quality LP bases typically get better terms.'
  },
  {
    question: 'How does LP creditworthiness affect the facility?',
    answer:
      "Lenders evaluate each LP's creditworthiness to determine the \"borrowing base.\" High-quality LPs (pension funds, sovereign wealth funds, endowments) may qualify for 90%+ advance rates, while lower-rated LPs may only qualify at 65% or be excluded entirely. This is why large funds with institutional LPs get the best terms."
  },
  {
    question: 'What is the difference between bridging and long-duration usage?',
    answer:
      'Bridging (or short-term) usage involves drawing the line to fund investments then repaying within 30-180 days through capital calls. This is generally accepted practice. Long-duration usage (6+ months without repayment) is more controversial, as it has a larger IRR impact and can mask true performance. Many LPs now scrutinize extended line usage.'
  },
  {
    question: 'Should we report returns with and without the subscription line?',
    answer:
      'Yes. Best practice (per ILPA) is to report both "levered" returns (actual) and "unlevered" or "LP-level" returns (as if capital had been called without the line). This gives LPs a complete picture and demonstrates transparency. Some sophisticated LPs now require this disclosure.'
  },
  {
    question: 'What happens if an LP defaults on a capital call backing the line?',
    answer:
      'This is a key risk for subscription lines. Lenders typically exclude LPs who default from the borrowing base and may reduce availability. The fund must either reduce the outstanding balance or provide additional collateral. Fund documents usually include consequences for LP defaults (forced sale at discount, loss of committee rights, etc.).'
  },
  {
    question: 'How should subscription line interest be allocated among LPs?',
    answer:
      "Interest expense is typically allocated based on whose capital was effectively bridged. Some funds allocate pro-rata to all LPs; others allocate to specific deals or time periods. The methodology should be disclosed to LPs and applied consistently. Large institutional LPs often negotiate specific allocation terms in side letters."
  },
  {
    question: 'What is a "clean-down" provision?',
    answer:
      "A clean-down requires the borrower to fully repay (bring to zero) the outstanding balance for a specified period each year (typically 30-90 days). This prevents the line from becoming permanent leverage and ensures it's being used for bridging rather than ongoing funding. Most lenders require this."
  },
  {
    question: 'When in the fund lifecycle are subscription lines most useful?',
    answer:
      'Lines are most valuable during the investment period when deals are being made. They provide flexibility for competitive situations, allow efficient capital call management, and smooth out the J-curve. After the investment period, lines are less commonly used since there are fewer new investments requiring bridge financing.'
  }
]

// Collapsible glossary term
function GlossaryTerm({ term, definition }: { term: string; definition: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-3 text-left hover:bg-accent/30 px-2 rounded"
      >
        <span className="font-medium">{term}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className="pb-3 px-2 text-sm text-muted-foreground">{definition}</div>}
    </div>
  )
}

// Collapsible FAQ item
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-3 text-left hover:bg-accent/30 px-2 rounded"
      >
        <span className="font-medium">{question}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className="pb-3 px-2 text-sm text-muted-foreground">{answer}</div>}
    </div>
  )
}

export function LearnTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Glossary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" />
            Glossary
          </CardTitle>
          <CardDescription>Key terms for understanding subscription credit lines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {GLOSSARY_TERMS.map((item) => (
              <GlossaryTerm key={item.term} term={item.term} definition={item.definition} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="h-5 w-5" />
            FAQ
          </CardTitle>
          <CardDescription>Common questions about subscription credit lines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {FAQ_ITEMS.map((item) => (
              <FAQItem key={item.question} question={item.question} answer={item.answer} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
