'use client'

import { useState } from 'react'
import { Mail, CheckCircle2, Loader2, ArrowRight } from 'lucide-react'

/**
 * Mid-feed CTA card. Lives inside the NewsFeed render loop, injected
 * after the 8th story group so users who are actively scrolling the
 * feed get a soft subscribe prompt before they bounce. Matches the
 * editorial visual language (serif headline, mono label) rather than
 * looking like a paid popup.
 *
 * Uses the same /api/newsletter/subscribe endpoint as the hero form,
 * so analytics and dedup paths stay unified. On success, collapses to
 * a "You're subscribed" confirmation in place.
 */
export function MidFeedSubscribeCTA() {
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

  return (
    <div className="my-6 rounded-lg border-2 border-foreground/15 bg-card/95 px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
        <span className="h-px w-6 bg-foreground/40" />
        In Your Inbox
      </div>
      <h3
        className="mt-2 font-display text-foreground"
        style={{
          fontSize: 'clamp(20px, 2.6vw, 26px)',
          lineHeight: 1.15,
          letterSpacing: '-0.015em',
          fontWeight: 500,
          fontVariationSettings: '"opsz" 36',
        }}
      >
        Get the morning brief before the market opens.
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        FundOps Daily — top fund news, every weekday morning. Free.
      </p>

      {status === 'success' ? (
        <div className="mt-4 flex items-center gap-2.5 rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span className="text-sm text-emerald-300">
            You&apos;re subscribed. Your first edition lands tomorrow morning.
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              required
              aria-label="Email address"
              className="w-full rounded-sm border-2 border-foreground/15 bg-background/70 px-4 py-2.5 pl-9 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/50 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="group inline-flex items-center justify-center gap-2 rounded-sm bg-foreground px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 sm:shrink-0"
          >
            {status === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Subscribe Free
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>
      )}
      {status === 'error' && (
        <p className="mt-2 text-xs text-red-400">{errorMsg}</p>
      )}
    </div>
  )
}
