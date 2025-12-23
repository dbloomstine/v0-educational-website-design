"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, HelpCircle, Plus, Minus } from 'lucide-react'

const faqs = [
  {
    question: 'What is a subscription credit line and why do funds use them?',
    answer: 'A subscription credit line (also called a capital call facility) is a revolving loan secured by LP capital commitments. Funds use them for operational flexibility: bridging time between investment decisions and capital calls, reducing the number of capital calls to LPs, providing liquidity for time-sensitive opportunities, and smoothing the J-curve. They\'ve become standard for PE, VC, and credit funds.'
  },
  {
    question: 'How does a subscription line impact IRR?',
    answer: 'Subscription lines can significantly boost reported IRR by delaying when LP capital is called. Since IRR is time-weighted, starting the "clock" later on LP investments mechanically increases returns. A 15% gross IRR might show as 20%+ with aggressive line usage. This is why ILPA recommends reporting both levered and unlevered returns.'
  },
  {
    question: 'Why doesn\'t MOIC change with subscription line usage?',
    answer: 'MOIC (Multiple on Invested Capital) measures total value returned divided by total capital invested. It doesn\'t factor in timing, so the subscription line\'s delay of capital calls has no impact. A 2.0x MOIC remains 2.0x regardless of subscription line usage. This makes MOIC a useful complement to IRR for evaluating true performance.'
  },
  {
    question: 'What are ILPA\'s recommendations on subscription lines?',
    answer: 'ILPA recommends: (1) reporting IRR both with and without the subscription line effect, (2) disclosing line terms and usage in quarterly reports, (3) limiting line usage to bridging purposes rather than long-term leverage, (4) providing transparency on costs (interest, fees), and (5) establishing clear policies in the LPA about line usage.'
  },
  {
    question: 'What are typical subscription line terms?',
    answer: 'Common terms include: advance rates of 65-90% of qualified LP commitments, commitment fees of 25-75 bps annually, interest at SOFR plus 150-250 bps, facility sizes of 15-25% of fund commitments, and 2-3 year tenors. Larger funds with higher-quality LP bases typically get better terms.'
  },
  {
    question: 'How does LP creditworthiness affect the facility?',
    answer: 'Lenders evaluate each LP\'s creditworthiness to determine the "borrowing base." High-quality LPs (pension funds, sovereign wealth funds, endowments) may qualify for 90%+ advance rates, while lower-rated LPs may only qualify at 65% or be excluded entirely. This is why large funds with institutional LPs get the best terms.'
  },
  {
    question: 'What is the difference between bridging and long-duration usage?',
    answer: 'Bridging (or short-term) usage involves drawing the line to fund investments then repaying within 30-180 days through capital calls. This is generally accepted practice. Long-duration usage (6+ months without repayment) is more controversial, as it has a larger IRR impact and can mask true performance. Many LPs now scrutinize extended line usage.'
  },
  {
    question: 'Should we report returns with and without the subscription line?',
    answer: 'Yes. Best practice (per ILPA) is to report both "levered" returns (actual) and "unlevered" or "LP-level" returns (as if capital had been called without the line). This gives LPs a complete picture and demonstrates transparency. Some sophisticated LPs now require this disclosure.'
  },
  {
    question: 'What happens if an LP defaults on a capital call backing the line?',
    answer: 'This is a key risk for subscription lines. Lenders typically exclude LPs who default from the borrowing base and may reduce availability. The fund must either reduce the outstanding balance or provide additional collateral. Fund documents usually include consequences for LP defaults (forced sale at discount, loss of committee rights, etc.).'
  },
  {
    question: 'How should subscription line interest be allocated among LPs?',
    answer: 'Interest expense is typically allocated based on whose capital was effectively bridged. Some funds allocate pro-rata to all LPs; others allocate to specific deals or time periods. The methodology should be disclosed to LPs and applied consistently. Large institutional LPs often negotiate specific allocation terms in side letters.'
  },
  {
    question: 'What is a "clean-down" provision?',
    answer: 'A clean-down requires the borrower to fully repay (bring to zero) the outstanding balance for a specified period each year (typically 30-90 days). This prevents the line from becoming permanent leverage and ensures it\'s being used for bridging rather than ongoing funding. Most lenders require this.'
  },
  {
    question: 'When in the fund lifecycle are subscription lines most useful?',
    answer: 'Lines are most valuable during the investment period when deals are being made. They provide flexibility for competitive situations, allow efficient capital call management, and smooth out the J-curve. After the investment period, lines are less commonly used since there are fewer new investments requiring bridge financing.'
  }
]

export function FAQSection() {
  const [isOpen, setIsOpen] = useState(false)
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  return (
    <Card className="border-muted">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Frequently Asked Questions</CardTitle>
              </div>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="border-t pt-4">
            <div className="space-y-2">
              {faqs.map((faq, index) => (
                <div key={index} className="border rounded-lg">
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full flex items-start justify-between p-4 text-left hover:bg-accent/50 transition-colors"
                  >
                    <span className="font-medium text-sm pr-4">{faq.question}</span>
                    {openItems.includes(index) ? (
                      <Minus className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    ) : (
                      <Plus className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  {openItems.includes(index) && (
                    <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
