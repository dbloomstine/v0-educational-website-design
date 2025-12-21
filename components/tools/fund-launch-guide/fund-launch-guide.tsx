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
} from 'lucide-react'
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
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(PHASES.map(p => p.id)))

  // UI state
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [showCopied, setShowCopied] = useState(false)
  const [filterCompleted, setFilterCompleted] = useState<'all' | 'incomplete' | 'completed'>('all')
  const [providers, setProviders] = useState<Record<string, string>>({})

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
    } catch (e) {
      console.error('Failed to load saved state:', e)
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

  // Handlers
  const handleOnboardingComplete = (newConfig: FundConfig, newProviders: Record<string, string>) => {
    setConfig(newConfig)
    setProviders(newProviders)
    setShowOnboarding(false)
    setCompletedTasks(new Set())
    setExpandedTasks(new Set())
    setExpandedPhases(new Set(PHASES.map(p => p.id)))
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
  }

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
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
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
      { wch: 20 },  // Phase
      { wch: 40 },  // Task
      { wch: 10 },  // Status
      { wch: 10 },  // Priority
      { wch: 12 },  // Time Est
      { wch: 12 },  // Category
      { wch: 60 },  // Quick Tip
      { wch: 30 },  // Notes
      { wch: 12 },  // Due Date
      { wch: 15 },  // Owner
    ]

    XLSX.utils.book_append_sheet(wb, wsChecklist, 'Checklist')

    // Sheet 2: Summary
    const summaryData: any[][] = [
      ['Fund Launch Checklist Summary'],
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

    summaryData.push([''])
    summaryData.push(['Generated by FundOpsHQ', new Date().toLocaleDateString()])

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 10 }]
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

    // Download
    XLSX.writeFile(wb, getExportFilename('xlsx'))
  }

  const handleExportPdf = () => {
    if (!config) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Fund Launch Checklist', pageWidth / 2, 20, { align: 'center' })

    // Config summary
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    const configText = `${config.strategy} | ${config.size} | ${config.jurisdiction} | Anchor: ${config.hasAnchor ? 'Yes' : 'No'}`
    doc.text(configText, pageWidth / 2, 28, { align: 'center' })

    // Progress
    const progressPercent = Math.round((completedTasks.size / applicableTasks.length) * 100)
    doc.text(`Progress: ${completedTasks.size} of ${applicableTasks.length} tasks complete (${progressPercent}%)`, pageWidth / 2, 35, { align: 'center' })

    doc.setTextColor(0)
    let yPos = 45

    // Tasks by phase
    PHASES.forEach(phase => {
      const tasks = tasksByPhase.get(phase.id) || []
      if (tasks.length === 0) return

      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      // Phase header
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`${phase.name} (${phase.estimatedWeeks})`, 14, yPos)
      yPos += 6

      // Tasks table
      const tableData = tasks.map(task => [
        completedTasks.has(task.id) ? '[x]' : '[ ]',
        task.title,
        task.priority,
        task.timeEstimate,
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['', 'Task', 'Priority', 'Time']],
        body: tableData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 110 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
        },
        headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240] },
        margin: { left: 14 },
      })

      yPos = (doc as any).lastAutoTable.finalY + 10
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(
        `Generated by FundOpsHQ | ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
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
      } catch (e) {
        console.error('Failed to parse URL state:', e)
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
      {/* Progress Dashboard */}
      <ProgressDashboard
        config={config}
        phases={PHASES}
        tasksByPhase={tasksByPhase}
        completedTasks={completedTasks}
        onResetProgress={handleResetProgress}
        onReconfigure={handleReconfigure}
        onShare={handleShare}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
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

      {/* View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="timeline" className="gap-1.5">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="board" className="gap-1.5">
              <Columns3 className="h-4 w-4" />
              <span className="hidden sm:inline">Board</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-1.5">
              <LayoutList className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1.5" />
                Filter
                {filterCompleted !== 'all' && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-xs">
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
          {PHASES.map((phase, phaseIndex) => {
            const tasks = getFilteredTasks(tasksByPhase.get(phase.id) || [])
            const allPhaseTasks = tasksByPhase.get(phase.id) || []
            const phaseCompleted = allPhaseTasks.filter(t => completedTasks.has(t.id)).length
            const isExpanded = expandedPhases.has(phase.id)

            if (tasks.length === 0 && filterCompleted !== 'all') return null

            return (
              <div key={phase.id} className="relative">
                {/* Timeline connector */}
                {phaseIndex < PHASES.length - 1 && (
                  <div className="absolute left-6 top-16 bottom-0 w-px bg-border" />
                )}

                {/* Phase header */}
                <button
                  onClick={() => handleTogglePhaseExpand(phase.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="relative z-10">
                    <div
                      className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-full text-2xl transition-all",
                        phaseCompleted === allPhaseTasks.length && allPhaseTasks.length > 0
                          ? "bg-emerald-500/20 ring-2 ring-emerald-500"
                          : "bg-accent"
                      )}
                    >
                      {phaseIcons[phase.id] || '📋'}
                    </div>
                  </div>

                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{phase.name}</h3>
                      <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-accent">
                        {phase.estimatedWeeks}
                      </span>
                    </div>
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
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Phase tasks */}
                {isExpanded && tasks.length > 0 && (
                  <div className="ml-6 pl-10 border-l border-border mt-4 space-y-3 animate-in slide-in-from-top-2 fade-in-0 duration-200">
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
    </div>
  )
}
