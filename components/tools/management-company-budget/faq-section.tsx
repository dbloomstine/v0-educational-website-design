"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  HelpCircle,
  Search,
  ChevronDown,
  ExternalLink
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'basics' | 'fees' | 'operations' | 'fundraising' | 'tool'
  links?: { label: string; url: string }[]
}

const FAQ_ITEMS: FAQItem[] = [
  // Basics
  {
    id: 'what-is-manco',
    question: 'What is the difference between a fund and a management company?',
    answer: 'The fund (e.g., "ABC Ventures Fund I, LP") is the investment vehicle that holds capital from LPs and makes investments. The management company (e.g., "ABC Ventures Management LLC") is the operating entity that employs the team, receives management fees, and runs day-to-day operations. This tool helps you budget for the management company\'s operations.',
    category: 'basics'
  },
  {
    id: 'why-separate',
    question: 'Why do I need a separate management company?',
    answer: 'A separate management company provides liability protection, allows for multiple funds under one operating entity, enables compensation flexibility, and is the standard institutional structure. LPs expect this separation for governance and fiduciary reasons.',
    category: 'basics'
  },
  {
    id: 'starting-capital',
    question: 'Where does the starting capital come from?',
    answer: 'Management company starting capital typically comes from: (1) GP personal savings/investments, (2) GP commitment draws accelerated before first close, (3) Seed investors or strategic partners, (4) Revenue from prior funds (for established managers), or (5) Bank lines of credit. Many emerging managers self-fund the first 12-24 months.',
    category: 'basics'
  },

  // Fees
  {
    id: 'fee-rate',
    question: 'What management fee rate should I charge?',
    answer: 'Industry standard is 1.5-2.5% annually on committed capital during the investment period, often stepping down to 1-1.5% on invested capital after. Emerging managers and smaller funds often charge higher rates (2-2.5%) while larger established funds may charge less (1.5-1.75%). Your fee needs to cover operations while remaining competitive for LP expectations.',
    category: 'fees'
  },
  {
    id: 'fee-calculation',
    question: 'How are management fees calculated and paid?',
    answer: 'Management fees are typically calculated quarterly on committed capital (during investment period) or invested capital (after). Fees are drawn from LP capital commitments, not the management company\'s accounts. The formula is: (Committed Capital × Fee Rate) ÷ 4 per quarter. For a $100M fund at 2%, that\'s $500K/quarter.',
    category: 'fees'
  },
  {
    id: 'when-fees-start',
    question: 'When do management fees start flowing?',
    answer: 'Fees begin at first close, calculated on the capital committed at that point. This is why "months to first close" and "first close amount" are critical inputs—they determine when you transition from burning starting capital to receiving fee income.',
    category: 'fees'
  },
  {
    id: 'fee-offset',
    question: 'What expenses can I charge to the fund vs. management company?',
    answer: 'Generally, fund expenses (charged to LPs) include: organizational costs, audit, legal for deals, taxes. Management company expenses (covered by fees) include: salaries, rent, travel, general overhead. The LPA defines exactly what can be charged to the fund. Excessive fund expenses reduce LP returns and can create conflicts.',
    category: 'fees'
  },

  // Operations
  {
    id: 'team-size',
    question: 'How many people do I need to run a fund?',
    answer: 'It depends on fund size and strategy: Solo GP works for $10-30M funds. Two partners + 1 ops person is common for $30-75M. Full team (4-6 people) typical for $100M+. Key roles: deal sourcing, due diligence, portfolio support, LP relations, operations/finance. Consider outsourcing admin and legal to scale efficiently.',
    category: 'operations'
  },
  {
    id: 'fund-admin',
    question: 'Do I need a fund administrator?',
    answer: 'Yes, for institutional-quality operations. Fund admins handle: investor statements, capital calls, distributions, NAV calculations, compliance reporting. They\'re required by most institutional LPs and cost $3K-15K/month depending on fund size and complexity. DIY admin is possible for very small funds but creates due diligence concerns.',
    category: 'operations'
  },
  {
    id: 'legal-costs',
    question: 'How much should I budget for legal?',
    answer: 'Fund formation (LPA, PPM, subscription docs): $75K-$200K one-time. Ongoing legal: $2K-5K/month for retainer + per-deal costs ($5K-15K per investment). Side letter negotiations, amendments, and LP disputes add costs. Budget conservatively—legal is often underestimated.',
    category: 'operations'
  },

  // Fundraising
  {
    id: 'fundraise-timeline',
    question: 'How long does fundraising typically take?',
    answer: 'First-time funds: 12-24 months from start to final close. Established managers: 6-12 months. Factors affecting timeline: track record, market conditions, LP relationships, fund size, differentiation. Plan for the longer end to avoid runway pressure.',
    category: 'fundraising'
  },
  {
    id: 'first-close',
    question: 'What percentage should my first close be?',
    answer: 'Target 25-50% of fund size at first close. This demonstrates LP confidence, provides meaningful fee income, and allows you to start investing. Too small (<20%) signals weak demand. First close timing affects runway calculations significantly.',
    category: 'fundraising'
  },
  {
    id: 'runway',
    question: 'How much runway do I need before first close?',
    answer: 'Minimum 12 months, target 18-24 months. This accounts for: (1) Longer-than-expected fundraising, (2) Legal and setup delays, (3) Building pipeline before investing, (4) Personal financial cushion. Running out of runway during fundraising is a serious risk to fund viability.',
    category: 'fundraising'
  },

  // Tool
  {
    id: 'accuracy',
    question: 'How accurate are these projections?',
    answer: 'This tool provides planning estimates based on your inputs and industry-standard assumptions. Actual results will vary based on fundraising timing, fee negotiations, expense management, and market conditions. Use this for directional planning and sensitivity analysis, not exact forecasting. Consult with fund counsel and accountants for formal budgeting.',
    category: 'tool'
  },
  {
    id: 'save-data',
    question: 'Is my data saved?',
    answer: 'Data is saved locally in your browser (localStorage) and auto-saves as you make changes. You can also export your budget as JSON to save, share, or import later. No data is sent to any server—everything stays in your browser.',
    category: 'tool'
  },
  {
    id: 'what-if',
    question: 'How do I model different scenarios?',
    answer: 'Use the "What-If Scenarios" sliders to quickly see how changes to fund size, fees, or costs affect your metrics. You can also use the Sample Scenarios library to load pre-built templates, or export/import JSON files to compare different configurations.',
    category: 'tool'
  }
]

const CATEGORY_LABELS: Record<FAQItem['category'], string> = {
  basics: 'Fund Basics',
  fees: 'Fees & Economics',
  operations: 'Operations',
  fundraising: 'Fundraising',
  tool: 'Using This Tool'
}

interface FAQSectionProps {
  className?: string
  compact?: boolean
}

export function FAQSection({ className, compact = false }: FAQSectionProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<FAQItem['category'] | 'all'>('all')

  const filteredItems = FAQ_ITEMS.filter(item => {
    const matchesSearch = search === '' ||
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = Object.keys(CATEGORY_LABELS) as FAQItem['category'][]

  if (compact) {
    // Compact version shows just top 5 questions
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-5 w-5" />
            Quick FAQ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.slice(0, 5).map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className="text-sm text-left hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Frequently Asked Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              "px-3 py-1 text-xs rounded-full transition-colors",
              selectedCategory === 'all'
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            All ({FAQ_ITEMS.length})
          </button>
          {categories.map(cat => {
            const count = FAQ_ITEMS.filter(i => i.category === cat).length
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1 text-xs rounded-full transition-colors",
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {CATEGORY_LABELS[cat]} ({count})
              </button>
            )
          })}
        </div>

        {/* Questions */}
        <Accordion type="single" collapsible className="w-full">
          {filteredItems.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="text-sm text-left hover:no-underline">
                <div className="flex items-start gap-2">
                  <span>{item.question}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {item.answer}
                </p>
                {item.links && item.links.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {item.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {link.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                )}
                <div className="text-xs text-muted-foreground pt-1">
                  Category: {CATEGORY_LABELS[item.category]}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No questions found matching "{search}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
