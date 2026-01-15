'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, ChevronRight, BookOpen, HelpCircle } from 'lucide-react'

// Glossary terms
const GLOSSARY_TERMS = [
  {
    term: 'Management Fee',
    definition: 'Annual fee charged by fund manager (GP) to cover operating expenses. Typically 1.5-2.5% of committed or invested capital, paid regardless of fund performance.'
  },
  {
    term: 'Committed Capital',
    definition: 'Total amount LPs have pledged to invest in the fund. Management fees on committed capital are consistent and predictable, as they don\'t vary with deployment pace.'
  },
  {
    term: 'Invested Cost',
    definition: 'The actual amount of capital that has been called and deployed into investments. Fees on invested cost are lower initially but grow as capital is deployed.'
  },
  {
    term: 'Net Asset Value (NAV)',
    definition: 'The current fair market value of the fund\'s investments. NAV-based fees align manager compensation with portfolio performance but introduce volatility.'
  },
  {
    term: 'Lower of Cost or Fair Value',
    definition: 'A conservative fee base that uses the lesser of invested cost or current fair value. Protects LPs when portfolio values decline.'
  },
  {
    term: 'Investment Period',
    definition: 'The initial years (typically 3-6) when the fund actively invests in new opportunities. Higher fees are usually charged during this period.'
  },
  {
    term: 'Harvest Period',
    definition: 'Post-investment period when the fund focuses on managing and exiting investments. Fees typically step down during this phase.'
  },
  {
    term: 'Fee Step-Down',
    definition: 'Reduction in management fee rate after the investment period ends. Common step-downs go from 2% to 1.5% or lower.'
  },
  {
    term: 'Fee Offset',
    definition: 'Reduction in management fees equal to some portion (often 80-100%) of portfolio company fees, monitoring fees, or transaction fees received by the GP.'
  },
  {
    term: 'Fund Term',
    definition: 'Total duration of the fund from first close to final distribution, typically 10-12 years for PE/VC, with possible extensions.'
  }
]

// FAQ items
const FAQ_ITEMS = [
  {
    question: 'Why do fees step down after the investment period?',
    answer: 'During the investment period, the GP is actively sourcing, diligencing, and executing new deals - requiring more resources. After the investment period, the focus shifts to portfolio management and exits, which is less resource-intensive. Step-downs reflect this reduced workload and align GP compensation with value-add activities.'
  },
  {
    question: 'What\'s the difference between committed and invested capital fees?',
    answer: 'Committed capital fees are charged on the total pledged amount regardless of deployment, providing GPs with predictable revenue. Invested capital fees are only charged on deployed capital, potentially saving LPs money if deployment is slow but reducing GP income during ramp-up.'
  },
  {
    question: 'How do NAV-based fees work?',
    answer: 'NAV-based fees are calculated on the current fair market value of the portfolio. They\'re common in hedge funds and some credit funds. When portfolio values rise, fees increase; when values fall, fees decrease. This creates alignment between GP and LP interests but introduces fee volatility.'
  },
  {
    question: 'What fee rate is typical for PE vs VC?',
    answer: 'PE buyout funds typically charge 1.5-2% on committed capital during investment period, stepping down to 1-1.5% on invested cost afterward. VC funds often charge 2-2.5% flat on committed capital with no step-down, reflecting higher operating costs and longer investment horizons.'
  },
  {
    question: 'How much should LPs expect to pay in total fees?',
    answer: 'Over a 10-year fund life with typical PE terms (2%/1.5%), total management fees usually equal 15-18% of committed capital. VC funds with 2.5% flat fees can reach 20-25%. Credit funds with lower rates (1-1.5%) typically total 10-15%.'
  },
  {
    question: 'What is a management fee offset?',
    answer: 'Fee offsets reduce the management fee by some portion of fees the GP receives from portfolio companies (transaction fees, monitoring fees, board fees). An 80% offset means 80 cents of every dollar in portfolio company fees reduces the management fee. This protects LPs from paying twice for GP services.'
  },
  {
    question: 'Can management fees be negotiated?',
    answer: 'Larger LPs (anchor investors, institutions) often negotiate fee discounts, typically 10-25 basis points off standard rates. These arrangements are documented in side letters. Smaller investors usually receive standard terms.'
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
      {isOpen && (
        <div className="pb-3 px-2 text-sm text-muted-foreground">
          {definition}
        </div>
      )}
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
      {isOpen && (
        <div className="pb-3 px-2 text-sm text-muted-foreground">
          {answer}
        </div>
      )}
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
          <CardDescription>
            Key terms in management fee structures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
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
          <CardDescription>
            Common questions about management fees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {FAQ_ITEMS.map((item) => (
              <FAQItem key={item.question} question={item.question} answer={item.answer} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
