"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react'

const glossaryTerms = [
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
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className="border-muted">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Glossary</CardTitle>
              </div>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Key terms for understanding subscription credit lines and their impact on fund performance.
            </p>
            <div className="space-y-4">
              {glossaryTerms.map(({ term, definition }) => (
                <div key={term} className="pb-4 border-b border-border last:border-0 last:pb-0">
                  <dt className="font-semibold text-sm text-foreground mb-1">{term}</dt>
                  <dd className="text-sm text-muted-foreground leading-relaxed">{definition}</dd>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
