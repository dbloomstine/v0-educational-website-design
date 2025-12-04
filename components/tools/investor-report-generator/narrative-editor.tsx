"use client"

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  RefreshCw,
  Copy,
  Check,
  FileDown,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  FileText,
  CheckCircle,
  Palette,
  FileType,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { GeneratedNarrative, GeneratedSection, ParsedData, GenerationSettings, ChatMessage, BrandSettings } from './types'
import { ChatRefinementPanel } from './chat-refinement-panel'
import { RichTextEditor } from './rich-text-editor'
import { CoverPagePreview } from './cover-page-preview'
import { BrandSettingsEditor } from './brand-settings-editor'

interface NarrativeEditorProps {
  narrative: GeneratedNarrative | null
  onRegenerateSection: (sectionId: string) => Promise<void>
  onExportPDF: () => void
  onExportWord: () => void
  isRegenerating: string | null
  parsedData: ParsedData[]
  settings: GenerationSettings
  onSettingsChange: (settings: Partial<GenerationSettings>) => void
  chatMessages: ChatMessage[]
  onChatSend: (message: string) => Promise<void>
  isChatProcessing: boolean
  brandSettings?: BrandSettings
  onBrandSettingsChange: (settings: BrandSettings) => void
  editedContent: Record<string, string>
  onEditedContentChange: (content: Record<string, string>) => void
}

export function NarrativeEditor({
  narrative,
  onRegenerateSection,
  onExportPDF,
  onExportWord,
  isRegenerating,
  parsedData,
  settings,
  onSettingsChange,
  chatMessages,
  onChatSend,
  isChatProcessing,
  brandSettings,
  onBrandSettingsChange,
  editedContent,
  onEditedContentChange,
}: NarrativeEditorProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [showSuccess, setShowSuccess] = useState(false)
  const [isChatExpanded, setIsChatExpanded] = useState(true)

  // Show success animation when narrative is first generated
  useEffect(() => {
    if (narrative) {
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [narrative?.generatedAt])

  const getDisplayContent = (section: GeneratedSection) => {
    return editedContent[section.id] ?? section.content
  }

  const handleStartEdit = (sectionId: string) => {
    setEditingSection(sectionId)
  }

  const handleContentChange = (sectionId: string, content: string) => {
    onEditedContentChange({ ...editedContent, [sectionId]: content })
  }

  const handleSaveEdit = (sectionId: string) => {
    setEditingSection(null)
  }

  const handleCancelEdit = (sectionId: string) => {
    setEditingSection(null)
    if (narrative) {
      const original = narrative.sections.find(s => s.id === sectionId)?.content
      if (original) {
        onEditedContentChange({ ...editedContent, [sectionId]: original })
      }
    }
  }

  const handleCopySection = useCallback(async (sectionId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedSection(sectionId)
      setTimeout(() => setCopiedSection(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [])

  const handleCopyAll = useCallback(async () => {
    if (!narrative) return

    const fullText = narrative.sections
      .map(s => `## ${s.title}\n\n${getDisplayContent(s)}`)
      .join('\n\n')

    try {
      await navigator.clipboard.writeText(fullText)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [narrative, editedContent])

  const toggleCollapse = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  if (!narrative) {
    return (
      <div className="sticky top-36">
        <Card className="min-h-[400px] flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10">
          <CardContent className="text-center py-16 px-8">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-150" />
              <div className="relative p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
                <Sparkles className="h-12 w-12 text-primary/60" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Your Letter Will Appear Here</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Upload your files, configure your settings, and click Generate to create your professional investor letter.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Success Banner */}
      {showSuccess && (
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">Letter Generated Successfully!</p>
            <p className="text-sm text-green-700 dark:text-green-300">Review your narrative below, then use AI to refine it.</p>
          </div>
        </div>
      )}

      {/* AI Refinement Panel - Prominent Position */}
      <ChatRefinementPanel
        messages={chatMessages}
        onSendMessage={onChatSend}
        isProcessing={isChatProcessing}
        isExpanded={isChatExpanded}
        onToggleExpand={() => setIsChatExpanded(!isChatExpanded)}
      />

      {/* Header with actions and brand preview */}
      <Card
        className="overflow-hidden"
        style={{
          background: brandSettings?.isAutoExtracted
            ? `linear-gradient(135deg, ${brandSettings.primaryColor}08 0%, ${brandSettings.accentColor}15 100%)`
            : undefined
        }}
      >
        {/* Brand accent bar at top */}
        {brandSettings?.isAutoExtracted && (
          <div
            className="h-1"
            style={{
              background: `linear-gradient(90deg, ${brandSettings.primaryColor}, ${brandSettings.accentColor})`
            }}
          />
        )}
        <CardContent className="py-5 px-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Logo or icon */}
              {brandSettings?.logoUrl ? (
                <div
                  className="p-1.5 rounded-lg border"
                  style={{ borderColor: brandSettings.primaryColor + '30' }}
                >
                  <img
                    src={brandSettings.logoUrl}
                    alt="Fund logo"
                    className="w-8 h-8 rounded"
                  />
                </div>
              ) : (
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">{settings.fundName || 'Investor Letter'}</h3>
                <p className="text-sm text-muted-foreground">
                  {settings.reportingPeriod || 'Quarterly Report'} • {narrative.sections.length} sections
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Brand preview indicator */}
              {brandSettings?.isAutoExtracted && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-background/80 rounded-full border text-xs text-muted-foreground">
                  <Palette className="h-3 w-3" />
                  <span>Custom branding</span>
                  <div className="flex gap-0.5 ml-1">
                    <div
                      className="w-3 h-3 rounded-full border border-white/50"
                      style={{ backgroundColor: brandSettings.primaryColor }}
                      title="Primary color"
                    />
                    <div
                      className="w-3 h-3 rounded-full border border-white/50"
                      style={{ backgroundColor: brandSettings.secondaryColor }}
                      title="Secondary color"
                    />
                    <div
                      className="w-3 h-3 rounded-full border border-white/50"
                      style={{ backgroundColor: brandSettings.accentColor }}
                      title="Accent color"
                    />
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAll}
                className="gap-2"
              >
                {copiedAll ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy All
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onExportWord}
                className="gap-2"
              >
                <FileType className="h-4 w-4" />
                Word
              </Button>
              <Button
                size="sm"
                onClick={onExportPDF}
                className="gap-2"
                style={brandSettings?.isAutoExtracted ? {
                  backgroundColor: brandSettings.primaryColor,
                  borderColor: brandSettings.primaryColor,
                } : undefined}
              >
                <FileDown className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cover Page Preview and Brand Settings - Full Width Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="w-full">
          <CoverPagePreview
            settings={settings}
            brandSettings={brandSettings}
            onSettingsChange={(partial) => onSettingsChange({ ...settings, ...partial })}
            onBrandSettingsChange={onBrandSettingsChange}
          />
        </div>
        {brandSettings && (
          <div className="w-full space-y-4">
            <BrandSettingsEditor
              brandSettings={brandSettings}
              onBrandSettingsChange={onBrandSettingsChange}
            />
            <div className="p-4 bg-muted/30 rounded-lg border text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">PDF Preview Tips</p>
              <ul className="space-y-1 list-disc pl-4">
                <li>Click any text on the cover page to edit it</li>
                <li>Adjust brand colors to match your fund's identity</li>
                <li>Colors are applied to the PDF cover and section accents</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Sections */}
      {narrative.sections.map((section, index) => (
        <Card
          key={section.id}
          className="overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{
            animationDelay: `${index * 100}ms`,
            borderLeftWidth: brandSettings?.isAutoExtracted ? '3px' : undefined,
            borderLeftColor: brandSettings?.isAutoExtracted ? brandSettings.primaryColor : undefined,
          }}
        >
          <CardHeader
            className="cursor-pointer hover:bg-accent/50 transition-colors py-4 px-6"
            onClick={() => toggleCollapse(section.id)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${collapsedSections.has(section.id) ? 'bg-muted' : ''}`}
                  style={!collapsedSections.has(section.id) && brandSettings?.isAutoExtracted ? {
                    backgroundColor: brandSettings.primaryColor + '15'
                  } : !collapsedSections.has(section.id) ? {
                    backgroundColor: 'hsl(var(--primary) / 0.1)'
                  } : undefined}
                >
                  {collapsedSections.has(section.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp
                      className="h-4 w-4"
                      style={brandSettings?.isAutoExtracted ? { color: brandSettings.primaryColor } : undefined}
                    />
                  )}
                </div>
                {section.title}
              </CardTitle>
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                {editingSection !== section.id && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopySection(section.id, getDisplayContent(section))}
                      title="Copy section"
                    >
                      {copiedSection === section.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRegenerateSection(section.id)}
                      disabled={isRegenerating === section.id}
                      title="Regenerate section"
                      className="gap-1.5"
                    >
                      {isRegenerating === section.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          <span className="hidden sm:inline">Regenerate</span>
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          <div className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${collapsedSections.has(section.id) ? 'max-h-0' : 'max-h-[2000px]'}
          `}>
            <CardContent className="pt-0 px-6 pb-6">
              {editingSection === section.id ? (
                <RichTextEditor
                  content={editedContent[section.id] ?? section.content}
                  onChange={(content) => handleContentChange(section.id, content)}
                  onSave={() => handleSaveEdit(section.id)}
                  onCancel={() => handleCancelEdit(section.id)}
                  brandColor={brandSettings?.primaryColor}
                />
              ) : (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-li:text-foreground/90 cursor-text rounded-lg p-3 -m-3 hover:bg-accent/30 transition-colors group relative"
                  onClick={() => handleStartEdit(section.id)}
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded pointer-events-none">
                    Click to edit
                  </div>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h3: ({ children }) => (
                        <h3 className="text-base font-semibold mt-4 mb-2 text-foreground">{children}</h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-3 leading-relaxed">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="leading-relaxed">{children}</li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary/50 pl-4 py-1 my-3 bg-primary/5 rounded-r-lg italic">
                          {children}
                        </blockquote>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic text-foreground/80">{children}</em>
                      ),
                    }}
                  >
                    {getDisplayContent(section)}
                  </ReactMarkdown>
                </div>
              )}

              {section.error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{section.error}</p>
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      ))}

      {/* Generation metadata */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground py-4">
        <span>Generated {new Date(narrative.generatedAt).toLocaleString()}</span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
        <span className="capitalize">{narrative.settings.tone} tone</span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
        <span className="capitalize">{narrative.settings.format.replace('-', ' ')}</span>
      </div>
    </div>
  )
}
