"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquarePlus, ChevronDown, ChevronUp, X } from 'lucide-react'

interface ContextInputProps {
  value: string
  onChange: (value: string) => void
}

export function ContextInput({ value, onChange }: ContextInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasContent = value.trim().length > 0
  const characterCount = value.length

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setIsExpanded(false)
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full group"
      >
        <Card className="border-dashed border-2 hover:border-primary/50 hover:bg-accent/30 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <MessageSquarePlus className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                {hasContent ? (
                  <div>
                    <p className="text-sm font-medium text-foreground">Context added</p>
                    <p className="text-xs text-muted-foreground truncate max-w-md">
                      {value.slice(0, 100)}{value.length > 100 ? '...' : ''}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      Add context, notes, or instructions
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Optional: Paste meeting notes, provide emphasis, or guide the AI
                    </p>
                  </div>
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </CardContent>
        </Card>
      </button>
    )
  }

  return (
    <Card className="border-primary/30 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <MessageSquarePlus className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Context & Instructions</span>
            <span className="text-xs text-muted-foreground">(optional)</span>
          </div>
          <div className="flex items-center gap-2">
            {hasContent && (
              <button
                onClick={handleClear}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
            <button
              onClick={() => setIsExpanded(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste meeting notes, provide specific instructions, or add context that isn't in your uploaded files...

Examples:
• Focus on our Series B investment in TechCo
• Keep the tone more conservative than usual
• Mention the market volatility in Q4
• Match the style of our previous quarterly letters"
          className="min-h-[150px] resize-y text-sm"
          autoFocus
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>This context will guide the AI when generating your letter</span>
          <span>{characterCount.toLocaleString()} characters</span>
        </div>
      </CardContent>
    </Card>
  )
}
