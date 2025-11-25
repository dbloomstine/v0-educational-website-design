import { PricingOutput, KYCAMLInput, formatCurrency, getFundTypeName } from './pricingData'

export function exportKYCAMLPricing(output: PricingOutput, input: KYCAMLInput) {
  const timestamp = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const content = `
KYC / AML COST ESTIMATE - INVESTOR ONBOARDING
Generated: ${timestamp}
Source: FundOpsHQ KYC/AML Cost Estimator

═══════════════════════════════════════════════════════════════════════

ESTIMATED COST RANGE
═══════════════════════════════════════════════════════════════════════

INITIAL ONBOARDING (One-Time)

Low Estimate:        ${formatCurrency(output.initialOnboarding.low)}
Most Likely:         ${formatCurrency(output.initialOnboarding.medium)}
High Estimate:       ${formatCurrency(output.initialOnboarding.high)}

${input.hasOngoingMonitoring ? `
ONGOING ANNUAL MONITORING

Low Estimate:        ${formatCurrency(output.annualOngoing.low)}
Most Likely:         ${formatCurrency(output.annualOngoing.medium)}
High Estimate:       ${formatCurrency(output.annualOngoing.high)}
` : ''}

AVERAGE PER INVESTOR

Low:                 ${formatCurrency(output.averagePerInvestor.low)}
Most Likely:         ${formatCurrency(output.averagePerInvestor.medium)}
High:                ${formatCurrency(output.averagePerInvestor.high)}

These estimates reflect typical mid-tier KYC/AML service providers for
private investment fund investor onboarding and ongoing monitoring.

═══════════════════════════════════════════════════════════════════════

YOUR FUND PROFILE
═══════════════════════════════════════════════════════════════════════

Fund Type:           ${getFundTypeName(input.fundType)}
Fund Domicile:       ${getDomicileName(input.domicile)}
Investor Jurisdictions: ${getJurisdictionName(input.investorJurisdictions)}
Risk Level:          ${input.riskLevel === 'higher-risk' ? 'Higher Risk (EDD Required)' : 'Standard Risk'}

INVESTOR MIX

Total Investors:     ${output.totalInvestors}
  • Individual:      ${input.individualCount}
  • Entity:          ${input.entityCount}
  • Institutional:   ${input.institutionalCount}

KYC/AML SCOPE

Due Diligence Level: ${input.dueDiligenceLevel === 'enhanced' ? 'Enhanced Due Diligence (EDD)' : 'Standard CDD'}
Monitoring Frequency: ${getMonitoringName(input.monitoringFrequency)}
Operating Model:     ${getOperatingModelName(input.operatingModel)}

Depth of Checks:
${input.checksDepth.map(check => `  • ${getCheckName(check)}`).join('\n')}

COMPLEXITY FACTORS

Non-Resident Proportion: ${getNonResidentName(input.nonResidentProportion)}
Complex Ownership:   ${input.complexOwnership ? 'Yes (Multi-layer UBO analysis required)' : 'No'}
High-Risk Proportion: ${getHighRiskName(input.highRiskProportion)}

═══════════════════════════════════════════════════════════════════════

PER-INVESTOR COSTS BY TYPE
═══════════════════════════════════════════════════════════════════════

INDIVIDUAL INVESTORS (${input.individualCount})

Low:                 ${formatCurrency(output.perInvestorCosts.individual.low)}
Medium:              ${formatCurrency(output.perInvestorCosts.individual.medium)}
High:                ${formatCurrency(output.perInvestorCosts.individual.high)}

ENTITY INVESTORS (${input.entityCount})

Low:                 ${formatCurrency(output.perInvestorCosts.entity.low)}
Medium:              ${formatCurrency(output.perInvestorCosts.entity.medium)}
High:                ${formatCurrency(output.perInvestorCosts.entity.high)}

INSTITUTIONAL INVESTORS (${input.institutionalCount})

Low:                 ${formatCurrency(output.perInvestorCosts.institutional.low)}
Medium:              ${formatCurrency(output.perInvestorCosts.institutional.medium)}
High:                ${formatCurrency(output.perInvestorCosts.institutional.high)}

═══════════════════════════════════════════════════════════════════════

DETAILED COST BREAKDOWN
═══════════════════════════════════════════════════════════════════════

${output.breakdown.map(item => {
  const category = item.category.padEnd(45)
  const range = `${formatCurrency(item.total.low)} - ${formatCurrency(item.total.high)}`
  return `${category}\n${item.count ? `  ${item.count} investors @ ${formatCurrency(item.perUnit.low)} - ${formatCurrency(item.perUnit.high)} each\n` : ''}  Total: ${range}`
}).join('\n\n')}

───────────────────────────────────────────────────────────────────────
INITIAL ONBOARDING TOTAL (Most Likely): ${formatCurrency(output.initialOnboarding.medium)}
${input.hasOngoingMonitoring ? `ANNUAL ONGOING TOTAL (Most Likely):     ${formatCurrency(output.annualOngoing.medium)}` : ''}
═══════════════════════════════════════════════════════════════════════

${output.drivers.length > 0 ? `
WHAT'S DRIVING YOUR KYC/AML COSTS
═══════════════════════════════════════════════════════════════════════

${output.drivers.map((driver, index) => `
${index + 1}. ${driver.title}${driver.impact === 'positive' ? ' [Cost Reduction]' : driver.impact === 'negative' ? ' [Cost Driver]' : ''}
   ${driver.description}
`).join('\n')}
` : ''}

═══════════════════════════════════════════════════════════════════════

WHAT'S TYPICALLY INCLUDED
═══════════════════════════════════════════════════════════════════════

STANDARD KYC/AML ONBOARDING:

• Identity verification (government-issued ID, passport, etc.)
• Address verification (utility bills, bank statements)
• PEP (Politically Exposed Persons) screening
• Sanctions list screening (OFAC, EU, UN)
• Adverse media screening
• Entity verification (articles of incorporation, registry extracts)
• Beneficial ownership analysis
• Source of funds documentation review
• Risk assessment and classification
• AML/CTF compliance documentation

ENHANCED DUE DILIGENCE (EDD) ADDS:

• Detailed source of wealth analysis
• Enhanced background checks
• Additional document verification
• Ongoing transaction monitoring
• Senior management review and approval
• More frequent periodic reviews

ONGOING MONITORING INCLUDES:

• Periodic PEP and sanctions list rescreening
• Adverse media monitoring
• KYC document refresh and updates
• Transaction monitoring (for ongoing activity)
• Periodic risk reassessment

═══════════════════════════════════════════════════════════════════════

FACTORS THAT CAN INCREASE COSTS
═══════════════════════════════════════════════════════════════════════

• Investors from high-risk jurisdictions (FATF grey-list countries)
• Complex multi-layered corporate structures requiring UBO analysis
• Lack of standard documentation or incomplete records
• High proportion of non-English documentation requiring translation
• Investors flagged in initial screening requiring manual review
• Changes in regulatory requirements or sanction lists
• Rush processing or expedited onboarding requirements

FACTORS THAT CAN REDUCE COSTS

• Bundling KYC/AML with fund administrator services
• High volume of investors enabling economies of scale
• Automated digital onboarding workflows
• Standardized documentation from investors
• Mostly domestic investors from low-risk jurisdictions
• Established relationships with reputable intermediaries

═══════════════════════════════════════════════════════════════════════

ABOUT THESE ESTIMATES
═══════════════════════════════════════════════════════════════════════

These estimates reflect typical mid-tier KYC/AML service providers. Costs
vary significantly based on:

• Provider choice (in-house, outsourced specialist, or bundled with
  fund administrator)
• Technology platform and degree of automation
• Specific compliance requirements for your fund's jurisdictions
• Volume discounts for larger investor bases
• Complexity of your investor base and ownership structures

HOW TO USE THIS ESTIMATE:

Use this as a starting point for budgeting and vendor discussions.
Request detailed proposals from multiple providers to compare:
• Per-investor pricing by investor type
• Platform/subscription fees
• Setup and integration costs
• Ongoing monitoring costs
• SLAs for turnaround time
• Technology capabilities and reporting

Consider bundling with your fund administrator for potential cost savings
and operational efficiency.

═══════════════════════════════════════════════════════════════════════

Generated by FundOpsHQ KYC/AML Cost Estimator
https://fundopshq.com/tools/kyc-aml-cost-estimator

This is an educational estimate only. Consult with qualified compliance
professionals for actual pricing and AML/KYC compliance advice.

═══════════════════════════════════════════════════════════════════════
`.trim()

  // Create and download the file
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kyc-aml-estimate-${new Date().toISOString().split('T')[0]}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Helper functions for display names
function getDomicileName(domicile: string): string {
  const names: Record<string, string> = {
    'us': 'United States',
    'cayman': 'Cayman Islands',
    'luxembourg': 'Luxembourg',
    'uk': 'United Kingdom',
    'ireland': 'Ireland',
    'other': 'Other'
  }
  return names[domicile] || domicile
}

function getJurisdictionName(jurisdiction: string): string {
  const names: Record<string, string> = {
    'domestic': 'Primarily Domestic',
    'mixed': 'Mixed Domestic & International',
    'international': 'Primarily International',
    'high-risk': 'Includes High-Risk Jurisdictions'
  }
  return names[jurisdiction] || jurisdiction
}

function getMonitoringName(frequency: string): string {
  const names: Record<string, string> = {
    'none': 'No Ongoing Monitoring',
    'annual': 'Annual Refresh',
    'quarterly': 'Quarterly Monitoring',
    'continuous': 'Continuous Monitoring'
  }
  return names[frequency] || frequency
}

function getOperatingModelName(model: string): string {
  const names: Record<string, string> = {
    'in-house': 'In-House (own team + software)',
    'outsourced': 'Outsourced to KYC/AML Provider',
    'bundled': 'Bundled Through Fund Administrator'
  }
  return names[model] || model
}

function getCheckName(check: string): string {
  const names: Record<string, string> = {
    'id-verification': 'ID & Address Verification',
    'pep-sanctions': 'PEP & Sanctions Screening',
    'adverse-media': 'Adverse Media Screening',
    'source-of-wealth': 'Source of Wealth / Funds Analysis'
  }
  return names[check] || check
}

function getNonResidentName(proportion: string): string {
  const names: Record<string, string> = {
    'minimal': 'Minimal (<25%)',
    'some': 'Some (25-50%)',
    'majority': 'Majority (>50%)'
  }
  return names[proportion] || proportion
}

function getHighRiskName(proportion: string): string {
  const names: Record<string, string> = {
    'low': 'Low (<10%)',
    'moderate': 'Moderate (10-25%)',
    'high': 'High (>25%)'
  }
  return names[proportion] || proportion
}
