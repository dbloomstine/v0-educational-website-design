"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExportToolbarProps {
  /** Handler for CSV export */
  onExportCSV?: () => void
  /** Handler for PDF export */
  onExportPDF?: () => void
  /** Whether exports are disabled (e.g., no data yet) */
  disabled?: boolean
  /** Loading state for CSV export */
  csvLoading?: boolean
  /** Loading state for PDF export */
  pdfLoading?: boolean
  /** Custom className */
  className?: string
  /** Compact mode for inline use */
  compact?: boolean
}

/**
 * ExportToolbar - Unified export buttons for all tools
 *
 * Provides CSV and PDF export buttons with consistent styling.
 * Supports loading states and disabled state.
 */
export function ExportToolbar({
  onExportCSV,
  onExportPDF,
  disabled = false,
  csvLoading = false,
  pdfLoading = false,
  className,
  compact = false
}: ExportToolbarProps) {
  const hasCSV = !!onExportCSV
  const hasPDF = !!onExportPDF

  if (!hasCSV && !hasPDF) {
    return null
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {hasCSV && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCSV}
            disabled={disabled || csvLoading}
          >
            {csvLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span className="ml-1.5">CSV</span>
          </Button>
        )}
        {hasPDF && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportPDF}
            disabled={disabled || pdfLoading}
          >
            {pdfLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            <span className="ml-1.5">PDF</span>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border border-border bg-muted/30",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Download className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Export Results</p>
          <p className="text-xs text-muted-foreground">
            Download your calculations
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        {hasCSV && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCSV}
            disabled={disabled || csvLoading}
            className="flex-1 sm:flex-none"
          >
            {csvLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            Export CSV
          </Button>
        )}
        {hasPDF && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportPDF}
            disabled={disabled || pdfLoading}
            className="flex-1 sm:flex-none"
          >
            {pdfLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * MobileExportBar - Fixed bottom bar for mobile export actions
 */
interface MobileExportBarProps extends ExportToolbarProps {
  /** Whether to show the bar (typically based on scroll position or results) */
  show?: boolean
}

export function MobileExportBar({
  show = true,
  onExportCSV,
  onExportPDF,
  disabled = false,
  csvLoading = false,
  pdfLoading = false
}: MobileExportBarProps) {
  const hasCSV = !!onExportCSV
  const hasPDF = !!onExportPDF

  if (!show || (!hasCSV && !hasPDF)) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-3 sm:hidden">
      <div className="flex items-center gap-2">
        {hasCSV && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCSV}
            disabled={disabled || csvLoading}
            className="flex-1"
          >
            {csvLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            CSV
          </Button>
        )}
        {hasPDF && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportPDF}
            disabled={disabled || pdfLoading}
            className="flex-1"
          >
            {pdfLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            PDF
          </Button>
        )}
      </div>
    </div>
  )
}
