'use client'

import { useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useFundLaunchStore, PHASES } from '../store'
import { TaskCard } from '../task-card'
import { ProgressDashboard } from '../progress-dashboard'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LayoutList,
  Columns3,
  Clock,
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  Sparkles,
  ArrowRight,
  Command,
  Timer,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Icons for phases
const phaseIcons: Record<string, string> = {
  'strategy': '🎯',
  'legal-formation': '⚖️',
  'documentation': '📄',
  'regulatory': '🛡️',
  'service-providers': '🤝',
  'operations': '⚙️',
  'fundraising': '📢',
  'first-close': '🚀',
}

export function ChecklistTab() {
  // Store selectors
  const config = useFundLaunchStore(state => state.config)
  const providers = useFundLaunchStore(state => state.providers)
  const completedTasks = useFundLaunchStore(state => state.completedTasks)
  const expandedTasks = useFundLaunchStore(state => state.expandedTasks)
  const expandedPhases = useFundLaunchStore(state => state.expandedPhases)
  const viewMode = useFundLaunchStore(state => state.viewMode)
  const filterCompleted = useFundLaunchStore(state => state.filterCompleted)

  // Store actions
  const toggleTaskComplete = useFundLaunchStore(state => state.toggleTaskComplete)
  const toggleTaskExpand = useFundLaunchStore(state => state.toggleTaskExpand)
  const togglePhaseExpand = useFundLaunchStore(state => state.togglePhaseExpand)
  const setViewMode = useFundLaunchStore(state => state.setViewMode)
  const setFilterCompleted = useFundLaunchStore(state => state.setFilterCompleted)
  const resetProgress = useFundLaunchStore(state => state.resetProgress)
  const setShowOnboarding = useFundLaunchStore(state => state.setShowOnboarding)
  const removeProvider = useFundLaunchStore(state => state.removeProvider)
  const setShowQuickJump = useFundLaunchStore(state => state.setShowQuickJump)
  const setShowCopied = useFundLaunchStore(state => state.setShowCopied)

  // Computed values
  const getApplicableTasks = useFundLaunchStore(state => state.getApplicableTasks)
  const getTasksByPhase = useFundLaunchStore(state => state.getTasksByPhase)
  const getTotalTimeEstimate = useFundLaunchStore(state => state.getTotalTimeEstimate)
  const getRecommendedNextTask = useFundLaunchStore(state => state.getRecommendedNextTask)
  const getTaskDependencies = useFundLaunchStore(state => state.getTaskDependencies)
  const getFilteredTasks = useFundLaunchStore(state => state.getFilteredTasks)

  const applicableTasks = useMemo(() => getApplicableTasks(), [getApplicableTasks])
  const tasksByPhase = useMemo(() => getTasksByPhase(), [getTasksByPhase])
  const totalTimeEstimate = getTotalTimeEstimate()
  const recommendedNextTask = getRecommendedNextTask()

  const completedSet = useMemo(() => new Set(completedTasks), [completedTasks])
  const expandedTasksSet = useMemo(() => new Set(expandedTasks), [expandedTasks])
  const expandedPhasesSet = useMemo(() => new Set(expandedPhases), [expandedPhases])

  // Handlers
  const handleResetProgress = useCallback(() => {
    if (confirm('Reset all progress?\n\nThis will clear all completed tasks and selected service providers. Your fund configuration will be kept.\n\nThis cannot be undone.')) {
      resetProgress()
    }
  }, [resetProgress])

  const handleReconfigure = useCallback(() => {
    setShowOnboarding(true)
  }, [setShowOnboarding])

  const handleShare = useCallback(async () => {
    if (!config) return

    const state = {
      c: config,
      t: completedTasks,
    }
    const encoded = btoa(JSON.stringify(state))
    const url = `${window.location.origin}${window.location.pathname}?state=${encoded}`

    try {
      await navigator.clipboard.writeText(url)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    } catch {
      prompt('Copy this link to share:', url)
    }
  }, [config, completedTasks, setShowCopied])

  const getExportFilename = useCallback((extension: string) => {
    const date = new Date().toISOString().split('T')[0]
    const strategy = config?.strategy?.toLowerCase().replace(/\s+/g, '-') || 'fund'
    return `fund-launch-checklist-${strategy}-${date}.${extension}`
  }, [config])

  const handleExportExcel = useCallback(() => {
    if (!config) return

    const wb = XLSX.utils.book_new()

    const checklistData: (string | number)[][] = [
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
          completedSet.has(task.id) ? 'Complete' : 'Pending',
          task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
          task.timeEstimate,
          task.category.charAt(0).toUpperCase() + task.category.slice(1),
          task.quickTip,
          '',
          '',
          '',
        ])
      })
    })

    const wsChecklist = XLSX.utils.aoa_to_sheet(checklistData)
    wsChecklist['!cols'] = [
      { wch: 22 },
      { wch: 45 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 65 },
      { wch: 35 },
      { wch: 14 },
      { wch: 18 },
    ]

    XLSX.utils.book_append_sheet(wb, wsChecklist, 'Checklist')

    const summaryData: (string | number)[][] = [
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
      ['Completed', completedTasks.length],
      ['Remaining', applicableTasks.length - completedTasks.length],
      ['Completion %', `${Math.round((completedTasks.length / applicableTasks.length) * 100)}%`],
      [''],
      ['Progress by Phase'],
      ['Phase', 'Total', 'Complete', '% Done'],
    ]

    PHASES.forEach(phase => {
      const tasks = tasksByPhase.get(phase.id) || []
      const completed = tasks.filter(t => completedSet.has(t.id)).length
      const percent = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
      summaryData.push([phase.name, tasks.length, completed, `${percent}%`])
    })

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
    wsSummary['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

    XLSX.writeFile(wb, getExportFilename('xlsx'))
  }, [config, tasksByPhase, completedSet, completedTasks, applicableTasks, getExportFilename])

  const handleExportPdf = useCallback(() => {
    if (!config) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    doc.setFillColor(26, 29, 36)
    doc.rect(0, 0, pageWidth, 40, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('FundOpsHQ', 14, 12)

    doc.setFontSize(22)
    doc.text('Fund Launch Checklist', 14, 26)

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

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(51, 51, 51)
    doc.text('Progress Overview', 14, yPos)
    yPos += 7

    const progressPercent = Math.round((completedTasks.length / applicableTasks.length) * 100)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text(`${completedTasks.length} of ${applicableTasks.length} tasks complete (${progressPercent}%)`, 14, yPos)
    yPos += 12

    doc.setTextColor(51, 51, 51)

    PHASES.forEach(phase => {
      const tasks = tasksByPhase.get(phase.id) || []
      if (tasks.length === 0) return

      if (yPos > pageHeight - 60) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(51, 51, 51)
      doc.text(phase.name, 14, yPos)
      yPos += 8

      const tableData = tasks.map(task => [
        completedSet.has(task.id) ? '[x]' : '[ ]',
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

      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12
    })

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

    doc.save(getExportFilename('pdf'))
  }, [config, tasksByPhase, completedSet, completedTasks, applicableTasks, getExportFilename])

  const handlePhaseClick = useCallback((phaseId: string) => {
    togglePhaseExpand(phaseId)
    setTimeout(() => {
      const element = document.getElementById(`phase-${phaseId}`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [togglePhaseExpand])

  const handleGoToRecommendedTask = useCallback(() => {
    if (!recommendedNextTask) return

    const phase = PHASES.find(p => p.id === recommendedNextTask.phaseId)
    if (phase) {
      if (!expandedPhasesSet.has(phase.id)) {
        togglePhaseExpand(phase.id)
      }
      if (!expandedTasksSet.has(recommendedNextTask.id)) {
        toggleTaskExpand(recommendedNextTask.id)
      }
      setTimeout(() => {
        const element = document.getElementById(`phase-${phase.id}`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [recommendedNextTask, expandedPhasesSet, expandedTasksSet, togglePhaseExpand, toggleTaskExpand])

  if (!config) {
    return null
  }

  return (
    <div className="space-y-6">
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
        completedTasks={completedSet}
        providers={providers}
        onResetProgress={handleResetProgress}
        onReconfigure={handleReconfigure}
        onShare={handleShare}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
        onRemoveProvider={removeProvider}
        onPhaseClick={handlePhaseClick}
      />

      {/* What's Next Suggestion */}
      {recommendedNextTask && completedTasks.length > 0 && completedTasks.length < applicableTasks.length && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
          <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-primary mb-0.5">Recommended Next</div>
            <div className="text-sm font-medium truncate">{recommendedNextTask.title}</div>
          </div>
          <Button
            variant="ghost"
            size="lg"
            onClick={handleGoToRecommendedTask}
            aria-label={`Go to recommended task: ${recommendedNextTask.title}`}
            className="shrink-0 min-h-[44px] focus:ring-2 focus:ring-primary"
          >
            Go
            <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
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
            const phaseCompleted = allPhaseTasks.filter(t => completedSet.has(t.id)).length
            const isExpanded = expandedPhasesSet.has(phase.id)

            if (tasks.length === 0 && filterCompleted !== 'all') return null

            return (
              <div key={phase.id} id={`phase-${phase.id}`} className="relative scroll-mt-24">
                {/* Timeline connector */}
                {phaseIndex < PHASES.length - 1 && (
                  <div className="absolute left-6 top-16 bottom-0 w-px bg-border" />
                )}

                {/* Phase header */}
                <button
                  onClick={() => togglePhaseExpand(phase.id)}
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
                        isCompleted={completedSet.has(task.id)}
                        isExpanded={expandedTasksSet.has(task.id)}
                        onToggleComplete={() => toggleTaskComplete(task.id)}
                        onToggleExpand={() => toggleTaskExpand(task.id)}
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
              const phaseCompleted = allPhaseTasks.filter(t => completedSet.has(t.id)).length

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
                        isCompleted={completedSet.has(task.id)}
                        isExpanded={expandedTasksSet.has(task.id)}
                        onToggleComplete={() => toggleTaskComplete(task.id)}
                        onToggleExpand={() => toggleTaskExpand(task.id)}
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
              const isComplete = completedSet.has(task.id)
              const isExpanded = expandedTasksSet.has(task.id)

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
                        onChange={() => toggleTaskComplete(task.id)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                    </div>
                    <div className="col-span-5">
                      <button
                        onClick={() => toggleTaskExpand(task.id)}
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
                      <button onClick={() => toggleTaskExpand(task.id)}>
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
