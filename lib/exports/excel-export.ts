/**
 * Excel Export Utility
 *
 * Provides functions to generate professional Excel files from tool data.
 * Uses SheetJS (xlsx) library for Excel generation with proper formatting.
 */

import * as XLSX from 'xlsx'
import { toast } from 'sonner'

export interface ExcelSection {
  /** Sheet name (max 31 characters) */
  sheetName: string
  /** Section title (optional header at top of sheet) */
  title?: string
  /** Column headers */
  headers: string[]
  /** Row data */
  rows: (string | number | null | undefined)[][]
  /** Column widths in characters (optional) */
  columnWidths?: number[]
}

export interface ExcelExportOptions {
  /** Filename without extension */
  filename: string
  /** Tool name for the header */
  toolName: string
  /** Tool description (optional) */
  description?: string
  /** Data sections (each becomes a sheet) */
  sections: ExcelSection[]
  /** Include timestamp */
  includeTimestamp?: boolean
  /** Include disclaimer sheet */
  includeDisclaimer?: boolean
}

/**
 * Format a number for Excel display
 */
function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Format a currency value for Excel
 */
function formatCurrency(value: number, decimals: number = 0): string {
  return '$' + formatNumber(value, decimals)
}

/**
 * Format cell value for Excel
 */
function formatCellValue(value: string | number | null | undefined): string | number {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') return value
  return String(value)
}

/**
 * Generate and download an Excel file
 */
export function downloadExcel(options: ExcelExportOptions): void {
  try {
    const {
      filename,
      toolName,
      description,
      sections,
      includeTimestamp = true,
      includeDisclaimer = true
    } = options

    const wb = XLSX.utils.book_new()

    // Helper to set column widths
    const setColWidths = (ws: XLSX.WorkSheet, widths: number[]) => {
      ws['!cols'] = widths.map(w => ({ wch: w }))
    }

    // Add each section as a sheet
    sections.forEach((section) => {
      const sheetData: (string | number)[][] = []

      // Add title row if provided
      if (section.title) {
        sheetData.push([section.title])
        sheetData.push([]) // Empty row for spacing
      }

      // Add headers
      sheetData.push(section.headers)

      // Add data rows
      section.rows.forEach((row) => {
        sheetData.push(row.map(formatCellValue))
      })

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(sheetData)

      // Set column widths
      if (section.columnWidths) {
        setColWidths(ws, section.columnWidths)
      } else {
        // Auto-calculate widths based on headers
        const defaultWidths = section.headers.map(h => Math.max(h.length + 2, 15))
        setColWidths(ws, defaultWidths)
      }

      // Add sheet to workbook (limit sheet name to 31 chars)
      const sheetName = section.sheetName.substring(0, 31)
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    })

    // Add info sheet with metadata
    const infoData: (string | number)[][] = [
      ['FundOpsHQ - ' + toolName],
      []
    ]

    if (description) {
      infoData.push([description])
      infoData.push([])
    }

    if (includeTimestamp) {
      const timestamp = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      infoData.push(['Generated:', timestamp])
      infoData.push([])
    }

    infoData.push(['Tool:', toolName])
    infoData.push(['Website:', 'fundops.com'])

    const infoWs = XLSX.utils.aoa_to_sheet(infoData)
    setColWidths(infoWs, [20, 40])
    XLSX.utils.book_append_sheet(wb, infoWs, 'Info')

    // Add disclaimer sheet if requested
    if (includeDisclaimer) {
      const disclaimerData: (string | number)[][] = [
        ['DISCLAIMER'],
        [],
        ['This tool provides educational estimates only and should not be considered financial, legal, or tax advice.'],
        [],
        ['Actual costs and outcomes depend on your specific situation, service providers, and market conditions.'],
        [],
        ['Always obtain formal quotes from qualified service providers. Consult with legal, tax, and financial advisors for your specific situation.'],
        [],
        ['FundOpsHQ is an educational resource and does not provide professional services.']
      ]

      const disclaimerWs = XLSX.utils.aoa_to_sheet(disclaimerData)
      setColWidths(disclaimerWs, [100])
      XLSX.utils.book_append_sheet(wb, disclaimerWs, 'Disclaimer')
    }

    // Write file
    XLSX.writeFile(wb, `${filename}.xlsx`)

    toast.success('Excel file exported successfully', {
      description: `${filename}.xlsx has been downloaded`
    })
  } catch (error) {
    toast.error('Export failed', {
      description: 'There was an error exporting the Excel file'
    })
  }
}

/**
 * Helper to create a simple data section
 */
export function createExcelSection(
  sheetName: string,
  title: string | undefined,
  headers: string[],
  rows: (string | number | null | undefined)[][],
  columnWidths?: number[]
): ExcelSection {
  return { sheetName, title, headers, rows, columnWidths }
}
