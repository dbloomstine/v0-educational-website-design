"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Info, Zap, Clock, Target, ChevronLeft, ChevronRight } from 'lucide-react'
import { FileUploadZone } from './file-upload-zone'
import { GenerationSettingsPanel } from './generation-settings'
import { NarrativeEditor } from './narrative-editor'
import { ProgressStepper } from './progress-stepper'
import { LoadingAnimation } from './loading-animation'
import { SecurityPanel } from './security-panel'
import { exportToPDF } from './export-pdf'
import { exportToWord } from './export-docx'
import {
  ParsedData,
  GenerationSettings,
  GeneratedNarrative,
  ExtractedMetadata,
  ChatMessage,
  BrandSettings,
} from './types'

const DEFAULT_SETTINGS: GenerationSettings = {
  fundName: '',
  fundType: '',
  reportingPeriod: '',
  tone: 'neutral',
  format: 'executive-summary',
  sections: {
    performanceOverview: true,
    attributionAnalysis: true,
    keyEvents: true,
    forwardOutlook: true,
  },
}

const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  accentColor: '#3b82f6',
  isAutoExtracted: false,
}

// Helper to aggregate extracted metadata from all files
function aggregateMetadata(files: ParsedData[]): ExtractedMetadata {
  const result: ExtractedMetadata = {}

  // Priority order for confidence: high > medium > low
  const confidenceOrder = { high: 3, medium: 2, low: 1, undefined: 0 }

  for (const file of files) {
    const meta = file.extractedMetadata
    if (!meta) continue

    // Fund name - prefer higher confidence
    if (meta.fundName) {
      const currentConfidence = confidenceOrder[result.fundNameConfidence || 'undefined']
      const newConfidence = confidenceOrder[meta.fundNameConfidence || 'undefined']
      if (newConfidence > currentConfidence) {
        result.fundName = meta.fundName
        result.fundNameConfidence = meta.fundNameConfidence
        result.fundNameSource = meta.fundNameSource
      }
    }

    // Reporting period - prefer higher confidence
    if (meta.reportingPeriod) {
      const currentConfidence = confidenceOrder[result.reportingPeriodConfidence || 'undefined']
      const newConfidence = confidenceOrder[meta.reportingPeriodConfidence || 'undefined']
      if (newConfidence > currentConfidence) {
        result.reportingPeriod = meta.reportingPeriod
        result.reportingPeriodConfidence = meta.reportingPeriodConfidence
        result.reportingPeriodSource = meta.reportingPeriodSource
      }
    }

    // Fund type - prefer higher confidence
    if (meta.fundType) {
      const currentConfidence = confidenceOrder[result.fundTypeConfidence || 'undefined']
      const newConfidence = confidenceOrder[meta.fundTypeConfidence || 'undefined']
      if (newConfidence > currentConfidence) {
        result.fundType = meta.fundType
        result.fundTypeConfidence = meta.fundTypeConfidence
        result.fundTypeSource = meta.fundTypeSource
      }
    }
  }

  return result
}

export function InvestorReportGenerator() {
  const [processedFiles, setProcessedFiles] = useState<ParsedData[]>([])
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS)
  const [narrative, setNarrative] = useState<GeneratedNarrative | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(true)

  // Ref for scrolling to narrative section
  const narrativeSectionRef = useRef<HTMLDivElement>(null)
  const [editedContent, setEditedContent] = useState<Record<string, string>>({})
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isChatProcessing, setIsChatProcessing] = useState(false)
  const [brandSettings, setBrandSettings] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS)
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Scroll detection for sticky progress stepper
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 200)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Aggregate metadata from all processed files
  const aggregatedMetadata = aggregateMetadata(processedFiles)

  const handleFilesProcessed = useCallback((files: ParsedData[]) => {
    setProcessedFiles(prev => {
      const newFiles = [...prev, ...files]

      // Auto-populate settings from newly uploaded files
      const newMetadata = aggregateMetadata(files)
      if (newMetadata.fundName || newMetadata.reportingPeriod || newMetadata.fundType) {
        setSettings(current => ({
          ...current,
          fundName: current.fundName || newMetadata.fundName || '',
          reportingPeriod: current.reportingPeriod || newMetadata.reportingPeriod || '',
          fundType: current.fundType || newMetadata.fundType || '',
        }))
      }

      return newFiles
    })
    setError(null)
    setShowOnboarding(false)
  }, [])

  const handleRemoveFile = useCallback((fileName: string) => {
    setProcessedFiles(prev => prev.filter(f => f.fileName !== fileName))
  }, [])

  const handleRegenerateSection = useCallback(async (sectionId: string) => {
    if (!narrative) return

    setRegeneratingSection(sectionId)

    try {
      const response = await fetch('/api/generate-narrative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parsedData: processedFiles,
          settings,
          regenerateSection: sectionId,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to regenerate section')
      }

      const newSection = data.narrative.sections[0]
      if (newSection) {
        setNarrative(prev => {
          if (!prev) return null
          return {
            ...prev,
            sections: prev.sections.map(s =>
              s.id === sectionId ? { ...s, content: newSection.content } : s
            ),
          }
        })
        setEditedContent(prev => {
          const next = { ...prev }
          delete next[sectionId]
          return next
        })
      }
    } catch (err) {
      setNarrative(prev => {
        if (!prev) return null
        return {
          ...prev,
          sections: prev.sections.map(s =>
            s.id === sectionId
              ? { ...s, error: err instanceof Error ? err.message : 'Failed to regenerate' }
              : s
          ),
        }
      })
    } finally {
      setRegeneratingSection(null)
    }
  }, [narrative, processedFiles, settings])

  const handleExportPDF = useCallback(async () => {
    if (!narrative) return
    await exportToPDF(narrative, settings, editedContent, brandSettings)
  }, [narrative, settings, editedContent, brandSettings])

  const handleExportWord = useCallback(async () => {
    if (!narrative) return
    await exportToWord(narrative, settings, editedContent, brandSettings)
  }, [narrative, settings, editedContent, brandSettings])

  const handleChatSend = useCallback(async (message: string) => {
    if (!narrative || isChatProcessing) return

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    }
    setChatMessages(prev => [...prev, userMessage])
    setIsChatProcessing(true)

    try {
      const response = await fetch('/api/refine-narrative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentNarrative: narrative,
          chatHistory: chatMessages,
          userMessage: message,
          parsedData: processedFiles,
          settings,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to refine narrative')
      }

      // Update narrative with refined content
      if (data.updatedNarrative) {
        setNarrative(data.updatedNarrative)
        setEditedContent({}) // Clear any manual edits since AI updated the content
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.assistantMessage || 'Changes applied successfully.',
        timestamp: new Date(),
        affectedSections: data.affectedSections,
      }
      setChatMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      // Add error response
      const errorMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsChatProcessing(false)
    }
  }, [narrative, chatMessages, processedFiles, settings, isChatProcessing])

  // Reset chat when generating a new narrative
  const handleGenerate = useCallback(async () => {
    if (processedFiles.length === 0) return

    setIsGenerating(true)
    setError(null)
    setChatMessages([]) // Clear chat history for fresh generation

    // Scroll to the narrative section so user sees the loading animation
    setTimeout(() => {
      narrativeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)

    try {
      const response = await fetch('/api/generate-narrative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parsedData: processedFiles,
          settings,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate narrative')
      }

      setNarrative(data.narrative)
      setEditedContent({})
      // Auto-collapse the left panel after generation
      setIsLeftPanelCollapsed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate narrative')
    } finally {
      setIsGenerating(false)
    }
  }, [processedFiles, settings])

  const canGenerate = processedFiles.length > 0

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8 md:p-10">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-primary/10 rounded-xl">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                Investor Report Generator
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Transform your performance data and commentary into polished, professional quarterly investor letters in minutes.
              </p>
            </div>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-sm rounded-full border border-border text-sm">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>AI-Powered</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-sm rounded-full border border-border text-sm">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>2-Minute Generation</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-sm rounded-full border border-border text-sm">
              <Target className="w-4 h-4 text-green-500" />
              <span>Institutional Quality</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Stepper - Sticky on scroll */}
      <div
        className={`
          bg-card border border-border transition-all duration-300 z-40
          ${isScrolled
            ? 'sticky top-0 rounded-none -mx-4 px-4 py-3 shadow-md border-x-0 border-t-0'
            : 'rounded-xl p-6'
          }
        `}
      >
        <ProgressStepper
          currentStep={narrative ? 'export' : processedFiles.length > 0 ? 'configure' : 'upload'}
          hasFiles={processedFiles.length > 0}
          hasGenerated={!!narrative}
          compact={isScrolled}
        />
      </div>

      {/* Security Panel */}
      <SecurityPanel />

      {/* Onboarding */}
      {showOnboarding && !narrative && processedFiles.length === 0 && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-8">
            <div className="flex items-start gap-5">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Info className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-xl mb-3">
                  Get Started in 4 Easy Steps
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Create professional investor letters in minutes. Upload your data, generate a draft, then chat with AI to perfect it.
                </p>
                <div className="grid md:grid-cols-4 gap-5">
                  {[
                    {
                      step: '1',
                      title: 'Upload Your Data',
                      description: 'Drag and drop performance reports and manager commentary',
                    },
                    {
                      step: '2',
                      title: 'Configure Settings',
                      description: 'Choose your tone, format, and sections to include',
                    },
                    {
                      step: '3',
                      title: 'Generate Draft',
                      description: 'AI creates your professional investor letter',
                    },
                    {
                      step: '4',
                      title: 'Refine with AI',
                      description: 'Chat to tweak tone, add detail, or make changes',
                    },
                  ].map((item) => (
                    <div key={item.step} className="relative">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                          {item.step}
                        </div>
                        <h4 className="font-medium text-sm">{item.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground pl-11">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Button onClick={() => setShowOnboarding(false)} size="lg">
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 animate-in fade-in shake duration-300">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-red-900 dark:text-red-100">Generation Failed</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setError(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Layout - Collapsible left column */}
      <div className="relative">
        {/* Toggle Button - Always visible */}
        <button
          onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
          className={`
            absolute z-10 top-4 flex items-center justify-center
            w-6 h-12 bg-background border rounded-r-lg shadow-sm
            hover:bg-accent transition-all duration-300
            ${isLeftPanelCollapsed ? 'left-0' : 'left-[440px] xl:left-[500px]'}
          `}
          title={isLeftPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {isLeftPanelCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        <div className="flex gap-4 lg:gap-6">
        {/* Left Column - Upload & Settings */}
        <div
          className={`
            transition-all duration-300 ease-in-out space-y-6 flex-shrink-0
            ${isLeftPanelCollapsed
              ? 'w-0 opacity-0 overflow-hidden p-0 m-0'
              : 'w-[440px] xl:w-[500px]'
            }
          `}
        >
          {/* File Upload */}
          <Card className="overflow-hidden animate-in fade-in slide-in-from-left-4 duration-500">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
                Upload Your Files
              </h3>
              <FileUploadZone
                onFilesProcessed={handleFilesProcessed}
                processedFiles={processedFiles}
                onRemoveFile={handleRemoveFile}
                brandSettings={brandSettings}
                onBrandSettingsChange={setBrandSettings}
              />
            </CardContent>
          </Card>

          {/* Settings */}
          <div className="animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: '100ms' }}>
            <GenerationSettingsPanel
              settings={settings}
              onSettingsChange={setSettings}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              canGenerate={canGenerate}
              extractedMetadata={aggregatedMetadata}
            />
          </div>
        </div>

        {/* Right Column - Generated Narrative */}
        <div
          ref={narrativeSectionRef}
          className={`
            transition-all duration-300 ease-in-out flex-1 min-w-0
            animate-in fade-in slide-in-from-right-4 duration-500
            ${isLeftPanelCollapsed ? 'pl-8' : ''}
          `}
          style={{ animationDelay: '200ms' }}
        >
          {isGenerating ? (
            <Card className="min-h-[500px] flex items-center justify-center">
              <LoadingAnimation isLoading={isGenerating} />
            </Card>
          ) : (
            <NarrativeEditor
              narrative={narrative}
              onRegenerateSection={handleRegenerateSection}
              onExportPDF={handleExportPDF}
              onExportWord={handleExportWord}
              isRegenerating={regeneratingSection}
              parsedData={processedFiles}
              settings={settings}
              onSettingsChange={(partial) => setSettings(prev => ({ ...prev, ...partial }))}
              chatMessages={chatMessages}
              onChatSend={handleChatSend}
              isChatProcessing={isChatProcessing}
              brandSettings={brandSettings}
              onBrandSettingsChange={setBrandSettings}
              editedContent={editedContent}
              onEditedContentChange={setEditedContent}
            />
          )}
        </div>
        </div>
      </div>

      {/* Sample Data CTA */}
      {processedFiles.length === 0 && !showOnboarding && !narrative && (
        <Card className="bg-gradient-to-r from-accent/50 to-accent/20 border-accent animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-8">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="font-semibold text-xl mb-3">Need Sample Data to Try?</h3>
              <p className="text-muted-foreground mb-4">
                Create a CSV with columns like &quot;Period&quot;, &quot;Return&quot;, &quot;Benchmark&quot; for performance data,
                or upload a Word document with your manager commentary.
              </p>
              <p className="text-sm text-muted-foreground">
                Check the <code className="px-1.5 py-0.5 bg-muted rounded text-xs">test-data/</code> folder for sample files.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
