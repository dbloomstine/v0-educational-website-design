"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { GenerationSettings, ToneOption, LetterFormat, ExtractedMetadata } from './types'
import { Sparkles, TrendingDown, Minus, TrendingUp, Wand2, X } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface GenerationSettingsProps {
  settings: GenerationSettings
  onSettingsChange: (settings: GenerationSettings) => void
  onGenerate: () => void
  isGenerating: boolean
  canGenerate: boolean
  extractedMetadata?: ExtractedMetadata
}

const TONE_OPTIONS: { value: ToneOption; label: string; description: string; icon: React.ReactNode; preview: string }[] = [
  {
    value: 'conservative',
    label: 'Conservative',
    description: 'Measured, risk-aware',
    icon: <TrendingDown className="w-4 h-4" />,
    preview: '"While markets remained volatile, we maintained our disciplined approach..."',
  },
  {
    value: 'neutral',
    label: 'Neutral',
    description: 'Balanced, factual',
    icon: <Minus className="w-4 h-4" />,
    preview: '"The fund returned 8.5% for the quarter, outperforming the benchmark..."',
  },
  {
    value: 'optimistic',
    label: 'Optimistic',
    description: 'Confident, forward-looking',
    icon: <TrendingUp className="w-4 h-4" />,
    preview: '"We are pleased to report strong performance driven by our conviction..."',
  },
]

const FORMAT_OPTIONS: { value: LetterFormat; label: string; description: string }[] = [
  { value: 'executive-summary', label: 'Executive Summary', description: '1-2 paragraphs per section, ~500 words total' },
  { value: 'full-letter', label: 'Full Letter', description: 'Comprehensive coverage, ~1,500 words total' },
]

const SECTION_OPTIONS = [
  { id: 'performanceOverview', label: 'Performance Overview', description: 'Fund returns vs benchmark analysis' },
  { id: 'attributionAnalysis', label: 'Attribution Analysis', description: 'Top contributors and detractors' },
  { id: 'keyEvents', label: 'Key Events', description: 'Market shifts and portfolio activity' },
  { id: 'forwardOutlook', label: 'Forward-Looking Outlook', description: 'Market views and positioning' },
]

export function GenerationSettingsPanel({
  settings,
  onSettingsChange,
  onGenerate,
  isGenerating,
  canGenerate,
  extractedMetadata,
}: GenerationSettingsProps) {
  const updateSettings = (updates: Partial<GenerationSettings>) => {
    onSettingsChange({ ...settings, ...updates })
  }

  // Determine if a field was auto-populated
  const isAutoFundName = extractedMetadata?.fundName && settings.fundName === extractedMetadata.fundName
  const isAutoPeriod = extractedMetadata?.reportingPeriod && settings.reportingPeriod === extractedMetadata.reportingPeriod
  const isAutoFundType = extractedMetadata?.fundType && settings.fundType === extractedMetadata.fundType

  const toggleSection = (sectionId: keyof GenerationSettings['sections']) => {
    onSettingsChange({
      ...settings,
      sections: {
        ...settings.sections,
        [sectionId]: !settings.sections[sectionId],
      },
    })
  }

  const selectedSectionsCount = Object.values(settings.sections).filter(Boolean).length
  const selectedTone = TONE_OPTIONS.find(t => t.value === settings.tone)

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
          Configure Your Letter
        </CardTitle>
        <CardDescription>Customize the output to match your brand</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Fund Details */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Fund Details
          </Label>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="fundName">Fund Name</Label>
                {isAutoFundName && extractedMetadata && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                          <Wand2 className="w-3 h-3" />
                          Auto-detected
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Detected from {extractedMetadata.fundNameSource}</p>
                        {extractedMetadata.fundNameConfidence && (
                          <p className="text-xs text-muted-foreground">
                            Confidence: {extractedMetadata.fundNameConfidence}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="relative">
                <Input
                  id="fundName"
                  placeholder="e.g., Apex Capital Partners LP"
                  value={settings.fundName}
                  onChange={(e) => updateSettings({ fundName: e.target.value })}
                  className={`h-11 ${isAutoFundName ? 'pr-10 border-amber-300 dark:border-amber-700' : ''}`}
                />
                {isAutoFundName && (
                  <button
                    type="button"
                    onClick={() => updateSettings({ fundName: '' })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Clear auto-detected value"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="fundType">Fund Type</Label>
                  {isAutoFundType && extractedMetadata && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                            <Wand2 className="w-3 h-3" />
                            Auto
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Detected from {extractedMetadata.fundTypeSource}</p>
                          {extractedMetadata.fundTypeConfidence && (
                            <p className="text-xs text-muted-foreground">
                              Confidence: {extractedMetadata.fundTypeConfidence}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="fundType"
                    placeholder="e.g., Venture Capital, Real Estate, Private Credit"
                    value={settings.fundType}
                    onChange={(e) => updateSettings({ fundType: e.target.value })}
                    className={`h-11 ${isAutoFundType ? 'pr-10 border-amber-300 dark:border-amber-700' : ''}`}
                  />
                  {isAutoFundType && (
                    <button
                      type="button"
                      onClick={() => updateSettings({ fundType: '' })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      title="Clear auto-detected value"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="period">Reporting Period</Label>
                  {isAutoPeriod && extractedMetadata && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                            <Wand2 className="w-3 h-3" />
                            Auto
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Detected from {extractedMetadata.reportingPeriodSource}</p>
                          {extractedMetadata.reportingPeriodConfidence && (
                            <p className="text-xs text-muted-foreground">
                              Confidence: {extractedMetadata.reportingPeriodConfidence}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="period"
                    placeholder="e.g., Q4 2024"
                    value={settings.reportingPeriod}
                    onChange={(e) => updateSettings({ reportingPeriod: e.target.value })}
                    className={`h-11 ${isAutoPeriod ? 'pr-10 border-amber-300 dark:border-amber-700' : ''}`}
                  />
                  {isAutoPeriod && (
                    <button
                      type="button"
                      onClick={() => updateSettings({ reportingPeriod: '' })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      title="Clear auto-detected value"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tone Selection */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Tone
          </Label>
          <div className="space-y-3">
            {TONE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => updateSettings({ tone: option.value })}
                className={`
                  w-full p-4 rounded-xl border text-left transition-all duration-200
                  ${settings.tone === option.value
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    p-2 rounded-lg transition-colors
                    ${settings.tone === option.value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                  `}>
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Tone preview */}
          {selectedTone && (
            <div className="p-3 bg-muted/50 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1">Preview:</p>
              <p className="text-sm italic text-foreground/80">{selectedTone.preview}</p>
            </div>
          )}
        </div>

        {/* Format Selection */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Format
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FORMAT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => updateSettings({ format: option.value })}
                className={`
                  p-4 rounded-xl border text-left transition-all duration-200
                  ${settings.format === option.value
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  }
                `}
              >
                <p className="font-medium mb-1">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Section Toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Sections to Include
            </Label>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {selectedSectionsCount} of {SECTION_OPTIONS.length}
            </span>
          </div>
          <div className="space-y-3">
            {SECTION_OPTIONS.map((section) => {
              const isChecked = settings.sections[section.id as keyof GenerationSettings['sections']]
              return (
                <label
                  key={section.id}
                  className={`
                    flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200
                    ${isChecked
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border hover:border-primary/30 hover:bg-accent/30'
                    }
                  `}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleSection(section.id as keyof GenerationSettings['sections'])}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="font-medium leading-none mb-1">{section.label}</p>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-2">
          <Button
            onClick={onGenerate}
            disabled={!canGenerate || isGenerating || selectedSectionsCount === 0}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
                Generating Your Letter...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Investor Letter
              </>
            )}
          </Button>

          {!canGenerate && (
            <p className="text-xs text-center text-muted-foreground mt-3">
              Upload at least one file to generate a letter
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
