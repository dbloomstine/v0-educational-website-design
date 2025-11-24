import { SideLetterData } from './types'

export function getSampleData(): SideLetterData {
  return {
    fund: {
      name: 'Acme Ventures Fund II, LP',
      type: 'Venture Capital',
      vintage: 2024,
      standardFee: 2.0,
      standardCarry: 20.0,
      term: 10
    },
    investors: [
      {
        id: '1',
        name: 'State Teachers Pension Fund',
        commitment: 30,
        category: 'Pension',
        regulatory: { erisa: true, act40: false, aifmd: false, other: false }
      },
      {
        id: '2',
        name: 'University Endowment',
        commitment: 15,
        category: 'Endowment',
        regulatory: { erisa: false, act40: false, aifmd: false, other: false }
      },
      {
        id: '3',
        name: 'Global Sovereign Fund',
        commitment: 50,
        category: 'Sovereign Wealth Fund',
        regulatory: { erisa: false, act40: false, aifmd: false, other: false }
      },
      {
        id: '4',
        name: 'Tech Family Office',
        commitment: 8,
        category: 'Family Office',
        regulatory: { erisa: false, act40: false, aifmd: false, other: false }
      },
      {
        id: '5',
        name: 'Insurance Co Investment Arm',
        commitment: 20,
        category: 'Insurance',
        regulatory: { erisa: false, act40: true, aifmd: false, other: false }
      }
    ],
    clauses: [
      {
        id: '1',
        investorId: '1',
        category: 'mfn',
        description: 'Full MFN rights for all economic and non-economic terms granted to investors with $25M+ commitments'
      },
      {
        id: '2',
        investorId: '1',
        category: 'reporting',
        description: 'Quarterly portfolio company-level detail and ESG impact reporting'
      },
      {
        id: '3',
        investorId: '3',
        category: 'fees',
        description: 'Management fee discount to 1.75% (0.25% below standard)'
      },
      {
        id: '4',
        investorId: '3',
        category: 'mfn',
        description: 'Economic MFN only (fees and carry), excludes regulatory provisions'
      },
      {
        id: '5',
        investorId: '3',
        category: 'coinvest',
        description: 'Co-investment rights for all deals $10M+, no fee/no carry up to 2x commitment'
      },
      {
        id: '6',
        investorId: '5',
        category: 'regulatory',
        description: '40 Act diversification compliance monitoring and quarterly certification'
      },
      {
        id: '7',
        investorId: '5',
        category: 'reporting',
        description: 'Monthly capital account statements for regulatory compliance'
      },
      {
        id: '8',
        investorId: '2',
        category: 'esg',
        description: 'Exclusion of tobacco, private prisons, and fossil fuel investments'
      }
    ],
    mfnConfig: {
      tier1Threshold: 25,
      tier2Threshold: 10,
      tier1Scope: ['fees', 'reporting', 'coinvest'],
      tier2Scope: ['fees'],
      exclusions: 'Regulatory-driven provisions (ERISA, 40 Act compliance)\nESG-specific exclusion rights\nTerms granted solely for legal or regulatory reasons'
    },
    scenarios: []
  }
}

export const CLAUSE_TEMPLATES = {
  fees: [
    'Management fee discount of [X]% from standard rate',
    'Management fee discount to [X]% flat',
    'Carry reduction to [X]%',
    'Fee step-down after year [X]',
    'Fee waiver during investment period',
    'Reduced organizational expenses allocation'
  ],
  mfn: [
    'Full MFN rights (economic and non-economic terms)',
    'Economic MFN only (fees and carry)',
    'Fee MFN only',
    'MFN with commitment threshold of $[X]M',
    'MFN limited to same investor category',
    'MFN with carve-outs for regulatory provisions'
  ],
  liquidity: [
    'Redemption rights after year [X]',
    'Quarterly liquidity windows',
    'Transfer rights without GP consent',
    'Reduced lock-up period',
    'Early withdrawal option with [X]% penalty',
    'Secondary transfer facilitation rights'
  ],
  reporting: [
    'Monthly (vs quarterly) capital account statements',
    'Portfolio company-level detail',
    'Access to annual audited financials',
    'Quarterly investment pipeline updates',
    'ESG impact reporting',
    'Separate side letter confirmation of compliance'
  ],
  esg: [
    'Exclusion of tobacco, firearms, fossil fuels',
    'Positive ESG screening requirements',
    'Impact measurement and reporting',
    'Excuse rights for investments violating ESG policy',
    'Board diversity requirements',
    'Climate risk assessment disclosure'
  ],
  coinvest: [
    'Co-investment rights for deals $[X]M+',
    'Right to invest up to [X]% of total commitment',
    'No-fee/no-carry co-investment up to $[X]M',
    'First look/ROFR on co-investment opportunities',
    'Pro rata allocation right in syndication',
    'Separate co-investment vehicle option'
  ],
  regulatory: [
    'ERISA plan asset compliance provisions',
    '40 Act diversification requirements',
    'AIFMD reporting and disclosure',
    'UBTI blocking structures',
    'Tax information and K-1 timing',
    'Regulatory audit cooperation'
  ],
  excuse: [
    'Excuse rights for investments in certain sectors',
    'Key person excuse and suspension rights',
    'Conflict of interest excuse rights',
    'Geographic/industry concentration limits',
    'Excuse rights for investments over $[X]M',
    'Portfolio company governance excuse rights'
  ],
  other: [
    'Capacity rights to increase commitment by [X]%',
    'Advisory committee seat',
    'Consent rights for GP removal',
    'Separate account option at $[X]M',
    'Key person definition modification',
    'Clawback/GP commitment modification'
  ]
}
