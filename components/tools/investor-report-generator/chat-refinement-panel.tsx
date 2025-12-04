"use client"

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  MessageCircle,
  Send,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
  Lightbulb,
} from 'lucide-react'
import { ChatMessage } from './types'

interface ChatRefinementPanelProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => Promise<void>
  isProcessing: boolean
  isExpanded: boolean
  onToggleExpand: () => void
}

const SUGGESTED_PROMPTS = [
  { label: 'More optimistic', prompt: 'Make the tone more optimistic and confident throughout the letter.' },
  { label: 'Shorter', prompt: 'Make the letter more concise - reduce each section by about 30%.' },
  { label: 'More formal', prompt: 'Make the language more formal and institutional.' },
  { label: 'Add detail', prompt: 'Add more specific details and analysis to each section.' },
]

export function ChatRefinementPanel({
  messages,
  onSendMessage,
  isProcessing,
  isExpanded,
  onToggleExpand,
}: ChatRefinementPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isExpanded) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isExpanded])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    const message = input.trim()
    setInput('')
    await onSendMessage(message)
  }

  const handleSuggestedPrompt = async (prompt: string) => {
    if (isProcessing) return
    await onSendMessage(prompt)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg shadow-primary/5 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Header - Always visible */}
      <CardHeader
        className="pb-0 cursor-pointer hover:bg-primary/10 transition-colors rounded-t-lg"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="p-2 bg-primary/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Refine Your Letter with AI</span>
                {messages.length === 0 && (
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full">
                    New
                  </span>
                )}
                {messages.length > 0 && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                    {messages.length} messages
                  </span>
                )}
              </div>
              {!isExpanded && (
                <p className="text-sm text-muted-foreground font-normal">
                  Ask AI to adjust tone, add details, or make other changes
                </p>
              )}
            </div>
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {/* Expanded Content */}
      {isExpanded && (
        <CardContent className="pt-4 space-y-4">
          {/* Messages Area */}
          <div className="bg-background/50 rounded-lg border border-border min-h-[200px] max-h-[300px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
                <div className="p-3 bg-primary/10 rounded-full mb-3">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <p className="font-medium mb-1">Start a conversation</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Ask me to adjust tone, add details, shorten sections, or make other changes to your letter.
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.affectedSections && message.affectedSections.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {message.affectedSections.map((section) => (
                            <span
                              key={section}
                              className="px-2 py-0.5 bg-background/50 text-xs rounded-full"
                            >
                              {section.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Refining your letter...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Suggested Prompts */}
          {messages.length === 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lightbulb className="w-3 h-3" />
                <span>Quick suggestions</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((suggestion) => (
                  <button
                    key={suggestion.label}
                    onClick={() => handleSuggestedPrompt(suggestion.prompt)}
                    disabled={isProcessing}
                    className="px-3 py-1.5 text-sm bg-muted hover:bg-accent rounded-full transition-colors disabled:opacity-50"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell me how to improve the letter..."
              className="min-h-[44px] max-h-[120px] resize-none"
              disabled={isProcessing}
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isProcessing}
              className="h-11 w-11 flex-shrink-0"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  )
}
