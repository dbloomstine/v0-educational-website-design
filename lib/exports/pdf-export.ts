/**
 * PDF Export Utility
 *
 * Provides functions to generate professional PDF reports from tool data.
 * Uses jsPDF for PDF generation with manual table formatting.
 */

import { jsPDF } from "jspdf"
import { toast } from "sonner"

// Brand colors
const COLORS = {
  primary: [26, 29, 36] as [number, number, number],      // Dark background color
  accent: [96, 165, 250] as [number, number, number],     // Blue accent
  text: [51, 51, 51] as [number, number, number],         // Dark text
  muted: [107, 114, 128] as [number, number, number],     // Gray text
  border: [229, 231, 235] as [number, number, number],    // Light border
  headerBg: [249, 250, 251] as [number, number, number],  // Light gray bg
}

export interface PDFSection {
  type: "title" | "subtitle" | "text" | "keyValue" | "table" | "spacer"
  content?: string
  data?: Record<string, string | number> | string[][]
  headers?: string[]
}

export interface PDFExportOptions {
  /** Filename without extension */
  filename: string
  /** Tool name for the header */
  toolName: string
  /** Tool description */
  description?: string
  /** Content sections */
  sections: PDFSection[]
  /** Include standard disclaimer */
  includeDisclaimer?: boolean
}

/**
 * Generate and download a PDF report
 */
export function downloadPDF(options: PDFExportOptions): void {
  try {
    const {
      filename,
      toolName,
      description,
      sections,
      includeDisclaimer = true
    } = options

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    let y = margin

    // Helper to check if we need a new page
    const checkNewPage = (needed: number) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage()
        y = margin
        return true
      }
      return false
    }

    // Header
    doc.setFillColor(...COLORS.primary)
    doc.rect(0, 0, pageWidth, 35, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.text("FundOpsHQ", margin, 12)

    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text(toolName, margin, 24)

    y = 45

    // Timestamp
    doc.setTextColor(...COLORS.muted)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    const timestamp = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
    doc.text(`Generated: ${timestamp}`, margin, y)
    y += 8

    // Description
    if (description) {
      doc.setTextColor(...COLORS.text)
      doc.setFontSize(10)
      const descLines = doc.splitTextToSize(description, contentWidth)
      doc.text(descLines, margin, y)
      y += descLines.length * 5 + 5
    }

    // Process sections
    sections.forEach((section) => {
      switch (section.type) {
        case "title":
          checkNewPage(15)
          doc.setTextColor(...COLORS.text)
          doc.setFontSize(14)
          doc.setFont("helvetica", "bold")
          doc.text(section.content || "", margin, y)
          y += 8
          break

        case "subtitle":
          checkNewPage(12)
          doc.setTextColor(...COLORS.muted)
          doc.setFontSize(11)
          doc.setFont("helvetica", "bold")
          doc.text(section.content || "", margin, y)
          y += 6
          break

        case "text":
          checkNewPage(10)
          doc.setTextColor(...COLORS.text)
          doc.setFontSize(10)
          doc.setFont("helvetica", "normal")
          const textLines = doc.splitTextToSize(section.content || "", contentWidth)
          doc.text(textLines, margin, y)
          y += textLines.length * 5 + 3
          break

        case "keyValue":
          if (section.data && typeof section.data === "object" && !Array.isArray(section.data)) {
            const entries = Object.entries(section.data)
            const rowHeight = 7
            checkNewPage(entries.length * rowHeight + 5)

            entries.forEach(([key, value], index) => {
              const isEven = index % 2 === 0
              if (isEven) {
                doc.setFillColor(...COLORS.headerBg)
                doc.rect(margin, y - 4, contentWidth, rowHeight, "F")
              }

              doc.setTextColor(...COLORS.muted)
              doc.setFontSize(9)
              doc.setFont("helvetica", "normal")
              doc.text(key, margin + 2, y)

              doc.setTextColor(...COLORS.text)
              doc.setFont("helvetica", "bold")
              doc.text(String(value), margin + contentWidth / 2, y)

              y += rowHeight
            })
            y += 5
          }
          break

        case "table":
          if (section.headers && section.data && Array.isArray(section.data)) {
            const headers = section.headers
            const rows = section.data as string[][]
            const colWidth = contentWidth / headers.length
            const rowHeight = 7

            checkNewPage((rows.length + 1) * rowHeight + 10)

            // Table header
            doc.setFillColor(...COLORS.primary)
            doc.rect(margin, y - 4, contentWidth, rowHeight, "F")
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(9)
            doc.setFont("helvetica", "bold")

            headers.forEach((header, i) => {
              doc.text(header, margin + i * colWidth + 2, y)
            })
            y += rowHeight

            // Table rows
            doc.setTextColor(...COLORS.text)
            doc.setFont("helvetica", "normal")

            rows.forEach((row, rowIndex) => {
              if (rowIndex % 2 === 0) {
                doc.setFillColor(...COLORS.headerBg)
                doc.rect(margin, y - 4, contentWidth, rowHeight, "F")
              }

              row.forEach((cell, i) => {
                const text = String(cell || "")
                const truncated = text.length > 25 ? text.substring(0, 22) + "..." : text
                doc.text(truncated, margin + i * colWidth + 2, y)
              })
              y += rowHeight
            })
            y += 5
          }
          break

        case "spacer":
          y += 10
          break
      }
    })

    // Disclaimer
    if (includeDisclaimer) {
      checkNewPage(45)

      y += 5
      doc.setDrawColor(...COLORS.border)
      doc.line(margin, y, pageWidth - margin, y)
      y += 8

      doc.setTextColor(...COLORS.muted)
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.text("DISCLAIMER", margin, y)
      y += 5

      doc.setFont("helvetica", "normal")
      const disclaimerText = [
        "This tool provides educational estimates only and should not be considered financial, legal, or tax advice.",
        "Actual costs and outcomes depend on your specific situation, service providers, and market conditions.",
        "Always obtain formal quotes from qualified service providers. Consult with legal, tax, and financial advisors for your specific situation.",
        "",
        "FundOpsHQ is an educational resource and does not provide professional services."
      ]

      disclaimerText.forEach((line) => {
        const lines = doc.splitTextToSize(line, contentWidth)
        doc.text(lines, margin, y)
        y += lines.length * 4 + 1
      })
    }

    // Footer on each page
    const totalPages = doc.internal.pages.length - 1
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setTextColor(...COLORS.muted)
      doc.setFontSize(8)
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin - 20,
        pageHeight - 10
      )
      doc.text("fundops.com", margin, pageHeight - 10)
    }

    // Download
    doc.save(`${filename}.pdf`)
    toast.success("PDF exported successfully", {
      description: `${filename}.pdf has been downloaded`
    })
  } catch (error) {
    toast.error("Export failed", {
      description: "There was an error exporting the PDF file"
    })
    console.error("PDF export error:", error)
  }
}

/**
 * Helper to create a key-value section
 */
export function createPDFKeyValueSection(
  title: string,
  data: Record<string, string | number>
): PDFSection[] {
  return [
    { type: "subtitle", content: title },
    { type: "keyValue", data }
  ]
}

/**
 * Helper to create a table section
 */
export function createPDFTableSection(
  title: string,
  headers: string[],
  rows: string[][]
): PDFSection[] {
  return [
    { type: "subtitle", content: title },
    { type: "table", headers, data: rows }
  ]
}
