"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import {
  FundConfig,
  FundLaunchTask,
  FundLaunchPhase,
  ViewMode,
  STORAGE_KEY,
  DEFAULT_CONFIG,
} from './types'
import { PHASES, TASKS, getApplicableTasks, getTasksForPhase } from './data'
import { TaskCard } from './task-card'

// Dynamic import to avoid SSR issues with framer-motion and canvas-confetti
const JourneyMode = dynamic(() => import('./journey-mode').then(mod => mod.JourneyMode), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  ),
})
import { ProgressDashboard } from './progress-dashboard'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LayoutList,
  Columns3,
  Clock,
  ChevronDown,
  ChevronRight,
  Filter,
  X,
  Check,
  Copy,
  Download,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  Search,
  Sparkles,
  ArrowRight,
  Command,
  Timer,
  RotateCcw,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { RelatedToolsSection, DisclaimerBlock } from '@/components/tools/shared'

interface StoredState {
  config: FundConfig
  completedTasks: string[]
  viewMode: ViewMode
  expandedTasks: string[]
  hasCompletedOnboarding: boolean
  providers?: Record<string, string>
}

// Icons for phases
const phaseIcons: Record<string, string> = {
  'strategy-planning': '🎯',
  'legal-formation': '⚖️',
  'fund-docs': '📄',
  'regulatory': '🛡️',
  'service-providers': '🤝',
  'operations': '⚙️',
  'marketing': '📢',
  'first-close': '🚀',
}

export function FundLaunchGuide() {
  // Core state
  const [config, setConfig] = useState<FundConfig | null>(null)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>('timeline')
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())

  // UI state
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [showCopied, setShowCopied] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [filterCompleted, setFilterCompleted] = useState<'all' | 'incomplete' | 'completed'>('all')
  const [providers, setProviders] = useState<Record<string, string>>({})

  // Quick Jump Search state
  const [showQuickJump, setShowQuickJump] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Load state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: StoredState = JSON.parse(stored)
        setConfig(parsed.config)
        setCompletedTasks(new Set(parsed.completedTasks))
        setViewMode(parsed.viewMode || 'timeline')
        setExpandedTasks(new Set(parsed.expandedTasks || []))
        setShowOnboarding(!parsed.hasCompletedOnboarding)
        setProviders(parsed.providers || {})
      }
    } catch {
      // Silent fail - localStorage may be unavailable
    }
    setHasLoaded(true)
  }, [])

  // Save state to localStorage
  useEffect(() => {
    if (!hasLoaded || !config) return

    const state: StoredState = {
      config,
      completedTasks: Array.from(completedTasks),
      viewMode,
      expandedTasks: Array.from(expandedTasks),
      hasCompletedOnboarding: true,
      providers,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [config, completedTasks, viewMode, expandedTasks, hasLoaded, providers])

  // Get applicable tasks for current config
  const applicableTasks = useMemo(() => {
    if (!config) return []
    return getApplicableTasks(config)
  }, [config])

  // Group tasks by phase
  const tasksByPhase = useMemo(() => {
    const map = new Map<string, FundLaunchTask[]>()
    PHASES.forEach(phase => {
      const phaseTasks = applicableTasks
        .filter(t => t.phaseId === phase.id)
        .sort((a, b) => a.order - b.order)
      map.set(phase.id, phaseTasks)
    })
    return map
  }, [applicableTasks])

  // Get task dependencies with completion status
  const getTaskDependencies = useCallback((task: FundLaunchTask) => {
    if (!task.dependencies) return []
    return task.dependencies.map(dep => {
      const depTask = applicableTasks.find(t => t.id === dep.taskId)
      return depTask ? {
        task: depTask,
        type: dep.type,
        isCompleted: completedTasks.has(dep.taskId),
      } : null
    }).filter(Boolean) as { task: FundLaunchTask; type: 'required' | 'recommended'; isCompleted: boolean }[]
  }, [applicableTasks, completedTasks])

  // Filter tasks
  const getFilteredTasks = useCallback((tasks: FundLaunchTask[]) => {
    if (filterCompleted === 'all') return tasks
    if (filterCompleted === 'incomplete') return tasks.filter(t => !completedTasks.has(t.id))
    return tasks.filter(t => completedTasks.has(t.id))
  }, [filterCompleted, completedTasks])

  // Parse time estimate to hours
  const parseTimeToHours = useCallback((timeStr: string): number => {
    const match = timeStr.match(/(\d+(?:-\d+)?)\s*(hour|day|week|hr|wk)/i)
    if (!match) return 0
    const [, numPart, unit] = match
    const nums = numPart.split('-').map(Number)
    const avgNum = nums.reduce((a, b) => a + b, 0) / nums.length
    if (unit.toLowerCase().startsWith('week') || unit.toLowerCase().startsWith('wk')) return avgNum * 40
    if (unit.toLowerCase().startsWith('day')) return avgNum * 8
    return avgNum // hours
  }, [])

  // Calculate total estimated time remaining
  const totalTimeEstimate = useMemo(() => {
    const incompleteTasks = applicableTasks.filter(t => !completedTasks.has(t.id))
    const totalHours = incompleteTasks.reduce((sum, task) => sum + parseTimeToHours(task.timeEstimate), 0)
    if (totalHours === 0) return 'All done!'
    if (totalHours < 8) return `~${Math.ceil(totalHours)} hours`
    if (totalHours < 40) return `~${Math.ceil(totalHours / 8)} days`
    return `~${Math.ceil(totalHours / 40)} weeks`
  }, [applicableTasks, completedTasks, parseTimeToHours])

  // Search/filter tasks for Quick Jump
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return applicableTasks
      .filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.quickTip.toLowerCase().includes(query) ||
        task.category.toLowerCase().includes(query)
      )
      .slice(0, 8) // Limit to 8 results
  }, [applicableTasks, searchQuery])

  // Keyboard shortcut for Quick Jump (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowQuickJump(true)
        setSearchQuery('')
      }
      if (e.key === 'Escape' && showQuickJump) {
        setShowQuickJump(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showQuickJump])

  // Navigate to task from Quick Jump
  const handleQuickJumpSelect = (task: FundLaunchTask) => {
    setShowQuickJump(false)
    setSearchQuery('')
    const phase = PHASES.find(p => p.id === task.phaseId)
    if (phase) {
      setExpandedPhases(prev => new Set([...prev, phase.id]))
      setExpandedTasks(prev => new Set([...prev, task.id]))
      setTimeout(() => {
        const element = document.getElementById(`phase-${phase.id}`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }

  // Handlers
  const handleOnboardingComplete = (newConfig: FundConfig, newProviders: Record<string, string>, journeyCompletedTasks?: string[]) => {
    setConfig(newConfig)
    setProviders(newProviders)
    setShowOnboarding(false)
    // Preserve any tasks marked complete during the journey
    setCompletedTasks(new Set(journeyCompletedTasks || []))
    setExpandedTasks(new Set())
    // Keep phases collapsed - user can expand as needed
    setExpandedPhases(new Set())
  }

  const handleOnboardingSkip = () => {
    setConfig(DEFAULT_CONFIG)
    setShowOnboarding(false)
  }

  const handleToggleTaskComplete = (taskId: string) => {
    setCompletedTasks(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
    // Show saved indicator
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 1500)
  }

  // Find the recommended next task (highest priority incomplete task)
  const getRecommendedNextTask = useMemo(() => {
    const priorityOrder = { critical: 0, important: 1, optional: 2 }
    const incompleteTasks = applicableTasks
      .filter(t => !completedTasks.has(t.id))
      .sort((a, b) => {
        // First by priority
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (priorityDiff !== 0) return priorityDiff
        // Then by phase order
        const phaseA = PHASES.findIndex(p => p.id === a.phaseId)
        const phaseB = PHASES.findIndex(p => p.id === b.phaseId)
        if (phaseA !== phaseB) return phaseA - phaseB
        // Then by task order
        return a.order - b.order
      })
    return incompleteTasks[0] || null
  }, [applicableTasks, completedTasks])

  const handleToggleTaskExpand = (taskId: string) => {
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

  const handleTogglePhaseExpand = (phaseId: string) => {
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

  const handleResetProgress = () => {
    if (confirm('Reset all progress?\n\nThis will clear all completed tasks. Your fund configuration and selected service providers will be kept.\n\nThis cannot be undone.')) {
      setCompletedTasks(new Set())
      setExpandedTasks(new Set())
    }
  }

  const handleReconfigure = () => {
    setShowOnboarding(true)
  }

  const handleShare = async () => {
    if (!config) return

    const state = {
      c: config,
      t: Array.from(completedTasks),
    }
    const encoded = btoa(JSON.stringify(state))
    const url = `${window.location.origin}${window.location.pathname}?state=${encoded}`

    try {
      await navigator.clipboard.writeText(url)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    } catch {
      // Fallback
      prompt('Copy this link to share:', url)
    }
  }

  const getExportFilename = (extension: string) => {
    const date = new Date().toISOString().split('T')[0]
    const strategy = config?.strategy?.toLowerCase().replace(/\s+/g, '-') || 'fund'
    return `fund-launch-checklist-${strategy}-${date}.${extension}`
  }

  const handleExportExcel = () => {
    if (!config) return

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Sheet 1: Checklist
    const checklistData: any[][] = [
      ['FundOpsHQ - Fund Launch Checklist'],
      [`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`],
      [''],
      ['Phase', 'Task', 'Status', 'Priority', 'Time Est.', 'Category', 'Quick Tip', 'Notes', 'Due Date', 'Owner']
    ]

    PHASES.forEach(phase => {
      const tasks = tasksByPhase.get(phase.id) || []
      tasks.forEach(task => {
        checklistData.push([
          phase.name,
          task.title,
          completedTasks.has(task.id) ? 'Complete' : 'Pending',
          task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
          task.timeEstimate,
          task.category.charAt(0).toUpperCase() + task.category.slice(1),
          task.quickTip,
          '', // Notes - blank for user
          '', // Due Date - blank for user
          '', // Owner - blank for user
        ])
      })
    })

    const wsChecklist = XLSX.utils.aoa_to_sheet(checklistData)

    // Set column widths
    wsChecklist['!cols'] = [
      { wch: 22 },  // Phase
      { wch: 45 },  // Task
      { wch: 12 },  // Status
      { wch: 12 },  // Priority
      { wch: 14 },  // Time Est
      { wch: 14 },  // Category
      { wch: 65 },  // Quick Tip
      { wch: 35 },  // Notes
      { wch: 14 },  // Due Date
      { wch: 18 },  // Owner
    ]

    XLSX.utils.book_append_sheet(wb, wsChecklist, 'Checklist')

    // Sheet 2: Summary
    const summaryData: any[][] = [
      ['FundOpsHQ - Fund Launch Checklist Summary'],
      [`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`],
      [''],
      ['Configuration'],
      ['Strategy', config.strategy],
      ['Target Size', config.size],
      ['Jurisdiction', config.jurisdiction],
      ['Anchor Investor', config.hasAnchor ? 'Yes' : 'No'],
      [''],
      ['Progress Overview'],
      ['Total Tasks', applicableTasks.length],
      ['Completed', completedTasks.size],
      ['Remaining', applicableTasks.length - completedTasks.size],
      ['Completion %', `${Math.round((completedTasks.size / applicableTasks.length) * 100)}%`],
      [''],
      ['Progress by Phase'],
      ['Phase', 'Total', 'Complete', '% Done'],
    ]

    PHASES.forEach(phase => {
      const tasks = tasksByPhase.get(phase.id) || []
      const completed = tasks.filter(t => completedTasks.has(t.id)).length
      const percent = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
      summaryData.push([phase.name, tasks.length, completed, `${percent}%`])
    })

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
    wsSummary['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

    // Download
    XLSX.writeFile(wb, getExportFilename('xlsx'))
  }

  const handleExportPdf = () => {
    if (!config) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Professional Header with FundOpsHQ Branding
    doc.setFillColor(26, 29, 36) // Dark background
    doc.rect(0, 0, pageWidth, 40, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('FundOpsHQ', 14, 12)

    doc.setFontSize(22)
    doc.text('Fund Launch Checklist', 14, 26)

    // Timestamp
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(200, 200, 200)
    const timestamp = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    doc.text(`Generated: ${timestamp}`, 14, 35)

    let yPos = 52

    // Config summary - improved formatting
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(51, 51, 51)
    doc.text('Fund Configuration', 14, yPos)
    yPos += 7

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text(`Strategy: ${config.strategy}`, 14, yPos)
    yPos += 6
    doc.text(`Target Size: ${config.size}`, 14, yPos)
    yPos += 6
    doc.text(`Jurisdiction: ${config.jurisdiction}`, 14, yPos)
    yPos += 6
    doc.text(`Anchor Investor: ${config.hasAnchor ? 'Yes' : 'No'}`, 14, yPos)
    yPos += 10

    // Progress - improved formatting
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(51, 51, 51)
    doc.text('Progress Overview', 14, yPos)
    yPos += 7

    const progressPercent = Math.round((completedTasks.size / applicableTasks.length) * 100)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text(`${completedTasks.size} of ${applicableTasks.length} tasks complete (${progressPercent}%)`, 14, yPos)
    yPos += 12

    doc.setTextColor(51, 51, 51)

    // Tasks by phase
    PHASES.forEach(phase => {
      const tasks = tasksByPhase.get(phase.id) || []
      if (tasks.length === 0) return

      // Check if we need a new page
      if (yPos > pageHeight - 60) {
        doc.addPage()
        yPos = 20
      }

      // Phase header - improved styling
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(51, 51, 51)
      doc.text(phase.name, 14, yPos)
      yPos += 8

      // Tasks table with better spacing
      const tableData = tasks.map(task => [
        completedTasks.has(task.id) ? '[x]' : '[ ]',
        task.title,
        task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
        task.timeEstimate,
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['', 'Task', 'Priority', 'Time Est.']],
        body: tableData,
        theme: 'striped',
        styles: {
          fontSize: 10,
          cellPadding: 3.5,
          lineColor: [229, 231, 235],
          lineWidth: 0.1,
          textColor: [51, 51, 51]
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 115 },
          2: { cellWidth: 28 },
          3: { cellWidth: 28 },
        },
        headStyles: {
          fontStyle: 'bold',
          fillColor: [26, 29, 36],
          textColor: [255, 255, 255],
          fontSize: 10,
          cellPadding: 4
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        margin: { left: 14, right: 14 },
      })

      yPos = (doc as any).lastAutoTable.finalY + 12
    })

    // Footer on all pages
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text('fundops.com', 14, pageHeight - 10)
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - 14,
        pageHeight - 10,
        { align: 'right' }
      )
    }

    // Download
    doc.save(getExportFilename('pdf'))
  }

  // Load state from URL on initial load
  useEffect(() => {
    if (!hasLoaded) return

    const params = new URLSearchParams(window.location.search)
    const stateParam = params.get('state')

    if (stateParam) {
      try {
        const decoded = JSON.parse(atob(stateParam))
        if (decoded.c) {
          setConfig(decoded.c)
          setShowOnboarding(false)
          if (decoded.t) {
            setCompletedTasks(new Set(decoded.t))
          }
        }
        // Clear URL param
        window.history.replaceState({}, '', window.location.pathname)
      } catch {
        // Silent fail - invalid URL state
      }
    }
  }, [hasLoaded])

  // Loading state
  if (!hasLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Onboarding - Now uses the gamified Journey Mode
  if (showOnboarding) {
    return (
      <JourneyMode
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    )
  }

  // No config (shouldn't happen)
  if (!config) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Quick Jump Dialog */}
      <Dialog open={showQuickJump} onOpenChange={setShowQuickJump}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Quick Jump to Task
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-16"
                autoFocus
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">
                  {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">K</kbd>
              </div>
            </div>
            {searchQuery && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks found matching "{searchQuery}"
              </p>
            )}
            {searchResults.length > 0 && (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {searchResults.map((task) => {
                  const phase = PHASES.find(p => p.id === task.phaseId)
                  const isComplete = completedTasks.has(task.id)
                  return (
                    <button
                      key={task.id}
                      onClick={() => handleQuickJumpSelect(task)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg transition-colors",
                        "hover:bg-accent focus:bg-accent focus:outline-none",
                        isComplete && "opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {isComplete && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                        <span className={cn("font-medium text-sm", isComplete && "line-through")}>
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span>{phase?.shortName}</span>
                        <span>•</span>
                        <span>{task.priority}</span>
                        <span>•</span>
                        <span>{task.timeEstimate}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
            {!searchQuery && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Start typing to search tasks by name, category, or description
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Regulatory Disclaimer Banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="shrink-0 mt-0.5">
          <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            <strong>Important:</strong> This is an educational planning tool only. Fund formation requires consultation with{' '}
            <strong>qualified legal counsel</strong> for SEC/state registration, LPA drafting, and regulatory compliance.
            Requirements vary by jurisdiction and fund structure.
          </p>
        </div>
      </div>

      {/* Welcome Back / Start Fresh Card - shown to returning users */}
      <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20 shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Welcome back!</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your progress is saved. Continue where you left off, or start fresh with a new configuration.
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:shrink-0">
            <Button
              variant="outline"
              size="lg"
              onClick={handleReconfigure}
              className="flex-1 sm:flex-none min-h-[44px] bg-background hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Start Fresh
            </Button>
          </div>
        </div>
      </div>

      {/* Time Estimate & Quick Jump Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Timer className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Estimated time remaining</div>
            <div className="text-lg font-semibold">{totalTimeEstimate}</div>
          </div>
        </div>
        <Button
          variant="outline"
          size="lg"
          onClick={() => setShowQuickJump(true)}
          className="gap-2 min-h-[44px] focus:ring-2 focus:ring-primary"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Quick Jump</span>
          <span className="sm:hidden">Search</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-2 px-1.5 py-0.5 rounded bg-muted border text-[10px]">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>
      </div>

      {/* Progress Dashboard */}
      <ProgressDashboard
        config={config}
        phases={PHASES}
        tasksByPhase={tasksByPhase}
        completedTasks={completedTasks}
        providers={providers}
        onResetProgress={handleResetProgress}
        onReconfigure={handleReconfigure}
        onShare={handleShare}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
        onPhaseClick={(phaseId) => {
          // Expand the phase and scroll to it
          setExpandedPhases(prev => new Set([...prev, phaseId]))
          setTimeout(() => {
            const element = document.getElementById(`phase-${phaseId}`)
            element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
        }}
      />

      {/* Copied toast */}
      {showCopied && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in-0 duration-300">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background shadow-lg">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Link copied!</span>
          </div>
        </div>
      )}

      {/* Saved toast */}
      {showSaved && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in-0 duration-300">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white shadow-lg">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Progress saved</span>
          </div>
        </div>
      )}

      {/* What's Next Suggestion */}
      {getRecommendedNextTask && completedTasks.size > 0 && completedTasks.size < applicableTasks.length && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
          <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-primary mb-0.5">Recommended Next</div>
            <div className="text-sm font-medium truncate">{getRecommendedNextTask.title}</div>
          </div>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => {
              const phase = PHASES.find(p => p.id === getRecommendedNextTask.phaseId)
              if (phase) {
                setExpandedPhases(prev => new Set([...prev, phase.id]))
                setExpandedTasks(prev => new Set([...prev, getRecommendedNextTask.id]))
                setTimeout(() => {
                  const element = document.getElementById(`phase-${phase.id}`)
                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 100)
              }
            }}
            aria-label={`Go to recommended task: ${getRecommendedNextTask.title}`}
            className="shrink-0 min-h-[44px] focus:ring-2 focus:ring-primary"
          >
            Go
            <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList role="tablist" aria-label="View mode selection">
            <TabsTrigger
              value="timeline"
              className="gap-1.5 min-h-[44px] focus:ring-2 focus:ring-primary"
              aria-label="Timeline view"
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Timeline</span>
              <span className="sm:hidden">Time</span>
            </TabsTrigger>
            <TabsTrigger
              value="board"
              className="gap-1.5 min-h-[44px] focus:ring-2 focus:ring-primary"
              aria-label="Board view"
            >
              <Columns3 className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Board</span>
            </TabsTrigger>
            <TabsTrigger
              value="list"
              className="gap-1.5 min-h-[44px] focus:ring-2 focus:ring-primary"
              aria-label="List view"
            >
              <LayoutList className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">List</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                aria-label="Filter tasks"
                aria-haspopup="menu"
                className="min-h-[44px] focus:ring-2 focus:ring-primary"
              >
                <Filter className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Filter
                {filterCompleted !== 'all' && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-xs" aria-label="1 filter active">
                    1
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={filterCompleted === 'all'}
                onCheckedChange={() => setFilterCompleted('all')}
              >
                All Tasks
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterCompleted === 'incomplete'}
                onCheckedChange={() => setFilterCompleted('incomplete')}
              >
                Incomplete Only
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterCompleted === 'completed'}
                onCheckedChange={() => setFilterCompleted('completed')}
              >
                Completed Only
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="space-y-6">
          {/* Empty state for filtered views */}
          {filterCompleted !== 'all' && getFilteredTasks(applicableTasks).length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold mb-1">No tasks match your filter</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {filterCompleted === 'completed'
                  ? "You haven't completed any tasks yet. Get started by checking off your first task!"
                  : "You've completed all your tasks! Great job!"}
              </p>
              <Button variant="outline" size="sm" onClick={() => setFilterCompleted('all')}>
                Show all tasks
              </Button>
            </div>
          )}
          {PHASES.map((phase, phaseIndex) => {
            const tasks = getFilteredTasks(tasksByPhase.get(phase.id) || [])
            const allPhaseTasks = tasksByPhase.get(phase.id) || []
            const phaseCompleted = allPhaseTasks.filter(t => completedTasks.has(t.id)).length
            const isExpanded = expandedPhases.has(phase.id)

            if (tasks.length === 0 && filterCompleted !== 'all') return null

            return (
              <div key={phase.id} id={`phase-${phase.id}`} className="relative scroll-mt-24">
                {/* Timeline connector */}
                {phaseIndex < PHASES.length - 1 && (
                  <div className="absolute left-6 top-16 bottom-0 w-px bg-border" />
                )}

                {/* Phase header */}
                <button
                  onClick={() => handleTogglePhaseExpand(phase.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`phase-tasks-${phase.id}`}
                  aria-label={`${phase.name}: ${phaseCompleted} of ${allPhaseTasks.length} tasks completed`}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <div className="relative z-10">
                    <div
                      className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-full text-2xl transition-all",
                        phaseCompleted === allPhaseTasks.length && allPhaseTasks.length > 0
                          ? "bg-emerald-500/20 ring-2 ring-emerald-500"
                          : "bg-accent"
                      )}
                      aria-hidden="true"
                    >
                      {phaseIcons[phase.id] || '📋'}
                    </div>
                  </div>

                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold">{phase.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{phase.description}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {phaseCompleted}/{allPhaseTasks.length}
                      </div>
                      <div className="text-xs text-muted-foreground">tasks</div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    )}
                  </div>
                </button>

                {/* Phase tasks */}
                {isExpanded && tasks.length > 0 && (
                  <div
                    id={`phase-tasks-${phase.id}`}
                    role="region"
                    aria-label={`${phase.name} tasks`}
                    className="ml-6 pl-10 border-l border-border mt-4 space-y-3 animate-in slide-in-from-top-2 fade-in-0 duration-200"
                  >
                    {tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        phase={phase}
                        isCompleted={completedTasks.has(task.id)}
                        isExpanded={expandedTasks.has(task.id)}
                        onToggleComplete={() => handleToggleTaskComplete(task.id)}
                        onToggleExpand={() => handleToggleTaskExpand(task.id)}
                        dependencies={getTaskDependencies(task)}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Board View (Kanban-style) */}
      {viewMode === 'board' && (
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-4 min-w-max pb-4">
            {PHASES.map((phase) => {
              const tasks = getFilteredTasks(tasksByPhase.get(phase.id) || [])
              const allPhaseTasks = tasksByPhase.get(phase.id) || []
              const phaseCompleted = allPhaseTasks.filter(t => completedTasks.has(t.id)).length

              return (
                <div
                  key={phase.id}
                  className="w-80 shrink-0 rounded-xl border border-border bg-accent/30"
                >
                  {/* Column header */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{phaseIcons[phase.id] || '📋'}</span>
                      <h3 className="font-semibold truncate">{phase.shortName}</h3>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {phaseCompleted}/{allPhaseTasks.length} complete
                      </span>
                      <div className="h-1 w-20 bg-accent rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all",
                            phaseCompleted === allPhaseTasks.length && allPhaseTasks.length > 0
                              ? "bg-emerald-500"
                              : "bg-primary"
                          )}
                          style={{ width: `${allPhaseTasks.length > 0 ? (phaseCompleted / allPhaseTasks.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
                    {tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        phase={phase}
                        isCompleted={completedTasks.has(task.id)}
                        isExpanded={expandedTasks.has(task.id)}
                        onToggleComplete={() => handleToggleTaskComplete(task.id)}
                        onToggleExpand={() => handleToggleTaskExpand(task.id)}
                        dependencies={getTaskDependencies(task)}
                        viewMode={viewMode}
                      />
                    ))}
                    {tasks.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-accent/50 px-4 py-3 border-b border-border">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
              <div className="col-span-1"></div>
              <div className="col-span-5">Task</div>
              <div className="col-span-2">Phase</div>
              <div className="col-span-2">Time Est.</div>
              <div className="col-span-2">Priority</div>
            </div>
          </div>
          <div className="divide-y divide-border">
            {getFilteredTasks(applicableTasks).map((task) => {
              const phase = PHASES.find(p => p.id === task.phaseId)!
              const isComplete = completedTasks.has(task.id)
              const isExpanded = expandedTasks.has(task.id)

              return (
                <div key={task.id}>
                  <div
                    className={cn(
                      "grid grid-cols-12 gap-4 px-4 py-3 items-center transition-colors",
                      isComplete ? "bg-card/50" : "bg-card hover:bg-accent/30"
                    )}
                  >
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={isComplete}
                        onChange={() => handleToggleTaskComplete(task.id)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                    </div>
                    <div className="col-span-5">
                      <button
                        onClick={() => handleToggleTaskExpand(task.id)}
                        className="text-left w-full"
                      >
                        <span
                          className={cn(
                            "font-medium",
                            isComplete && "text-muted-foreground line-through"
                          )}
                        >
                          {task.title}
                        </span>
                      </button>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">{phase.shortName}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">{task.timeEstimate}</span>
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          task.priority === 'critical' && "text-red-500",
                          task.priority === 'important' && "text-amber-500",
                          task.priority === 'optional' && "text-muted-foreground"
                        )}
                      >
                        {task.priority}
                      </span>
                      <button onClick={() => handleToggleTaskExpand(task.id)}>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-4 py-4 bg-accent/20 border-t border-border animate-in slide-in-from-top-2 fade-in-0 duration-200">
                      <div className="ml-8 space-y-4">
                        <p className="text-sm text-muted-foreground">{task.quickTip}</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {task.fullExplanation}
                        </p>
                        {task.pitfalls && task.pitfalls.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium mb-2">Common Pitfalls</h5>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                              {task.pitfalls.map((pitfall, i) => (
                                <li key={i}>{pitfall}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {task.benchmark && (
                          <div className="text-sm">
                            <span className="font-medium">Benchmark:</span>{' '}
                            <span className="text-muted-foreground">{task.benchmark}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Related Tools */}
      <RelatedToolsSection
        currentToolSlug="fund-launch-guide"
        relatedTools={[
          {
            slug: 'management-company-budget',
            title: 'Management Company Budget Planner',
            description: 'Calculate your burn rate, runway, and seed capital needs with a simple budget model.',
            reason: 'Build your budget while tracking your launch milestones and expenses'
          },
          {
            slug: 'fund-expense-allocation',
            title: 'Fund Expense Allocation Helper',
            description: 'Interactive tool to classify expenses as fund or management company expenses.',
            reason: 'Learn proper expense allocation policies as you set up your fund operations'
          }
        ]}
        learningPath="Complete your launch: Fund Launch Guide → Budget Planner → Expense Allocation"
      />

      {/* Disclaimer */}
      <DisclaimerBlock
        additionalDisclaimer="Fund formation involves complex legal, regulatory, tax, and compliance requirements that vary by jurisdiction. This guide provides educational information only and is not a substitute for professional advice. SEC/state registration, Advisers Act compliance, LPA drafting, and other regulatory matters require consultation with qualified fund formation attorneys and compliance professionals. Actual timelines and requirements depend on your specific fund structure, strategy, investor base, and jurisdiction."
      />
    </div>
  )
}
