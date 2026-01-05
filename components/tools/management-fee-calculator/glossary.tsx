'use client'

import { GlossaryBase, type GlossaryTerm, type GlossaryCategoryConfig } from '@/components/tools/shared'

/**
 * Glossary terms for Management Fee Calculator
 */
export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // Basics
  {
    id: 'management-fee',
    term: 'Management Fee',
    definition: 'An annual fee paid by the fund to the GP (General Partner) to cover operational costs. Typically calculated as a percentage of committed capital, invested capital, or NAV.',
    example: 'A 2% management fee on a $100M fund generates $2M per year for the GP.',
    category: 'basics',
    related: ['Fee Basis', 'GP', 'LP']
  },
  {
    id: 'gp',
    term: 'General Partner (GP)',
    definition: 'The fund manager who makes investment decisions and runs day-to-day operations. The GP earns management fees and carried interest.',
    category: 'basics',
    related: ['LP', 'Management Fee']
  },
  {
    id: 'lp',
    term: 'Limited Partner (LP)',
    definition: 'Investors who commit capital to the fund but have limited liability and no management control. LPs pay management fees and share profits with the GP.',
    category: 'basics',
    related: ['GP', 'Committed Capital']
  },
  {
    id: 'lpa',
    term: 'Limited Partnership Agreement (LPA)',
    definition: 'The legal document that governs the fund, including fee structures, investment restrictions, and GP/LP rights. Management fee terms are defined here.',
    example: 'The LPA might specify: "2% on commitments during years 1-5, then 1.5% on invested capital thereafter."',
    category: 'basics',
    related: ['Management Fee', 'Fee Basis']
  },

  // Fee Types
  {
    id: 'committed-capital',
    term: 'Committed Capital',
    definition: 'The total amount LPs have legally committed to invest in the fund, regardless of how much has actually been called. Often used as the fee basis during the investment period.',
    example: 'If an LP commits $10M to a fund, fees are charged on the full $10M even if only $5M has been called.',
    category: 'fee-types',
    related: ['Invested Cost', 'Capital Call']
  },
  {
    id: 'invested-cost',
    term: 'Invested Cost (or Net Invested Capital)',
    definition: 'The actual capital that has been deployed into portfolio investments. Often used as the fee basis after the investment period to align fees with activity.',
    example: 'If $50M of a $100M fund has been invested, fees on invested cost would be calculated on $50M.',
    category: 'fee-types',
    related: ['Committed Capital', 'NAV']
  },
  {
    id: 'nav',
    term: 'Net Asset Value (NAV)',
    definition: 'The current fair market value of the fund\'s portfolio. Using NAV as a fee basis means fees rise and fall with portfolio performance.',
    example: 'If investments purchased for $50M are now worth $75M, NAV-based fees would be charged on $75M.',
    category: 'fee-types',
    related: ['Invested Cost', 'Fair Value']
  },
  {
    id: 'fair-value',
    term: 'Fair Value',
    definition: 'The estimated market price of an asset. For private investments, this is determined through valuation methodologies (comparable transactions, DCF, etc.).',
    category: 'fee-types',
    related: ['NAV', 'Lower of']
  },
  {
    id: 'lower-of',
    term: 'Lower of Cost or Fair Value',
    definition: 'A conservative fee basis that uses the lesser of invested cost or current fair value. Considered LP-friendly as it limits fees if portfolio value declines.',
    example: 'If $50M was invested but portfolio is now worth $40M, fees are charged on $40M (the lower amount).',
    category: 'fee-types',
    related: ['Invested Cost', 'Fair Value', 'NAV']
  },

  // Calculation
  {
    id: 'fee-basis',
    term: 'Fee Basis (or Fee Base)',
    definition: 'The amount on which management fees are calculated. Common bases include committed capital, invested cost, NAV, or lower of cost/FV.',
    category: 'calculation',
    related: ['Committed Capital', 'Invested Cost', 'NAV']
  },
  {
    id: 'fee-rate',
    term: 'Fee Rate',
    definition: 'The annual percentage charged on the fee basis. Standard PE/VC rates are 1.5-2.5%, while credit and real estate may be lower.',
    example: 'A 2% fee rate on $50M fee basis = $1M annual management fee.',
    category: 'calculation',
    related: ['Fee Basis', 'Two and Twenty']
  },
  {
    id: 'two-and-twenty',
    term: 'Two and Twenty (2 and 20)',
    definition: 'The traditional private equity fee structure: 2% annual management fee plus 20% carried interest on profits. Increasingly being negotiated down.',
    category: 'calculation',
    related: ['Fee Rate', 'Carried Interest']
  },
  {
    id: 'carried-interest',
    term: 'Carried Interest (Carry)',
    definition: 'The GP\'s share of fund profits, typically 20%. Unlike management fees, carry is only earned when returns exceed the hurdle rate.',
    category: 'calculation',
    related: ['Two and Twenty', 'Hurdle Rate']
  },

  // Structure
  {
    id: 'investment-period',
    term: 'Investment Period',
    definition: 'The timeframe (typically 3-5 years) during which the GP can make new investments. Management fees are often higher during this period.',
    example: 'A 10-year fund with a 4-year investment period would have years 1-4 as the investment period.',
    category: 'structure',
    related: ['Harvest Period', 'Fund Term']
  },
  {
    id: 'harvest-period',
    term: 'Harvest Period',
    definition: 'The period after the investment period when the GP focuses on managing and exiting existing investments. Fees often step down during this phase.',
    category: 'structure',
    related: ['Investment Period', 'Step-Down']
  },
  {
    id: 'fund-term',
    term: 'Fund Term',
    definition: 'The total lifespan of the fund, typically 10 years for PE/VC with possible extensions. Management fees are charged throughout this period.',
    category: 'structure',
    related: ['Investment Period', 'Extension']
  },
  {
    id: 'step-down',
    term: 'Fee Step-Down',
    definition: 'A reduction in the management fee rate after a specified period, usually the end of the investment period. Aligns GP incentives with LP interests.',
    example: 'A step-down from 2.0% to 1.5% after year 5 reduces total fees over the fund life.',
    category: 'structure',
    related: ['Investment Period', 'Harvest Period']
  },
  {
    id: 'fee-phase',
    term: 'Fee Phase',
    definition: 'A period with consistent fee terms. Most funds have two phases: investment period (higher fees on commitments) and harvest period (lower fees on invested capital).',
    category: 'structure',
    related: ['Step-Down', 'Investment Period']
  },

  // Negotiation
  {
    id: 'fee-holiday',
    term: 'Fee Holiday (or Fee Waiver)',
    definition: 'A period where management fees are reduced or eliminated, often offered to first-close investors as an incentive for early commitment.',
    example: 'First-close LPs might receive a 6-month fee holiday, reducing their total fee burden.',
    category: 'negotiation',
    related: ['Fee Offset', 'MFN']
  },
  {
    id: 'fee-offset',
    term: 'Fee Offset',
    definition: 'A reduction in management fees based on other income the GP receives (e.g., transaction fees, monitoring fees). 100% offset means full reduction.',
    example: 'If the GP earns $500K in transaction fees with 100% offset, management fees are reduced by $500K.',
    category: 'negotiation',
    related: ['Fee Holiday', 'Transaction Fee']
  },
  {
    id: 'mfn',
    term: 'Most Favored Nation (MFN)',
    definition: 'A clause ensuring an LP receives terms at least as favorable as any other LP. If one LP negotiates lower fees, MFN-holders get the same benefit.',
    category: 'negotiation',
    related: ['Side Letter', 'Fee Holiday']
  },
  {
    id: 'side-letter',
    term: 'Side Letter',
    definition: 'A separate agreement between the GP and a specific LP that modifies the standard LPA terms. Often includes fee discounts for large LPs.',
    category: 'negotiation',
    related: ['MFN', 'Fee Holiday']
  }
]

/**
 * Category configuration for Management Fee Calculator Glossary
 */
export const FEE_GLOSSARY_CATEGORIES: Record<string, GlossaryCategoryConfig> = {
  'basics': { label: 'Basics', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  'fee-types': { label: 'Fee Types & Bases', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  'calculation': { label: 'Fee Calculation', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  'structure': { label: 'Fund Structure', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  'negotiation': { label: 'Negotiation Terms', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300' }
}

interface GlossaryProps {
  onTermRead?: (termId: string) => void
  onClose?: () => void
}

export function Glossary({ onTermRead, onClose }: GlossaryProps) {
  return (
    <GlossaryBase
      terms={GLOSSARY_TERMS}
      title="Fee Glossary"
      categoryLabels={FEE_GLOSSARY_CATEGORIES}
      showSearch
      showCategoryFilter
      showXpIndicator
      xpAmount={5}
      onTermRead={onTermRead}
      onClose={onClose}
      enableRelatedLinks
    />
  )
}
