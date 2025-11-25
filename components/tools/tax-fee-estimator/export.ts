import { PricingOutput, TaxInput, formatCurrency } from './pricingData'

export function exportTaxPricing(output: PricingOutput, input: TaxInput) {
  const timestamp = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const content = `
TAX FEE ESTIMATE - PRIVATE INVESTMENT FUND
Generated: ${timestamp}
Source: FundOpsHQ Tax Fee Estimator

═══════════════════════════════════════════════════════════════════════

ESTIMATED FEE RANGE
═══════════════════════════════════════════════════════════════════════

Low Estimate:        ${formatCurrency(output.lowEstimate)}
Most Likely:         ${formatCurrency(output.mediumEstimate)}
High Estimate:       ${formatCurrency(output.highEstimate)}

This estimate reflects annual tax compliance costs including federal and state
partnership returns, K-1 preparation, and routine tax planning.

═══════════════════════════════════════════════════════════════════════

YOUR FUND PROFILE
═══════════════════════════════════════════════════════════════════════

Fund Type:           ${getFundTypeName(input.fundType)}
Fund Size:           ${getFundSizeName(input.fundSize)}
Tax Year:            ${input.taxYear}
Investor Count:      ${getInvestorCountName(input.investorCount)}
Complexity:          ${getComplexityName(input.fundComplexity)}

STRUCTURE & ENTITIES

Parallel Funds:      ${input.parallelFunds}
AIVs/SPVs:          ${input.aivCount}
Blocker Entities:    ${input.blockerCount}
GP Entities:         ${input.gpEntityCount}

JURISDICTIONS

U.S. States:         ${getStateName(input.usStates)}
Foreign Jurisdictions: ${input.foreignJurisdictions === 'none' ? 'None' : input.foreignJurisdictions === 'single' ? '1 foreign country' : 'Multiple foreign countries'}

SPECIAL REPORTING

PFIC Reporting:      ${input.pficReporting ? 'Yes (Form 8621)' : 'No'}
CFC Reporting:       ${input.cfcReporting ? 'Yes (Form 5471)' : 'No'}
FATCA Reporting:     ${input.fatcaReporting ? 'Yes (Form 8938)' : 'No'}

═══════════════════════════════════════════════════════════════════════

DETAILED FEE BREAKDOWN
═══════════════════════════════════════════════════════════════════════

${output.breakdown.map(item => {
  const fee = formatCurrency(item.fee).padEnd(15)
  const component = item.component.padEnd(45)
  return `${fee} ${component}\n           ${item.description}`
}).join('\n\n')}

───────────────────────────────────────────────────────────────────────
TOTAL (Most Likely):  ${formatCurrency(output.mediumEstimate)}
═══════════════════════════════════════════════════════════════════════

${output.drivers.length > 0 ? `
WHAT'S DRIVING YOUR TAX FEES
═══════════════════════════════════════════════════════════════════════

${output.drivers.map((driver, index) => `
${index + 1}. ${driver.title}${driver.impact === 'positive' ? ' [Cost Reduction]' : driver.impact === 'negative' ? ' [Cost Driver]' : ''}
   ${driver.description}
`).join('\n')}
` : ''}

═══════════════════════════════════════════════════════════════════════

SCOPE & ASSUMPTIONS
═══════════════════════════════════════════════════════════════════════

WHAT'S TYPICALLY INCLUDED:

• Federal partnership tax return preparation (Form 1065)
• Schedule K-1 preparation and distribution to all investors
• Corporate tax returns for blocker entities and GP entities
• State and local tax return filings
• Annual tax provision calculations
• Routine tax compliance and advisory calls
• Basic tax planning during the year

OFTEN NOT INCLUDED (Additional Fees May Apply):

• Tax structuring for new funds or transactions (project-based)
• IRS audit defense or controversy work
• State tax controversy or appeals
• Transfer pricing studies (for cross-border funds)
• Tax opinion letters for specific transactions
• Portfolio company tax advisory (unless bundled)

KEY VARIABLES THAT CAN CHANGE PRICING:

• Significant mid-year transactions or restructurings
• Quality and organization of your accounting records
• Number of revisions or amended returns required
• Responsiveness to information requests
• Use of fund administrator vs. in-house accounting
• Timeliness of year-end close and data delivery

═══════════════════════════════════════════════════════════════════════

ABOUT THESE ESTIMATES
═══════════════════════════════════════════════════════════════════════

These estimates reflect typical mid-tier tax firms serving private investment
funds. Big 4 firms typically charge 30-50% more. Regional firms may offer
15-25% lower fees for simpler structures.

Actual costs depend on:
• Specific engagement scope negotiated with your tax provider
• Firm's experience with your fund type and strategy
• Your existing relationship and volume of work
• Geographic location and local market rates
• Timing and urgency of deliverables

HOW TO USE THIS ESTIMATE:

Use this as a starting point for budgeting and RFP discussions. Most tax
firms will provide a fixed-fee engagement letter after reviewing your
specific situation. Expect fees to be lower in subsequent years as
efficiency improves, unless fund complexity increases significantly.

═══════════════════════════════════════════════════════════════════════

Generated by FundOpsHQ Tax Fee Estimator
https://fundopshq.com/tools/tax-fee-estimator

This is an educational estimate only. Consult with qualified tax
professionals for actual fee quotes and tax advice.

═══════════════════════════════════════════════════════════════════════
`.trim()

  // Create and download the file
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tax-fee-estimate-${new Date().toISOString().split('T')[0]}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Helper functions for display names
function getFundTypeName(fundType: string): string {
  const names: Record<string, string> = {
    'venture-capital': 'Venture Capital',
    'pe-buyout': 'Private Equity (Buyout)',
    'growth-equity': 'Growth Equity',
    'private-credit': 'Private Credit / Direct Lending',
    'real-estate': 'Real Estate',
    'fund-of-funds': 'Fund of Funds',
    'hedge-fund': 'Hedge Fund',
    'other': 'Other'
  }
  return names[fundType] || fundType
}

function getFundSizeName(fundSize: string): string {
  const names: Record<string, string> = {
    'under-50': 'Under $50M',
    '50-100': '$50M - $100M',
    '100-250': '$100M - $250M',
    '250-500': '$250M - $500M',
    '500-plus': '$500M+'
  }
  return names[fundSize] || fundSize
}

function getInvestorCountName(count: string): string {
  const names: Record<string, string> = {
    'under-10': 'Under 10',
    '11-30': '11-30',
    '31-75': '31-75',
    '76-150': '76-150',
    '150-plus': '150+'
  }
  return names[count] || count
}

function getComplexityName(complexity: string): string {
  const names: Record<string, string> = {
    'simple': 'Simple - Basic equity investments',
    'moderate': 'Moderate - Some derivatives or debt',
    'complex': 'Complex - Multi-strategy with derivatives'
  }
  return names[complexity] || complexity
}

function getStateName(states: string): string {
  const names: Record<string, string> = {
    '1': '1 state',
    '2-3': '2-3 states',
    '4-6': '4-6 states',
    '7-10': '7-10 states',
    '10-plus': '10+ states'
  }
  return names[states] || states
}
