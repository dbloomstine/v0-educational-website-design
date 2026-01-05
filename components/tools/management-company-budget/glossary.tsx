'use client'

import { GlossaryBase, type GlossaryTerm, type GlossaryCategoryConfig, findGlossaryTerm } from '@/components/tools/shared'
import { Button } from '@/components/ui/button'
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
import { Book } from 'lucide-react'

/**
 * Glossary terms for Management Company Budget Tool
 */
export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // Fund Structure
  {
    term: 'Management Company (ManCo)',
    definition: 'The legal entity that manages the fund and employs the investment team. Receives management fees and typically owns the carried interest.',
    example: 'ABC Ventures Management LLC manages ABC Ventures Fund I, LP',
    related: ['General Partner', 'Limited Partner'],
    category: 'fund-structure'
  },
  {
    term: 'General Partner (GP)',
    definition: 'The partner responsible for managing the fund\'s investments and operations. Usually the same entity as or affiliated with the Management Company.',
    related: ['Limited Partner', 'Management Company'],
    category: 'fund-structure'
  },
  {
    term: 'Limited Partner (LP)',
    definition: 'Investors in the fund who contribute capital but have limited liability and no role in day-to-day management. Includes institutions, family offices, and high-net-worth individuals.',
    example: 'University endowments, pension funds, and fund-of-funds are common LPs',
    related: ['General Partner', 'Commitment'],
    category: 'fund-structure'
  },
  {
    term: 'Commitment',
    definition: 'The total amount an LP agrees to invest in the fund over its life. Capital is drawn down (called) as needed for investments.',
    example: 'An LP with a $10M commitment may have only $3M called in the first year',
    related: ['Capital Call', 'Paid-In Capital'],
    category: 'fund-structure'
  },
  {
    term: 'Capital Call',
    definition: 'A demand from the GP to LPs to contribute a portion of their committed capital, typically to fund new investments.',
    related: ['Commitment', 'Paid-In Capital'],
    category: 'fund-structure'
  },
  {
    term: 'AUM (Assets Under Management)',
    definition: 'The total market value of assets that the management company manages on behalf of investors.',
    related: ['Commitment', 'Fund Size'],
    category: 'fund-structure'
  },

  // Fees
  {
    term: 'Management Fee',
    definition: 'Annual fee paid by LPs to the GP/ManCo to cover fund operations. Typically 1.5-2.5% of committed capital during investment period, often stepping down after.',
    example: 'A $100M fund with 2% fee generates $2M/year for the management company',
    related: ['Fee Basis', 'Carry'],
    category: 'fees'
  },
  {
    term: 'Fee Basis',
    definition: 'The amount on which management fees are calculated. Usually committed capital during investment period, then may switch to invested capital.',
    example: 'Fees on committed capital: full $100M. Fees on invested capital: only the $60M deployed',
    related: ['Management Fee', 'Commitment'],
    category: 'fees'
  },
  {
    term: 'Carried Interest (Carry)',
    definition: 'The GP\'s share of fund profits, typically 20%, received after LPs have received their capital back plus a preferred return.',
    example: 'On $50M of profits, 20% carry = $10M to the GP, $40M to LPs (simplified)',
    related: ['Hurdle Rate', 'Waterfall'],
    category: 'fees'
  },
  {
    term: 'Hurdle Rate (Preferred Return)',
    definition: 'The minimum annual return LPs must receive before the GP can collect carried interest. Typically 8%.',
    related: ['Carried Interest', 'Waterfall'],
    category: 'fees'
  },
  {
    term: 'Waterfall',
    definition: 'The order in which fund distributions are made to LPs and GP, including return of capital, preferred return, catch-up, and profit split.',
    related: ['Carried Interest', 'Hurdle Rate'],
    category: 'fees'
  },

  // Operations
  {
    term: 'Fund Administrator',
    definition: 'Third-party service provider handling fund accounting, investor reporting, capital call processing, and compliance. Essential for institutional-quality operations.',
    example: 'Common administrators: Carta, Juniper Square, Allvue',
    category: 'operations'
  },
  {
    term: 'First Close',
    definition: 'The initial closing of the fund when the first group of LPs commits capital and the fund can begin investing. Often 25-50% of target fund size.',
    example: 'Target $100M fund holds first close at $40M, then continues fundraising',
    related: ['Final Close', 'Commitment'],
    category: 'operations'
  },
  {
    term: 'Final Close',
    definition: 'The last date on which new investors can commit to the fund. Typically 12-18 months after first close.',
    related: ['First Close', 'Commitment'],
    category: 'operations'
  },
  {
    term: 'Investment Period',
    definition: 'The period (usually 3-5 years) during which the fund actively makes new investments. After this, capital is reserved for follow-ons.',
    related: ['Fund Term', 'Commitment Period'],
    category: 'operations'
  },
  {
    term: 'Fund Term',
    definition: 'The total life of the fund, typically 10 years with options to extend. Covers investment period plus harvest period for exits.',
    related: ['Investment Period'],
    category: 'operations'
  },

  // Metrics
  {
    term: 'Runway',
    definition: 'The number of months the management company can operate on starting capital before needing management fee income.',
    example: '$500K starting capital ÷ $25K monthly burn = 20 months runway',
    related: ['Monthly Burn', 'Break-even'],
    category: 'metrics'
  },
  {
    term: 'Monthly Burn Rate',
    definition: 'The total monthly operating expenses of the management company, including team compensation and overhead.',
    related: ['Runway', 'Operating Budget'],
    category: 'metrics'
  },
  {
    term: 'Break-even AUM',
    definition: 'The assets under management required for management fee revenue to cover operating expenses.',
    example: 'At $300K/year expenses and 2% fee: break-even AUM = $15M',
    related: ['Management Fee', 'Monthly Burn'],
    category: 'metrics'
  },
  {
    term: 'J-Curve',
    definition: 'The pattern of fund returns over time: initially negative (fees and costs exceed gains) before turning positive as investments mature.',
    related: ['IRR', 'DPI'],
    category: 'metrics'
  },

  // Legal
  {
    term: 'LPA (Limited Partnership Agreement)',
    definition: 'The legal document governing the fund\'s terms, including fees, carry, investment restrictions, and GP/LP rights.',
    related: ['Side Letter', 'PPM'],
    category: 'legal'
  },
  {
    term: 'Side Letter',
    definition: 'Separate agreement with specific LPs granting special terms like fee discounts, co-investment rights, or enhanced reporting.',
    related: ['LPA', 'MFN'],
    category: 'legal'
  },
  {
    term: 'PPM (Private Placement Memorandum)',
    definition: 'The offering document provided to prospective LPs describing the fund, strategy, risks, and terms.',
    related: ['LPA', 'DDQ'],
    category: 'legal'
  },
  {
    term: 'Form ADV',
    definition: 'SEC registration document required for investment advisers managing over $150M, disclosing business practices and conflicts.',
    category: 'legal'
  },
  {
    term: 'ILPA (Institutional Limited Partners Association)',
    definition: 'Industry organization representing LPs that publishes best practices and templates for fund terms and reporting.',
    related: ['LPA', 'Reporting'],
    category: 'legal'
  }
]

/**
 * Category configuration for ManCo Budget Glossary
 */
export const MANCO_GLOSSARY_CATEGORIES: Record<string, GlossaryCategoryConfig> = {
  'fund-structure': { label: 'Fund Structure' },
  'fees': { label: 'Fees & Economics' },
  'operations': { label: 'Operations' },
  'metrics': { label: 'Metrics & Analysis' },
  'legal': { label: 'Legal & Compliance' }
}

interface GlossaryProps {
  className?: string
}

export function Glossary({ className }: GlossaryProps) {
  return (
    <GlossaryBase
      terms={GLOSSARY_TERMS}
      title="Glossary"
      categoryLabels={MANCO_GLOSSARY_CATEGORIES}
      showSearch
      showCategoryFilter
      enableRelatedLinks
      className={className}
    />
  )
}

/**
 * Inline tooltip version for use within text
 */
interface GlossaryTooltipProps {
  term: string
  children?: React.ReactNode
}

export function GlossaryTooltip({ term, children }: GlossaryTooltipProps) {
  const glossaryTerm = findGlossaryTerm(GLOSSARY_TERMS, term)

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

/**
 * Full-page glossary dialog
 */
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
