'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowRight, CheckCircle2, Loader2, X } from 'lucide-react'
import { captureSignupSource } from '@/lib/newsletter/signup-source'
import { interestWords } from '@/lib/newsletter/interests'
import { isMarkedSubscribed, markSubscribed } from '@/lib/newsletter/subscribed-flag'
import { useSubscribe } from '@/lib/newsletter/use-subscribe'
import {
  DISMISSED_KEY,
  OPEN_SIGNUP_EVENT,
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
import { FollowChoices } from './FollowChoices'

/**
 * The signup card (2026-10-08, Danny: "a polite gentle pop up... lets them
 * click out or x out... check a few boxes for which strategies"; 2026-10-09:
 * "more obvious... sooner... really easy and not too many clicks").
 *
 * Two steps, and only the first is asked for. One: an email field and one
 * button. Two, once they are in: the tick-boxes for what they follow, each
 * saved as it is ticked, with nothing left to press.
 *
 * A card in the corner (a sheet along the bottom on a phone), never a box
 * over the page: nothing behind it is dimmed or locked. It appears by itself
 * when lib/newsletter/prompt-rules.ts says so, and at once when a Subscribe
 * button asks for it (`OPEN_SIGNUP_EVENT`). Mounted once, in the root layout.
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

/** How many firms read it, for the line under the headline. Asked for once, and only when the card may be needed. */
let firmsRequest: Promise<number | null> | undefined
function readerFirms(): Promise<number | null> {
  firmsRequest ??= fetch('/api/newsletter/readers')
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => (typeof d?.firms === 'number' ? d.firms : null))
    .catch(() => null)
  return firmsRequest
}

function isTyping(): boolean {
  const el = document.activeElement
  return !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || (el as HTMLElement).isContentEditable)
}

/** Ask the card to open now. `token` skips to the tick-boxes, for a form that has just signed the reader up. */
export function openSignupCard(detail: { token?: string } = {}): void {
  window.dispatchEvent(new CustomEvent(OPEN_SIGNUP_EVENT, { detail }))
}

export function SubscribePrompt() {
  const pathname = usePathname() ?? '/'
  const [open, setOpen] = useState(false)
  /** Opened by a button rather than by the clock: shown on any page, and the field takes the cursor. */
  const [requested, setRequested] = useState(false)
  const [handedToken, setHandedToken] = useState<string | null>(null)
  const [firms, setFirms] = useState<number | null>(null)
  const [followed, setFollowed] = useState<string[]>([])
  const sub = useSubscribe('popup')
  const emailRef = useRef<HTMLInputElement>(null)
  const viewCounted = useRef<string | null>(null)

  // The clock: runs only while the card could still appear on this visit.
  useEffect(() => {
    if (open || shownInMemory || !isReadingPage(pathname)) return
    if (arrivedAsSubscriber(captureSignupSource())) markSubscribed()
    if (isMarkedSubscribed() || read('session', SHOWN_KEY)) return
    const dismissal = parseDismissal(read('local', DISMISSED_KEY))
    if (isQuiet(dismissal, Date.now())) return

    readerFirms().then(setFirms)

    // One page view per path, however often the effect re-runs.
    if (viewCounted.current !== pathname) {
      viewCounted.current = pathname
      write('session', VIEWS_KEY, String(Number(read('session', VIEWS_KEY) ?? 0) + 1))
    }

    let scrolledPx = window.scrollY
    let secondsOnPage = 0
    const onScroll = () => {
      scrolledPx = Math.max(scrolledPx, window.scrollY)
    }

    const check = (leaving: boolean) => {
      const show = shouldShowPrompt({
        pathname,
        subscribed: isMarkedSubscribed(),
        shownThisVisit: false,
        dismissal,
        now: Date.now(),
        engagedSeconds: Number(read('session', SECONDS_KEY) ?? 0),
        secondsOnPage,
        pageViews: Number(read('session', VIEWS_KEY) ?? 1),
        scrolledPx,
        typing: isTyping(),
        viewportHeight: window.innerHeight,
        leaving,
      })
      if (show) {
        shownInMemory = true
        write('session', SHOWN_KEY, '1')
        setRequested(false)
        setOpen(true)
      }
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      secondsOnPage += 1
      write('session', SECONDS_KEY, String(Number(read('session', SECONDS_KEY) ?? 0) + 1))
      check(false)
    }, 1000)

    // A reader heading for the tab bar or the back button: the pointer leaves
    // through the top of the window. Mouse only; a phone has no such signal.
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget && e.clientY <= 0) check(true)
    }
    const hasMouse = window.matchMedia?.('(pointer: fine)').matches
    window.addEventListener('scroll', onScroll, { passive: true })
    if (hasMouse) document.addEventListener('mouseout', onLeave)

    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('mouseout', onLeave)
      window.clearInterval(timer)
    }
  }, [pathname, open])

  // A Subscribe button asked for it: open now, whatever the clock says.
  useEffect(() => {
    const onRequest = (e: Event) => {
      const token = (e as CustomEvent<{ token?: string }>).detail?.token
      shownInMemory = true
      write('session', SHOWN_KEY, '1')
      readerFirms().then(setFirms)
      setHandedToken(typeof token === 'string' ? token : null)
      setRequested(true)
      setOpen(true)
    }
    window.addEventListener(OPEN_SIGNUP_EVENT, onRequest)
    return () => window.removeEventListener(OPEN_SIGNUP_EVENT, onRequest)
  }, [])

  const token = sub.preferencesToken ?? handedToken
  const finished = sub.status === 'success' || sub.status === 'already' || !!handedToken

  // They pressed Subscribe: put the cursor in the field so they can just type.
  useEffect(() => {
    if (open && requested && !finished) emailRef.current?.focus({ preventScroll: true })
  }, [open, requested, finished])

  function close(remember: 'dismissed' | 'subscribed' | 'none') {
    if (remember === 'dismissed') {
      const next = nextDismissal(parseDismissal(read('local', DISMISSED_KEY)), Date.now())
      write('local', DISMISSED_KEY, JSON.stringify(next))
    }
    if (remember === 'subscribed') markSubscribed()
    setOpen(false)
  }
  // Closing a card they asked for is not a "no": the clock may still offer it another day.
  const closeKind = finished || requested ? 'none' : 'dismissed'

  // Esc closes it, as the X does.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(closeKind)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closeKind])

  if (!open || !(requested || isReadingPage(pathname))) return null

  const followedWords = interestWords(followed)

  return (
    <aside
      aria-label="Subscribe to FundOps Daily"
      className="paper pointer-events-none fixed inset-x-0 bottom-0 z-50 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[440px]"
    >
      <div className="signup-card pointer-events-auto border-t-[3px] border-[var(--tab)] bg-card text-foreground shadow-[0_-12px_40px_rgba(19,35,58,0.3)] sm:shadow-[0_18px_56px_rgba(19,35,58,0.38)]">
        <div className="flex items-center justify-between gap-3 bg-[var(--ink)] py-1.5 pl-4 pr-1.5 text-[var(--ink-foreground)]">
          <p className="font-ui text-[11px] font-bold uppercase tracking-[0.14em]">
            FundOps Daily
            <span className="ml-2 font-semibold tracking-[0.08em] text-[var(--tab)]">Free, every morning</span>
          </p>
          <button
            type="button"
            onClick={() => close(closeKind)}
            aria-label="Close"
            className="rounded-sm p-1.5 opacity-80 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--tab)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {finished ? (
          <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-4">
            <p className="flex items-start gap-2 font-news text-[22px] font-medium leading-[1.2]">
              <CheckCircle2 className="mt-[3px] h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
              {sub.status === 'already' ? 'You’re already on the list.' : 'You’re in.'}
            </p>
            <p className="mt-1.5 font-ui text-[13.5px] leading-snug text-foreground/75" role="status">
              {sub.status === 'already'
                ? 'This address already gets FundOps Daily. To choose what you follow, use the link at the foot of any edition.'
                : `Your first edition lands tomorrow morning.${followedWords ? ` Stories on ${followedWords} will be grouped for you.` : ''}`}
            </p>

            {token && sub.status !== 'already' && (
              <div className="mt-3.5 border-t border-border pt-3">
                <p className="mb-2.5 font-news text-[16.5px] leading-snug">
                  One more thing, if you like: tick what you follow and those stories are grouped for you.
                </p>
                <FollowChoices token={token} onChange={setFollowed} />
              </div>
            )}

            <button
              type="button"
              onClick={() => close('none')}
              className="mt-2 inline-flex h-9 items-center rounded-sm border border-foreground/30 px-3.5 font-ui text-[12px] font-bold uppercase tracking-[0.08em] transition-colors hover:border-foreground"
            >
              {token && sub.status !== 'already' ? 'Done' : 'Back to the news'}
            </button>
          </div>
        ) : (
          <form onSubmit={sub.submit} className="px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-3.5">
            <h2 className="font-news text-[24px] font-medium leading-[1.12] tracking-[-0.012em] sm:text-[27px]">
              Every fund close, deal and move,{' '}
              <span className="italic" style={{ color: 'var(--display-accent)' }}>in one morning email.</span>
            </h2>
            <p className="mt-2 font-ui text-[13.5px] leading-snug text-foreground/75">
              {firms && firms >= 25 ? (
                <>
                  Read each morning at <strong className="font-bold text-foreground">{firms.toLocaleString('en-US')} firms</strong>: GPs, LPs and
                  fund service providers.
                </>
              ) : (
                'Read each morning by GPs, LPs and fund service providers.'
              )}
            </p>

            <div className="mt-3.5 flex items-stretch gap-2">
              <input
                ref={emailRef}
                type="email"
                value={sub.email}
                onChange={(e) => sub.setEmail(e.target.value)}
                placeholder="name@firm.com"
                required
                autoComplete="email"
                inputMode="email"
                aria-label="Email address"
                className="h-12 min-w-0 flex-1 rounded-sm border-2 border-foreground/35 bg-background px-3 font-ui text-[16px] text-foreground placeholder:text-muted-foreground/70 focus:border-foreground focus:outline-none"
              />
              <button
                type="submit"
                disabled={sub.status === 'loading'}
                className="group inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-sm px-4 font-ui text-[13px] font-extrabold uppercase tracking-[0.07em] transition-[filter] hover:brightness-95 disabled:opacity-50"
                style={{ background: 'var(--tab)', color: 'var(--ink)' }}
              >
                {sub.status === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>
                      Subscribe<span className="hidden sm:inline"> free</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
            {sub.status === 'error' && <p className="mt-1.5 font-ui text-xs text-red-400" role="alert">{sub.errorMsg}</p>}

            <div className="mt-2 flex items-center justify-between gap-3 font-ui text-[12px] text-muted-foreground">
              <span>
                <span className="hidden sm:inline">One email a day. </span>Unsubscribe in one click.
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <button type="button" onClick={() => close('subscribed')} className="rounded-sm py-1 underline underline-offset-2 hover:text-foreground">
                  I subscribe
                </button>
                <button type="button" onClick={() => close(closeKind)} className="rounded-sm py-1 underline underline-offset-2 hover:text-foreground">
                  No thanks
                </button>
              </span>
            </div>
          </form>
        )}
      </div>
    </aside>
  )
}
