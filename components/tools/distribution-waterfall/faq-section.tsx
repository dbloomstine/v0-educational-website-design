'use client'

import { FAQBase, type FAQItem, type FAQCategoryConfig } from '@/components/tools/shared'

/**
 * FAQ data for Distribution Waterfall Calculator
 */
export const WATERFALL_FAQS: FAQItem[] = [
  // Basics
  {
    id: 'what-is-waterfall',
    question: 'What is a distribution waterfall?',
    answer: 'A distribution waterfall is the contractual mechanism that determines how profits from a private fund are distributed between the Limited Partners (LPs) and the General Partner (GP). It\'s called a "waterfall" because proceeds flow down through sequential tiers - each tier must be filled before excess proceeds cascade to the next level. The standard tiers are: (1) Return of Capital, (2) Preferred Return, (3) GP Catch-Up, and (4) Profit Split.',
    category: 'basics'
  },
  {
    id: 'why-matters',
    question: 'Why does waterfall structure matter to investors?',
    answer: 'The waterfall structure significantly impacts how much money LPs and GPs receive at different performance levels. A well-structured waterfall aligns incentives: GPs are motivated to generate strong returns because they only earn meaningful carry after exceeding the hurdle rate. For LPs, understanding the waterfall helps evaluate fund terms and compare different investment opportunities. Small differences in terms (like 6% vs 8% pref, or European vs American) can mean millions in different distributions.',
    category: 'basics'
  },
  {
    id: 'when-gp-paid',
    question: 'When does the GP start receiving carried interest?',
    answer: 'In a European (whole-fund) waterfall, the GP receives carry only after ALL contributed capital plus the preferred return has been distributed to LPs. In an American (deal-by-deal) waterfall, the GP can receive carry on individual profitable deals even before the entire fund has returned capital - though this is typically subject to a clawback provision. The timing depends on fund performance and the specific waterfall terms in the LPA.',
    category: 'basics'
  },
  {
    id: 'difference-fee-carry',
    question: 'What\'s the difference between management fee and carried interest?',
    answer: 'Management fee is a fixed annual charge (typically 1.5-2% of committed capital) that pays for fund operations regardless of performance. Carried interest is a share of profits (typically 20%) earned only when the fund generates returns above the preferred return hurdle. Management fees are predictable income for GPs; carry is performance-based compensation that creates alignment with LPs.',
    category: 'basics'
  },

  // Structure
  {
    id: 'european-vs-american',
    question: 'What\'s the difference between European and American waterfalls?',
    answer: 'European (whole-fund) waterfalls require all contributed capital plus preferred return to be distributed to LPs before any carry is paid. American (deal-by-deal) waterfalls allow carry on individual profitable investments before the fund as a whole has returned capital. European is more LP-friendly; American lets GPs receive carry earlier. Most buyout PE funds use European; many VC funds use American with clawback provisions.',
    category: 'structure'
  },
  {
    id: 'which-better-lp',
    question: 'Which waterfall type is better for LPs?',
    answer: 'European (whole-fund) waterfalls are generally more LP-friendly because GP carry is only paid after ALL LP capital and preferred returns are distributed. This protects LPs from scenarios where GP earns carry on early winners while later investments lose money. However, American waterfalls with strong clawback provisions can ultimately provide similar protection - the difference is mainly timing of when GP receives carry.',
    category: 'structure'
  },
  {
    id: 'what-is-clawback',
    question: 'What is a clawback provision?',
    answer: 'A clawback requires the GP to return previously received carried interest if the fund\'s final performance doesn\'t justify it. This is especially important in American waterfalls where GP may receive early carry. At fund liquidation, if total distributions to GP exceed what they\'d receive under a whole-fund calculation, they must return the excess. Clawbacks are typically backed by escrow (10-30% of carry held back) and GP personal guarantees.',
    category: 'structure'
  },

  // Economics
  {
    id: 'typical-pref-rate',
    question: 'What is a typical preferred return rate?',
    answer: 'The standard preferred return (hurdle rate) is 8% annually for most PE and credit funds. Real estate funds also commonly use 6-8%. Some VC funds have 0% pref or none at all. Higher pref rates (10%+) are rare and typically only seen in funds with lower risk profiles or in negotiations with large anchor LPs. The pref can be simple (linear) or compound (like a loan accruing interest).',
    category: 'economics'
  },
  {
    id: 'standard-carry',
    question: 'What is the standard carried interest percentage?',
    answer: 'The industry standard is 20% carried interest, part of the famous "2 and 20" model (2% management fee + 20% carry). However, terms vary: emerging managers may accept 15-18% to attract capital; top-tier managers with strong track records may negotiate 25-30%. Some funds have tiered carry that increases with performance (e.g., 20% up to 2x, 25% above 2x).',
    category: 'economics'
  },
  {
    id: 'catch-up-explained',
    question: 'How does the GP catch-up work?',
    answer: 'After LPs receive their capital and preferred return, the catch-up allows GP to receive a larger share of distributions (often 100%) until they\'ve "caught up" to their target carry percentage of TOTAL profits. Without catch-up, GP would only earn carry on profits ABOVE the pref amount, resulting in a lower effective carry rate. With 100% catch-up and 20% carry, GP gets 100% of distributions after pref until they have 20% of all profits, then it splits 80/20.',
    category: 'economics'
  },
  {
    id: 'effective-carry-lower',
    question: 'Why is my effective carry rate different from the stated carry rate?',
    answer: 'The effective carry rate (GP\'s actual share of total profits) can differ from the stated rate due to: (1) No catch-up provision - GP only earns carry on profits above pref, not on the pref itself; (2) Partial catch-up (e.g., 80%) - GP doesn\'t fully catch up; (3) Low returns - if barely above pref, most profit goes to LP. With a proper 100% catch-up, effective carry should equal stated carry at any return level above the hurdle.',
    category: 'economics'
  },
  {
    id: 'gp-commitment-typical',
    question: 'How much should a GP commit to their own fund?',
    answer: 'Standard GP commitments range from 1-5% of fund size, with 1-2% being most common. Larger commitments (3-5%) signal stronger GP conviction and are viewed favorably by LPs. Some LPs require minimum GP commitment as a condition of investment. The GP commitment flows through the same waterfall as LP capital, providing alignment. For a $100M fund, a 2% commitment means $2M of GP capital at risk.',
    category: 'economics'
  },

  // Negotiation
  {
    id: 'negotiate-terms',
    question: 'Can LP investors negotiate waterfall terms?',
    answer: 'Large institutional LPs (anchor investors, typically committing $25M+) often negotiate preferential terms via side letters. Common negotiated items include: fee discounts, co-investment rights, better information rights, and occasionally pref rate adjustments. Smaller LPs typically accept standard terms. Fund terms are more negotiable for emerging managers seeking anchor LPs, and less flexible for established managers with oversubscribed funds.',
    category: 'negotiation'
  },
  {
    id: 'fund-terms-compared',
    question: 'How do I compare waterfall terms across different funds?',
    answer: 'Key metrics to compare: (1) Pref rate - higher is more LP-friendly; (2) Waterfall type - European more LP-protective; (3) Catch-up - 100% is GP-friendly, partial or none is LP-friendly; (4) Carry rate - lower is better for LPs; (5) GP commitment - higher shows alignment; (6) Clawback strength - important for American waterfalls. Model different scenarios (1.5x, 2x, 3x returns) to see actual dollar differences.',
    category: 'negotiation'
  },
  {
    id: 'emerging-manager-terms',
    question: 'What waterfall terms are typical for emerging managers?',
    answer: 'Emerging managers (Fund I/II) often offer more LP-friendly terms to attract capital: 15-18% carry (vs 20%), 8% pref with catch-up, European waterfall, 2-3% GP commitment. They may also offer reduced or waived management fees for anchor LPs. As managers establish track records, they typically move toward standard market terms. Some emerging managers keep standard terms but offer larger co-investment allocations.',
    category: 'negotiation'
  },

  // Advanced
  {
    id: 'compound-vs-simple',
    question: 'What\'s the difference between simple and compound preferred return?',
    answer: 'Simple pref: Pref Return = Capital × Rate × Years (linear accrual). Compound pref: Pref compounds annually like interest, so Pref Return = Capital × ((1 + Rate)^Years - 1). Example with $100M, 8% over 5 years: Simple = $40M; Compound = $46.9M. Compound is more LP-friendly but less common. Most funds use simple pref for easier calculation, though compound is sometimes seen in credit funds.',
    category: 'advanced'
  },
  {
    id: 'recycling-impact',
    question: 'How does capital recycling affect the waterfall?',
    answer: 'Recycling allows reinvesting early exit proceeds rather than distributing them, effectively increasing deployable capital beyond the committed amount. This can delay distributions but potentially improve returns. LPAs typically cap recycling (e.g., up to 120% of commitments). For waterfall purposes, only final distributions flow through the waterfall - interim recycled capital doesn\'t trigger distribution calculations.',
    category: 'advanced'
  },
  {
    id: 'deal-by-deal-model',
    question: 'How should I model a true deal-by-deal waterfall?',
    answer: 'True deal-by-deal waterfalls calculate carry on each investment separately, requiring: (1) Individual deal capital contributions and timing; (2) Each deal\'s exit proceeds and timing; (3) Deal-level pref calculation; (4) Running carry balance across deals; (5) Clawback reconciliation at fund end. This tool shows fund-level results assuming simultaneous exits - for true deal-by-deal, you\'d need investment-level modeling with cash flow timing.',
    category: 'advanced'
  },
  {
    id: 'escrow-amount',
    question: 'How much carry is typically held in escrow?',
    answer: 'Escrow provisions typically hold back 10-30% of carried interest to cover potential clawback obligations. The specific amount is negotiated in the LPA. Escrowed carry is released gradually as fund performance becomes more certain, often with accelerated release in later years. Some funds use GP personal guarantees instead of or in addition to escrow. The escrow protects LPs without requiring immediate clawback from GPs.',
    category: 'advanced'
  },
  {
    id: 'tax-implications',
    question: 'Are there tax implications to waterfall structure?',
    answer: 'Yes, significant ones. Carried interest is generally taxed as long-term capital gains (lower rate) if held 3+ years, versus ordinary income for management fees. The timing of distributions can affect tax year of recognition. K-1 statements reflect each LP\'s share of income, gains, and losses. Consult tax advisors for fund-specific implications. This tool focuses on economics, not tax optimization.',
    category: 'advanced'
  }
]

/**
 * Category configuration for Waterfall FAQs
 */
export const WATERFALL_FAQ_CATEGORIES: Record<string, FAQCategoryConfig> = {
  basics: { label: 'Getting Started', description: 'Fundamental concepts' },
  structure: { label: 'Waterfall Structure', description: 'European vs American' },
  economics: { label: 'Economic Terms', description: 'Pref, carry, catch-up' },
  negotiation: { label: 'Negotiation & Comparison', description: 'Evaluating fund terms' },
  advanced: { label: 'Advanced Topics', description: 'Complex scenarios' }
}

interface FAQSectionProps {
  compact?: boolean
}

export function FAQSection({ compact = false }: FAQSectionProps) {
  if (compact) {
    return (
      <FAQBase
        items={WATERFALL_FAQS}
        compact
        compactLimit={5}
        accordionMode
      />
    )
  }

  return (
    <FAQBase
      items={WATERFALL_FAQS}
      title="Frequently Asked Questions"
      subtitle="Everything you need to know about distribution waterfalls"
      categoryLabels={WATERFALL_FAQ_CATEGORIES}
      showSearch
      showCategoryFilter
      accordionMode
    />
  )
}
