"use client"

import { Phase, FundFormationInputs } from './types'
import { format } from 'date-fns'
import { useState } from 'react'
import { ExportToolbar } from '@/components/tools/shared'
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

interface ExportPanelProps {
  phases: Phase[]
  inputs: FundFormationInputs
}

export function ExportPanel({ phases, inputs }: ExportPanelProps) {
  const [csvLoading, setCsvLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const handleExportCSV = () => {
    setCsvLoading(true)
    setTimeout(() => {
      const sections: CSVSection[] = [
        // Fund Details
        createKeyValueSection('Fund Details', {
          'Strategy': inputs.strategy,
          'Target Size': inputs.sizeBand,
          'Jurisdiction': inputs.jurisdiction,
          'Anchor Investor': inputs.anchorStatus,
          'Starting Point': inputs.startingPoint,
          'Target First Close': format(inputs.firstCloseDate, 'MMMM d, yyyy'),
          'Target Final Close': format(inputs.finalCloseDate, 'MMMM d, yyyy')
        }),

        // All Milestones
        createTableSection(
          'Timeline Milestones',
          ['Phase', 'Milestone', 'Start Date', 'End Date', 'Duration', 'Owner', 'Categories'],
          phases.flatMap(phase =>
            phase.milestones.map(milestone => [
              phase.name,
              milestone.name,
              format(milestone.startDate, 'yyyy-MM-dd'),
              format(milestone.endDate, 'yyyy-MM-dd'),
              `${milestone.duration} days`,
              milestone.owner,
              milestone.category.join(', ')
            ])
          )
        )
      ]

      downloadCSV({
        filename: `fund-formation-timeline-${format(new Date(), 'yyyy-MM-dd')}`,
        toolName: 'Fund Formation Timeline',
        sections,
        includeDisclaimer: true
      })
      setCsvLoading(false)
    }, 100)
  }

  const handleExportPDF = () => {
    setPdfLoading(true)
    setTimeout(() => {
      const sections: PDFSection[] = [
        // Fund Details
        { type: 'title', content: 'Fund Details' },
        {
          type: 'keyValue',
          data: {
            'Strategy': inputs.strategy,
            'Target Size': inputs.sizeBand,
            'Jurisdiction': inputs.jurisdiction,
            'Anchor Investor': inputs.anchorStatus
          }
        },
        {
          type: 'keyValue',
          data: {
            'First Close': format(inputs.firstCloseDate, 'MMM d, yyyy'),
            'Final Close': format(inputs.finalCloseDate, 'MMM d, yyyy')
          }
        },

        { type: 'spacer' },

        // Phase Summaries
        { type: 'title', content: 'Timeline Phases' },
        ...createPDFTableSection(
          '',
          ['Phase', 'Start', 'End', 'Tasks'],
          phases.map(phase => [
            phase.name.substring(0, 20),
            format(phase.startDate, 'MMM d'),
            format(phase.endDate, 'MMM d'),
            String(phase.milestones.length)
          ])
        ),

        { type: 'spacer' },

        // Key Milestones (first 15)
        { type: 'title', content: 'Key Milestones' },
        ...createPDFTableSection(
          '',
          ['Milestone', 'Start', 'End', 'Owner'],
          phases.flatMap(phase =>
            phase.milestones.map(m => [
              m.name.substring(0, 25),
              format(m.startDate, 'MMM d'),
              format(m.endDate, 'MMM d'),
              m.owner.substring(0, 15)
            ])
          ).slice(0, 15)
        )
      ]

      downloadPDF({
        filename: `fund-formation-timeline-${format(new Date(), 'yyyy-MM-dd')}`,
        toolName: 'Fund Formation Timeline',
        description: `${inputs.strategy} fund timeline targeting ${inputs.sizeBand} with ${inputs.jurisdiction} structure.`,
        sections,
        includeDisclaimer: true
      })
      setPdfLoading(false)
    }, 100)
  }

  return (
    <div className="p-4 bg-accent/20 rounded-lg border border-accent space-y-4">
      <div>
        <h3 className="font-semibold text-sm mb-1">Export Timeline</h3>
        <p className="text-xs text-muted-foreground">
          Save or share your fund formation timeline
        </p>
      </div>

      <ExportToolbar
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        csvLoading={csvLoading}
        pdfLoading={pdfLoading}
      />

      <div className="text-xs text-muted-foreground pt-2 border-t border-border">
        <p>
          <strong>Tip:</strong> CSV exports work great in Excel or Google Sheets for project management.
          PDF provides a clean summary for stakeholder presentations.
        </p>
      </div>
    </div>
  )
}
