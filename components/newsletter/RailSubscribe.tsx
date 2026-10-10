'use client'

import { useEffect } from 'react'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { useSubscribe } from '@/lib/newsletter/use-subscribe'
import { openSignupCard } from './SubscribePrompt'

/**
 * The email field inside the rail's navy "subscribe" panel on story, firm,
 * section, league and archive pages. Until 2026-10-09 that panel was a button
 * to the homepage's form: a reader on a story page had to leave it to sign up.
 * Once they are in, the signup card opens at its tick-boxes.
 */
export function RailSubscribe() {
  const sub = useSubscribe('rail')

  // Once they are in, the signup box opens at its tick-boxes: every way of subscribing asks what the reader follows.
  useEffect(() => {
    if (sub.status === 'success' && sub.preferencesToken) openSignupCard({ token: sub.preferencesToken })
    // Already on the list and never asked: asked now.
    if (sub.status === 'already' && sub.preferencesTicket) openSignupCard({ ticket: sub.preferencesTicket, already: true })
  }, [sub.status, sub.preferencesToken, sub.preferencesTicket])

  if (sub.status === 'success' || sub.status === 'already') {
    return (
      <div className="mt-3">
        <p className="flex items-start gap-2 font-ui text-[13.5px] leading-snug">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--tab)' }} aria-hidden />
          {sub.status === 'already' ? 'You’re already on the list.' : 'You’re in. Your first edition lands tomorrow morning.'}
        </p>
        {sub.status === 'success' && sub.preferencesToken && (
          <button
            type="button"
            onClick={() => openSignupCard({ token: sub.preferencesToken ?? undefined })}
            className="mt-2 font-ui text-[12.5px] font-semibold underline underline-offset-2 opacity-90 hover:opacity-100"
          >
            Choose what you follow
          </button>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={sub.submit} className="mt-3">
      <div className="flex items-stretch gap-2">
        <input
          type="email"
          value={sub.email}
          onChange={(e) => sub.setEmail(e.target.value)}
          placeholder="name@firm.com"
          required
          autoComplete="email"
          inputMode="email"
          aria-label="Email address"
          className="h-10 min-w-0 flex-1 rounded-sm border border-transparent bg-[var(--ink-foreground)] px-3 font-ui text-[16px] text-[var(--ink)] placeholder:text-[color-mix(in_oklab,var(--ink)_50%,transparent)] focus:border-[var(--tab)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={sub.status === 'loading'}
          aria-label="Subscribe free"
          className="group inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-sm px-3.5 font-ui text-[12px] font-bold uppercase tracking-[0.06em] transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--tab)', color: 'var(--ink)' }}
        >
          {sub.status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Subscribe <ArrowRight className="h-3 w-3" aria-hidden /></>}
        </button>
      </div>
      {sub.status === 'error' && <p className="mt-1.5 font-ui text-xs" role="alert">{sub.errorMsg}</p>}
      <p className="mt-1.5 font-ui text-[11.5px] opacity-65">Free. Unsubscribe in one click.</p>
    </form>
  )
}
