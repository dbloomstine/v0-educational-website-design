"use client"

import { Phase, FundFormationInputs } from './types'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { FileText, FileSpreadsheet, Download, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface ExportPanelProps {
  phases: Phase[]
  inputs: FundFormationInputs
}

export function ExportPanel({ phases, inputs }: ExportPanelProps) {
  const [copied, setCopied] = useState(false)

  const generateTextSummary = (): string => {
    let text = `FUND FORMATION TIMELINE\n`
    text += `Generated on ${format(new Date(), 'MMMM d, yyyy')}\n\n`

    text += `FUND DETAILS:\n`
    text += `Strategy: ${inputs.strategy}\n`
    text += `Target Size: ${inputs.sizeBand}\n`
    text += `Jurisdiction: ${inputs.jurisdiction}\n`
    text += `Anchor Investor: ${inputs.anchorStatus}\n`
    text += `Target First Close: ${format(inputs.firstCloseDate, 'MMMM d, yyyy')}\n`
    text += `Target Final Close: ${format(inputs.finalCloseDate, 'MMMM d, yyyy')}\n\n`

    phases.forEach((phase) => {
      text += `\n${'='.repeat(60)}\n`
      text += `${phase.name.toUpperCase()}\n`
      text += `${phase.description}\n`
      text += `Timeline: ${format(phase.startDate, 'MMM d, yyyy')} - ${format(phase.endDate, 'MMM d, yyyy')}\n`
      text += `${'='.repeat(60)}\n\n`

      phase.milestones.forEach((milestone, index) => {
        text += `${index + 1}. ${milestone.name}\n`
        text += `   Description: ${milestone.description}\n`
        text += `   Dates: ${format(milestone.startDate, 'MMM d, yyyy')} - ${format(milestone.endDate, 'MMM d, yyyy')}\n`
        text += `   Duration: ${milestone.duration} days\n`
        text += `   Owner: ${milestone.owner}\n`
        text += `   Categories: ${milestone.category.join(', ')}\n\n`
      })
    })

    return text
  }

  const generateCSV = (): string => {
    let csv = 'Phase,Milestone,Description,Start Date,End Date,Duration (days),Owner,Categories\n'

    phases.forEach((phase) => {
      phase.milestones.forEach((milestone) => {
        const row = [
          phase.name,
          milestone.name,
          `"${milestone.description}"`,
          format(milestone.startDate, 'yyyy-MM-dd'),
          format(milestone.endDate, 'yyyy-MM-dd'),
          milestone.duration.toString(),
          milestone.owner,
          `"${milestone.category.join(', ')}"`
        ]
        csv += row.join(',') + '\n'
      })
    })

    return csv
  }

  const handleCopyText = async () => {
    const text = generateTextSummary()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadCSV = () => {
    const csv = generateCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fund-formation-timeline-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handlePrintPDF = () => {
    window.print()
  }

  return (
    <div className="p-4 bg-accent/20 rounded-lg border border-accent space-y-4">
      <div>
        <h3 className="font-semibold text-sm mb-1">Export Timeline</h3>
        <p className="text-xs text-muted-foreground">
          Save or share your fund formation timeline
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyText}
          className="justify-start"
        >
          {copied ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          {copied ? 'Copied!' : 'Copy Text Summary'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadCSV}
          className="justify-start"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Download CSV
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handlePrintPDF}
          className="justify-start"
        >
          <FileText className="h-4 w-4 mr-2" />
          Print / Save PDF
        </Button>
      </div>

      <div className="text-xs text-muted-foreground pt-2 border-t border-border">
        <p>
          <strong>Tip:</strong> Use "Copy Text Summary" to paste into emails or memos.
          CSV exports work great in Excel or Google Sheets.
        </p>
      </div>
    </div>
  )
}
