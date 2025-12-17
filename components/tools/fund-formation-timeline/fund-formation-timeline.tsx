"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar as CalendarIcon, LayoutGrid, List, Download, Sparkles, RotateCcw } from 'lucide-react'
import { format, parseISO } from 'date-fns'

import {
  FundFormationInputs,
  Phase,
  ViewMode,
  DetailLevel,
  FundStrategy,
  FundSizeBand,
  Jurisdiction,
  AnchorStatus,
  StartingPoint
} from './types'
import {
  calculateTimeline,
  getDefaultInputs,
  TIMELINE_PRESETS
} from './timeline-calculator'
import { TimelineView } from './timeline-view'
import { MilestoneCardsView } from './milestone-cards-view'
import { ExportPanel } from './export-panel'
import { DisclaimerBlock } from '@/components/tools/shared'
import { InfoPopover } from '@/components/ui/info-popover'
import { ShareButton } from '@/components/tools/share-button'

interface FundFormationTimelineProps {
  className?: string
}

export function FundFormationTimeline({ className }: FundFormationTimelineProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Parse initial state from URL or use defaults
  const getInitialInputs = (): FundFormationInputs => {
    const defaults = getDefaultInputs()

    if (typeof window === 'undefined') return defaults

    const strategy = searchParams.get('strategy') as FundStrategy | null
    const sizeBand = searchParams.get('size') as FundSizeBand | null
    const jurisdiction = searchParams.get('jurisdiction') as Jurisdiction | null
    const anchorStatus = searchParams.get('anchor') as AnchorStatus | null
    const startingPoint = searchParams.get('start') as StartingPoint | null
    const detailLevel = searchParams.get('detail') as DetailLevel | null
    const firstCloseStr = searchParams.get('firstClose')
    const finalCloseStr = searchParams.get('finalClose')

    return {
      strategy: strategy || defaults.strategy,
      sizeBand: sizeBand || defaults.sizeBand,
      jurisdiction: jurisdiction || defaults.jurisdiction,
      anchorStatus: anchorStatus || defaults.anchorStatus,
      startingPoint: startingPoint || defaults.startingPoint,
      detailLevel: detailLevel || defaults.detailLevel,
      firstCloseDate: firstCloseStr ? parseISO(firstCloseStr) : defaults.firstCloseDate,
      finalCloseDate: finalCloseStr ? parseISO(finalCloseStr) : defaults.finalCloseDate
    }
  }

  const [inputs, setInputs] = useState<FundFormationInputs>(getInitialInputs)
  const [phases, setPhases] = useState<Phase[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('timeline')
  const [showExport, setShowExport] = useState(false)
  const [visibleCategories, setVisibleCategories] = useState({
    legal: true,
    regulatory: true,
    'investor-relations': true,
    operations: true
  })

  // Calculate timeline whenever inputs change
  useEffect(() => {
    const newPhases = calculateTimeline(inputs)
    setPhases(newPhases)
  }, [inputs])

  // Update URL when inputs change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      params.set('strategy', inputs.strategy)
      params.set('size', inputs.sizeBand)
      params.set('jurisdiction', inputs.jurisdiction)
      params.set('anchor', inputs.anchorStatus)
      params.set('start', inputs.startingPoint)
      params.set('detail', inputs.detailLevel)
      params.set('firstClose', format(inputs.firstCloseDate, 'yyyy-MM-dd'))
      params.set('finalClose', format(inputs.finalCloseDate, 'yyyy-MM-dd'))

      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, 500)

    return () => clearTimeout(timer)
  }, [inputs, pathname, router])

  // Generate shareable URL
  const getShareableUrl = useCallback(() => {
    const params = new URLSearchParams()
    params.set('strategy', inputs.strategy)
    params.set('size', inputs.sizeBand)
    params.set('jurisdiction', inputs.jurisdiction)
    params.set('anchor', inputs.anchorStatus)
    params.set('start', inputs.startingPoint)
    params.set('detail', inputs.detailLevel)
    params.set('firstClose', format(inputs.firstCloseDate, 'yyyy-MM-dd'))
    params.set('finalClose', format(inputs.finalCloseDate, 'yyyy-MM-dd'))

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}${pathname}?${params.toString()}`
  }, [inputs, pathname])

  const handleInputChange = <K extends keyof FundFormationInputs>(
    field: K,
    value: FundFormationInputs[K]
  ) => {
    setInputs(prev => ({ ...prev, [field]: value }))
  }

  const handlePresetClick = (presetIndex: number) => {
    const preset = TIMELINE_PRESETS[presetIndex]
    setInputs(prev => ({
      ...prev,
      ...preset.inputs
    }))
  }

  const handleDateChange = (field: 'firstCloseDate' | 'finalCloseDate', value: string) => {
    setInputs(prev => ({ ...prev, [field]: new Date(value) }))
  }

  const toggleCategory = (category: keyof typeof visibleCategories) => {
    setVisibleCategories(prev => ({ ...prev, [category]: !prev[category] }))
  }

  const resetToDefaults = () => {
    setInputs(getDefaultInputs())
    setVisibleCategories({
      legal: true,
      regulatory: true,
      'investor-relations': true,
      operations: true
    })
  }

  return (
    <div className={className}>
      {/* Header with Share Button */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Fund Formation Timeline</h2>
          <p className="text-muted-foreground max-w-2xl">
            Plan your fund launch timeline with customizable milestones and phases.
          </p>
        </div>
        <ShareButton getShareableUrl={getShareableUrl} />
      </div>

      {/* Input Panel */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Fund Details
          </CardTitle>
          <CardDescription>
            Customize your fund formation timeline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preset Scenarios */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Quick Start Presets</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TIMELINE_PRESETS.map((preset, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto py-3 px-4 text-left justify-start"
                  onClick={() => handlePresetClick(index)}
                >
                  <div>
                    <div className="font-medium text-sm">{preset.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {preset.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Fund Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="strategy">Fund Strategy</Label>
                <InfoPopover>
                  Your fund's investment strategy affects regulatory requirements, typical timeline, and investor expectations. VC funds often have simpler structures, while PE/Credit may require more complex documentation.
                </InfoPopover>
              </div>
              <Select
                value={inputs.strategy}
                onValueChange={(value: FundStrategy) =>
                  handleInputChange('strategy', value)
                }
              >
                <SelectTrigger id="strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VC">Venture Capital</SelectItem>
                  <SelectItem value="PE">Private Equity</SelectItem>
                  <SelectItem value="Private Credit">Private Credit</SelectItem>
                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                  <SelectItem value="Hedge Fund">Hedge Fund</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="sizeBand">Target Fund Size</Label>
                <InfoPopover>
                  Larger funds typically require more robust infrastructure, longer fundraising periods, and more extensive legal documentation. Smaller emerging funds can often move faster with simpler structures.
                </InfoPopover>
              </div>
              <Select
                value={inputs.sizeBand}
                onValueChange={(value: FundSizeBand) =>
                  handleInputChange('sizeBand', value)
                }
              >
                <SelectTrigger id="sizeBand">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="< $50M">Less than $50M</SelectItem>
                  <SelectItem value="$50M - $150M">$50M - $150M</SelectItem>
                  <SelectItem value="$150M - $500M">$150M - $500M</SelectItem>
                  <SelectItem value="> $500M">More than $500M</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="jurisdiction">Jurisdiction</Label>
                <InfoPopover>
                  <strong>US Onshore:</strong> Delaware LP/LLC, typically simpler and faster to form.
                  <br /><br />
                  <strong>Cayman Feeder:</strong> Parallel structure for tax-exempt and non-US investors. Adds 4-8 weeks and legal costs.
                  <br /><br />
                  <strong>EU AIF:</strong> AIFMD-compliant structure required for EU marketing. Requires regulatory approval.
                </InfoPopover>
              </div>
              <Select
                value={inputs.jurisdiction}
                onValueChange={(value: Jurisdiction) =>
                  handleInputChange('jurisdiction', value)
                }
              >
                <SelectTrigger id="jurisdiction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US Onshore Only">US Onshore Only</SelectItem>
                  <SelectItem value="US with Cayman Feeder">
                    US with Cayman Feeder
                  </SelectItem>
                  <SelectItem value="EU AIF Style">EU AIF Style</SelectItem>
                  <SelectItem value="Not Sure">Not Sure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="anchorStatus">Anchor Investor</Label>
                <InfoPopover>
                  An anchor investor (typically 20-30% of fund) can significantly accelerate your timeline by validating your fund thesis and attracting other LPs. Without an anchor, expect longer fundraising periods.
                </InfoPopover>
              </div>
              <Select
                value={inputs.anchorStatus}
                onValueChange={(value: AnchorStatus) =>
                  handleInputChange('anchorStatus', value)
                }
              >
                <SelectTrigger id="anchorStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes - Committed</SelectItem>
                  <SelectItem value="In Discussion">In Discussion</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="startingPoint">Starting Point</Label>
                <InfoPopover>
                  Your current preparation level affects how quickly you can move. "Starting from Scratch" means you need to develop all materials. Having draft materials ready can save 4-8 weeks.
                </InfoPopover>
              </div>
              <Select
                value={inputs.startingPoint}
                onValueChange={(value: StartingPoint) =>
                  handleInputChange('startingPoint', value)
                }
              >
                <SelectTrigger id="startingPoint">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starting from Scratch">
                    Starting from Scratch
                  </SelectItem>
                  <SelectItem value="Have Draft Deck and Data Room">
                    Have Draft Deck & Data Room
                  </SelectItem>
                  <SelectItem value="Close to First Close">
                    Close to First Close
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="detailLevel">Detail Level</Label>
                <InfoPopover>
                  "Simple" shows key milestones only - ideal for high-level planning. "Detailed" includes all tasks and sub-milestones - useful for project management and tracking.
                </InfoPopover>
              </div>
              <Select
                value={inputs.detailLevel}
                onValueChange={(value: DetailLevel) =>
                  handleInputChange('detailLevel', value)
                }
              >
                <SelectTrigger id="detailLevel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple - Key Milestones</SelectItem>
                  <SelectItem value="detailed">Detailed - All Tasks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="firstCloseDate">Target First Close</Label>
              <input
                id="firstCloseDate"
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={format(inputs.firstCloseDate, 'yyyy-MM-dd')}
                onChange={(e) => handleDateChange('firstCloseDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="finalCloseDate">Target Final Close</Label>
              <input
                id="finalCloseDate"
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={format(inputs.finalCloseDate, 'yyyy-MM-dd')}
                onChange={(e) => handleDateChange('finalCloseDate', e.target.value)}
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="pt-4 border-t">
            <Label className="text-sm font-medium mb-3 block">Task Categories</Label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(visibleCategories).map((category) => (
                <Button
                  key={category}
                  size="sm"
                  variant={visibleCategories[category as keyof typeof visibleCategories] ? 'default' : 'outline'}
                  onClick={() => toggleCategory(category as keyof typeof visibleCategories)}
                  className="text-xs"
                >
                  {category.split('-').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Views */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Your Fund Formation Timeline</CardTitle>
              <CardDescription className="mt-1">
                {phases.length > 0 && (
                  <>
                    {format(phases[0].startDate, 'MMM d, yyyy')} -{' '}
                    {format(phases[phases.length - 1].endDate, 'MMM d, yyyy')}
                  </>
                )}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowExport(!showExport)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showExport && (
            <div className="mb-6">
              <ExportPanel phases={phases} inputs={inputs} />
            </div>
          )}

          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="cards" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-0">
              <TimelineView phases={phases} visibleCategories={visibleCategories} />
            </TabsContent>

            <TabsContent value="cards" className="mt-0">
              <MilestoneCardsView phases={phases} visibleCategories={visibleCategories} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={resetToDefaults}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>

      {/* Disclaimer */}
      <DisclaimerBlock
        additionalDisclaimer="Fund formation timelines vary significantly based on your specific situation, service provider availability, and regulatory requirements. This tool provides general guidance - always work with qualified legal counsel and fund administrators."
      />
    </div>
  )
}
