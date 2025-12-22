import type { ClassificationResult, ClassificationInput } from './expenseData'
import { fundTypes, fundStages, beneficiaries, expenseCategories } from './expenseData'
import {
  downloadCSV,
  createKeyValueSection,
  createTableSection,
  type CSVSection
} from '@/lib/exports'
import {
  downloadPDF,
  type PDFSection
} from '@/lib/exports'
import {
  downloadExcel,
  createExcelSection,
  type ExcelSection
} from '@/lib/exports'

export function exportToPDF(input: ClassificationInput, result: ClassificationResult) {
  const categoryName = expenseCategories.find(c => c.id === input.expenseCategory)?.name || 'Custom Expense'
  const classificationLabel = result.classification === 'fund-expense' ? 'Fund Expense' :
                              result.classification === 'management-expense' ? 'Management Expense' :
                              'Case-by-Case'

  const sections: PDFSection[] = [
    // Classification Result
    { type: 'title', content: 'Classification Result' },
    {
      type: 'keyValue',
      data: {
        'Classification': classificationLabel,
        'Market Practice': result.marketPractice.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        'Expense Category': categoryName
      }
    },

    { type: 'spacer' },

    // Context
    { type: 'title', content: 'Input Context' },
    {
      type: 'keyValue',
      data: {
        'Fund Type': fundTypes[input.fundType].name,
        'Fund Stage': fundStages[input.fundStage].name,
        'Beneficiary': beneficiaries[input.primaryBeneficiary].name
      }
    },

    { type: 'spacer' },

    // Rationale
    { type: 'title', content: 'Rationale' },
    { type: 'text', content: result.headline },
    { type: 'spacer' },
    { type: 'text', content: result.rationale },

    { type: 'spacer' },

    // LP Sensitivities
    { type: 'title', content: 'LP Sensitivities' },
    { type: 'text', content: result.lpSensitivities }
  ]

  // Add flags if any
  if (result.flags.length > 0) {
    sections.push({ type: 'spacer' })
    sections.push({ type: 'title', content: 'Important Considerations' })
    result.flags.slice(0, 3).forEach(flag => {
      sections.push({ type: 'text', content: `- ${flag}` })
    })
  }

  downloadPDF({
    filename: `expense-allocation-analysis-${new Date().toISOString().split('T')[0]}`,
    toolName: 'Fund Expense Allocation Helper',
    description: `Expense classification analysis for: ${categoryName}`,
    sections,
    includeDisclaimer: true
  })
}

export function exportToCSV(input: ClassificationInput, result: ClassificationResult) {
  const categoryName = expenseCategories.find(c => c.id === input.expenseCategory)?.name || 'Custom Expense'
  const classificationLabel = result.classification === 'fund-expense' ? 'Fund Expense' :
                              result.classification === 'management-expense' ? 'Management Expense' :
                              'Case-by-Case'

  const sections: CSVSection[] = [
    // Classification Result
    createKeyValueSection('Classification Result', {
      'Classification': classificationLabel,
      'Market Practice': result.marketPractice,
      'Headline': result.headline
    }),

    // Input Context
    createKeyValueSection('Input Context', {
      'Expense Category': categoryName,
      'Custom Description': input.customDescription || 'N/A',
      'Fund Type': fundTypes[input.fundType].name,
      'Fund Stage': fundStages[input.fundStage].name,
      'Primary Beneficiary': beneficiaries[input.primaryBeneficiary].name,
      'LPA Context': input.lpaContext || 'N/A'
    }),

    // Analysis
    createKeyValueSection('Analysis', {
      'Rationale': result.rationale,
      'Detailed Explanation': result.detailedExplanation,
      'LP Sensitivities': result.lpSensitivities
    })
  ]

  // Add flags if any
  if (result.flags.length > 0) {
    sections.push(
      createTableSection(
        'Important Considerations',
        ['Flag'],
        result.flags.map(flag => [flag])
      )
    )
  }

  // Add examples if any
  if (result.examples.length > 0) {
    sections.push(
      createTableSection(
        'Examples',
        ['Example'],
        result.examples.map(example => [example])
      )
    )
  }

  downloadCSV({
    filename: `expense-allocation-analysis-${new Date().toISOString().split('T')[0]}`,
    toolName: 'Fund Expense Allocation Helper',
    sections,
    includeDisclaimer: true
  })
}

// Excel export function
export function exportToExcel(input: ClassificationInput, result: ClassificationResult) {
  const categoryName = expenseCategories.find(c => c.id === input.expenseCategory)?.name || 'Custom Expense'
  const classificationLabel = result.classification === 'fund-expense' ? 'Fund Expense' :
                              result.classification === 'management-expense' ? 'Management Expense' :
                              'Case-by-Case'

  const sections: ExcelSection[] = [
    // Summary sheet
    createExcelSection(
      'Summary',
      'Expense Classification Analysis',
      ['Parameter', 'Value'],
      [
        ['Classification Result', classificationLabel],
        ['Market Practice', result.marketPractice.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())],
        ['Expense Category', categoryName],
        ['', ''],
        ['Fund Type', fundTypes[input.fundType].name],
        ['Fund Stage', fundStages[input.fundStage].name],
        ['Primary Beneficiary', beneficiaries[input.primaryBeneficiary].name],
        ['', ''],
        ['Headline', result.headline]
      ],
      [30, 60]
    ),

    // Input Context sheet
    createExcelSection(
      'Input Context',
      'Detailed Input Parameters',
      ['Parameter', 'Value'],
      [
        ['Expense Category', categoryName],
        ['Custom Description', input.customDescription || 'N/A'],
        ['Fund Type', fundTypes[input.fundType].name],
        ['Fund Stage', fundStages[input.fundStage].name],
        ['Primary Beneficiary', beneficiaries[input.primaryBeneficiary].name],
        ['LPA Context', input.lpaContext || 'N/A']
      ],
      [30, 60]
    ),

    // Analysis sheet
    createExcelSection(
      'Analysis',
      'Detailed Analysis and Rationale',
      ['Section', 'Content'],
      [
        ['Classification', classificationLabel],
        ['Market Practice', result.marketPractice],
        ['Headline', result.headline],
        ['', ''],
        ['Rationale', result.rationale],
        ['', ''],
        ['Detailed Explanation', result.detailedExplanation],
        ['', ''],
        ['LP Sensitivities', result.lpSensitivities]
      ],
      [25, 90]
    )
  ]

  // Add flags sheet if any
  if (result.flags.length > 0) {
    sections.push(
      createExcelSection(
        'Important Notes',
        'Important Considerations and Flags',
        ['Flag'],
        result.flags.map(flag => [flag]),
        [100]
      )
    )
  }

  // Add examples sheet if any
  if (result.examples.length > 0) {
    sections.push(
      createExcelSection(
        'Examples',
        'Practical Examples',
        ['Example'],
        result.examples.map(example => [example]),
        [100]
      )
    )
  }

  downloadExcel({
    filename: `expense-allocation-analysis-${new Date().toISOString().split('T')[0]}`,
    toolName: 'Fund Expense Allocation Helper',
    description: `Expense classification analysis for: ${categoryName}`,
    sections,
    includeTimestamp: true,
    includeDisclaimer: true
  })
}
