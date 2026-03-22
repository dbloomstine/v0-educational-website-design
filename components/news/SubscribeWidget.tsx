'use client'

import { useState } from 'react'
import { Mail, CheckCircle2, Loader2 } from 'lucide-react'

export function SubscribeWidget() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to subscribe')
      }

      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5">
        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
        <span className="text-sm text-emerald-300">Check your inbox to confirm your subscription.</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3 rounded-lg border border-border/40 bg-card/50 px-4 py-2.5 overflow-hidden">
      <div className="flex items-center gap-2 min-w-0">
        <Mail className="h-4 w-4 text-blue-400 shrink-0" />
        <span className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">FundOps Daily</span> — Top fund news in your inbox every morning
        </span>
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="flex-1 min-w-0 rounded-md border border-border/60 bg-background/50 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="shrink-0 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
        >
          {status === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Subscribe'
          )}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-xs text-red-400 sm:ml-6">{errorMsg}</p>
      )}
    </form>
  )
}
