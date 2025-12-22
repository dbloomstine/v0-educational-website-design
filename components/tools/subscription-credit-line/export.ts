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
import {
  downloadExcel,
  createExcelSection,
  type ExcelSection
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
    ...createPDFTableSection(
      'Cash Flow Summary (Years 1-5)',
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

// Comparison CSV export
export function exportSubscriptionLineComparisonCSV(outputA: SubscriptionLineOutput, outputB: SubscriptionLineOutput) {
  const sections: CSVSection[] = [
    // Fund Structure Comparison
    createTableSection(
      'Fund Structure Comparison',
      ['Metric', 'Scenario A', 'Scenario B', 'Difference'],
      [
        ['Fund Size', formatCurrency(outputA.input.fundSize), formatCurrency(outputB.input.fundSize), formatCurrency(outputB.input.fundSize - outputA.input.fundSize)],
        ['Investment Period', `${outputA.input.investmentPeriodYears} years`, `${outputB.input.investmentPeriodYears} years`, '-'],
        ['Gross MOIC', formatMultiple(outputA.input.grossMOIC), formatMultiple(outputB.input.grossMOIC), `${(outputB.input.grossMOIC - outputA.input.grossMOIC).toFixed(2)}x`]
      ]
    ),

    // Line Terms Comparison
    createTableSection(
      'Subscription Line Terms',
      ['Metric', 'Scenario A', 'Scenario B', 'Difference'],
      [
        ['Using Line', outputA.input.useLine ? 'Yes' : 'No', outputB.input.useLine ? 'Yes' : 'No', '-'],
        ['Facility Size', formatPercent(outputA.input.facilitySize, 0), formatPercent(outputB.input.facilitySize, 0), `${((outputB.input.facilitySize - outputA.input.facilitySize) * 100).toFixed(0)}%`],
        ['Interest Rate', formatPercent(outputA.input.interestRate, 2), formatPercent(outputB.input.interestRate, 2), `${((outputB.input.interestRate - outputA.input.interestRate) * 100).toFixed(2)}%`],
        ['Max Days Outstanding', `${outputA.input.maxDaysOutstanding} days`, `${outputB.input.maxDaysOutstanding} days`, `${outputB.input.maxDaysOutstanding - outputA.input.maxDaysOutstanding} days`]
      ]
    ),

    // Performance Comparison
    createTableSection(
      'Performance Results',
      ['Metric', 'Scenario A', 'Scenario B', 'Difference'],
      [
        ['Net IRR (With Line)', formatPercent(outputA.irrWithLine, 2), formatPercent(outputB.irrWithLine, 2), `${((outputB.irrWithLine - outputA.irrWithLine) * 100).toFixed(2)}%`],
        ['Net IRR (No Line)', formatPercent(outputA.irrNoLine, 2), formatPercent(outputB.irrNoLine, 2), `${((outputB.irrNoLine - outputA.irrNoLine) * 100).toFixed(2)}%`],
        ['IRR Boost', formatBasisPoints(outputA.irrBoost), formatBasisPoints(outputB.irrBoost), `${(outputB.irrBoost - outputA.irrBoost).toFixed(0)} bps`],
        ['Net MOIC (With Line)', formatMultiple(outputA.moicWithLine), formatMultiple(outputB.moicWithLine), `${(outputB.moicWithLine - outputA.moicWithLine).toFixed(2)}x`],
        ['Net MOIC (No Line)', formatMultiple(outputA.moicNoLine), formatMultiple(outputB.moicNoLine), `${(outputB.moicNoLine - outputA.moicNoLine).toFixed(2)}x`],
        ['MOIC Drag', `${outputA.moicDrag.toFixed(2)}%`, `${outputB.moicDrag.toFixed(2)}%`, `${(outputB.moicDrag - outputA.moicDrag).toFixed(2)}%`]
      ]
    ),

    // Cost Comparison
    createTableSection(
      'Cost Analysis',
      ['Metric', 'Scenario A', 'Scenario B', 'Difference'],
      [
        ['Total Interest Paid', formatCurrency(outputA.totalInterestPaid), formatCurrency(outputB.totalInterestPaid), formatCurrency(outputB.totalInterestPaid - outputA.totalInterestPaid)],
        ['Total Management Fees', formatCurrency(outputA.totalManagementFees), formatCurrency(outputB.totalManagementFees), formatCurrency(outputB.totalManagementFees - outputA.totalManagementFees)],
        ['Combined Fee Drag', `${outputA.feeDrag.toFixed(2)}%`, `${outputB.feeDrag.toFixed(2)}%`, `${(outputB.feeDrag - outputA.feeDrag).toFixed(2)}%`]
      ]
    )
  ]

  downloadCSV({
    filename: `subscription-line-comparison-${new Date().toISOString().split('T')[0]}`,
    toolName: 'Subscription Credit Line Impact Visualizer',
    sections,
    includeDisclaimer: true
  })
}

// Comparison PDF export
export function exportSubscriptionLineComparisonPDF(outputA: SubscriptionLineOutput, outputB: SubscriptionLineOutput) {
  const sections: PDFSection[] = [
    // Scenario Inputs
    { type: 'title', content: 'Scenario Comparison' },
    ...createPDFTableSection(
      '',
      ['Input', 'Scenario A', 'Scenario B'],
      [
        ['Fund Size', formatCurrency(outputA.input.fundSize), formatCurrency(outputB.input.fundSize)],
        ['Using Line', outputA.input.useLine ? 'Yes' : 'No', outputB.input.useLine ? 'Yes' : 'No'],
        ['Facility Size', formatPercent(outputA.input.facilitySize, 0), formatPercent(outputB.input.facilitySize, 0)],
        ['Interest Rate', formatPercent(outputA.input.interestRate, 2), formatPercent(outputB.input.interestRate, 2)],
        ['Max Days Out', `${outputA.input.maxDaysOutstanding}`, `${outputB.input.maxDaysOutstanding}`]
      ]
    ),

    { type: 'spacer' },

    // Performance Results
    { type: 'title', content: 'Performance Results' },
    ...createPDFTableSection(
      '',
      ['Metric', 'Scenario A', 'Scenario B'],
      [
        ['Net IRR (With Line)', formatPercent(outputA.irrWithLine, 2), formatPercent(outputB.irrWithLine, 2)],
        ['Net MOIC (With Line)', formatMultiple(outputA.moicWithLine), formatMultiple(outputB.moicWithLine)],
        ['IRR Boost', formatBasisPoints(outputA.irrBoost), formatBasisPoints(outputB.irrBoost)],
        ['MOIC Drag', `${outputA.moicDrag.toFixed(2)}%`, `${outputB.moicDrag.toFixed(2)}%`]
      ]
    ),

    { type: 'spacer' },

    // Impact Analysis
    { type: 'title', content: 'Impact Analysis (B vs A)' },
    {
      type: 'keyValue',
      data: {
        'IRR Difference': `${((outputB.irrWithLine - outputA.irrWithLine) * 100) >= 0 ? '+' : ''}${((outputB.irrWithLine - outputA.irrWithLine) * 100).toFixed(2)}%`,
        'MOIC Difference': `${(outputB.moicWithLine - outputA.moicWithLine) >= 0 ? '+' : ''}${(outputB.moicWithLine - outputA.moicWithLine).toFixed(2)}x`,
        'IRR Boost Change': `${(outputB.irrBoost - outputA.irrBoost) >= 0 ? '+' : ''}${(outputB.irrBoost - outputA.irrBoost).toFixed(0)} bps`,
        'Interest Cost Change': formatCurrency(outputB.totalInterestPaid - outputA.totalInterestPaid)
      }
    }
  ]

  downloadPDF({
    filename: `subscription-line-comparison-${new Date().toISOString().split('T')[0]}`,
    toolName: 'Subscription Credit Line Impact Visualizer',
    description: 'Side-by-side comparison of two subscription line scenarios.',
    sections,
    includeDisclaimer: true
  })
}

// Excel export functions
export function exportSubscriptionLineExcel(output: SubscriptionLineOutput) {
  const sections: ExcelSection[] = [
    // Summary sheet
    createExcelSection(
      'Summary',
      'Performance Comparison',
      ['Metric', 'Without Line', 'With Line', 'Impact'],
      [
        ['Net IRR', formatPercent(output.irrNoLine, 2), formatPercent(output.irrWithLine, 2), formatBasisPoints(output.irrBoost)],
        ['Net MOIC', formatMultiple(output.moicNoLine), formatMultiple(output.moicWithLine), `${output.moicDrag.toFixed(2)}%`],
        ['TVPI', formatMultiple(output.tvpiNoLine), formatMultiple(output.tvpiWithLine), `${((output.tvpiWithLine - output.tvpiNoLine) * 100).toFixed(2)}%`],
        ['DPI', formatMultiple(output.dpiNoLine), formatMultiple(output.dpiWithLine), `${((output.dpiWithLine - output.dpiNoLine) * 100).toFixed(2)}%`],
        ['Total Interest Paid', '-', formatCurrency(output.totalInterestPaid), formatCurrency(output.totalInterestPaid)],
        ['Total Management Fees', formatCurrency(output.totalManagementFees), formatCurrency(output.totalManagementFees), '-'],
        ['Combined Fee Drag', '-', `${output.feeDrag.toFixed(2)}%`, `${output.feeDrag.toFixed(2)}%`],
        ['Capital Efficiency', '-', `${output.capitalEfficiency.toFixed(2)}%`, `${output.capitalEfficiency.toFixed(2)}%`],
        ['Avg Days Outstanding', '-', `${output.avgDaysCapitalOutstanding.toFixed(0)} days`, `${output.avgDaysCapitalOutstanding.toFixed(0)} days`]
      ],
      [30, 20, 20, 20]
    ),

    // Fund Structure sheet
    createExcelSection(
      'Fund Structure',
      'Fund Parameters',
      ['Parameter', 'Value'],
      [
        ['Fund Size', formatCurrency(output.input.fundSize)],
        ['Investment Period', `${output.input.investmentPeriodYears} years`],
        ['Total Fund Term', `${output.input.fundTermYears} years`],
        ['Deployment Pace', output.input.deploymentPaceType],
        ['Realization Schedule', output.input.realizationScheduleType],
        ['Gross MOIC', formatMultiple(output.input.grossMOIC)],
        ['Management Fee', `${formatPercent(output.input.managementFeeRate, 2)} on ${output.input.managementFeeBasis}`],
        ['Carried Interest', formatPercent(output.input.carryRate, 0)],
        ['Preferred Return', formatPercent(output.input.prefRate, 1)]
      ],
      [35, 25]
    ),

    // Subscription Line Terms sheet
    createExcelSection(
      'Sub Line Terms',
      'Subscription Line Configuration',
      ['Parameter', 'Value'],
      output.input.useLine ? [
        ['Using Credit Facility', 'Yes'],
        ['Facility Size (%)', formatPercent(output.input.facilitySize, 0)],
        ['Facility Size ($)', formatCurrency(output.input.fundSize * output.input.facilitySize)],
        ['Interest Rate', formatPercent(output.input.interestRate, 2)],
        ['Max Days Outstanding', `${output.input.maxDaysOutstanding} days`],
        ['Repayment Trigger', output.input.repaymentTrigger === 'automatic' ? 'Automatic (time-based)' : 'Distribution-funded']
      ] : [
        ['Using Credit Facility', 'No']
      ],
      [35, 30]
    ),

    // Cash Flow Timeline sheet
    createExcelSection(
      'Cash Flows',
      'Annual Cash Flow Timeline',
      ['Year', 'Capital Calls (No Line)', 'Capital Calls (With Line)', 'Distributions', 'Interest Paid', 'Line Balance'],
      output.cashFlows.map(cf => [
        cf.year,
        cf.capitalCallsNoLine,
        cf.capitalCallsWithLine,
        cf.distributionsWithLine,
        cf.interestPaid,
        cf.lineBalance
      ]),
      [8, 22, 22, 18, 18, 18]
    ),

    // J-Curve Data sheet
    createExcelSection(
      'J-Curve',
      'J-Curve Progression',
      ['Year', 'NAV (Without Line)', 'NAV (With Line)', 'Difference'],
      output.jCurveDataNoLine.map((d, i) => [
        d.year,
        d.nav,
        output.jCurveDataWithLine[i]?.nav || 0,
        (output.jCurveDataWithLine[i]?.nav || 0) - d.nav
      ]),
      [8, 22, 22, 22]
    )
  ]

  downloadExcel({
    filename: `subscription-line-analysis-${new Date().toISOString().split('T')[0]}`,
    toolName: 'Subscription Credit Line Impact Visualizer',
    description: `Analysis for ${formatCurrency(output.input.fundSize)} fund with ${output.input.useLine ? formatPercent(output.input.facilitySize, 0) + ' facility' : 'no credit line'}`,
    sections,
    includeTimestamp: true,
    includeDisclaimer: true
  })
}

// Comparison Excel export
export function exportSubscriptionLineComparisonExcel(outputA: SubscriptionLineOutput, outputB: SubscriptionLineOutput) {
  const sections: ExcelSection[] = [
    // Comparison Summary sheet
    createExcelSection(
      'Comparison',
      'Scenario Comparison',
      ['Metric', 'Scenario A', 'Scenario B', 'Difference'],
      [
        // Fund Structure
        ['FUND STRUCTURE', '', '', ''],
        ['Fund Size', formatCurrency(outputA.input.fundSize), formatCurrency(outputB.input.fundSize), formatCurrency(outputB.input.fundSize - outputA.input.fundSize)],
        ['Investment Period', `${outputA.input.investmentPeriodYears} years`, `${outputB.input.investmentPeriodYears} years`, '-'],
        ['Gross MOIC', formatMultiple(outputA.input.grossMOIC), formatMultiple(outputB.input.grossMOIC), `${(outputB.input.grossMOIC - outputA.input.grossMOIC).toFixed(2)}x`],
        ['', '', '', ''],
        // Subscription Line Terms
        ['SUBSCRIPTION LINE', '', '', ''],
        ['Using Line', outputA.input.useLine ? 'Yes' : 'No', outputB.input.useLine ? 'Yes' : 'No', '-'],
        ['Facility Size', formatPercent(outputA.input.facilitySize, 0), formatPercent(outputB.input.facilitySize, 0), `${((outputB.input.facilitySize - outputA.input.facilitySize) * 100).toFixed(0)}%`],
        ['Interest Rate', formatPercent(outputA.input.interestRate, 2), formatPercent(outputB.input.interestRate, 2), `${((outputB.input.interestRate - outputA.input.interestRate) * 100).toFixed(2)}%`],
        ['Max Days Out', `${outputA.input.maxDaysOutstanding}`, `${outputB.input.maxDaysOutstanding}`, `${outputB.input.maxDaysOutstanding - outputA.input.maxDaysOutstanding}`],
        ['', '', '', ''],
        // Performance Results
        ['PERFORMANCE', '', '', ''],
        ['Net IRR (With Line)', formatPercent(outputA.irrWithLine, 2), formatPercent(outputB.irrWithLine, 2), `${((outputB.irrWithLine - outputA.irrWithLine) * 100).toFixed(2)}%`],
        ['Net IRR (No Line)', formatPercent(outputA.irrNoLine, 2), formatPercent(outputB.irrNoLine, 2), `${((outputB.irrNoLine - outputA.irrNoLine) * 100).toFixed(2)}%`],
        ['IRR Boost', formatBasisPoints(outputA.irrBoost), formatBasisPoints(outputB.irrBoost), `${(outputB.irrBoost - outputA.irrBoost).toFixed(0)} bps`],
        ['Net MOIC (With Line)', formatMultiple(outputA.moicWithLine), formatMultiple(outputB.moicWithLine), `${(outputB.moicWithLine - outputA.moicWithLine).toFixed(2)}x`],
        ['MOIC Drag', `${outputA.moicDrag.toFixed(2)}%`, `${outputB.moicDrag.toFixed(2)}%`, `${(outputB.moicDrag - outputA.moicDrag).toFixed(2)}%`],
        ['', '', '', ''],
        // Cost Analysis
        ['COSTS', '', '', ''],
        ['Total Interest', formatCurrency(outputA.totalInterestPaid), formatCurrency(outputB.totalInterestPaid), formatCurrency(outputB.totalInterestPaid - outputA.totalInterestPaid)],
        ['Total Mgmt Fees', formatCurrency(outputA.totalManagementFees), formatCurrency(outputB.totalManagementFees), formatCurrency(outputB.totalManagementFees - outputA.totalManagementFees)],
        ['Combined Fee Drag', `${outputA.feeDrag.toFixed(2)}%`, `${outputB.feeDrag.toFixed(2)}%`, `${(outputB.feeDrag - outputA.feeDrag).toFixed(2)}%`]
      ],
      [30, 20, 20, 20]
    )
  ]

  downloadExcel({
    filename: `subscription-line-comparison-${new Date().toISOString().split('T')[0]}`,
    toolName: 'Subscription Credit Line Impact Visualizer',
    description: 'Side-by-side comparison of two subscription line scenarios',
    sections,
    includeTimestamp: true,
    includeDisclaimer: true
  })
}
