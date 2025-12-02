import {
  SubscriptionLineOutput,
  formatCurrency,
  formatPercent,
  formatBasisPoints,
  formatMultiple
} from './subscriptionLineCalculations'
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

export function exportSubscriptionLineCSV(output: SubscriptionLineOutput) {
  const sections: CSVSection[] = [
    // Fund Structure
    createKeyValueSection('Fund Structure', {
      'Fund Size': formatCurrency(output.input.fundSize),
      'Investment Period': `${output.input.investmentPeriodYears} years`,
      'Total Fund Term': `${output.input.fundTermYears} years`,
      'Deployment Pace': output.input.deploymentPaceType,
      'Realization Schedule': output.input.realizationScheduleType,
      'Gross MOIC': formatMultiple(output.input.grossMOIC)
    }),

    // Economics
    createKeyValueSection('Fund Economics', {
      'Management Fee': `${formatPercent(output.input.managementFeeRate, 2)} on ${output.input.managementFeeBasis}`,
      'Carried Interest': formatPercent(output.input.carryRate, 0),
      'Preferred Return': formatPercent(output.input.prefRate, 1)
    }),

    // Subscription Line Terms
    createKeyValueSection('Subscription Line Terms', {
      'Using Credit Facility': output.input.useLine ? 'Yes' : 'No',
      ...(output.input.useLine ? {
        'Facility Size': `${formatPercent(output.input.facilitySize, 0)} (${formatCurrency(output.input.fundSize * output.input.facilitySize)})`,
        'Interest Rate': formatPercent(output.input.interestRate, 2),
        'Max Days Outstanding': `${output.input.maxDaysOutstanding} days`,
        'Repayment Trigger': output.input.repaymentTrigger === 'automatic' ? 'Automatic (time-based)' : 'Distribution-funded'
      } : {})
    }),

    // Performance Comparison
    createKeyValueSection('Performance Comparison', {
      'Net IRR (Without Line)': formatPercent(output.irrNoLine, 2),
      'Net IRR (With Line)': formatPercent(output.irrWithLine, 2),
      'IRR Impact': formatBasisPoints(output.irrBoost),
      'Net MOIC (Without Line)': formatMultiple(output.moicNoLine),
      'Net MOIC (With Line)': formatMultiple(output.moicWithLine),
      'MOIC Reduction': `${output.moicDrag.toFixed(2)}%`,
      'TVPI (Without Line)': formatMultiple(output.tvpiNoLine),
      'TVPI (With Line)': formatMultiple(output.tvpiWithLine),
      'DPI (Without Line)': formatMultiple(output.dpiNoLine),
      'DPI (With Line)': formatMultiple(output.dpiWithLine)
    }),

    // Cost Analysis
    createKeyValueSection('Cost Analysis', {
      'Total Interest Paid': formatCurrency(output.totalInterestPaid),
      'Total Management Fees': formatCurrency(output.totalManagementFees),
      'Combined Fee Drag': `${output.feeDrag.toFixed(2)}%`,
      'Capital Efficiency': `${output.capitalEfficiency.toFixed(2)}%`,
      'Avg Days Capital Outstanding': `${output.avgDaysCapitalOutstanding.toFixed(0)} days`
    }),

    // Cash Flow Timeline
    createTableSection(
      'Cash Flow Timeline',
      ['Year', 'Capital Calls (No Line)', 'Capital Calls (With Line)', 'Distributions', 'Interest Paid', 'Line Balance'],
      output.cashFlows.map(cf => [
        cf.year.toString(),
        formatCurrency(cf.capitalCallsNoLine),
        formatCurrency(cf.capitalCallsWithLine),
        formatCurrency(cf.distributionsWithLine),
        formatCurrency(cf.interestPaid),
        formatCurrency(cf.lineBalance)
      ])
    ),

    // J-Curve Data
    createTableSection(
      'J-Curve Data',
      ['Year', 'NAV (Without Line)', 'NAV (With Line)'],
      output.jCurveDataNoLine.map((d, i) => [
        d.year.toString(),
        formatCurrency(d.nav),
        formatCurrency(output.jCurveDataWithLine[i]?.nav || 0)
      ])
    )
  ]

  downloadCSV({
    filename: `subscription-line-analysis-${new Date().toISOString().split('T')[0]}`,
    toolName: 'Subscription Credit Line Impact Visualizer',
    sections,
    includeDisclaimer: true
  })
}

export function exportSubscriptionLinePDF(output: SubscriptionLineOutput) {
  const peakNegativeNoLine = Math.min(...output.jCurveDataNoLine.map(d => d.nav))
  const peakNegativeWithLine = Math.min(...output.jCurveDataWithLine.map(d => d.nav))

  const sections: PDFSection[] = [
    // Performance Summary
    { type: 'title', content: 'Performance Comparison' },
    {
      type: 'keyValue',
      data: {
        'Net IRR (Without Line)': formatPercent(output.irrNoLine, 2),
        'Net IRR (With Line)': formatPercent(output.irrWithLine, 2),
        'IRR Impact': formatBasisPoints(output.irrBoost),
        'Net MOIC (Without Line)': formatMultiple(output.moicNoLine),
        'Net MOIC (With Line)': formatMultiple(output.moicWithLine),
        'MOIC Reduction': `${output.moicDrag.toFixed(2)}%`
      }
    },

    { type: 'spacer' },

    // Fund Structure
    { type: 'title', content: 'Fund Structure' },
    {
      type: 'keyValue',
      data: {
        'Fund Size': formatCurrency(output.input.fundSize),
        'Investment Period': `${output.input.investmentPeriodYears} years`,
        'Fund Term': `${output.input.fundTermYears} years`,
        'Gross MOIC': formatMultiple(output.input.grossMOIC)
      }
    },

    { type: 'spacer' },

    // Subscription Line Terms
    { type: 'title', content: 'Subscription Line Terms' },
    {
      type: 'keyValue',
      data: output.input.useLine ? {
        'Facility Size': `${formatPercent(output.input.facilitySize, 0)}`,
        'Interest Rate': formatPercent(output.input.interestRate, 2),
        'Max Days Outstanding': `${output.input.maxDaysOutstanding} days`,
        'Repayment Trigger': output.input.repaymentTrigger
      } : {
        'Status': 'No subscription line used'
      }
    },

    { type: 'spacer' },

    // Cost Analysis
    { type: 'title', content: 'Cost Analysis' },
    {
      type: 'keyValue',
      data: {
        'Total Interest Paid': formatCurrency(output.totalInterestPaid),
        'Total Management Fees': formatCurrency(output.totalManagementFees),
        'Combined Fee Drag': `${output.feeDrag.toFixed(2)}%`
      }
    },

    { type: 'spacer' },

    // J-Curve Impact
    { type: 'title', content: 'J-Curve Impact' },
    {
      type: 'keyValue',
      data: {
        'Peak Negative NAV (No Line)': formatCurrency(peakNegativeNoLine),
        'Peak Negative NAV (With Line)': formatCurrency(peakNegativeWithLine),
        'J-Curve Reduction': formatCurrency(Math.abs(peakNegativeWithLine - peakNegativeNoLine))
      }
    },

    { type: 'spacer' },

    // Cash Flow Summary (first 5 years)
    { type: 'title', content: 'Cash Flow Summary (Years 1-5)' },
    createPDFTableSection(
      ['Year', 'Calls (No Line)', 'Calls (Line)', 'Distributions', 'Interest'],
      output.cashFlows.slice(0, 5).map(cf => [
        cf.year.toString(),
        formatCurrency(cf.capitalCallsNoLine),
        formatCurrency(cf.capitalCallsWithLine),
        formatCurrency(cf.distributionsWithLine),
        formatCurrency(cf.interestPaid)
      ])
    ),

    { type: 'spacer' },

    // Key Insights
    { type: 'title', content: 'Key Insights' },
    { type: 'text', content: `IRR Impact: The subscription line ${output.irrBoost > 0 ? 'boosts' : 'reduces'} IRR by ${formatBasisPoints(output.irrBoost)} by delaying capital calls from LPs.` },
    { type: 'text', content: `MOIC Impact: Net multiple reduced by ${output.moicDrag.toFixed(2)}% due to ${formatCurrency(output.totalInterestPaid)} in interest expense.` },
    { type: 'text', content: `Per ILPA guidance, funds should report both levered and unlevered returns for transparency.` }
  ]

  downloadPDF({
    filename: `subscription-line-analysis-${new Date().toISOString().split('T')[0]}`,
    toolName: 'Subscription Credit Line Impact Visualizer',
    description: `Analysis for ${formatCurrency(output.input.fundSize)} fund with ${output.input.useLine ? formatPercent(output.input.facilitySize, 0) + ' facility' : 'no credit line'}`,
    sections,
    includeDisclaimer: true
  })
}
