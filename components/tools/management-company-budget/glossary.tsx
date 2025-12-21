"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Book,
  Search,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface GlossaryTerm {
  term: string
  definition: string
  category: 'fund-structure' | 'fees' | 'operations' | 'metrics' | 'legal'
  example?: string
  related?: string[]
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  // Fund Structure
  {
    term: 'Management Company (ManCo)',
    definition: 'The legal entity that manages the fund and employs the investment team. Receives management fees and typically owns the carried interest.',
    category: 'fund-structure',
    example: 'ABC Ventures Management LLC manages ABC Ventures Fund I, LP',
    related: ['General Partner', 'Limited Partner']
  },
  {
    term: 'General Partner (GP)',
    definition: 'The partner responsible for managing the fund\'s investments and operations. Usually the same entity as or affiliated with the Management Company.',
    category: 'fund-structure',
    related: ['Limited Partner', 'Management Company']
  },
  {
    term: 'Limited Partner (LP)',
    definition: 'Investors in the fund who contribute capital but have limited liability and no role in day-to-day management. Includes institutions, family offices, and high-net-worth individuals.',
    category: 'fund-structure',
    example: 'University endowments, pension funds, and fund-of-funds are common LPs',
    related: ['General Partner', 'Commitment']
  },
  {
    term: 'Commitment',
    definition: 'The total amount an LP agrees to invest in the fund over its life. Capital is drawn down (called) as needed for investments.',
    category: 'fund-structure',
    example: 'An LP with a $10M commitment may have only $3M called in the first year',
    related: ['Capital Call', 'Paid-In Capital']
  },
  {
    term: 'Capital Call',
    definition: 'A demand from the GP to LPs to contribute a portion of their committed capital, typically to fund new investments.',
    category: 'fund-structure',
    related: ['Commitment', 'Paid-In Capital']
  },
  {
    term: 'AUM (Assets Under Management)',
    definition: 'The total market value of assets that the management company manages on behalf of investors.',
    category: 'fund-structure',
    related: ['Commitment', 'Fund Size']
  },

  // Fees
  {
    term: 'Management Fee',
    definition: 'Annual fee paid by LPs to the GP/ManCo to cover fund operations. Typically 1.5-2.5% of committed capital during investment period, often stepping down after.',
    category: 'fees',
    example: 'A $100M fund with 2% fee generates $2M/year for the management company',
    related: ['Fee Basis', 'Carry']
  },
  {
    term: 'Fee Basis',
    definition: 'The amount on which management fees are calculated. Usually committed capital during investment period, then may switch to invested capital.',
    category: 'fees',
    example: 'Fees on committed capital: full $100M. Fees on invested capital: only the $60M deployed',
    related: ['Management Fee', 'Commitment']
  },
  {
    term: 'Carried Interest (Carry)',
    definition: 'The GP\'s share of fund profits, typically 20%, received after LPs have received their capital back plus a preferred return.',
    category: 'fees',
    example: 'On $50M of profits, 20% carry = $10M to the GP, $40M to LPs (simplified)',
    related: ['Hurdle Rate', 'Waterfall']
  },
  {
    term: 'Hurdle Rate (Preferred Return)',
    definition: 'The minimum annual return LPs must receive before the GP can collect carried interest. Typically 8%.',
    category: 'fees',
    related: ['Carried Interest', 'Waterfall']
  },
  {
    term: 'Waterfall',
    definition: 'The order in which fund distributions are made to LPs and GP, including return of capital, preferred return, catch-up, and profit split.',
    category: 'fees',
    related: ['Carried Interest', 'Hurdle Rate']
  },

  // Operations
  {
    term: 'Fund Administrator',
    definition: 'Third-party service provider handling fund accounting, investor reporting, capital call processing, and compliance. Essential for institutional-quality operations.',
    category: 'operations',
    example: 'Common administrators: Carta, Juniper Square, Allvue'
  },
  {
    term: 'First Close',
    definition: 'The initial closing of the fund when the first group of LPs commits capital and the fund can begin investing. Often 25-50% of target fund size.',
    category: 'operations',
    example: 'Target $100M fund holds first close at $40M, then continues fundraising',
    related: ['Final Close', 'Commitment']
  },
  {
    term: 'Final Close',
    definition: 'The last date on which new investors can commit to the fund. Typically 12-18 months after first close.',
    category: 'operations',
    related: ['First Close', 'Commitment']
  },
  {
    term: 'Investment Period',
    definition: 'The period (usually 3-5 years) during which the fund actively makes new investments. After this, capital is reserved for follow-ons.',
    category: 'operations',
    related: ['Fund Term', 'Commitment Period']
  },
  {
    term: 'Fund Term',
    definition: 'The total life of the fund, typically 10 years with options to extend. Covers investment period plus harvest period for exits.',
    category: 'operations',
    related: ['Investment Period']
  },

  // Metrics
  {
    term: 'Runway',
    definition: 'The number of months the management company can operate on starting capital before needing management fee income.',
    category: 'metrics',
    example: '$500K starting capital ÷ $25K monthly burn = 20 months runway',
    related: ['Monthly Burn', 'Break-even']
  },
  {
    term: 'Monthly Burn Rate',
    definition: 'The total monthly operating expenses of the management company, including team compensation and overhead.',
    category: 'metrics',
    related: ['Runway', 'Operating Budget']
  },
  {
    term: 'Break-even AUM',
    definition: 'The assets under management required for management fee revenue to cover operating expenses.',
    category: 'metrics',
    example: 'At $300K/year expenses and 2% fee: break-even AUM = $15M',
    related: ['Management Fee', 'Monthly Burn']
  },
  {
    term: 'J-Curve',
    definition: 'The pattern of fund returns over time: initially negative (fees and costs exceed gains) before turning positive as investments mature.',
    category: 'metrics',
    related: ['IRR', 'DPI']
  },

  // Legal
  {
    term: 'LPA (Limited Partnership Agreement)',
    definition: 'The legal document governing the fund\'s terms, including fees, carry, investment restrictions, and GP/LP rights.',
    category: 'legal',
    related: ['Side Letter', 'PPM']
  },
  {
    term: 'Side Letter',
    definition: 'Separate agreement with specific LPs granting special terms like fee discounts, co-investment rights, or enhanced reporting.',
    category: 'legal',
    related: ['LPA', 'MFN']
  },
  {
    term: 'PPM (Private Placement Memorandum)',
    definition: 'The offering document provided to prospective LPs describing the fund, strategy, risks, and terms.',
    category: 'legal',
    related: ['LPA', 'DDQ']
  },
  {
    term: 'Form ADV',
    definition: 'SEC registration document required for investment advisers managing over $150M, disclosing business practices and conflicts.',
    category: 'legal'
  },
  {
    term: 'ILPA (Institutional Limited Partners Association)',
    definition: 'Industry organization representing LPs that publishes best practices and templates for fund terms and reporting.',
    category: 'legal',
    related: ['LPA', 'Reporting']
  }
]

const CATEGORY_LABELS: Record<GlossaryTerm['category'], string> = {
  'fund-structure': 'Fund Structure',
  'fees': 'Fees & Economics',
  'operations': 'Operations',
  'metrics': 'Metrics & Analysis',
  'legal': 'Legal & Compliance'
}

interface GlossaryProps {
  className?: string
}

export function Glossary({ className }: GlossaryProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<GlossaryTerm['category'] | 'all'>('all')

  const filteredTerms = useMemo(() => {
    return GLOSSARY_TERMS.filter(term => {
      const matchesSearch = search === '' ||
        term.term.toLowerCase().includes(search.toLowerCase()) ||
        term.definition.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || term.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [search, selectedCategory])

  const categories = Object.keys(CATEGORY_LABELS) as GlossaryTerm['category'][]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Book className="h-5 w-5" />
          Glossary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search terms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="text-xs"
          >
            All
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="text-xs"
            >
              {CATEGORY_LABELS[cat]}
            </Button>
          ))}
        </div>

        {/* Terms */}
        <Accordion type="single" collapsible className="w-full">
          {filteredTerms.map((term) => (
            <AccordionItem key={term.term} value={term.term}>
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-2 text-left">
                  <span className="font-medium">{term.term}</span>
                  <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                    {CATEGORY_LABELS[term.category]}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{term.definition}</p>

                {term.example && (
                  <div className="text-xs bg-muted/50 p-2 rounded">
                    <span className="font-medium">Example: </span>
                    {term.example}
                  </div>
                )}

                {term.related && term.related.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Related:</span>
                    {term.related.map(related => (
                      <Button
                        key={related}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setSearch(related)}
                      >
                        {related}
                      </Button>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {filteredTerms.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No terms found matching "{search}"</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          {GLOSSARY_TERMS.length} terms across {categories.length} categories
        </div>
      </CardContent>
    </Card>
  )
}

// Inline tooltip version for use within text
interface GlossaryTooltipProps {
  term: string
  children?: React.ReactNode
}

export function GlossaryTooltip({ term, children }: GlossaryTooltipProps) {
  const glossaryTerm = GLOSSARY_TERMS.find(
    t => t.term.toLowerCase() === term.toLowerCase()
  )

  if (!glossaryTerm) {
    return <span>{children || term}</span>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="underline decoration-dotted cursor-help">
            {children || term}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium text-sm">{glossaryTerm.term}</p>
            <p className="text-xs">{glossaryTerm.definition}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Full-page glossary dialog
interface GlossaryDialogProps {
  trigger?: React.ReactNode
}

export function GlossaryDialog({ trigger }: GlossaryDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Book className="h-4 w-4 mr-2" />
            Glossary
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Fund Management Glossary
          </DialogTitle>
        </DialogHeader>
        <Glossary className="border-0 shadow-none" />
      </DialogContent>
    </Dialog>
  )
}
