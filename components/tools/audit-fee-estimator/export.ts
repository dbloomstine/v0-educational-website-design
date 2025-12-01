/**
 * Audit Fee Estimator Export Functions
 *
 * Provides CSV and PDF export functionality for the audit fee estimator.
 */

import { AuditInput, PricingOutput, getFundTypeName, getFundSizeName } from './pricingData'
import {
  downloadCSV,
  createKeyValueSection,
  createTableSection,
  formatCurrency,
  type CSVSection
} from '@/lib/exports'
import {
  downloadPDF,
  createPDFKeyValueSection,
  createPDFTableSection,
  type PDFSection
} from '@/lib/exports'

// Scope of services (shared between exports and UI)
export const includedServices = [
  'Annual financial statement audit (balance sheet, income statement, cash flows, changes in partners\' capital)',
  'Review of internal controls and key processes',
  'Coordination with fund administrator (if applicable)',
  'Review of valuation methodology and supporting evidence for portfolio investments',
  'Partner/investor capital statements and capital activity verification',
  'Audit of carried interest calculations (basic waterfall)',
  'Audit opinion and signed financial statements',
  'Management representation letter',
  'Review of compliance with LPA economic terms'
]

export const outOfScopeServices = [
  'Tax return preparation and filing (Form 1065, K-1s, state returns)',
  'Complex tax structuring or tax planning advice',
  'SOC 1 or SOC 2 reports (service organization controls)',
  'Agreed-upon procedures (AUPs) for specific LP requests',
  'Special regulatory reports (e.g., AIFMD, non-standard filings)',
  'Interim reviews (quarterly or semi-annual)',
  'Portfolio company audits or reviews',
  'Forensic accounting or dispute resolution',
  'Management company (GP) audit (separate engagement)'
]

/**
 * Export audit summary as CSV
 */
export function exportAuditCSV(input: AuditInput, results: PricingOutput): void {
  const sections: CSVSection[] = [
    // Estimated Fees
    createKeyValueSection('Estimated Annual Audit Fees', {
      'Low Estimate': formatCurrency(results.lowEstimate),
      'Medium Estimate': formatCurrency(results.mediumEstimate),
      'High Estimate': formatCurrency(results.highEstimate)
    }),

    // Fund Profile
    createKeyValueSection('Fund Profile', {
      'Fund Type': getFundTypeName(input.fundType),
      'Fund Size (AUM)': getFundSizeName(input.fundSize),
      'Portfolio Companies': input.portfolioCount,
      'Legal Entities': input.entityCount,
      'Jurisdictions': input.jurisdictions === 'us-only' ? 'U.S. Only' : input.jurisdictions === 'us-plus-1' ? 'U.S. + 1 other' : 'Multiple',
      'Manager Stage': input.emergingManager === 'fund-1' ? 'Fund I (first-time)' : input.emergingManager === 'fund-2-3' ? 'Fund II or III' : 'Established'
    }),

    // Complexity & Structure
    createKeyValueSection('Complexity & Structure', {
      'Strategy Complexity': capitalize(input.strategyComplexity),
      'Valuation Complexity': input.valuationComplexity === 'mostly-1-2' ? 'Largely Level 1 & 2' : 'Significant Level 3',
      'Complex Instruments': input.complexInstruments ? 'Yes' : 'No',
      'Third-Party Administrator': input.hasAdmin ? 'Yes' : 'No'
    }),

    // Audit Context
    createKeyValueSection('Audit Context', {
      'Audit Year': input.auditYear === 'first' ? 'First-year audit' : 'Repeat audit',
      'Timeline': input.timeline === 'normal' ? 'Normal (90+ days)' : 'Rush / tight deadline',
      'Reporting Framework': input.framework.toUpperCase(),
      'SEC-Registered': input.secRegistered ? 'Yes' : 'No'
    }),

    // Cost Drivers Table
    createTableSection(
      'Key Cost Drivers',
      ['Factor', 'Impact', 'Description'],
      results.drivers.map(driver => [
        driver.title,
        driver.impact === 'positive' ? 'Cost Reduction' : driver.impact === 'negative' ? 'Cost Increase' : 'Neutral',
        driver.description
      ])
    ),

    // Scope - Included
    {
      title: 'Typically Included in Base Audit',
      rows: includedServices.map(s => [s])
    },

    // Scope - Out of Scope
    {
      title: 'Usually Billed Separately',
      rows: outOfScopeServices.map(s => [s])
    }
  ]

  downloadCSV({
    filename: `audit-fee-estimate-${new Date().toISOString().split('T')[0]}`,
    toolName: 'Audit Fee Estimator',
    sections,
    includeDisclaimer: true
  })
}

/**
 * Export audit summary as PDF
 */
export function exportAuditPDF(input: AuditInput, results: PricingOutput): void {
  const sections: PDFSection[] = [
    // Estimated Fees (prominent)
    { type: 'title', content: 'Estimated Annual Audit Fees' },
    {
      type: 'keyValue',
      data: {
        'Low Estimate (Conservative)': formatCurrency(results.lowEstimate),
        'Medium Estimate (Most Likely)': formatCurrency(results.mediumEstimate),
        'High Estimate (Complex)': formatCurrency(results.highEstimate)
      }
    },

    { type: 'spacer' },

    // Fund Profile
    ...createPDFKeyValueSection('Fund Profile', {
      'Fund Type': getFundTypeName(input.fundType),
      'Fund Size (AUM)': getFundSizeName(input.fundSize),
      'Portfolio Companies': input.portfolioCount,
      'Legal Entities': input.entityCount,
      'Jurisdictions': input.jurisdictions === 'us-only' ? 'U.S. Only' : input.jurisdictions === 'us-plus-1' ? 'U.S. + 1 other' : 'Multiple'
    }),

    { type: 'spacer' },

    // Complexity & Structure
    ...createPDFKeyValueSection('Complexity & Structure', {
      'Strategy Complexity': capitalize(input.strategyComplexity),
      'Valuation Complexity': input.valuationComplexity === 'mostly-1-2' ? 'Level 1 & 2' : 'Level 3',
      'Complex Instruments': input.complexInstruments ? 'Yes' : 'No',
      'Third-Party Admin': input.hasAdmin ? 'Yes' : 'No'
    }),

    { type: 'spacer' },

    // Audit Context
    ...createPDFKeyValueSection('Audit Context', {
      'Audit Year': input.auditYear === 'first' ? 'First-year' : 'Repeat',
      'Timeline': input.timeline === 'normal' ? 'Normal' : 'Rush',
      'Framework': input.framework.toUpperCase(),
      'SEC-Registered': input.secRegistered ? 'Yes' : 'No'
    }),

    { type: 'spacer' },

    // Cost Drivers
    ...createPDFTableSection(
      'Key Cost Drivers',
      ['Factor', 'Impact'],
      results.drivers.slice(0, 6).map(driver => [
        driver.title,
        driver.impact === 'positive' ? 'Reduces Cost' : driver.impact === 'negative' ? 'Increases Cost' : 'Neutral'
      ])
    )
  ]

  downloadPDF({
    filename: `audit-fee-estimate-${new Date().toISOString().split('T')[0]}`,
    toolName: 'Audit Fee Estimator',
    description: `Audit fee estimate for a ${getFundTypeName(input.fundType)} with ${getFundSizeName(input.fundSize)} AUM and ${input.portfolioCount} portfolio companies.`,
    sections,
    includeDisclaimer: true
  })
}

// Helper function
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Legacy export function for backwards compatibility
export function exportAuditSummary(input: AuditInput, results: PricingOutput) {
  exportAuditCSV(input, results)
}
