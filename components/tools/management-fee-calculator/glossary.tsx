'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react'

interface GlossaryTerm {
  id: string
  term: string
  definition: string
  example?: string
  category: 'basics' | 'fee-types' | 'calculation' | 'structure' | 'negotiation'
  relatedTerms?: string[]
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // Basics
  {
    id: 'management-fee',
    term: 'Management Fee',
    definition: 'An annual fee paid by the fund to the GP (General Partner) to cover operational costs. Typically calculated as a percentage of committed capital, invested capital, or NAV.',
    example: 'A 2% management fee on a $100M fund generates $2M per year for the GP.',
    category: 'basics',
    relatedTerms: ['fee-basis', 'gp', 'lp']
  },
  {
    id: 'gp',
    term: 'General Partner (GP)',
    definition: 'The fund manager who makes investment decisions and runs day-to-day operations. The GP earns management fees and carried interest.',
    category: 'basics',
    relatedTerms: ['lp', 'management-fee']
  },
  {
    id: 'lp',
    term: 'Limited Partner (LP)',
    definition: 'Investors who commit capital to the fund but have limited liability and no management control. LPs pay management fees and share profits with the GP.',
    category: 'basics',
    relatedTerms: ['gp', 'committed-capital']
  },
  {
    id: 'lpa',
    term: 'Limited Partnership Agreement (LPA)',
    definition: 'The legal document that governs the fund, including fee structures, investment restrictions, and GP/LP rights. Management fee terms are defined here.',
    example: 'The LPA might specify: "2% on commitments during years 1-5, then 1.5% on invested capital thereafter."',
    category: 'basics',
    relatedTerms: ['management-fee', 'fee-basis']
  },

  // Fee Types
  {
    id: 'committed-capital',
    term: 'Committed Capital',
    definition: 'The total amount LPs have legally committed to invest in the fund, regardless of how much has actually been called. Often used as the fee basis during the investment period.',
    example: 'If an LP commits $10M to a fund, fees are charged on the full $10M even if only $5M has been called.',
    category: 'fee-types',
    relatedTerms: ['invested-cost', 'capital-call']
  },
  {
    id: 'invested-cost',
    term: 'Invested Cost (or Net Invested Capital)',
    definition: 'The actual capital that has been deployed into portfolio investments. Often used as the fee basis after the investment period to align fees with activity.',
    example: 'If $50M of a $100M fund has been invested, fees on invested cost would be calculated on $50M.',
    category: 'fee-types',
    relatedTerms: ['committed-capital', 'nav']
  },
  {
    id: 'nav',
    term: 'Net Asset Value (NAV)',
    definition: 'The current fair market value of the fund\'s portfolio. Using NAV as a fee basis means fees rise and fall with portfolio performance.',
    example: 'If investments purchased for $50M are now worth $75M, NAV-based fees would be charged on $75M.',
    category: 'fee-types',
    relatedTerms: ['invested-cost', 'fair-value']
  },
  {
    id: 'fair-value',
    term: 'Fair Value',
    definition: 'The estimated market price of an asset. For private investments, this is determined through valuation methodologies (comparable transactions, DCF, etc.).',
    category: 'fee-types',
    relatedTerms: ['nav', 'lower-of']
  },
  {
    id: 'lower-of',
    term: 'Lower of Cost or Fair Value',
    definition: 'A conservative fee basis that uses the lesser of invested cost or current fair value. Considered LP-friendly as it limits fees if portfolio value declines.',
    example: 'If $50M was invested but portfolio is now worth $40M, fees are charged on $40M (the lower amount).',
    category: 'fee-types',
    relatedTerms: ['invested-cost', 'fair-value', 'nav']
  },

  // Calculation
  {
    id: 'fee-basis',
    term: 'Fee Basis (or Fee Base)',
    definition: 'The amount on which management fees are calculated. Common bases include committed capital, invested cost, NAV, or lower of cost/FV.',
    category: 'calculation',
    relatedTerms: ['committed-capital', 'invested-cost', 'nav']
  },
  {
    id: 'fee-rate',
    term: 'Fee Rate',
    definition: 'The annual percentage charged on the fee basis. Standard PE/VC rates are 1.5-2.5%, while credit and real estate may be lower.',
    example: 'A 2% fee rate on $50M fee basis = $1M annual management fee.',
    category: 'calculation',
    relatedTerms: ['fee-basis', 'two-and-twenty']
  },
  {
    id: 'two-and-twenty',
    term: 'Two and Twenty (2 and 20)',
    definition: 'The traditional private equity fee structure: 2% annual management fee plus 20% carried interest on profits. Increasingly being negotiated down.',
    category: 'calculation',
    relatedTerms: ['fee-rate', 'carried-interest']
  },
  {
    id: 'carried-interest',
    term: 'Carried Interest (Carry)',
    definition: 'The GP\'s share of fund profits, typically 20%. Unlike management fees, carry is only earned when returns exceed the hurdle rate.',
    category: 'calculation',
    relatedTerms: ['two-and-twenty', 'hurdle-rate']
  },

  // Structure
  {
    id: 'investment-period',
    term: 'Investment Period',
    definition: 'The timeframe (typically 3-5 years) during which the GP can make new investments. Management fees are often higher during this period.',
    example: 'A 10-year fund with a 4-year investment period would have years 1-4 as the investment period.',
    category: 'structure',
    relatedTerms: ['harvest-period', 'fund-term']
  },
  {
    id: 'harvest-period',
    term: 'Harvest Period',
    definition: 'The period after the investment period when the GP focuses on managing and exiting existing investments. Fees often step down during this phase.',
    category: 'structure',
    relatedTerms: ['investment-period', 'step-down']
  },
  {
    id: 'fund-term',
    term: 'Fund Term',
    definition: 'The total lifespan of the fund, typically 10 years for PE/VC with possible extensions. Management fees are charged throughout this period.',
    category: 'structure',
    relatedTerms: ['investment-period', 'extension']
  },
  {
    id: 'step-down',
    term: 'Fee Step-Down',
    definition: 'A reduction in the management fee rate after a specified period, usually the end of the investment period. Aligns GP incentives with LP interests.',
    example: 'A step-down from 2.0% to 1.5% after year 5 reduces total fees over the fund life.',
    category: 'structure',
    relatedTerms: ['investment-period', 'harvest-period']
  },
  {
    id: 'fee-phase',
    term: 'Fee Phase',
    definition: 'A period with consistent fee terms. Most funds have two phases: investment period (higher fees on commitments) and harvest period (lower fees on invested capital).',
    category: 'structure',
    relatedTerms: ['step-down', 'investment-period']
  },

  // Negotiation
  {
    id: 'fee-holiday',
    term: 'Fee Holiday (or Fee Waiver)',
    definition: 'A period where management fees are reduced or eliminated, often offered to first-close investors as an incentive for early commitment.',
    example: 'First-close LPs might receive a 6-month fee holiday, reducing their total fee burden.',
    category: 'negotiation',
    relatedTerms: ['fee-offset', 'mfn']
  },
  {
    id: 'fee-offset',
    term: 'Fee Offset',
    definition: 'A reduction in management fees based on other income the GP receives (e.g., transaction fees, monitoring fees). 100% offset means full reduction.',
    example: 'If the GP earns $500K in transaction fees with 100% offset, management fees are reduced by $500K.',
    category: 'negotiation',
    relatedTerms: ['fee-holiday', 'transaction-fee']
  },
  {
    id: 'mfn',
    term: 'Most Favored Nation (MFN)',
    definition: 'A clause ensuring an LP receives terms at least as favorable as any other LP. If one LP negotiates lower fees, MFN-holders get the same benefit.',
    category: 'negotiation',
    relatedTerms: ['side-letter', 'fee-holiday']
  },
  {
    id: 'side-letter',
    term: 'Side Letter',
    definition: 'A separate agreement between the GP and a specific LP that modifies the standard LPA terms. Often includes fee discounts for large LPs.',
    category: 'negotiation',
    relatedTerms: ['mfn', 'fee-holiday']
  }
]

const categoryLabels: Record<string, string> = {
  'basics': 'Basics',
  'fee-types': 'Fee Types & Bases',
  'calculation': 'Fee Calculation',
  'structure': 'Fund Structure',
  'negotiation': 'Negotiation Terms'
}

const categoryColors: Record<string, string> = {
  'basics': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'fee-types': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  'calculation': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  'structure': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  'negotiation': 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300'
}

interface GlossaryProps {
  onTermRead?: (termId: string) => void
  onClose?: () => void
}

export function Glossary({ onTermRead, onClose }: GlossaryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredTerms = GLOSSARY_TERMS.filter(term => {
    const matchesSearch = searchQuery === '' ||
      term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === null || term.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(GLOSSARY_TERMS.map(t => t.category)))

  const handleTermClick = (termId: string) => {
    setExpandedTerm(expandedTerm === termId ? null : termId)
    if (expandedTerm !== termId) {
      onTermRead?.(termId)
    }
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle>Fee Glossary</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
            >
              {categoryLabels[category]}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="max-h-[500px] overflow-y-auto space-y-2">
        {filteredTerms.map((term) => (
          <motion.div
            key={term.id}
            layout
            className="border rounded-lg overflow-hidden"
          >
            <button
              onClick={() => handleTermClick(term.id)}
              className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Badge className={categoryColors[term.category]}>
                  {categoryLabels[term.category]}
                </Badge>
                <span className="font-medium">{term.term}</span>
              </div>
              {expandedTerm === term.id ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            <AnimatePresence>
              {expandedTerm === term.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-3 pb-3"
                >
                  <p className="text-sm text-muted-foreground mb-2">
                    {term.definition}
                  </p>
                  {term.example && (
                    <div className="p-2 bg-muted/50 rounded text-sm mb-2">
                      <span className="font-medium">Example: </span>
                      {term.example}
                    </div>
                  )}
                  {term.relatedTerms && term.relatedTerms.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground">Related:</span>
                      {term.relatedTerms.map(relId => {
                        const relTerm = GLOSSARY_TERMS.find(t => t.id === relId)
                        return relTerm ? (
                          <button
                            key={relId}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTermClick(relId)
                            }}
                            className="text-xs text-primary hover:underline"
                          >
                            {relTerm.term}
                          </button>
                        ) : null
                      })}
                    </div>
                  )}

                  {/* XP indicator */}
                  <div className="flex items-center gap-1 mt-2 text-xs text-amber-600 dark:text-amber-400">
                    <Sparkles className="h-3 w-3" />
                    <span>+5 XP for learning this term!</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {filteredTerms.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No terms found matching your search.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
