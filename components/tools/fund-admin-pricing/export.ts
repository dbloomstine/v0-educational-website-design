/**
 * Fund Administration Pricing Export Functions
 *
 * Provides CSV and PDF export functionality for the pricing estimator.
 */

import { FundAdminInput, PricingOutput, getFundTypeName, getRegionName } from './pricingData'
import {
  downloadCSV,
  createKeyValueSection,
  createTableSection,
  formatCurrency,
  formatNumber,
  type CSVSection
} from '@/lib/exports'
import {
  downloadPDF,
  createPDFKeyValueSection,
  createPDFTableSection,
  type PDFSection
} from '@/lib/exports'

/**
 * Export pricing summary as CSV
 */
export function exportPricingCSV(input: FundAdminInput, results: PricingOutput): void {
  const currency = results.currency

  const sections: CSVSection[] = [
    // Fund Profile
    createKeyValueSection('Fund Profile', {
      'Fund Type': getFundTypeName(input.fundType),
      'Assets Under Management': `${formatCurrency(input.aumAmount)}M ${input.aumCurrency}`,
      'Primary Jurisdiction': getRegionName(input.region),
      'Strategy Complexity': capitalize(input.strategyComplexity)
    }),

    // Fund Structure
    createKeyValueSection('Fund Structure', {
      'Main Fund Entities': input.mainEntities,
      'Master-Feeder Structure': input.hasMasterFeeder ? 'Yes' : 'No',
      'Parallel Funds': input.hasParallelFunds ? 'Yes' : 'No',
      'SPVs / Co-Investment Vehicles': input.spvCount,
      'Management Company Entities': input.managementCompanyEntities
    }),

    // Investors & Reporting
    createKeyValueSection('Investors & Reporting', {
      'Number of Investors': formatNumber(input.investorCount),
      'Reporting Frequency': capitalize(input.reportingFrequency),
      'Investor-Level Reporting': input.investorLevelReporting ? 'Yes' : 'No',
      'Capital Call/Distribution Processing': input.capitalCallDistribution ? 'Yes' : 'No',
      'Custom Reporting Requirements': input.customReporting ? 'Yes' : 'No'
    }),

    // Selected Services
    createKeyValueSection('Selected Services', {
      'Core Fund Administration': input.coreAdminIncluded ? 'Included' : 'Not Included',
      'Financial Statements': input.financialStatements ? 'Included' : 'Not Included',
      'Audit Support': input.auditSupport ? 'Included' : 'Not Included',
      'Tax Support': formatTaxSupport(input.taxSupport),
      'Regulatory Filings': input.regulatoryFilings ? 'Included' : 'Not Included',
      'KYC/AML Support': input.kycAmlSupport ? 'Included' : 'Not Included',
      'Bank Reconciliation': input.bankReconciliation ? 'Included' : 'Not Included',
      'Waterfall Calculations': input.waterfallCalculations ? 'Included' : 'Not Included',
      'CFO Consulting': formatCfoConsulting(input.cfoConsulting)
    }),

    // Estimated Annual Fees
    createKeyValueSection('Estimated Annual Fees', {
      'Low Estimate': formatCurrency(results.annualFees.low),
      'Medium Estimate': formatCurrency(results.annualFees.medium),
      'High Estimate': formatCurrency(results.annualFees.high)
    }),

    // Onboarding Fees
    createKeyValueSection('Onboarding / Setup Fees (One-Time)', {
      'Low Estimate': formatCurrency(results.onboardingFee.low),
      'Medium Estimate': formatCurrency(results.onboardingFee.medium),
      'High Estimate': formatCurrency(results.onboardingFee.high)
    }),

    // Cost Breakdown Table
    createTableSection(
      'Detailed Cost Breakdown',
      ['Category', 'Description', 'Low', 'High'],
      results.breakdown.map(item => [
        item.category,
        item.description,
        formatCurrency(item.low),
        formatCurrency(item.high)
      ])
    ),

    // Pricing Drivers Table
    createTableSection(
      'Key Pricing Drivers',
      ['Factor', 'Impact', 'Explanation'],
      results.drivers.map(driver => [
        driver.factor,
        driver.impact.toUpperCase(),
        driver.explanation
      ])
    ),

    // Scope of Services
    createTableSection(
      'Scope of Services',
      ['Service', 'Status', 'Notes'],
      results.scopeOfServices.map(item => [
        item.service,
        item.included ? 'Included' : 'Not Included',
        item.notes || ''
      ])
    ),

    // Out of Scope
    {
      title: 'Typically Out of Scope',
      rows: results.outOfScope.map(item => [item])
    }
  ]

  downloadCSV({
    filename: `fund-admin-pricing-estimate-${new Date().toISOString().split('T')[0]}`,
    toolName: 'Fund Administration Pricing Estimator',
    sections,
    includeDisclaimer: true
  })
}

/**
 * Export pricing summary as PDF
 */
export function exportPricingPDF(input: FundAdminInput, results: PricingOutput): void {
  const sections: PDFSection[] = [
    // Fund Profile
    ...createPDFKeyValueSection('Fund Profile', {
      'Fund Type': getFundTypeName(input.fundType),
      'Assets Under Management': `${formatCurrency(input.aumAmount)}M ${input.aumCurrency}`,
      'Primary Jurisdiction': getRegionName(input.region),
      'Strategy Complexity': capitalize(input.strategyComplexity)
    }),

    { type: 'spacer' },

    // Fund Structure
    ...createPDFKeyValueSection('Fund Structure', {
      'Main Fund Entities': String(input.mainEntities),
      'Master-Feeder': input.hasMasterFeeder ? 'Yes' : 'No',
      'Parallel Funds': input.hasParallelFunds ? 'Yes' : 'No',
      'SPVs': String(input.spvCount),
      'Management Co. Entities': String(input.managementCompanyEntities)
    }),

    { type: 'spacer' },

    // Estimated Annual Fees (prominent)
    { type: 'title', content: 'Estimated Annual Administration Fees' },
    {
      type: 'keyValue',
      data: {
        'Low Estimate (Conservative)': formatCurrency(results.annualFees.low),
        'Medium Estimate (Most Likely)': formatCurrency(results.annualFees.medium),
        'High Estimate (Complex)': formatCurrency(results.annualFees.high)
      }
    },

    { type: 'spacer' },

    // Onboarding Fees
    ...createPDFKeyValueSection('Onboarding / Setup Fees (One-Time)', {
      'Low Estimate': formatCurrency(results.onboardingFee.low),
      'Medium Estimate': formatCurrency(results.onboardingFee.medium),
      'High Estimate': formatCurrency(results.onboardingFee.high)
    }),

    { type: 'spacer' },

    // Cost Breakdown
    ...createPDFTableSection(
      'Detailed Cost Breakdown',
      ['Category', 'Low', 'High'],
      results.breakdown.map(item => [
        item.category,
        formatCurrency(item.low),
        formatCurrency(item.high)
      ])
    ),

    { type: 'spacer' },

    // Pricing Drivers
    ...createPDFTableSection(
      'Key Pricing Drivers',
      ['Factor', 'Impact', 'Explanation'],
      results.drivers.map(driver => [
        driver.factor,
        driver.impact.toUpperCase(),
        truncate(driver.explanation, 40)
      ])
    ),

    { type: 'spacer' },

    // Selected Services
    ...createPDFKeyValueSection('Selected Services', {
      'Core Administration': input.coreAdminIncluded ? 'Included' : 'Not Included',
      'Financial Statements': input.financialStatements ? 'Included' : 'Not Included',
      'Audit Support': input.auditSupport ? 'Included' : 'Not Included',
      'Tax Support': formatTaxSupport(input.taxSupport),
      'Regulatory Filings': input.regulatoryFilings ? 'Included' : 'Not Included',
      'KYC/AML Support': input.kycAmlSupport ? 'Included' : 'Not Included',
      'Bank Reconciliation': input.bankReconciliation ? 'Included' : 'Not Included',
      'Waterfall Calculations': input.waterfallCalculations ? 'Included' : 'Not Included'
    })
  ]

  downloadPDF({
    filename: `fund-admin-pricing-estimate-${new Date().toISOString().split('T')[0]}`,
    toolName: 'Fund Administration Pricing Estimator',
    description: `Pricing estimate for a ${getFundTypeName(input.fundType)} with ${formatCurrency(input.aumAmount)}M ${input.aumCurrency} AUM and ${formatNumber(input.investorCount)} investors.`,
    sections,
    includeDisclaimer: true
  })
}

// Helper functions
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatTaxSupport(value: string): string {
  switch (value) {
    case 'none': return 'None'
    case 'basic': return 'Basic'
    case 'full': return 'Full'
    default: return value
  }
}

function formatCfoConsulting(value: string): string {
  switch (value) {
    case 'none': return 'None'
    case 'light': return 'Light Touch'
    case 'heavy': return 'Heavy Involvement'
    default: return value
  }
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength - 3) + '...'
}

// Legacy export function for backwards compatibility
export function exportPricingSummary(input: FundAdminInput, results: PricingOutput) {
  // Default to CSV for legacy calls
  exportPricingCSV(input, results)
}
