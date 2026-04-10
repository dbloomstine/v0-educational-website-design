'use client'

import { useState } from 'react'
import { MessageSquarePlus, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

const CATEGORIES = [
  { label: 'Missing Source', value: 'missing_source' },
  { label: 'Feature Request', value: 'feature_request' },
  { label: 'Bug Report', value: 'bug_report' },
  { label: 'General Feedback', value: 'general' },
] as const

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('missing_source')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const reset = () => {
    setCategory('missing_source')
    setMessage('')
    setEmail('')
    setStatus('idle')
    setErrorMsg('')
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      // Reset after close animation
      setTimeout(reset, 200)
    }
  }

  const handleSubmit = async () => {
    if (message.trim().length < 5) {
      setErrorMsg('Please write at least a few words.')
      return
    }

    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message, email, page: '/' }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }

      setStatus('success')
      setTimeout(() => handleOpenChange(false), 1500)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit')
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <MessageSquarePlus className="h-3 w-3" />
        Suggest
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">Send Feedback</DialogTitle>
            <DialogDescription>
              Suggest a missing source, request a feature, or report an issue.
            </DialogDescription>
          </DialogHeader>

          {status === 'success' ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <div className="rounded-full bg-green-900/50 p-2">
                <Check className="h-5 w-5 text-green-400" />
              </div>
              <p className="text-sm text-foreground">Thanks for the feedback!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Category pills */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5 block">
                  Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                        category === cat.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5 block">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    category === 'missing_source'
                      ? "e.g. You're missing coverage from Preqin's blog..."
                      : category === 'feature_request'
                        ? 'e.g. It would be great if I could save articles...'
                        : 'What would you like us to know?'
                  }
                  rows={4}
                  maxLength={2000}
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>

              {/* Email (optional) */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5 block">
                  Email <span className="normal-case tracking-normal font-normal">(optional — if you want a reply)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Error */}
              {errorMsg && (
                <p className="text-xs text-red-400">{errorMsg}</p>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={status === 'submitting' || message.trim().length < 5}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2 text-xs font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
