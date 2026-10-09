'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowRight, CheckCircle2, Loader2, X } from 'lucide-react'
import { captureSignupSource, signupSourceForRequest } from '@/lib/newsletter/signup-source'
import { INTERESTS, ROLES, interestWords } from '@/lib/newsletter/interests'
import { isMarkedSubscribed, markSubscribed } from '@/lib/newsletter/subscribed-flag'
import {
  DISMISSED_KEY,
  SECONDS_KEY,
  SHOWN_KEY,
  VIEWS_KEY,
  arrivedAsSubscriber,
  isQuiet,
  isReadingPage,
  nextDismissal,
  parseDismissal,
  shouldShowPrompt,
} from '@/lib/newsletter/prompt-rules'
import { ChoiceChips } from './ChoiceChips'

/**
 * The signup card (2026-10-08, Danny: "a polite gentle pop up... lets them
 * click out or x out... check a few boxes for which strategies").
 *
 * A card in the corner (a sheet along the bottom on a phone), never a box
 * over the page: nothing behind it is dimmed or locked, and it does not take
 * the keyboard focus. When it may appear is decided in
 * lib/newsletter/prompt-rules.ts; this file keeps the clock and the storage.
 * Mounted once, in the root layout.
 */

function read(store: 'local' | 'session', key: string): string | null {
  try {
    return (store === 'local' ? window.localStorage : window.sessionStorage).getItem(key)
  } catch {
    return null
  }
}
function write(store: 'local' | 'session', key: string, value: string): void {
  try {
    ;(store === 'local' ? window.localStorage : window.sessionStorage).setItem(key, value)
  } catch {
    // storage blocked: the in-memory flags below still hold for this page load
  }
}

/** For a browser that refuses storage: at least never twice in one page load. */
let shownInMemory = false

function isTyping(): boolean {
  const el = document.activeElement
  return !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || (el as HTMLElement).isContentEditable)
}

export function SubscribePrompt() {
  const pathname = usePathname() ?? '/'
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [role, setRole] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'already' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const viewCounted = useRef<string | null>(null)

  // The clock: runs only while the card could still appear on this visit.
  useEffect(() => {
    if (open || shownInMemory || !isReadingPage(pathname)) return
    if (arrivedAsSubscriber(captureSignupSource())) markSubscribed()
    if (isMarkedSubscribed() || read('session', SHOWN_KEY)) return
    const dismissal = parseDismissal(read('local', DISMISSED_KEY))
    if (isQuiet(dismissal, Date.now())) return

    // One page view per path, however often the effect re-runs.
    if (viewCounted.current !== pathname) {
      viewCounted.current = pathname
      write('session', VIEWS_KEY, String(Number(read('session', VIEWS_KEY) ?? 0) + 1))
    }

    let scrolledPx = window.scrollY
    const onScroll = () => {
      scrolledPx = Math.max(scrolledPx, window.scrollY)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      const engagedSeconds = Number(read('session', SECONDS_KEY) ?? 0) + 1
      write('session', SECONDS_KEY, String(engagedSeconds))
      const show = shouldShowPrompt({
        pathname,
        subscribed: isMarkedSubscribed(),
        shownThisVisit: false,
        dismissal,
        now: Date.now(),
        engagedSeconds,
        pageViews: Number(read('session', VIEWS_KEY) ?? 1),
        scrolledPx,
        typing: isTyping(),
        viewportHeight: window.innerHeight,
      })
      if (show) {
        shownInMemory = true
        write('session', SHOWN_KEY, '1')
        setOpen(true)
      }
    }, 1000)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearInterval(timer)
    }
  }, [pathname, open])

  function close(remember: 'dismissed' | 'subscribed' | 'none') {
    if (remember === 'dismissed') {
      const next = nextDismissal(parseDismissal(read('local', DISMISSED_KEY)), Date.now())
      write('local', DISMISSED_KEY, JSON.stringify(next))
    }
    if (remember === 'subscribed') markSubscribed()
    setOpen(false)
  }

  const finished = status === 'success' || status === 'already'

  // Esc closes it, as the X does.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(finished ? 'none' : 'dismissed')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, finished])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          attribution: signupSourceForRequest(),
          interests,
          role: role[0],
          form: 'popup',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to subscribe')
      markSubscribed()
      setStatus(data.message === 'Already subscribed' ? 'already' : 'success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (!open || !isReadingPage(pathname)) return null

  const followed = interestWords(interests)

  return (
    <aside
      aria-label="Subscribe to FundOps Daily"
      className="paper pointer-events-none fixed inset-x-0 bottom-0 z-50 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[404px]"
    >
      <div className="signup-card pointer-events-auto border-t border-foreground bg-card text-foreground shadow-[0_-10px_36px_rgba(19,35,58,0.22)] sm:border sm:shadow-[0_14px_44px_rgba(19,35,58,0.28)]">
        <div className="flex items-center justify-between gap-3 border-l-4 border-[var(--tab)] bg-[var(--ink)] py-1.5 pl-2.5 pr-1.5 text-[var(--ink-foreground)]">
          <p className="font-ui text-[11px] font-bold uppercase tracking-[0.14em]">
            FundOps Daily
            <span className="ml-2 font-semibold tracking-[0.08em] opacity-65">Free, every morning</span>
          </p>
          <button
            type="button"
            onClick={() => close(finished ? 'none' : 'dismissed')}
            aria-label="Close"
            className="rounded-sm p-1.5 opacity-80 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--tab)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {finished ? (
          <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:pb-4">
            <p className="flex items-start gap-2 font-news text-[21px] font-medium leading-[1.2]">
              <CheckCircle2 className="mt-[3px] h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
              {status === 'already' ? 'You’re already on the list.' : 'You’re in.'}
            </p>
            <p className="mt-1.5 font-ui text-[13.5px] leading-snug text-foreground/75" role="status">
              {status === 'already'
                ? 'This address already gets FundOps Daily. To choose what you follow, use the link at the foot of any edition.'
                : `Your first edition lands tomorrow morning.${followed ? ` Stories on ${followed} will be grouped for you.` : ''}`}
            </p>
            <button
              type="button"
              onClick={() => close('none')}
              className="mt-3 inline-flex h-9 items-center rounded-sm border border-foreground/30 px-3.5 font-ui text-[12px] font-bold uppercase tracking-[0.08em] transition-colors hover:border-foreground"
            >
              Back to the news
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3.5 sm:pb-3">
            <h2 className="font-news text-[21px] font-medium leading-[1.16] tracking-[-0.01em] sm:text-[23px]">
              The private markets news you follow,{' '}
              <span className="italic" style={{ color: 'var(--display-accent)' }}>in one email.</span>
            </h2>
            <p className="mt-1.5 hidden font-ui text-[13px] leading-snug text-foreground/70 sm:block">
              Tick what you follow and each morning’s edition groups those stories for you.
            </p>

            <div className="mt-3 space-y-2.5">
              <ChoiceChips legend="I follow" options={INTERESTS} selected={interests} onChange={setInterests} compact />
              <ChoiceChips legend="I’m at a" options={ROLES} selected={role} onChange={setRole} single compact inline />
            </div>

            <div className="mt-3.5 flex items-stretch gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@firm.com"
                required
                autoComplete="email"
                aria-label="Email address"
                className="h-10 min-w-0 flex-1 rounded-sm border border-foreground/30 bg-background px-3 font-ui text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:border-foreground focus:outline-none"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="group inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-sm bg-foreground px-4 font-ui text-[12px] font-bold uppercase tracking-[0.08em] text-background transition-colors hover:bg-foreground/85 disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
            {status === 'error' && <p className="mt-1.5 font-ui text-xs text-red-400" role="alert">{errorMsg}</p>}

            <div className="mt-2 flex items-center justify-between gap-3 font-ui text-[12px] text-muted-foreground">
              <button type="button" onClick={() => close('dismissed')} className="-ml-1 rounded-sm px-1 py-1 underline underline-offset-2 hover:text-foreground">
                No thanks
              </button>
              <button type="button" onClick={() => close('subscribed')} className="-mr-1 rounded-sm px-1 py-1 underline underline-offset-2 hover:text-foreground">
                I already subscribe
              </button>
            </div>
          </form>
        )}
      </div>
    </aside>
  )
}
