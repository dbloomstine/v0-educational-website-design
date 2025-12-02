import { PricingOutput, KYCAMLInput, formatCurrency, getFundTypeName } from './pricingData'
import {
  downloadCSV,
  createKeyValueSection,
  createTableSection,
  type CSVSection
} from '@/lib/exports'
import {
  downloadPDF,
  createPDFTableSection,
  type PDFSection
} from '@/lib/exports'

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

export function exportKYCAMLCSV(output: PricingOutput, input: KYCAMLInput) {
  const sections: CSVSection[] = [
    // Cost Summary
    createKeyValueSection('Cost Summary', {
      'Total Investors': output.totalInvestors.toString(),
      'Initial Onboarding (Low)': formatCurrency(output.initialOnboarding.low),
      'Initial Onboarding (Most Likely)': formatCurrency(output.initialOnboarding.medium),
      'Initial Onboarding (High)': formatCurrency(output.initialOnboarding.high),
      ...(input.hasOngoingMonitoring ? {
        'Annual Monitoring (Low)': formatCurrency(output.annualOngoing.low),
        'Annual Monitoring (Most Likely)': formatCurrency(output.annualOngoing.medium),
        'Annual Monitoring (High)': formatCurrency(output.annualOngoing.high)
      } : {}),
      'Average Per Investor (Low)': formatCurrency(output.averagePerInvestor.low),
      'Average Per Investor (Most Likely)': formatCurrency(output.averagePerInvestor.medium),
      'Average Per Investor (High)': formatCurrency(output.averagePerInvestor.high)
    }),

    // Fund Profile
    createKeyValueSection('Fund Profile', {
      'Fund Type': getFundTypeName(input.fundType),
      'Fund Domicile': getDomicileName(input.domicile),
      'Investor Jurisdictions': getJurisdictionName(input.investorJurisdictions),
      'Risk Level': input.riskLevel === 'higher-risk' ? 'Higher Risk (EDD Required)' : 'Standard Risk'
    }),

    // Investor Mix
    createKeyValueSection('Investor Mix', {
      'Individual Investors': input.individualCount.toString(),
      'Entity Investors': input.entityCount.toString(),
      'Institutional Investors': input.institutionalCount.toString(),
      'Total Investors': output.totalInvestors.toString()
    }),

    // KYC/AML Scope
    createKeyValueSection('KYC/AML Scope', {
      'Due Diligence Level': input.dueDiligenceLevel === 'enhanced' ? 'Enhanced Due Diligence (EDD)' : 'Standard CDD',
      'Monitoring Frequency': getMonitoringName(input.monitoringFrequency),
      'Operating Model': getOperatingModelName(input.operatingModel),
      'Depth of Checks': input.checksDepth.map(getCheckName).join(', ')
    }),

    // Complexity Factors
    createKeyValueSection('Complexity Factors', {
      'Non-Resident Proportion': getNonResidentName(input.nonResidentProportion),
      'Complex Ownership': input.complexOwnership ? 'Yes (Multi-layer UBO analysis)' : 'No',
      'High-Risk Proportion': getHighRiskName(input.highRiskProportion)
    }),

    // Per-Investor Costs
    createTableSection(
      'Per-Investor Costs by Type',
      ['Investor Type', 'Count', 'Low', 'Medium', 'High'],
      [
        ['Individual', input.individualCount.toString(), formatCurrency(output.perInvestorCosts.individual.low), formatCurrency(output.perInvestorCosts.individual.medium), formatCurrency(output.perInvestorCosts.individual.high)],
        ['Entity', input.entityCount.toString(), formatCurrency(output.perInvestorCosts.entity.low), formatCurrency(output.perInvestorCosts.entity.medium), formatCurrency(output.perInvestorCosts.entity.high)],
        ['Institutional', input.institutionalCount.toString(), formatCurrency(output.perInvestorCosts.institutional.low), formatCurrency(output.perInvestorCosts.institutional.medium), formatCurrency(output.perInvestorCosts.institutional.high)]
      ]
    ),

    // Cost Breakdown
    createTableSection(
      'Detailed Cost Breakdown',
      ['Category', 'Count', 'Per Unit (Low-High)', 'Total (Low-High)'],
      output.breakdown.map(item => [
        item.category,
        item.count?.toString() || '-',
        item.count ? `${formatCurrency(item.perUnit.low)} - ${formatCurrency(item.perUnit.high)}` : '-',
        `${formatCurrency(item.total.low)} - ${formatCurrency(item.total.high)}`
      ])
    )
  ]

  // Add cost drivers if any
  if (output.drivers.length > 0) {
    sections.push(
      createTableSection(
        'Cost Drivers',
        ['Factor', 'Impact', 'Description'],
        output.drivers.map(driver => [
          driver.title,
          driver.impact === 'positive' ? 'Cost Reduction' : driver.impact === 'negative' ? 'Cost Driver' : 'Neutral',
          driver.description
        ])
      )
    )
  }

  downloadCSV({
    filename: `kyc-aml-estimate-${new Date().toISOString().split('T')[0]}`,
    toolName: 'KYC/AML Cost Estimator',
    sections,
    includeDisclaimer: true
  })
}

export function exportKYCAMLPDF(output: PricingOutput, input: KYCAMLInput) {
  const sections: PDFSection[] = [
    // Cost Summary
    { type: 'title', content: 'Estimated KYC/AML Costs' },
    {
      type: 'keyValue',
      data: {
        'Total Investors': output.totalInvestors.toString(),
        'Initial Onboarding (Most Likely)': formatCurrency(output.initialOnboarding.medium),
        'Initial Onboarding Range': `${formatCurrency(output.initialOnboarding.low)} - ${formatCurrency(output.initialOnboarding.high)}`,
        ...(input.hasOngoingMonitoring ? {
          'Annual Monitoring (Most Likely)': formatCurrency(output.annualOngoing.medium),
          'Annual Monitoring Range': `${formatCurrency(output.annualOngoing.low)} - ${formatCurrency(output.annualOngoing.high)}`
        } : {}),
        'Average Per Investor': formatCurrency(output.averagePerInvestor.medium)
      }
    },

    { type: 'spacer' },

    // Fund Profile
    { type: 'title', content: 'Fund Profile' },
    {
      type: 'keyValue',
      data: {
        'Fund Type': getFundTypeName(input.fundType),
        'Fund Domicile': getDomicileName(input.domicile),
        'Investor Jurisdictions': getJurisdictionName(input.investorJurisdictions),
        'Risk Level': input.riskLevel === 'higher-risk' ? 'Higher Risk' : 'Standard'
      }
    },

    { type: 'spacer' },

    // Investor Mix
    { type: 'title', content: 'Investor Mix' },
    {
      type: 'keyValue',
      data: {
        'Individual Investors': input.individualCount.toString(),
        'Entity Investors': input.entityCount.toString(),
        'Institutional Investors': input.institutionalCount.toString()
      }
    },

    { type: 'spacer' },

    // Per-Investor Costs Table
    ...createPDFTableSection(
      'Per-Investor Costs',
      ['Type', 'Count', 'Low', 'Medium', 'High'],
      [
        ['Individual', input.individualCount.toString(), formatCurrency(output.perInvestorCosts.individual.low), formatCurrency(output.perInvestorCosts.individual.medium), formatCurrency(output.perInvestorCosts.individual.high)],
        ['Entity', input.entityCount.toString(), formatCurrency(output.perInvestorCosts.entity.low), formatCurrency(output.perInvestorCosts.entity.medium), formatCurrency(output.perInvestorCosts.entity.high)],
        ['Institutional', input.institutionalCount.toString(), formatCurrency(output.perInvestorCosts.institutional.low), formatCurrency(output.perInvestorCosts.institutional.medium), formatCurrency(output.perInvestorCosts.institutional.high)]
      ]
    ),

    { type: 'spacer' },

    // KYC/AML Scope
    { type: 'title', content: 'KYC/AML Configuration' },
    {
      type: 'keyValue',
      data: {
        'Due Diligence': input.dueDiligenceLevel === 'enhanced' ? 'Enhanced (EDD)' : 'Standard CDD',
        'Monitoring': getMonitoringName(input.monitoringFrequency),
        'Operating Model': getOperatingModelName(input.operatingModel)
      }
    }
  ]

  // Add cost drivers if any
  if (output.drivers.length > 0) {
    sections.push({ type: 'spacer' })
    sections.push({ type: 'title', content: 'Key Cost Drivers' })
    output.drivers.slice(0, 4).forEach(driver => {
      const impact = driver.impact === 'positive' ? '[Savings]' : driver.impact === 'negative' ? '[Cost]' : ''
      sections.push({ type: 'text', content: `${driver.title} ${impact}: ${driver.description.substring(0, 100)}${driver.description.length > 100 ? '...' : ''}` })
    })
  }

  downloadPDF({
    filename: `kyc-aml-estimate-${new Date().toISOString().split('T')[0]}`,
    toolName: 'KYC/AML Cost Estimator',
    description: `KYC/AML cost estimate for ${output.totalInvestors} investors`,
    sections,
    includeDisclaimer: true
  })
}
