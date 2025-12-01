/**
 * Tax Fee Estimator Export Functions
 *
 * Provides CSV and PDF export functionality for the tax fee estimator.
 */

import { TaxInput, PricingOutput, getFundTypeName, getFundSizeName, formatCurrency } from './pricingData'
import {
  downloadCSV,
  createKeyValueSection,
  createTableSection,
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
  'Federal partnership tax return preparation (Form 1065)',
  'Schedule K-1 preparation and distribution to all investors',
  'Corporate tax returns for blocker entities and GP entities',
  'State and local tax return filings',
  'Annual tax provision calculations',
  'Routine tax compliance and advisory calls',
  'Basic tax planning during the year'
]

export const outOfScopeServices = [
  'Tax structuring for new funds or transactions (project-based)',
  'IRS audit defense or controversy work',
  'State tax controversy or appeals',
  'Transfer pricing studies (for cross-border funds)',
  'Tax opinion letters for specific transactions',
  'Portfolio company tax advisory (unless bundled)'
]

// Helper functions for display names
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
    'simple': 'Simple - Plain vanilla',
    'moderate': 'Moderate - Some complexity',
    'complex': 'Complex - Cross-border / Derivatives'
  }
  return names[complexity] || complexity
}

function getStateCountName(states: string): string {
  const names: Record<string, string> = {
    '1': '1 state',
    '2': '2 states',
    '3-5': '3-5 states',
    '6-10': '6-10 states',
    '10-plus': '10+ states'
  }
  return names[states] || states
}

function getDomicileName(domicile: string): string {
  const names: Record<string, string> = {
    'us-only': 'U.S. Only',
    'us-cayman': 'U.S. + Cayman',
    'us-lux': 'U.S. + Luxembourg',
    'multiple': 'Multiple Jurisdictions'
  }
  return names[domicile] || domicile
}

function getProviderTierName(tier: string): string {
  const names: Record<string, string> = {
    'boutique': 'Boutique / Specialist',
    'mid-market': 'Mid-Market',
    'big-4': 'Big 4 / Large Global'
  }
  return names[tier] || tier
}

/**
 * Export tax summary as CSV
 */
export function exportTaxCSV(input: TaxInput, output: PricingOutput): void {
  const sections: CSVSection[] = [
    // Estimated Fees
    createKeyValueSection('Estimated Annual Tax Fees', {
      'Low Estimate': formatCurrency(output.lowEstimate),
      'Medium Estimate': formatCurrency(output.mediumEstimate),
      'High Estimate': formatCurrency(output.highEstimate)
    }),

    // Fund Profile
    createKeyValueSection('Fund Profile', {
      'Fund Type': getFundTypeName(input.fundType),
      'Fund Size': getFundSizeName(input.fundSize),
      'Strategy Complexity': getComplexityName(input.strategyComplexity),
      'Domicile': getDomicileName(input.domicile)
    }),

    // Structure
    createKeyValueSection('Structure & Entities', {
      'Main Funds': String(input.mainFunds),
      'Parallel Funds': String(input.parallelFunds),
      'AIVs': String(input.aivCount),
      'Blocker Entities': String(input.blockerCount),
      'GP Entities': String(input.gpEntities),
      'Management Co.': input.managementCo ? 'Yes' : 'No'
    }),

    // Investors & Jurisdictions
    createKeyValueSection('Investors & Jurisdictions', {
      'Investor Count': getInvestorCountName(input.investorCount),
      'State Filings': getStateCountName(input.stateCount),
      'Foreign Investors': input.foreignInvestors ? 'Yes' : 'No',
      'ERISA / Tax-Exempt': input.erisa ? 'Yes' : 'No'
    }),

    // Special Reporting
    createKeyValueSection('Special Reporting', {
      'PFIC Reporting': input.pfic ? 'Yes' : 'No',
      'CFC Reporting': input.cfc ? 'Yes' : 'No',
      'Withholding (§1446)': input.withholding ? 'Yes' : 'No',
      'FATCA/CRS': input.fatca ? 'Yes' : 'No'
    }),

    // Service Scope
    createKeyValueSection('Service Scope', {
      'Quarterly Estimates': input.quarterlyEstimates ? 'Yes' : 'No',
      'Tax Planning': input.planningMeetings === 'none' ? 'Compliance Only' : input.planningMeetings,
      'Amendment Budget': input.amendments ? 'Yes' : 'No',
      'Provider Tier': getProviderTierName(input.providerTier)
    }),

    // Fee Breakdown Table
    createTableSection(
      'Detailed Fee Breakdown',
      ['Component', 'Description', 'Low', 'Medium', 'High'],
      output.breakdown.map(item => [
        item.category,
        item.description,
        formatCurrency(item.low),
        formatCurrency(item.medium),
        formatCurrency(item.high)
      ])
    ),

    // Cost Drivers Table
    createTableSection(
      'Key Cost Drivers',
      ['Factor', 'Impact', 'Description'],
      output.drivers.map(driver => [
        driver.title,
        driver.impact === 'positive' ? 'Cost Reduction' : driver.impact === 'negative' ? 'Cost Increase' : 'Neutral',
        driver.description
      ])
    ),

    // Scope - Included
    {
      title: 'Typically Included',
      rows: includedServices.map(s => [s])
    },

    // Scope - Out of Scope
    {
      title: 'Usually Billed Separately',
      rows: outOfScopeServices.map(s => [s])
    }
  ]

  downloadCSV({
    filename: `tax-fee-estimate-${new Date().toISOString().split('T')[0]}`,
    toolName: 'Tax Fee Estimator',
    sections,
    includeDisclaimer: true
  })
}

/**
 * Export tax summary as PDF
 */
export function exportTaxPDF(input: TaxInput, output: PricingOutput): void {
  const sections: PDFSection[] = [
    // Estimated Fees (prominent)
    { type: 'title', content: 'Estimated Annual Tax Compliance Fees' },
    {
      type: 'keyValue',
      data: {
        'Low Estimate': formatCurrency(output.lowEstimate),
        'Medium Estimate (Most Likely)': formatCurrency(output.mediumEstimate),
        'High Estimate': formatCurrency(output.highEstimate)
      }
    },

    { type: 'spacer' },

    // Fund Profile
    ...createPDFKeyValueSection('Fund Profile', {
      'Fund Type': getFundTypeName(input.fundType),
      'Fund Size': getFundSizeName(input.fundSize),
      'Complexity': getComplexityName(input.strategyComplexity),
      'Domicile': getDomicileName(input.domicile)
    }),

    { type: 'spacer' },

    // Structure
    ...createPDFKeyValueSection('Structure', {
      'Main Funds': String(input.mainFunds),
      'Parallel Funds': String(input.parallelFunds),
      'AIVs': String(input.aivCount),
      'Blockers': String(input.blockerCount),
      'GP Entities': String(input.gpEntities)
    }),

    { type: 'spacer' },

    // Investors
    ...createPDFKeyValueSection('Investors', {
      'Investor Count': getInvestorCountName(input.investorCount),
      'State Filings': getStateCountName(input.stateCount),
      'Foreign Investors': input.foreignInvestors ? 'Yes' : 'No'
    }),

    { type: 'spacer' },

    // Fee Breakdown (top items)
    ...createPDFTableSection(
      'Fee Breakdown',
      ['Component', 'Medium Est.'],
      output.breakdown.slice(0, 8).map(item => [
        item.category,
        formatCurrency(item.medium)
      ])
    ),

    { type: 'spacer' },

    // Cost Drivers (top items)
    ...createPDFTableSection(
      'Key Cost Drivers',
      ['Factor', 'Impact'],
      output.drivers.slice(0, 5).map(driver => [
        driver.title,
        driver.impact === 'positive' ? 'Reduces Cost' : driver.impact === 'negative' ? 'Increases Cost' : 'Neutral'
      ])
    )
  ]

  downloadPDF({
    filename: `tax-fee-estimate-${new Date().toISOString().split('T')[0]}`,
    toolName: 'Tax Fee Estimator',
    description: `Tax compliance estimate for a ${getFundTypeName(input.fundType)} with ${getFundSizeName(input.fundSize)} AUM.`,
    sections,
    includeDisclaimer: true
  })
}

// Legacy export function for backwards compatibility
export function exportTaxPricing(output: PricingOutput, input: TaxInput) {
  exportTaxCSV(input, output)
}
