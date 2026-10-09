'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowRight, CheckCircle2, Loader2, X } from 'lucide-react'
import { captureSignupSource } from '@/lib/newsletter/signup-source'
import { INTERESTS, ROLES, interestWords } from '@/lib/newsletter/interests'
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
import { ChoiceChips } from './ChoiceChips'
import { FollowChoices } from './FollowChoices'

/**
 * The signup card. Three passes on Danny's word:
 *   2026-10-08  "a polite gentle pop up... check a few boxes for which strategies"
 *   2026-10-09  "more obvious... sooner... really easy"
 *   2026-10-09  "keep [the boxes]... those are engaging clicks... in the middle
 *               of the screen... a tint out where it blurs the background...
 *               like how Substack does it, maybe not as takeover"
 *
 * So: a box in the middle of the screen over a tinted, lightly blurred page.
 * The tick-boxes (what the reader follows, where they sit) come first and are
 * optional; then the email and one button. Not a wall: the X, "No thanks",
 * Esc or a click anywhere outside closes it, and the page is still there.
 *
 * It appears by itself when lib/newsletter/prompt-rules.ts says so, and at
 * once when a Subscribe button asks for it (`OPEN_SIGNUP_EVENT`). Being a
 * real dialog now, it takes the keyboard focus, keeps Tab inside itself,
 * holds the page still behind it, and gives all of that back when it closes.
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
  const [role, setRole] = useState<string[]>([])
  const sub = useSubscribe('popup', () => ({ interests: followed, role: role[0] }))
  const emailRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
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

  const finished = sub.status === 'success' || sub.status === 'already' || !!handedToken

  const shown = open && (requested || isReadingPage(pathname))

  // A dialog: the page behind holds still, the focus comes in, and both go
  // back as they were when it closes. A reader who pressed Subscribe gets the
  // cursor in the email field; one it appeared to does not (on a phone that
  // would throw the keyboard up over what they were reading).
  useEffect(() => {
    if (!shown) return
    const before = document.activeElement as HTMLElement | null
    const root = document.documentElement
    const overflow = root.style.overflow
    root.style.overflow = 'hidden'
    if (requested && !finished) emailRef.current?.focus({ preventScroll: true })
    else boxRef.current?.focus({ preventScroll: true })
    return () => {
      root.style.overflow = overflow
      before?.focus?.({ preventScroll: true })
    }
  }, [shown, requested, finished])

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

  // Esc closes it, as the X does; Tab stays inside it.
  useEffect(() => {
    if (!shown) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return close(closeKind)
      if (e.key !== 'Tab' || !boxRef.current) return
      const stops = [...boxRef.current.querySelectorAll<HTMLElement>('button, input, a[href]')].filter((el) => !el.hasAttribute('disabled'))
      if (stops.length === 0) return
      const first = stops[0]
      const last = stops[stops.length - 1]
      const at = document.activeElement
      if (e.shiftKey && (at === first || at === boxRef.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && at === last) {
        e.preventDefault()
        first.focus()
      } else if (!boxRef.current.contains(at)) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shown, closeKind])

  if (!shown) return null

  const followedWords = interestWords(followed)

  return (
    // `.paper` brings the newsprint colours for the box; it also paints a cream
    // ground, which here would hide the page the tint is meant to show.
    <div className="paper fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-3 sm:p-6" style={{ background: 'transparent' }}>
      {/* The tint. A click on it closes the box: this is an ask, not a wall. */}
      <div
        aria-hidden
        onClick={() => close(closeKind)}
        className="signup-veil fixed inset-0 bg-[rgba(15,28,48,0.5)] backdrop-blur-[3px]"
      />
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-label="Subscribe to FundOps Daily"
        tabIndex={-1}
        className="signup-card relative my-auto w-full max-w-[540px] border-t-[3px] border-[var(--tab)] bg-card text-foreground shadow-[0_24px_80px_rgba(8,16,30,0.55)] outline-none"
      >
        <div className="flex items-center justify-between gap-3 bg-[var(--ink)] py-2 pl-4 pr-2 text-[var(--ink-foreground)] sm:pl-6">
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
            <X className="h-5 w-5" />
          </button>
        </div>

        {finished ? (
          <div className="px-4 pb-5 pt-5 sm:px-6">
            <p className="flex items-start gap-2 font-news text-[22px] font-medium leading-[1.2]">
              <CheckCircle2 className="mt-[3px] h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
              {sub.status === 'already' ? 'You’re already on the list.' : 'You’re in.'}
            </p>
            <p className="mt-1.5 font-ui text-[13.5px] leading-snug text-foreground/75" role="status">
              {sub.status === 'already'
                ? 'This address already gets FundOps Daily. To choose what you follow, use the link at the foot of any edition.'
                : `Your first edition lands tomorrow morning.${followedWords ? ` Stories on ${followedWords} will be grouped for you.` : ''}`}
            </p>

            {handedToken && sub.status !== 'already' && (
              <div className="mt-3.5 border-t border-border pt-3">
                <p className="mb-2.5 font-news text-[16.5px] leading-snug">
                  One more thing, if you like: tick what you follow and those stories are grouped for you.
                </p>
                <FollowChoices token={handedToken} onChange={setFollowed} />
              </div>
            )}

            <button
              type="button"
              onClick={() => close('none')}
              className="mt-2 inline-flex h-9 items-center rounded-sm border border-foreground/30 px-3.5 font-ui text-[12px] font-bold uppercase tracking-[0.08em] transition-colors hover:border-foreground"
            >
              {handedToken && sub.status !== 'already' ? 'Done' : 'Back to the news'}
            </button>
          </div>
        ) : (
          <form onSubmit={sub.submit} className="px-4 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
            <h2 className="font-news text-[25px] font-medium leading-[1.1] tracking-[-0.014em] sm:text-[32px]">
              Every fund close, deal and move,{' '}
              <span className="italic" style={{ color: 'var(--display-accent)' }}>in one morning email.</span>
            </h2>
            <p className="mt-2 font-ui text-[13.5px] leading-snug text-foreground/75 sm:text-[14.5px]">
              {firms && firms >= 25 ? (
                <>
                  Read each morning at <strong className="font-bold text-foreground">{firms.toLocaleString('en-US')} firms</strong>: GPs, LPs and
                  fund service providers.
                </>
              ) : (
                'Read each morning by GPs, LPs and fund service providers.'
              )}{' '}
              Tick what you follow and we’ll group those stories for you.
            </p>

            <div className="mt-4 space-y-3 sm:hidden">
              <ChoiceChips legend="I follow" options={INTERESTS} selected={followed} onChange={setFollowed} compact />
              <ChoiceChips legend="I’m at a" options={ROLES} selected={role} onChange={setRole} single compact inline />
            </div>
            <div className="mt-5 hidden space-y-4 sm:block">
              <ChoiceChips legend="I follow" options={INTERESTS} selected={followed} onChange={setFollowed} />
              <ChoiceChips legend="I’m at a" options={ROLES} selected={role} onChange={setRole} single inline />
            </div>

            <div className="mt-4 flex items-stretch gap-2 sm:mt-5">
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
                className="group inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-sm px-4 font-ui text-[13px] font-extrabold uppercase tracking-[0.07em] transition-[filter] hover:brightness-95 disabled:opacity-50 sm:px-5"
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

            <div className="mt-2.5 flex items-center justify-between gap-3 font-ui text-[12px] text-muted-foreground">
              <span>
                Free. <span className="hidden sm:inline">One email a day. </span>Unsubscribe in one click.
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
    </div>
  )
}
