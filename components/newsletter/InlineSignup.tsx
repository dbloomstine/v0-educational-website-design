'use client'

import { useEffect, useId, useState } from 'react'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { useSubscribe } from '@/lib/newsletter/use-subscribe'
import { isMarkedSubscribed } from '@/lib/newsletter/subscribed-flag'
import { firstEditionSentence } from '@/lib/newsletter/first-edition'
import { openSignupCard } from './SubscribePrompt'

export type InlineSignupForm = 'inline-story' | 'inline-event' | 'inline-firm' | 'inline-league'

/**
 * The ask inside the page (2026-10-22, "we're getting visitors, we need to convert more of them"): one line in the
 * reading column, where people actually read, rather than a box in the rail. Under a story's summary, an event's
 * date and venue, a firm's answer line and the league table's.
 *
 * The line is the field's label, so a screen reader hears what the field is for. Rendered in the browser only, and
 * not at all for a browser that has subscribed (the same flag every form sets, lib/newsletter/subscribed-flag.ts):
 * crawlers and readers without JavaScript get the page, subscribers are not asked again. Subscribes through the same
 * route as every other form, recorded as `form`; once in, the signup box opens at its tick-boxes, as after the rail.
 */
export function InlineSignup({
  form,
  line,
  button = 'Subscribe',
  interests,
  className = '',
}: {
  form: InlineSignupForm
  /** What the reader gets, in one sentence. */
  line: string
  button?: string
  /** Interest tags sent with the signup (the events offer's `events`, `city:<slug>`). */
  interests?: string[]
  className?: string
}) {
  const [show, setShow] = useState(false)
  const sub = useSubscribe(form, interests?.length ? () => ({ interests }) : undefined)
  const id = useId()

  useEffect(() => {
    setShow(!isMarkedSubscribed())
  }, [])

  useEffect(() => {
    if (sub.status === 'success' && sub.preferencesToken) openSignupCard({ token: sub.preferencesToken })
    if (sub.status === 'already' && sub.preferencesTicket) openSignupCard({ ticket: sub.preferencesTicket, already: true })
  }, [sub.status, sub.preferencesToken, sub.preferencesTicket])

  if (!show) return null

  const done = sub.status === 'success' || sub.status === 'already'
  return (
    <div className={`inline-signup border-y border-foreground/15 py-3 ${className}`} data-signup-inline={form}>
      {done ? (
        <p className="flex items-start gap-2 font-ui text-[14px] leading-snug text-foreground" role="status">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
          {sub.status === 'already' ? 'You’re already on the list.' : `You’re in. ${firstEditionSentence()}`}
        </p>
      ) : (
        <form onSubmit={sub.submit} className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label htmlFor={id} className="min-w-[14rem] flex-1 font-news text-[17px] leading-snug text-foreground">
            {line} <span className="italic" style={{ color: 'var(--display-accent)' }}>Free.</span>
          </label>
          <div className="flex w-full items-stretch gap-2 sm:w-auto">
            <input
              id={id}
              type="email"
              value={sub.email}
              onChange={(e) => sub.setEmail(e.target.value)}
              placeholder="name@firm.com"
              required
              autoComplete="email"
              inputMode="email"
              aria-describedby={sub.status === 'error' ? `${id}-error` : undefined}
              aria-invalid={sub.status === 'error' || undefined}
              className="h-11 min-w-0 flex-1 rounded-sm border border-foreground/30 bg-background px-3 font-ui text-[16px] text-foreground placeholder:text-muted-foreground/70 focus:border-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tab)] sm:w-60 sm:flex-none"
            />
            <button
              type="submit"
              disabled={sub.status === 'loading'}
              className="group inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-sm px-4 font-ui text-[12.5px] font-extrabold uppercase tracking-[0.07em] transition-[filter] hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50"
              style={{ background: 'var(--tab)', color: 'var(--ink)' }}
            >
              {sub.status === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  <span className="sr-only">Subscribing</span>
                </>
              ) : (
                <>
                  {button} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </>
              )}
            </button>
          </div>
          {sub.status === 'error' && (
            <p id={`${id}-error`} className="w-full font-ui text-[12.5px] text-red-700" role="alert">
              {sub.errorMsg}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
