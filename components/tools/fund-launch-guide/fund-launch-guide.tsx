"use client"

import { useState, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { PHASES, TASKS } from './data'
import { FundLaunchTask, FundLaunchPhase } from './types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Search,
  Printer,
  RotateCcw,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { DisclaimerBlock } from '@/components/tools/shared'

const STORAGE_KEY = 'fundopshq-fund-launch-simple'

// Priority badge colors
const priorityStyles = {
  critical: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  important: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  optional: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
}

// Category badge colors
const categoryStyles: Record<string, string> = {
  legal: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  regulatory: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  operations: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  marketing: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  finance: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

// Strategy options
const STRATEGIES = [
  { value: 'all', label: 'All Strategies' },
  { value: 'VC', label: 'Venture Capital' },
  { value: 'PE', label: 'Private Equity' },
  { value: 'Private Credit', label: 'Private Credit' },
  { value: 'Hedge Fund', label: 'Hedge Fund' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Infrastructure', label: 'Infrastructure' },
]

// Size options
const SIZES = [
  { value: 'all', label: 'All Sizes' },
  { value: 'emerging', label: 'Emerging (<$100M)' },
  { value: 'mid', label: 'Mid ($100M-$500M)' },
  { value: 'large', label: 'Large (>$500M)' },
]

export function FundLaunchGuide() {
  // State
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set()) // Start collapsed
  const [searchQuery, setSearchQuery] = useState('')
  const [phaseFilter, setPhaseFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [strategyFilter, setStrategyFilter] = useState<string>('all')
  const [sizeFilter, setSizeFilter] = useState<string>('all')
  const [hasLoaded, setHasLoaded] = useState(false)

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setCompletedTasks(new Set(parsed.completedTasks || []))
      }
    } catch {
      // Silent fail
    }
    setHasLoaded(true)
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (!hasLoaded) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      completedTasks: Array.from(completedTasks),
    }))
  }, [completedTasks, hasLoaded])

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let tasks = TASKS

    // Strategy filter - filter by applicableTo.strategies
    if (strategyFilter !== 'all') {
      tasks = tasks.filter(t =>
        t.applicableTo.strategies === 'all' ||
        t.applicableTo.strategies.includes(strategyFilter as never)
      )
    }

    // Size filter - filter by applicableTo.sizes
    if (sizeFilter !== 'all') {
      tasks = tasks.filter(t =>
        t.applicableTo.sizes === 'all' ||
        t.applicableTo.sizes.includes(sizeFilter as never)
      )
    }

    // Phase filter
    if (phaseFilter !== 'all') {
      tasks = tasks.filter(t => t.phaseId === phaseFilter)
    }

    // Category filter
    if (categoryFilter !== 'all') {
      tasks = tasks.filter(t => t.category === categoryFilter)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.quickTip.toLowerCase().includes(query)
      )
    }

    return tasks
  }, [strategyFilter, sizeFilter, phaseFilter, categoryFilter, searchQuery])

  // Group tasks by phase
  const tasksByPhase = useMemo(() => {
    const map = new Map<string, FundLaunchTask[]>()
    PHASES.forEach(phase => {
      const phaseTasks = filteredTasks
        .filter(t => t.phaseId === phase.id)
        .sort((a, b) => a.order - b.order)
      if (phaseTasks.length > 0) {
        map.set(phase.id, phaseTasks)
      }
    })
    return map
  }, [filteredTasks])

  // Progress stats - based on filtered tasks
  const progress = useMemo(() => {
    const completed = filteredTasks.filter(t => completedTasks.has(t.id)).length
    const total = filteredTasks.length
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }, [filteredTasks, completedTasks])

  // Handlers
  const handleToggleTask = (taskId: string) => {
    setCompletedTasks(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const handleToggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const handleTogglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev)
      if (next.has(phaseId)) {
        next.delete(phaseId)
      } else {
        next.add(phaseId)
      }
      return next
    })
  }

  const handleClearProgress = () => {
    if (confirm('Clear all progress? This cannot be undone.')) {
      setCompletedTasks(new Set())
    }
  }

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new()

    // Checklist sheet
    const checklistData: (string | number)[][] = [
      ['FundOpsHQ - Fund Launch Checklist'],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [''],
      ['Phase', 'Task', 'Status', 'Priority', 'Time Est.', 'Category', 'Quick Tip', 'Notes', 'Due Date', 'Owner']
    ]

    PHASES.forEach(phase => {
      const tasks = TASKS.filter(t => t.phaseId === phase.id).sort((a, b) => a.order - b.order)
      tasks.forEach(task => {
        checklistData.push([
          phase.name,
          task.title,
          completedTasks.has(task.id) ? '✓ Complete' : 'Pending',
          task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
          task.timeEstimate,
          task.category.charAt(0).toUpperCase() + task.category.slice(1),
          task.quickTip,
          '', '', '' // Notes, Due Date, Owner - blank for user
        ])
      })
    })

    const ws = XLSX.utils.aoa_to_sheet(checklistData)
    ws['!cols'] = [
      { wch: 25 }, { wch: 45 }, { wch: 12 }, { wch: 12 },
      { wch: 14 }, { wch: 14 }, { wch: 60 }, { wch: 30 }, { wch: 14 }, { wch: 18 }
    ]
    XLSX.utils.book_append_sheet(wb, ws, 'Checklist')

    // Summary sheet
    const summaryData: (string | number)[][] = [
      ['Summary'],
      [''],
      ['Total Tasks', TASKS.length],
      ['Completed', completedTasks.size],
      ['Remaining', TASKS.length - completedTasks.size],
      ['Progress', `${progress.percent}%`],
      [''],
      ['By Phase', 'Total', 'Complete', '% Done'],
    ]

    PHASES.forEach(phase => {
      const tasks = TASKS.filter(t => t.phaseId === phase.id)
      const completed = tasks.filter(t => completedTasks.has(t.id)).length
      const pct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
      summaryData.push([phase.name, tasks.length, completed, `${pct}%`])
    })

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

    XLSX.writeFile(wb, `fund-launch-checklist-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleExportPdf = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Header
    doc.setFillColor(26, 29, 36)
    doc.rect(0, 0, pageWidth, 35, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('FundOpsHQ', 14, 12)
    doc.setFontSize(20)
    doc.text('Fund Launch Checklist', 14, 25)

    let yPos = 45

    // Progress
    doc.setTextColor(51, 51, 51)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Progress: ${completedTasks.size} of ${TASKS.length} tasks (${progress.percent}%)`, 14, yPos)
    yPos += 12

    // Tasks by phase
    PHASES.forEach(phase => {
      const tasks = TASKS.filter(t => t.phaseId === phase.id).sort((a, b) => a.order - b.order)
      if (tasks.length === 0) return

      if (yPos > pageHeight - 60) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text(phase.name, 14, yPos)
      yPos += 6

      const tableData = tasks.map(task => [
        completedTasks.has(task.id) ? '☑' : '☐',
        task.title,
        task.priority,
        task.timeEstimate,
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['', 'Task', 'Priority', 'Time']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 110 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
        },
        headStyles: {
          fontStyle: 'bold',
          fillColor: [26, 29, 36],
          textColor: [255, 255, 255],
        },
        margin: { left: 14, right: 14 },
      })

      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text('fundopshq.com', 14, pageHeight - 10)
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' })
    }

    doc.save(`fund-launch-checklist-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const handlePrint = () => {
    window.print()
  }

  // Loading state
  if (!hasLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Disclaimer Banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg print:hidden">
        <svg className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-sm text-amber-900 dark:text-amber-100">
          <strong>Educational tool only.</strong> Fund formation requires qualified legal counsel for SEC/state registration, LPA drafting, and compliance. Requirements vary by jurisdiction.
        </p>
      </div>

      {/* Header with Progress & Export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-2xl font-bold">
            {progress.completed} of {progress.total} tasks
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="h-2 w-32 bg-accent rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground">{progress.percent}% complete</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPdf} className="gap-2">
            <Download className="h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 print:hidden">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          {completedTasks.size > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearProgress} className="gap-2 text-muted-foreground print:hidden">
              <RotateCcw className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 print:hidden">
        {/* Strategy and Size filters - primary */}
        <div className="flex flex-wrap gap-2">
          <Select value={strategyFilter} onValueChange={setStrategyFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Strategies" />
            </SelectTrigger>
            <SelectContent>
              {STRATEGIES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sizeFilter} onValueChange={setSizeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Sizes" />
            </SelectTrigger>
            <SelectContent>
              {SIZES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Search and secondary filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={phaseFilter} onValueChange={setPhaseFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Phases" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Phases</SelectItem>
              {PHASES.map(phase => (
                <SelectItem key={phase.id} value={phase.id}>{phase.shortName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>
              <SelectItem value="regulatory">Regulatory</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* No results */}
      {tasksByPhase.size === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">No tasks match your filters</div>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery('')
              setPhaseFilter('all')
              setCategoryFilter('all')
              setStrategyFilter('all')
              setSizeFilter('all')
            }}
            className="mt-2"
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Task Table by Phase */}
      <div className="space-y-4">
        {PHASES.filter(phase => tasksByPhase.has(phase.id)).map(phase => (
          <PhaseSection
            key={phase.id}
            phase={phase}
            tasks={tasksByPhase.get(phase.id) || []}
            completedTasks={completedTasks}
            expandedTasks={expandedTasks}
            isExpanded={expandedPhases.has(phase.id)}
            onTogglePhase={() => handleTogglePhase(phase.id)}
            onToggleTask={handleToggleTask}
            onToggleExpand={handleToggleExpand}
          />
        ))}
      </div>

      {/* Disclaimer */}
      <div className="print:hidden">
        <DisclaimerBlock
          additionalDisclaimer="Fund formation involves complex legal, regulatory, tax, and compliance requirements that vary by jurisdiction. This guide provides educational information only and is not a substitute for professional advice."
        />
      </div>
    </div>
  )
}

// Phase Section Component
function PhaseSection({
  phase,
  tasks,
  completedTasks,
  expandedTasks,
  isExpanded,
  onTogglePhase,
  onToggleTask,
  onToggleExpand,
}: {
  phase: FundLaunchPhase
  tasks: FundLaunchTask[]
  completedTasks: Set<string>
  expandedTasks: Set<string>
  isExpanded: boolean
  onTogglePhase: () => void
  onToggleTask: (id: string) => void
  onToggleExpand: (id: string) => void
}) {
  const phaseCompleted = tasks.filter(t => completedTasks.has(t.id)).length
  const allComplete = phaseCompleted === tasks.length && tasks.length > 0

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Phase Header */}
      <button
        onClick={onTogglePhase}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors print:py-2",
          "bg-muted/50 hover:bg-muted",
          allComplete && "bg-emerald-500/10"
        )}
      >
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 print:hidden" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 print:hidden" />
        )}
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: phase.color }}
        />
        <span className="font-semibold flex-1">{phase.name}</span>
        <span className="text-sm text-muted-foreground">
          {phaseCompleted}/{tasks.length}
        </span>
      </button>

      {/* Tasks */}
      {isExpanded && (
        <div className="divide-y divide-border">
          {tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              isCompleted={completedTasks.has(task.id)}
              isExpanded={expandedTasks.has(task.id)}
              onToggleComplete={() => onToggleTask(task.id)}
              onToggleExpand={() => onToggleExpand(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Task Row Component
function TaskRow({
  task,
  isCompleted,
  isExpanded,
  onToggleComplete,
  onToggleExpand,
}: {
  task: FundLaunchTask
  isCompleted: boolean
  isExpanded: boolean
  onToggleComplete: () => void
  onToggleExpand: () => void
}) {
  return (
    <div className={cn("transition-colors", isCompleted && "bg-muted/30")}>
      {/* Main Row */}
      <div className="flex items-start gap-3 px-4 py-3 print:py-2">
        {/* Checkbox */}
        <div className="pt-0.5 print:pt-0">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={onToggleComplete}
            className="h-5 w-5 rounded border-border text-primary focus:ring-primary cursor-pointer print:h-4 print:w-4"
          />
        </div>

        {/* Task Info */}
        <div className="flex-1 min-w-0">
          <button
            onClick={onToggleExpand}
            className="text-left w-full group"
          >
            <div className="flex items-start gap-2">
              <span
                className={cn(
                  "font-medium group-hover:text-primary transition-colors",
                  isCompleted && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </span>
              <span className="print:hidden">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground mt-0.5" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5" />
                )}
              </span>
            </div>
          </button>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 shrink-0 print:gap-1">
          <span className="text-xs text-muted-foreground hidden sm:inline print:inline">
            {task.timeEstimate}
          </span>
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full border capitalize",
              priorityStyles[task.priority]
            )}
          >
            {task.priority}
          </span>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pl-12 space-y-3 print:pb-2">
          <p className="text-sm text-muted-foreground">{task.quickTip}</p>

          {task.pitfalls && task.pitfalls.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Common pitfalls:</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {task.pitfalls.map((pitfall, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-500 shrink-0">•</span>
                    <span>{pitfall}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs">
            <span className={cn("px-2 py-0.5 rounded capitalize", categoryStyles[task.category] || 'bg-muted')}>
              {task.category}
            </span>
            {task.benchmark && (
              <span className="text-muted-foreground">
                {task.benchmark}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
