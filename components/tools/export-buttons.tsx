"use client"

import { Button } from '@/components/ui/button'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'

interface ExportButtonsProps {
  onExportCSV?: () => void
  onExportExcel?: () => void
  onExportPDF?: () => void
  disabled?: boolean
}

export function ExportButtons({
  onExportCSV,
  onExportExcel,
  onExportPDF,
  disabled = false
}: ExportButtonsProps) {
  const handleExportCSV = () => {
    if (onExportCSV) {
      onExportCSV()
    } else {
      // Placeholder functionality
      alert('CSV export functionality coming soon!')
    }
  }

  const handleExportExcel = () => {
    if (onExportExcel) {
      onExportExcel()
    } else {
      // Placeholder functionality
      alert('Excel export functionality coming soon!')
    }
  }

  const handleExportPDF = () => {
    if (onExportPDF) {
      onExportPDF()
    } else {
      // Placeholder functionality
      alert('PDF export functionality coming soon!')
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCSV}
        disabled={disabled}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        Export CSV
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportExcel}
        disabled={disabled}
        className="gap-2"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Export Excel
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPDF}
        disabled={disabled}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Export PDF
      </Button>
    </div>
  )
}
