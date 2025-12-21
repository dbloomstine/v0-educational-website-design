'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, BookOpen, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

interface GlossaryTerm {
  term: string
  definition: string
  example?: string
  related?: string[]
  category: 'structure' | 'economics' | 'tiers' | 'metrics' | 'provisions'
}

const glossaryTerms: GlossaryTerm[] = [
  // Structure terms
  {
    term: 'Distribution Waterfall',
    definition: 'The contractual order in which profits from a fund are distributed between LPs (Limited Partners) and the GP (General Partner). Proceeds flow down through sequential tiers, like water cascading down levels.',
    example: 'A typical PE waterfall has 4 tiers: Return of Capital → Preferred Return → GP Catch-Up → Profit Split',
    related: ['European Waterfall', 'American Waterfall', 'Tier'],
    category: 'structure'
  },
  {
    term: 'European Waterfall',
    definition: 'Also called "whole-fund" waterfall. The GP receives carried interest only after ALL contributed capital and preferred return have been distributed to ALL LPs across the entire fund. More LP-friendly.',
    example: 'A European waterfall fund with $100M contributed capital must return the full $100M + pref to LPs before GP earns any carry, regardless of how individual deals performed.',
    related: ['American Waterfall', 'Clawback'],
    category: 'structure'
  },
  {
    term: 'American Waterfall',
    definition: 'Also called "deal-by-deal" waterfall. The GP can receive carried interest on individual profitable investments before the fund as a whole has returned capital. Common in VC. Typically includes clawback provisions.',
    example: 'If Deal A returns 3x while Deal B loses money, GP could receive carry on Deal A\'s profits immediately under an American waterfall, subject to clawback at fund end.',
    related: ['European Waterfall', 'Clawback', 'Deal-by-Deal'],
    category: 'structure'
  },
  {
    term: 'LP (Limited Partner)',
    definition: 'Investors who provide capital to the fund but have limited liability and no management control. LPs receive their capital back and preferred return before GPs receive carried interest.',
    example: 'Pension funds, endowments, family offices, and high-net-worth individuals are typical LPs in private equity funds.',
    related: ['GP', 'Capital Commitment', 'Preferred Return'],
    category: 'structure'
  },
  {
    term: 'GP (General Partner)',
    definition: 'The fund manager entity responsible for investment decisions, fund operations, and portfolio management. GPs typically earn management fees and carried interest.',
    example: 'Blackstone Group, KKR, and Sequoia Capital are examples of General Partners that manage private funds.',
    related: ['LP', 'Carried Interest', 'Management Fee'],
    category: 'structure'
  },

  // Economic terms
  {
    term: 'Carried Interest (Carry)',
    definition: 'The GP\'s share of fund profits after LPs receive their capital and preferred return. This is the primary performance-based compensation for fund managers.',
    example: 'With 20% carry on $50M of profits, the GP receives $10M in carried interest, while LPs receive $40M.',
    related: ['Promote', 'Profit Split', 'Effective Carry Rate'],
    category: 'economics'
  },
  {
    term: 'Preferred Return (Pref)',
    definition: 'The minimum annual return that must be paid to LPs before the GP participates in profits. Also called the "hurdle rate." Acts as a performance threshold that aligns GP incentives with LP returns.',
    example: 'An 8% annual pref on $100M over 5 years means LPs must receive $40M (simple) or ~$47M (compound) in returns before GP earns carry.',
    related: ['Hurdle Rate', 'Catch-Up', 'IRR'],
    category: 'economics'
  },
  {
    term: 'Hurdle Rate',
    definition: 'Synonym for preferred return. The minimum return threshold that must be achieved before the GP earns carried interest.',
    related: ['Preferred Return', 'IRR', 'Benchmark'],
    category: 'economics'
  },
  {
    term: 'GP Commitment',
    definition: 'The capital that the GP invests in the fund alongside LPs. Demonstrates alignment of interests and "skin in the game." This capital is subject to the same waterfall as LP capital.',
    example: 'A 2% GP commitment on a $100M fund means the GP invests $2M of their own capital.',
    related: ['LP', 'Alignment', 'Commitment'],
    category: 'economics'
  },
  {
    term: 'Management Fee',
    definition: 'An annual fee charged by the GP to cover fund operations, typically 1.5-2% of committed capital during the investment period. Separate from carried interest.',
    example: 'A $100M fund with 2% management fee pays $2M/year to the GP for operations.',
    related: ['Carried Interest', 'Fee Base', 'Investment Period'],
    category: 'economics'
  },
  {
    term: 'Compounding (Pref)',
    definition: 'Whether the preferred return accrues like simple interest or compounds annually. Compound pref results in higher hurdle amounts over time.',
    example: '8% compound pref over 5 years: $100M × (1.08^5 - 1) = $46.9M vs simple: $100M × 8% × 5 = $40M',
    related: ['Preferred Return', 'Simple Interest', 'IRR'],
    category: 'economics'
  },

  // Tier terms
  {
    term: 'Return of Capital (Tier 1)',
    definition: 'The first tier of the waterfall where LPs receive back their contributed capital before any profits are distributed. This ensures LPs recover their principal first.',
    example: 'If LPs contributed $100M and the fund returns $80M, all $80M goes to LPs as return of capital with no profits to distribute.',
    related: ['Contributed Capital', 'Principal', 'Waterfall'],
    category: 'tiers'
  },
  {
    term: 'GP Catch-Up (Tier 3)',
    definition: 'After LPs receive capital + pref, GP receives a larger share (often 100%) of the next distributions until GP has received their target carry percentage of ALL profits. Ensures GP receives full carry rate on successful funds.',
    example: 'With 20% carry and 100% catch-up, after pref is paid, GP receives 100% of distributions until they have 20% of all profits.',
    related: ['Carried Interest', 'Preferred Return', 'Profit Split'],
    category: 'tiers'
  },
  {
    term: 'Profit Split (Tier 4)',
    definition: 'After catch-up (if any), remaining profits are split between LPs and GP according to the carry rate. Typically 80/20 LP/GP.',
    example: 'With 20% carry, remaining profits after catch-up split 80% to LPs and 20% to GP.',
    related: ['Carried Interest', 'Catch-Up', 'Promote'],
    category: 'tiers'
  },
  {
    term: 'Catch-Up Rate',
    definition: 'The percentage of distributions GP receives during the catch-up tier. 100% = GP gets everything until caught up. 80% = GP gets 80%, LP gets 20% during catch-up.',
    example: 'With 80% catch-up rate, during Tier 3 the GP receives 80 cents of every dollar while LP receives 20 cents.',
    related: ['GP Catch-Up', 'Profit Split'],
    category: 'tiers'
  },

  // Metrics
  {
    term: 'MOIC (Multiple on Invested Capital)',
    definition: 'Total value returned divided by total capital invested. A 2.0x MOIC means investors doubled their money. Does not account for time value.',
    example: 'A $100M fund that returns $250M has a 2.5x MOIC. LPs who contributed $98M and received $196M have a 2.0x LP MOIC.',
    related: ['IRR', 'DPI', 'TVPI'],
    category: 'metrics'
  },
  {
    term: 'IRR (Internal Rate of Return)',
    definition: 'The annualized return that accounts for the timing of cash flows. A time-weighted measure that reflects how quickly capital was deployed and returned.',
    example: 'A 2x return over 3 years is ~26% IRR, while the same 2x over 7 years is only ~10% IRR.',
    related: ['MOIC', 'Time-Weighted Return', 'Hurdle Rate'],
    category: 'metrics'
  },
  {
    term: 'Effective Carry Rate',
    definition: 'The actual percentage of total profits received by the GP, which may differ from the stated carry rate depending on waterfall structure and preferred return.',
    example: 'A 20% carry rate might result in only 15% effective carry if catch-up is not complete, or exactly 20% with full catch-up.',
    related: ['Carried Interest', 'Catch-Up', 'Profit Split'],
    category: 'metrics'
  },
  {
    term: 'DPI (Distributions to Paid-In)',
    definition: 'Total cash distributions divided by total capital called. Measures realized returns. A DPI of 1.0x means all invested capital has been returned.',
    example: 'A fund that called $100M and distributed $150M has a 1.5x DPI.',
    related: ['MOIC', 'TVPI', 'RVPI'],
    category: 'metrics'
  },
  {
    term: 'Gross Proceeds',
    definition: 'Total cash received from all exits and distributions before any waterfall splits or fee deductions. The starting point for waterfall calculations.',
    example: 'If portfolio companies are sold for $200M total, gross proceeds = $200M before splits.',
    related: ['Net Proceeds', 'Exit', 'Distribution'],
    category: 'metrics'
  },

  // Provisions
  {
    term: 'Clawback',
    definition: 'A provision requiring the GP to return previously received carry if the fund as a whole underperforms at final liquidation. Common in American waterfalls to protect LPs.',
    example: 'If GP received $5M carry on early deals but final fund performance doesn\'t support it, GP must return some or all of that carry.',
    related: ['American Waterfall', 'Carried Interest', 'True-Up'],
    category: 'provisions'
  },
  {
    term: 'Escrow',
    definition: 'A portion of carried interest held back and placed in a separate account to cover potential clawback obligations. Typically 10-30% of carry.',
    example: 'With 20% escrow, for every $100 of carry earned, $20 is held in escrow until fund liquidation.',
    related: ['Clawback', 'Carried Interest', 'Reserve'],
    category: 'provisions'
  },
  {
    term: 'LPA (Limited Partnership Agreement)',
    definition: 'The legal contract governing the fund, including investment terms, fee structure, waterfall mechanics, GP/LP rights, and governance. The definitive source for waterfall calculations.',
    example: 'The LPA specifies the exact formula for preferred return calculation, catch-up mechanics, and distribution procedures.',
    related: ['Side Letter', 'Fund Terms', 'Governance'],
    category: 'provisions'
  },
  {
    term: 'True-Up',
    definition: 'A reconciliation payment at fund liquidation to ensure distributions match the waterfall terms. May require GP clawback or additional LP distributions.',
    example: 'If final calculations show GP received $1M more than entitled, they must true-up by returning $1M.',
    related: ['Clawback', 'Final Distribution', 'Reconciliation'],
    category: 'provisions'
  },
  {
    term: 'Recycling',
    definition: 'Reinvesting proceeds from early exits rather than distributing them, effectively increasing the capital available to invest. Subject to LPA limits.',
    example: 'A $100M fund might reinvest $20M of early proceeds, allowing $120M total deployment.',
    related: ['Investment Period', 'Capital Calls', 'Distributions'],
    category: 'provisions'
  }
]

const categoryLabels: Record<string, { label: string; color: string }> = {
  structure: { label: 'Structure', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  economics: { label: 'Economics', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  tiers: { label: 'Tiers', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  metrics: { label: 'Metrics', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  provisions: { label: 'Provisions', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200' }
}

interface GlossaryProps {
  compact?: boolean
  initialSearchTerm?: string
}

export function Glossary({ compact = false, initialSearchTerm = '' }: GlossaryProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredTerms = glossaryTerms.filter(item => {
    const matchesSearch =
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleTerm = (term: string) => {
    setExpandedTerms(prev => {
      const next = new Set(prev)
      if (next.has(term)) {
        next.delete(term)
      } else {
        next.add(term)
      }
      return next
    })
  }

  const categories = Object.keys(categoryLabels)

  if (compact) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Quick Reference</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {filteredTerms.slice(0, 8).map((item) => (
              <button
                key={item.term}
                onClick={() => toggleTerm(item.term)}
                className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{item.term}</span>
                  {expandedTerms.has(item.term) ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                {expandedTerms.has(item.term) && (
                  <p className="text-xs text-muted-foreground mt-1">{item.definition}</p>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <CardTitle>Waterfall Glossary</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Essential terms for understanding distribution waterfall mechanics
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search glossary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All ({glossaryTerms.length})
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {categoryLabels[cat].label} ({glossaryTerms.filter(t => t.category === cat).length})
            </Button>
          ))}
        </div>

        {/* Terms list */}
        <div className="space-y-3">
          {filteredTerms.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No terms found matching "{searchTerm}"
            </p>
          ) : (
            filteredTerms.map((item) => (
              <div
                key={item.term}
                className="rounded-lg border border-border bg-background overflow-hidden"
              >
                <button
                  onClick={() => toggleTerm(item.term)}
                  className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">{item.term}</h4>
                        <Badge variant="secondary" className={categoryLabels[item.category].color}>
                          {categoryLabels[item.category].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.definition}
                      </p>
                    </div>
                    {expandedTerms.has(item.term) ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </button>

                {expandedTerms.has(item.term) && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                    <p className="text-sm text-foreground">{item.definition}</p>

                    {item.example && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Example:</p>
                        <p className="text-sm text-foreground">{item.example}</p>
                      </div>
                    )}

                    {item.related && item.related.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Related terms:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.related.map((related) => (
                            <button
                              key={related}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSearchTerm(related)
                                setExpandedTerms(new Set([related]))
                              }}
                              className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              {related}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Showing {filteredTerms.length} of {glossaryTerms.length} terms
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Export individual term lookup for use in InfoPopovers
export function getGlossaryTerm(termName: string): GlossaryTerm | undefined {
  return glossaryTerms.find(t =>
    t.term.toLowerCase() === termName.toLowerCase() ||
    t.term.toLowerCase().includes(termName.toLowerCase())
  )
}

export { glossaryTerms }
