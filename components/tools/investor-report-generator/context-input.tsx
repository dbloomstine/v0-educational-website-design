"use client"

import { useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

interface ContextInputProps {
  value: string
  onChange: (value: string) => void
}

export function ContextInput({ value, onChange }: ContextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 80), 300)
      textarea.style.height = `${newHeight}px`
    }
  }, [value])

  const characterCount = value.length

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/5 border-primary/20 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm" />
              <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Tell the AI what you need</h3>
            </div>
          </div>
          <span className="ml-auto text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
            Powered by Claude
          </span>
        </div>

        {/* Input Area */}
        <div className="px-4 pb-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Paste your notes, meeting summaries, or instructions here...

Example: &quot;Focus on our new investment in TechCorp. Emphasize the strong Q4 performance and mention we're cautiously optimistic about market conditions. Keep it professional but confident.&quot;"
              className="w-full min-h-[80px] max-h-[300px] px-4 py-3 text-sm bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-muted-foreground/60 transition-all duration-200"
              style={{ height: '80px' }}
            />

            {/* Floating indicators */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              {characterCount > 0 && (
                <span className="text-xs text-muted-foreground/70 bg-background/80 px-2 py-0.5 rounded">
                  {characterCount.toLocaleString()} chars
                </span>
              )}
            </div>
          </div>

          {/* Helper text */}
          <p className="mt-2 text-xs text-muted-foreground">
            The AI will incorporate your instructions when generating the investor letter.
            <span className="text-primary/70 ml-1">Works best with specific details.</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
