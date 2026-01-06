"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  FileDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  BarChart3,
  Table,
  FileSpreadsheet
} from 'lucide-react'
import { BudgetData, BudgetResults } from './types'
import { formatCurrency, formatRunway } from './budget-calculator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface PDFExportProps {
  data: BudgetData
  results: BudgetResults
  className?: string
}

interface ExportSection {
  id: string
  label: string
  icon: typeof FileText
  description: string
}

const EXPORT_SECTIONS: ExportSection[] = [
  {
    id: 'summary',
    label: 'Executive Summary',
    icon: FileText,
    description: 'Key metrics and highlights'
  },
  {
    id: 'charts',
    label: 'Charts & Visualizations',
    icon: BarChart3,
    description: 'Cash runway, expense breakdown'
  },
  {
    id: 'details',
    label: 'Detailed Budget',
    icon: Table,
    description: 'Line-by-line expense items'
  },
  {
    id: 'assumptions',
    label: 'Assumptions & Notes',
    icon: FileSpreadsheet,
    description: 'Methodology and disclaimers'
  }
]

export function PDFExport({ data, results, className }: PDFExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [selectedSections, setSelectedSections] = useState<string[]>(
    EXPORT_SECTIONS.map(s => s.id)
  )
  const [dialogOpen, setDialogOpen] = useState(false)

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const generatePrintableHTML = (): string => {
    const fund = data.funds[0]
    const teamCost = data.expenses.team.reduce((s, t) => s + t.monthlyCost, 0)
    const opsCost = data.expenses.operations.reduce((s, o) => s + o.monthlyCost, 0)
    const overheadCost = data.expenses.overhead.reduce((s, o) => s + o.monthlyCost, 0)

    const sections = []

    // Executive Summary
    if (selectedSections.includes('summary')) {
      sections.push(`
        <div class="section">
          <h2>Executive Summary</h2>
          <div class="metrics-grid">
            <div class="metric">
              <div class="metric-label">Fund Size</div>
              <div class="metric-value">$${fund?.size || 0}M</div>
            </div>
            <div class="metric">
              <div class="metric-label">Management Fee</div>
              <div class="metric-value">${fund?.feeRate || 0}%</div>
            </div>
            <div class="metric">
              <div class="metric-label">Monthly Burn</div>
              <div class="metric-value">${formatCurrency(results.monthlyBurn, true)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Annual Budget</div>
              <div class="metric-value">${formatCurrency(results.annualBudget, true)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Annual Revenue</div>
              <div class="metric-value">${formatCurrency(results.annualRevenue, true)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Pre-Fee Runway</div>
              <div class="metric-value">${formatRunway(results.runwayMonths)}</div>
            </div>
          </div>
          <div class="highlight-box ${results.annualRevenue >= results.annualBudget ? 'positive' : 'warning'}">
            ${results.annualRevenue >= results.annualBudget
              ? `✓ Positive cash flow: ${formatCurrency(results.annualRevenue - results.annualBudget, true)} annual surplus`
              : `⚠ Revenue gap: ${formatCurrency(results.annualBudget - results.annualRevenue, true)} annual shortfall`
            }
          </div>
        </div>
      `)
    }

    // Charts placeholder (visual representation in print)
    if (selectedSections.includes('charts')) {
      sections.push(`
        <div class="section">
          <h2>Budget Overview</h2>
          <div class="chart-placeholder">
            <h3>Expense Distribution</h3>
            <div class="bar-chart">
              <div class="bar-item">
                <div class="bar-label">Team Costs</div>
                <div class="bar-container">
                  <div class="bar" style="width: ${(teamCost / results.monthlyBurn * 100).toFixed(0)}%"></div>
                  <span class="bar-value">${formatCurrency(teamCost, true)}/mo (${(teamCost / results.monthlyBurn * 100).toFixed(0)}%)</span>
                </div>
              </div>
              <div class="bar-item">
                <div class="bar-label">Operations</div>
                <div class="bar-container">
                  <div class="bar ops" style="width: ${(opsCost / results.monthlyBurn * 100).toFixed(0)}%"></div>
                  <span class="bar-value">${formatCurrency(opsCost, true)}/mo (${(opsCost / results.monthlyBurn * 100).toFixed(0)}%)</span>
                </div>
              </div>
              <div class="bar-item">
                <div class="bar-label">Overhead</div>
                <div class="bar-container">
                  <div class="bar overhead" style="width: ${(overheadCost / results.monthlyBurn * 100).toFixed(0)}%"></div>
                  <span class="bar-value">${formatCurrency(overheadCost, true)}/mo (${(overheadCost / results.monthlyBurn * 100).toFixed(0)}%)</span>
                </div>
              </div>
            </div>
          </div>
          <div class="chart-placeholder">
            <h3>Cash Runway Timeline</h3>
            <div class="timeline">
              <div class="timeline-item">
                <div class="timeline-marker start"></div>
                <div class="timeline-content">
                  <strong>Today</strong>
                  <span>${formatCurrency(data.startingCash)}</span>
                </div>
              </div>
              ${fund?.feeStartMonth ? `
              <div class="timeline-item">
                <div class="timeline-marker fee"></div>
                <div class="timeline-content">
                  <strong>First Close (Month ${fund.feeStartMonth})</strong>
                  <span>Fees begin on $${fund.firstCloseAmount || 0}M</span>
                </div>
              </div>
              ` : ''}
              ${results.runwayMonths ? `
              <div class="timeline-item">
                <div class="timeline-marker end"></div>
                <div class="timeline-content">
                  <strong>Runway End (Month ${results.runwayMonths})</strong>
                  <span>Without fee income</span>
                </div>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
      `)
    }

    // Detailed Budget
    if (selectedSections.includes('details')) {
      sections.push(`
        <div class="section page-break">
          <h2>Detailed Budget</h2>

          <h3>Team Expenses</h3>
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Monthly Cost</th>
                <th>Annual Cost</th>
                <th>Partner</th>
              </tr>
            </thead>
            <tbody>
              ${data.expenses.team.map(member => `
                <tr>
                  <td>${member.role}</td>
                  <td>${formatCurrency(member.monthlyCost, true)}</td>
                  <td>${formatCurrency(member.monthlyCost * 12, true)}</td>
                  <td>${member.isPartner ? 'Yes' : 'No'}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td><strong>Total Team</strong></td>
                <td><strong>${formatCurrency(teamCost, true)}</strong></td>
                <td><strong>${formatCurrency(teamCost * 12, true)}</strong></td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <h3>Operations Expenses</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Monthly Cost</th>
                <th>Annual Cost</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              ${data.expenses.operations.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${formatCurrency(item.monthlyCost, true)}</td>
                  <td>${formatCurrency(item.monthlyCost * 12, true)}</td>
                  <td>${item.category || 'General'}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td><strong>Total Operations</strong></td>
                <td><strong>${formatCurrency(opsCost, true)}</strong></td>
                <td><strong>${formatCurrency(opsCost * 12, true)}</strong></td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <h3>Overhead Expenses</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Monthly Cost</th>
                <th>Annual Cost</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              ${data.expenses.overhead.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${formatCurrency(item.monthlyCost, true)}</td>
                  <td>${formatCurrency(item.monthlyCost * 12, true)}</td>
                  <td>${item.category || 'General'}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td><strong>Total Overhead</strong></td>
                <td><strong>${formatCurrency(overheadCost, true)}</strong></td>
                <td><strong>${formatCurrency(overheadCost * 12, true)}</strong></td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <div class="grand-total">
            <div class="total-label">Grand Total</div>
            <div class="total-value">${formatCurrency(results.monthlyBurn, true)}/month | ${formatCurrency(results.annualBudget, true)}/year</div>
          </div>
        </div>
      `)
    }

    // Assumptions & Notes
    if (selectedSections.includes('assumptions')) {
      sections.push(`
        <div class="section page-break">
          <h2>Assumptions & Notes</h2>

          <h3>Key Assumptions</h3>
          <ul>
            <li>Management fees calculated on committed capital during investment period</li>
            <li>Fee timing assumes first close at month ${fund?.feeStartMonth || 12}</li>
            <li>Runway calculated without fee income to assess pre-fundraise risk</li>
            <li>All expenses assumed to be recurring monthly unless noted</li>
          </ul>

          <h3>Methodology</h3>
          <ul>
            <li><strong>Monthly Burn:</strong> Sum of all recurring monthly expenses</li>
            <li><strong>Annual Revenue:</strong> (Fund Size × Fee Rate) calculated on committed capital</li>
            <li><strong>Runway:</strong> Starting Cash ÷ Monthly Burn (excluding fee income)</li>
            <li><strong>Break-even AUM:</strong> Annual Expenses ÷ Fee Rate</li>
          </ul>

          <h3>Industry Sources</h3>
          <ul>
            <li>ILPA Fee Reporting Template</li>
            <li>Cambridge Associates Operating Metrics</li>
            <li>Preqin Private Capital Terms</li>
            <li>NVCA Industry Survey</li>
          </ul>

          <h3>Disclaimer</h3>
          <p class="disclaimer">
            This budget model is for planning purposes only and does not constitute financial, legal, or tax advice.
            Actual results will vary based on fundraising timing, fee negotiations, expense management, and market conditions.
            Consult with qualified professionals before making business decisions.
          </p>
        </div>
      `)
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Management Company Budget - ${fund?.name || 'Fund'}</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1a1a1a;
            padding: 40px;
            max-width: 850px;
            margin: 0 auto;
          }
          h1 {
            font-size: 26px;
            margin-bottom: 10px;
            color: #111;
            font-weight: 700;
          }
          h2 {
            font-size: 20px;
            margin-bottom: 18px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e5e5;
            color: #222;
            font-weight: 600;
          }
          h3 {
            font-size: 16px;
            margin: 24px 0 14px;
            color: #444;
            font-weight: 600;
          }
          .header {
            margin-bottom: 36px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e5e5;
          }
          .header-meta {
            font-size: 12px;
            color: #666;
            margin-top: 8px;
          }
          .section {
            margin-bottom: 32px;
          }
          .page-break {
            page-break-before: always;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 24px;
          }
          .metric {
            padding: 18px;
            background: #f9f9f9;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e5e5e5;
          }
          .metric-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 500;
          }
          .metric-value {
            font-size: 22px;
            font-weight: 700;
            color: #111;
            margin-top: 6px;
          }
          .highlight-box {
            padding: 12px 16px;
            border-radius: 8px;
            font-weight: 500;
          }
          .highlight-box.positive {
            background: #dcfce7;
            color: #166534;
          }
          .highlight-box.warning {
            background: #fef3c7;
            color: #92400e;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11pt;
          }
          th, td {
            padding: 12px 14px;
            text-align: left;
            border-bottom: 1px solid #e5e5e5;
          }
          th {
            background: #1a1d24;
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.6px;
          }
          .total-row {
            background: #f9f9f9;
            font-weight: 600;
          }
          .grand-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            background: #111;
            color: white;
            border-radius: 8px;
            margin-top: 24px;
          }
          .total-label {
            font-weight: 600;
            font-size: 14px;
          }
          .total-value {
            font-size: 16px;
            font-weight: 600;
          }
          .chart-placeholder {
            padding: 20px;
            background: #f9f9f9;
            border-radius: 8px;
            margin-bottom: 16px;
          }
          .bar-chart {
            margin-top: 12px;
          }
          .bar-item {
            margin-bottom: 12px;
          }
          .bar-label {
            font-size: 11px;
            margin-bottom: 4px;
            color: #555;
          }
          .bar-container {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .bar {
            height: 20px;
            background: #3b82f6;
            border-radius: 4px;
            min-width: 4px;
          }
          .bar.ops { background: #10b981; }
          .bar.overhead { background: #f59e0b; }
          .bar-value {
            font-size: 10px;
            color: #666;
            white-space: nowrap;
          }
          .timeline {
            position: relative;
            padding-left: 20px;
            margin-top: 16px;
          }
          .timeline::before {
            content: '';
            position: absolute;
            left: 6px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #e5e5e5;
          }
          .timeline-item {
            position: relative;
            padding-bottom: 16px;
          }
          .timeline-marker {
            position: absolute;
            left: -14px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #3b82f6;
          }
          .timeline-marker.start { background: #10b981; }
          .timeline-marker.fee { background: #f59e0b; }
          .timeline-marker.end { background: #ef4444; }
          .timeline-content {
            display: flex;
            justify-content: space-between;
          }
          ul {
            margin-left: 20px;
            margin-bottom: 16px;
          }
          li {
            margin-bottom: 6px;
          }
          .disclaimer {
            font-size: 10px;
            color: #666;
            padding: 12px;
            background: #f5f5f5;
            border-radius: 4px;
            font-style: italic;
          }
          @media print {
            body {
              padding: 0;
            }
            .page-break {
              page-break-before: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FundOpsHQ - Management Company Budget</h1>
          <div class="header-meta">
            ${fund?.name || 'Fund'} | Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })} | For Planning Purposes Only
          </div>
        </div>
        ${sections.join('')}
      </body>
      </html>
    `
  }

  const handleExport = async () => {
    if (selectedSections.length === 0) return

    setIsExporting(true)
    setExportStatus('idle')

    try {
      const html = generatePrintableHTML()

      // Create a new window for printing
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('Could not open print window')
      }

      printWindow.document.write(html)
      printWindow.document.close()

      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print()
      }

      setExportStatus('success')
      setTimeout(() => {
        setExportStatus('idle')
        setDialogOpen(false)
      }, 2000)
    } catch (error) {
      // Export failed
      setExportStatus('error')
    } finally {
      setIsExporting(false)
    }
  }

  // Quick CSV export for spreadsheet users
  const handleCSVExport = () => {
    const formatNumberForCSV = (num: number) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    const rows = [
      ['FundOpsHQ - Management Company Budget Export'],
      ['Generated', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })],
      [],
      ['Summary'],
      ['Fund Size', `$${data.funds[0]?.size || 0}M`],
      ['Fee Rate', `${data.funds[0]?.feeRate || 0}%`],
      ['Monthly Burn', formatCurrency(results.monthlyBurn)],
      ['Annual Budget', formatCurrency(results.annualBudget)],
      ['Annual Revenue', formatCurrency(results.annualRevenue)],
      ['Runway (months)', results.runwayMonths || 'N/A'],
      [],
      ['Team Expenses'],
      ['Role', 'Monthly Cost', 'Annual Cost', 'Is Partner'],
      ...data.expenses.team.map(m => [m.role, formatNumberForCSV(m.monthlyCost), formatNumberForCSV(m.monthlyCost * 12), m.isPartner ? 'Yes' : 'No']),
      [],
      ['Operations Expenses'],
      ['Name', 'Monthly Cost', 'Annual Cost', 'Category'],
      ...data.expenses.operations.map(o => [o.name, formatNumberForCSV(o.monthlyCost), formatNumberForCSV(o.monthlyCost * 12), o.category || '']),
      [],
      ['Overhead Expenses'],
      ['Name', 'Monthly Cost', 'Annual Cost', 'Category'],
      ...data.expenses.overhead.map(o => [o.name, formatNumberForCSV(o.monthlyCost), formatNumberForCSV(o.monthlyCost * 12), o.category || '']),
      [],
      ['DISCLAIMER'],
      ['This tool provides educational estimates only and should not be considered financial, legal, or tax advice.'],
      ['Actual costs and outcomes depend on your specific situation, service providers, and market conditions.'],
      ['FundOpsHQ is an educational resource and does not provide professional services.']
    ]

    const csv = rows.map(row => row.map(cell => {
      const str = String(cell)
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str
    }).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fundopshq-budget-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <FileDown className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Budget Report</DialogTitle>
          <DialogDescription>
            Choose which sections to include in your report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Section selection */}
          <div className="space-y-3">
            {EXPORT_SECTIONS.map((section) => {
              const Icon = section.icon
              const isSelected = selectedSections.includes(section.id)

              return (
                <div
                  key={section.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  )}
                  onClick={() => toggleSection(section.id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleSection(section.id)}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSection(section.id)}
                    tabIndex={-1}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <Label className="font-medium cursor-pointer">{section.label}</Label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {section.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Export buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleExport}
              disabled={isExporting || selectedSections.length === 0}
              className="w-full"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : exportStatus === 'success' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Exported!
                </>
              ) : exportStatus === 'error' ? (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Export Failed
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export as PDF
                </>
              )}
            </Button>

            <Button variant="outline" onClick={handleCSVExport} className="w-full">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export as CSV
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            PDF export opens a print dialog. Choose "Save as PDF" in your browser's print options.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
