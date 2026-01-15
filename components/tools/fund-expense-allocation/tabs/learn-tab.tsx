'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, ChevronDown, ChevronRight, BookOpen, HelpCircle } from 'lucide-react'
import { glossary } from '../expenseData'

// FAQ data
const faqs = [
  {
    question: 'What determines if an expense is charged to the fund vs. the management company?',
    answer: 'The key test is "who benefits?" If the expense directly relates to fund activities and benefits the LPs (like fund formation, audit, or investment-related costs), it\'s typically a fund expense. If it benefits the manager\'s business broadly (like office rent, fundraising, or platform-wide technology), it\'s a management expense. The fund\'s LPA is the ultimate authority on allocation.'
  },
  {
    question: 'What are "organization costs" and are they always fund expenses?',
    answer: 'Organization costs are the one-time expenses to form and launch a fund (legal fees for LPA/PPM, regulatory filings, initial setup). They are typically fund expenses but almost always subject to a cap (commonly 0.3-0.5% of commitments). Amounts over the cap are borne by the GP. These costs are usually amortized over 5 years for GAAP purposes.'
  },
  {
    question: 'Can placement agent fees ever be charged to the fund?',
    answer: 'In practice, almost never. Placement agent fees are considered fundraising costs, which benefit the GP (who earns management fees on AUM). Charging these to the fund is a red flag for LPs and may violate fiduciary duties. Some very old or unusual fund structures might permit it, but modern institutional LPs would strongly object.'
  },
  {
    question: 'What about broken deal costs?',
    answer: 'Broken deal costs (expenses for transactions that don\'t close) are typically fund expenses because they relate to pursuing specific investments on behalf of the fund. However, they\'re an area of LP scrutiny. LPs expect costs to be tied to bona fide opportunities, reasonable in amount, and not indicative of a poor investment process. Some LPAs require GP sharing above certain thresholds.'
  },
  {
    question: 'How should technology and software costs be allocated?',
    answer: 'It depends on the technology. Fund-specific tools (like a dedicated investor portal or fund data room) are typically fund expenses. Platform-wide technology (CRM, email, collaboration tools) is management overhead. Shared tools that benefit multiple funds may be allocated pro-rata. The key is whether the technology is genuinely fund-specific or general business infrastructure.'
  },
  {
    question: 'What is a transaction fee offset?',
    answer: 'When GPs or their affiliates receive fees from portfolio companies (for transaction services, board participation, or ongoing monitoring), many LPAs require these fees to offset management fees paid by the fund—typically 50-100%. This prevents "double-dipping" where the GP collects both management fees and portfolio company fees.'
  },
  {
    question: 'How does the LPAC relate to expense allocation?',
    answer: 'The Limited Partner Advisory Committee (LPAC) often has approval rights over certain expense matters, especially where conflicts exist or unusual costs arise. LPAs may require LPAC consent for expenses above certain thresholds, affiliate transactions, or allocations between funds. LPAC review adds governance and helps resolve gray areas.'
  },
  {
    question: 'What happens if an expense benefits multiple funds?',
    answer: 'Shared expenses should be allocated fairly across benefiting funds. Common methods include: pro-rata by AUM, by number of portfolio companies, by activity level, or by committed capital. The allocation methodology should be disclosed, reasonable, and consistently applied. LPs may push back on allocations that seem to favor newer or larger funds.'
  },
  {
    question: 'Are all travel expenses treated the same?',
    answer: 'No. Travel for investment diligence or portfolio monitoring is typically a fund expense. Travel for fundraising is a management expense. Travel to LP meetings and advisory committee meetings is usually a fund expense. Conference attendance for general networking is typically management overhead. Business-class is common; first-class or luxury travel may be questioned.'
  },
  {
    question: 'What about insurance costs?',
    answer: 'Insurance allocation is complex and negotiated. D&O coverage for fund representatives on portfolio company boards is typically a fund expense. Firm-wide E&O or GP entity coverage is typically a management expense. Many policies are allocated based on the percentage of coverage attributable to fund activities versus management company operations.'
  }
]

// Glossary section
function GlossarySection() {
  const [searchQuery, setSearchQuery] = useState('')

  const glossaryEntries = Object.entries(glossary)

  const filteredEntries = glossaryEntries.filter(([term, definition]) => {
    const query = searchQuery.toLowerCase()
    return term.toLowerCase().includes(query) || definition.toLowerCase().includes(query)
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Glossary
        </CardTitle>
        <CardDescription>
          Key terms in fund expense allocation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search terms..."
            className="pl-10"
          />
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {filteredEntries.map(([term, definition]) => (
            <div key={term} className="p-3 bg-accent/30 rounded-lg">
              <div className="font-medium text-sm capitalize">
                {term.replace(/-/g, ' ')}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {definition}
              </div>
            </div>
          ))}

          {filteredEntries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No matching terms found.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// FAQ section
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Frequently Asked Questions
        </CardTitle>
        <CardDescription>
          Common questions about fund expense allocation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <div key={index} className="border rounded-lg">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors"
              >
                <span className="font-medium text-sm pr-4">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-4 pb-4 text-sm text-muted-foreground">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function LearnTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GlossarySection />
      <FAQSection />
    </div>
  )
}
