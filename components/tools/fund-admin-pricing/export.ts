import { FundAdminInput, PricingOutput, getFundTypeName, getRegionName, formatCurrency } from './pricingData'

export function exportPricingSummary(input: FundAdminInput, results: PricingOutput) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // Build text content for download
  let content = `FUND ADMINISTRATION PRICING ESTIMATE
Generated: ${date}
FundOpsHQ.com

========================================
FUND PROFILE
========================================

Fund Type: ${getFundTypeName(input.fundType)}
Assets Under Management: ${formatCurrency(input.aumAmount, input.aumCurrency)}M ${input.aumCurrency}
Primary Jurisdiction: ${getRegionName(input.region)}
Strategy Complexity: ${input.strategyComplexity.charAt(0).toUpperCase() + input.strategyComplexity.slice(1)}

========================================
FUND STRUCTURE
========================================

Main Fund Entities: ${input.mainEntities}
Master-Feeder Structure: ${input.hasMasterFeeder ? 'Yes' : 'No'}
Parallel Funds: ${input.hasParallelFunds ? 'Yes' : 'No'}
SPVs / Co-Investment Vehicles: ${input.spvCount}
Management Company Entities: ${input.managementCompanyEntities}

========================================
INVESTORS & REPORTING
========================================

Number of Investors: ${input.investorCount}
Reporting Frequency: ${input.reportingFrequency.charAt(0).toUpperCase() + input.reportingFrequency.slice(1)}
Investor-Level Reporting: ${input.investorLevelReporting ? 'Yes' : 'No'}
Capital Call/Distribution Processing: ${input.capitalCallDistribution ? 'Yes' : 'No'}
Custom Reporting Requirements: ${input.customReporting ? 'Yes' : 'No'}

========================================
SELECTED SERVICES
========================================

Core Fund Administration: ${input.coreAdminIncluded ? 'Included' : 'Not Included'}
Financial Statements: ${input.financialStatements ? 'Included' : 'Not Included'}
Audit Support: ${input.auditSupport ? 'Included' : 'Not Included'}
Tax Support: ${input.taxSupport === 'none' ? 'None' : input.taxSupport === 'basic' ? 'Basic' : 'Full'}
Regulatory Filings: ${input.regulatoryFilings ? 'Included' : 'Not Included'}
KYC/AML Support: ${input.kycAmlSupport ? 'Included' : 'Not Included'}
Bank Reconciliation: ${input.bankReconciliation ? 'Included' : 'Not Included'}
Waterfall Calculations: ${input.waterfallCalculations ? 'Included' : 'Not Included'}
CFO Consulting: ${input.cfoConsulting === 'none' ? 'None' : input.cfoConsulting === 'light' ? 'Light' : 'Heavy'}

========================================
ESTIMATED ANNUAL FEES
========================================

Low Estimate:    ${formatCurrency(results.annualFees.low, results.currency)}
Medium Estimate: ${formatCurrency(results.annualFees.medium, results.currency)}
High Estimate:   ${formatCurrency(results.annualFees.high, results.currency)}

========================================
ONBOARDING / SETUP FEES (One-Time)
========================================

Low Estimate:  ${formatCurrency(results.onboardingFee.low, results.currency)}
Medium Estimate: ${formatCurrency(results.onboardingFee.medium, results.currency)}
High Estimate: ${formatCurrency(results.onboardingFee.high, results.currency)}

========================================
DETAILED COST BREAKDOWN
========================================

${results.breakdown.map(item => `${item.category}
${item.description}
Range: ${formatCurrency(item.low, results.currency)} - ${formatCurrency(item.high, results.currency)}
`).join('\n')}

========================================
KEY PRICING DRIVERS
========================================

${results.drivers.map((driver, idx) => `${idx + 1}. ${driver.factor} [${driver.impact.toUpperCase()} IMPACT]
   ${driver.explanation}
`).join('\n')}

========================================
SCOPE OF SERVICES
========================================

INCLUDED IN ESTIMATE:
${results.scopeOfServices.filter(s => s.included).map(item => `✓ ${item.service}${item.notes ? ` (${item.notes})` : ''}`).join('\n')}

NOT INCLUDED (priced separately):
${results.scopeOfServices.filter(s => !s.included).map(item => `✗ ${item.service}`).join('\n')}

TYPICALLY OUT OF SCOPE:
${results.outOfScope.map(item => `• ${item}`).join('\n')}

========================================
IMPORTANT DISCLAIMER
========================================

This estimate is for educational and planning purposes only. Actual fees
will vary by administrator, specific fund circumstances, negotiation, and
scope changes. This does not constitute a binding quote or recommendation.

Always request formal proposals from multiple qualified fund administrators
and review detailed scope and pricing terms.

Next Steps:
1. Use this estimate for budgeting and planning
2. Prepare a detailed RFP with your specific requirements
3. Request formal proposals from 3-5 administrators
4. Compare proposals on scope, price, and service quality
5. Conduct reference calls and due diligence

========================================
Generated by FundOpsHQ.com
Fund Administration Pricing Estimator
${date}
========================================
`

  // Create downloadable file
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fund-admin-pricing-estimate-${new Date().toISOString().split('T')[0]}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
