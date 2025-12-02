/**
 * CSV Export Utility
 *
 * Provides functions to generate well-formatted CSV files from tool data.
 * CSV files can be opened directly in Excel or Google Sheets.
 */

export interface CSVSection {
  /** Section title (will be displayed as a header row) */
  title?: string
  /** Column headers (optional for simple list sections) */
  headers?: string[]
  /** Row data - each row is an array of values */
  rows: (string | number | null | undefined)[][]
}

export interface CSVExportOptions {
  /** Filename without extension */
  filename: string
  /** Tool name for the header */
  toolName: string
  /** Sections of data to include */
  sections: CSVSection[]
  /** Optional notes to include at the end */
  notes?: string[]
  /** Include timestamp */
  includeTimestamp?: boolean
  /** Include disclaimer */
  includeDisclaimer?: boolean
}

/**
 * Format a value for CSV (handles commas, quotes, etc.)
 */
function formatCSVValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  // If contains comma, newline, or quote, wrap in quotes and escape existing quotes
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Format a number for display (with commas for thousands)
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Format a currency value
 */
export function formatCurrency(value: number, decimals: number = 0): string {
  return "$" + formatNumber(value, decimals)
}

/**
 * Format a percentage value
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return formatNumber(value, decimals) + "%"
}

/**
 * Generate CSV content string
 */
export function generateCSV(options: CSVExportOptions): string {
  const {
    toolName,
    sections,
    notes = [],
    includeTimestamp = true,
    includeDisclaimer = true
  } = options

  const lines: string[] = []

  // Header
  lines.push(`FundOpsHQ - ${toolName}`)
  if (includeTimestamp) {
    lines.push(`Generated: ${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })}`)
  }
  lines.push("") // Empty line

  // Sections
  sections.forEach((section, index) => {
    if (section.title) {
      lines.push(section.title)
    }

    // Headers (optional - some sections are simple lists without headers)
    if (section.headers && section.headers.length > 0) {
      lines.push(section.headers.map(formatCSVValue).join(","))
    }

    // Data rows
    section.rows.forEach((row) => {
      lines.push(row.map(formatCSVValue).join(","))
    })

    // Add spacing between sections
    if (index < sections.length - 1) {
      lines.push("")
    }
  })

  // Notes
  if (notes.length > 0) {
    lines.push("")
    lines.push("Notes:")
    notes.forEach((note) => {
      lines.push(`"${note.replace(/"/g, '""')}"`)
    })
  }

  // Disclaimer
  if (includeDisclaimer) {
    lines.push("")
    lines.push("DISCLAIMER")
    lines.push("\"This tool provides educational estimates only and should not be considered financial, legal, or tax advice.\"")
    lines.push("\"Actual costs and outcomes depend on your specific situation, service providers, and market conditions.\"")
    lines.push("\"Always obtain formal quotes from qualified service providers.\"")
    lines.push("")
    lines.push("\"FundOpsHQ is an educational resource and does not provide professional services.\"")
  }

  return lines.join("\n")
}

/**
 * Download CSV file
 */
export function downloadCSV(options: CSVExportOptions): void {
  const csv = generateCSV(options)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = `${options.filename}.csv`
  link.style.display = "none"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Simple helper to create a section with key-value pairs
 */
export function createKeyValueSection(
  title: string,
  data: Record<string, string | number | null | undefined>
): CSVSection {
  return {
    title,
    headers: ["Parameter", "Value"],
    rows: Object.entries(data).map(([key, value]) => [key, value])
  }
}

/**
 * Simple helper to create a data table section
 */
export function createTableSection(
  title: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): CSVSection {
  return { title, headers, rows }
}
