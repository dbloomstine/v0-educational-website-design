"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, HelpCircle, Plus, Minus } from 'lucide-react'

const faqs = [
  {
    question: 'What is the difference between a fund expense and a management company expense?',
    answer: 'Fund expenses are costs borne by the limited partnership (and therefore by LPs through reduced NAV or capital calls). These include costs that directly benefit the fund, such as audit fees, fund-specific legal work, and transaction costs. Management company expenses are costs the GP pays out of management fees and include overhead like office rent, staff salaries, and platform-wide compliance programs. The key test is: who primarily benefits from this expense?'
  },
  {
    question: 'Why do LPs care so much about expense allocation?',
    answer: 'Expense allocation directly impacts LP returns. Every dollar charged to the fund reduces the capital available for investment or distributions. LPs have become increasingly sophisticated and scrutinize expense policies in LPAs. Improper expense allocation can damage GP reputation, lead to LP pushback in future fundraises, and in extreme cases may constitute breach of fiduciary duty.'
  },
  {
    question: 'What is an LPAC and when should expenses be reviewed by them?',
    answer: 'The Limited Partner Advisory Committee (LPAC) is a group of select LPs that advises on conflicts of interest and certain fund matters. Many LPAs require LPAC review or consent for significant expenses, unusual charges, or related-party transactions. Even when not required, consulting the LPAC on borderline expense decisions is good governance.'
  },
  {
    question: 'How should expenses be allocated when they benefit multiple funds?',
    answer: 'When expenses benefit multiple funds (e.g., shared service providers, platform-wide technology), they should be allocated reasonably based on a clear methodology. Common approaches include pro-rata by AUM, pro-rata by number of funds, or based on actual usage. The methodology should be disclosed to LPs and applied consistently.'
  },
  {
    question: 'What are "broken deal costs" and why are they controversial?',
    answer: 'Broken deal costs are expenses incurred pursuing investments that did not close. While typically fund expenses (since they relate to specific investment opportunities), LPs scrutinize them carefully. They want to see costs tied to bona fide opportunities with reasonable amounts. Excessive broken deal costs may suggest poor investment process or cost management.'
  },
  {
    question: 'Should placement agent fees ever be charged to the fund?',
    answer: 'No. Placement agent fees and fundraising costs are almost universally considered management company expenses. The rationale is that raising capital benefits the GP (which earns fees on AUM) more than existing fund investors. Charging these to the fund is a significant red flag and may violate fiduciary duties.'
  },
  {
    question: 'How do organization costs work and why are they typically capped?',
    answer: 'Organization costs are expenses to form and launch the fund (legal fees, filing fees, initial setup costs). While these are fund expenses, virtually all LPAs cap them (typically 0.3-0.5% of commitments) with the GP covering overages. This protects LPs from excessive formation costs and incentivizes GP cost management.'
  },
  {
    question: 'What is the proper treatment of D&O insurance?',
    answer: 'D&O insurance allocation is often negotiated. Fund-specific coverage (e.g., for portfolio company board seats) is typically a fund expense. Coverage for GP principals and management company activities should be a management expense. Many LPAs allocate pro-rata based on the portion of coverage attributable to fund activities.'
  },
  {
    question: 'How should technology costs be classified?',
    answer: 'Technology used exclusively for a specific fund (investor portal, fund-specific data room) can be a fund expense. Platform-wide technology (CRM, email, collaboration tools) is management overhead. Shared portfolio monitoring systems may be allocated across funds based on usage. The key is whether the cost is fund-specific or platform-wide.'
  },
  {
    question: 'What documentation should GPs maintain for expense decisions?',
    answer: 'GPs should maintain clear records of expense allocation decisions, including: the governing LPA provisions, rationale for classification, allocation methodology for shared expenses, any LPAC review or approval, and invoices/receipts. Good documentation protects against LP disputes and audit findings.'
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
