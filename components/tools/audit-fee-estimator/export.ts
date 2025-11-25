import { AuditInput, PricingOutput, getFundTypeName, getFundSizeName, formatCurrency } from './pricingData'

export function exportAuditSummary(input: AuditInput, results: PricingOutput) {
  const summary = `AUDIT PRICING ESTIMATE
Generated: ${new Date().toLocaleDateString()}
FundOpsHQ.com Audit Fee Estimator

═══════════════════════════════════════════════════

ESTIMATED ANNUAL AUDIT FEES

Low Estimate:    ${formatCurrency(results.lowEstimate)}
Medium Estimate: ${formatCurrency(results.mediumEstimate)}
High Estimate:   ${formatCurrency(results.highEstimate)}

═══════════════════════════════════════════════════

FUND PROFILE

Fund Type: ${getFundTypeName(input.fundType)}
Fund Size (AUM): ${getFundSizeName(input.fundSize)}
Portfolio Companies: ${input.portfolioCount}
Legal Entities: ${input.entityCount}
Jurisdictions: ${input.jurisdictions === 'us-only' ? 'U.S. Only' : input.jurisdictions === 'us-plus-1' ? 'U.S. + 1 other' : 'Multiple'}
Emerging Manager: ${input.emergingManager === 'fund-1' ? 'Fund I (first-time)' : input.emergingManager === 'fund-2-3' ? 'Fund II or III' : 'Established'}

COMPLEXITY & STRUCTURE

Strategy Complexity: ${input.strategyComplexity.charAt(0).toUpperCase() + input.strategyComplexity.slice(1)}
Valuation Complexity: ${input.valuationComplexity === 'mostly-1-2' ? 'Largely Level 1 & 2' : 'Significant Level 3'}
Complex Instruments: ${input.complexInstruments ? 'Yes' : 'No'}
Third-Party Administrator: ${input.hasAdmin ? 'Yes' : 'No'}

AUDIT CONTEXT

Audit Year: ${input.auditYear === 'first' ? 'First-year audit' : 'Repeat audit'}
Timeline: ${input.timeline === 'normal' ? 'Normal (90+ days)' : 'Rush / tight deadline'}
Reporting Framework: ${input.framework.toUpperCase()}
SEC-Registered: ${input.secRegistered ? 'Yes' : 'No'}

═══════════════════════════════════════════════════

KEY COST DRIVERS

${results.drivers.map((driver, i) => `${i + 1}. ${driver.title}
   ${driver.description}
`).join('\n')}

═══════════════════════════════════════════════════

WHAT'S TYPICALLY INCLUDED IN BASE AUDIT SCOPE

✓ Annual financial statement audit (balance sheet, income statement,
  cash flows, changes in partners' capital)
✓ Review of internal controls and key processes
✓ Coordination with fund administrator (if applicable)
✓ Review of valuation methodology and supporting evidence
✓ Partner/investor capital statements verification
✓ Audit of carried interest calculations
✓ Audit opinion and signed financial statements
✓ Review of compliance with LPA economic terms

USUALLY BILLED SEPARATELY / OUT OF SCOPE

× Tax return preparation and filing (Form 1065, K-1s)
× Complex tax structuring or planning
× SOC 1 or SOC 2 reports
× Agreed-upon procedures (AUPs) for LP requests
× Special regulatory reports (AIFMD, etc.)
× Interim reviews (quarterly/semi-annual)
× Portfolio company audits
× Management company (GP) audit

═══════════════════════════════════════════════════

NEXT STEPS

1. Request formal proposals from 2-3 reputable audit firms specializing
   in investment funds.

2. Clarify scope: Ensure proposals state what's included vs. additional
   services (tax, AUPs, etc.).

3. Check references from similar funds (same strategy, size, complexity).

4. Plan timing: Start 4-6 months before you need final financials.
   First-year audits take 8-12 weeks.

5. Leverage your administrator: Coordinate closely to streamline the
   process and reduce fees.

═══════════════════════════════════════════════════

DISCLAIMER

This tool is for informational and planning purposes only. Estimates are
based on general market data and typical fee ranges as of 2024-2025.
Actual audit fees vary significantly based on firm-specific rates,
detailed fund characteristics, scope negotiations, and timing. These
estimates do not constitute binding quotes or professional advice.
Always obtain formal proposals from qualified audit firms and consult
with your legal and financial advisors.

═══════════════════════════════════════════════════

Generated with FundOpsHQ Audit Fee Estimator
FundOpsHQ.com`

  // Create blob and download
  const blob = new Blob([summary], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'audit-pricing-estimate.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
