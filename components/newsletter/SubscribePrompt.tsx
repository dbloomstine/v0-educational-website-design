'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowRight, CheckCircle2, Loader2, X } from 'lucide-react'
import { captureSignupSource } from '@/lib/newsletter/signup-source'
import { INTERESTS, ROLES, eventSignupTags, interestWords } from '@/lib/newsletter/interests'
import { eventsOfferHeadline } from '@/lib/events/offer'
import { isMarkedSubscribed, markSubscribed } from '@/lib/newsletter/subscribed-flag'
import { useSubscribe } from '@/lib/newsletter/use-subscribe'
import {
  ARRIVAL_DELAY_MS,
  DISMISSED_KEY,
  SEEN_KEY,
  OPEN_SIGNUP_EVENT,
  SECONDS_KEY,
  SHOWN_KEY,
  VIEWS_KEY,
  arrivedAsSubscriber,
  arrivedFromPost,
  isFirstVisit,
  isQuiet,
  isReadingPage,
  nextDismissal,
  parseDismissal,
  promptForm,
  promptLayout,
  shouldShowOnArrival,
  shouldShowPrompt,
} from '@/lib/newsletter/prompt-rules'
import { FOLLOW } from '@/lib/brand/social'
import { ChoiceChips } from './ChoiceChips'
import { FollowChoices, type FollowPass } from './FollowChoices'

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
 *
 * 2026-10-22: a first visit gets it on arrival (prompt-rules.ts). On a phone
 * a box that came by itself is a bottom panel (`layout: 'sheet'`) that covers
 * at most a third of the screen and leaves the page free to scroll: no tint,
 * no held page, no focus taken. On an events page it offers the events
 * (with the city, read from the page's events block) and records the opt-in.
 * A signup through it is stored with the form `firstvisit` or `popup` and the
 * page it appeared on.
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

/**
 * The events page the box is on, if any: the city from the page's events block ("" for none), or the events section;
 * and whether that block says the Monday events email is live (lib/events/weekly-mode.ts), so the box promises it only then.
 */
function readEventsContext(pathname: string): { city: string | null; monday: boolean } | null {
  const block = document.querySelector('[data-signup-events]')
  if (block) return { city: block.getAttribute('data-signup-events') || null, monday: block.getAttribute('data-signup-events-monday') === '1' }
  return /^\/events(\/|$)/.test(pathname) ? { city: null, monday: false } : null
}

function isTyping(): boolean {
  const el = document.activeElement
  return !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || (el as HTMLElement).isContentEditable)
}

/** What another form hands the box so it opens at its tick-boxes: the key to save with, and whether the reader was already on the list. */
export interface Handed extends FollowPass {
  already?: boolean
}

/** Ask the box to open now. With a `token` or a `ticket` it skips to the tick-boxes, for a form that has just taken the reader's address. */
export function openSignupCard(detail: Handed = {}): void {
  window.dispatchEvent(new CustomEvent(OPEN_SIGNUP_EVENT, { detail }))
}

/**
 * The outreach emails' subscribe link carries the recipient's address as
 * `?e=<base64url>` (lib/outreach/template.ts). Null on any failure — bad
 * base64, not an email, a mangled share — so the field just starts empty.
 */
function decodePrefillEmail(): string | null {
  try {
    const token = new URLSearchParams(window.location.search).get('e')
    if (!token) return null
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '==='.slice(0, (4 - (b64.length % 4)) % 4)
    const decoded = atob(padded)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(decoded) ? decoded : null
  } catch {
    return null
  }
}

export function SubscribePrompt() {
  const pathname = usePathname() ?? '/'
  const [open, setOpen] = useState(false)
  /** Opened by a button rather than by the clock: shown on any page, and the field takes the cursor. */
  const [requested, setRequested] = useState(false)
  const [handed, setHanded] = useState<Handed | null>(null)
  /** The boxes ticked before an address turned out to be on the list already: saved for them with the ticket. */
  const [carried, setCarried] = useState(false)
  /** ...or, when none were ticked, the question is put now. Decided once, when the ticket arrives. */
  const [askNow, setAskNow] = useState(false)
  const [firms, setFirms] = useState<number | null>(null)
  /** Came over from one of our posts: the box says so. Read when it opens, never during the first render. */
  const [cameFrom, setCameFrom] = useState<ReturnType<typeof arrivedFromPost>>(null)
  const [followed, setFollowed] = useState<string[]>([])
  const [role, setRole] = useState<string[]>([])
  /** It came by itself on a first visit (counted as form `firstvisit`). */
  const [firstVisit, setFirstVisit] = useState(false)
  /** A bottom panel on a phone when it came by itself; the box in the middle otherwise. */
  const [layout, setLayout] = useState<'sheet' | 'dialog'>('dialog')
  /** The page it appeared on, stored with a signup (`signup_page`). */
  const [appearedAt, setAppearedAt] = useState<string | null>(null)
  /** On an events page: the city the page is about, if any. */
  const [eventsCtx, setEventsCtx] = useState<{ city: string | null; monday: boolean } | null>(null)
  const sub = useSubscribe(promptForm(firstVisit && !requested), () => ({
    interests: [...followed, ...(eventsCtx ? eventSignupTags(eventsCtx.city) : [])],
    role: role[0],
    ...(appearedAt ? { page: appearedAt } : {}),
  }))
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

    const fromPost = arrivedFromPost(captureSignupSource())
    setCameFrom(fromPost)

    // It is here by itself: remember that this browser has seen it, and how and where it came.
    const appear = (first: boolean) => {
      shownInMemory = true
      write('session', SHOWN_KEY, '1')
      write('local', SEEN_KEY, String(Date.now()))
      setFirstVisit(first)
      setLayout(promptLayout(window.innerWidth, false))
      setAppearedAt(pathname)
      setEventsCtx(readEventsContext(pathname))
      setRequested(false)
      setOpen(true)
    }

    // A first visit: on arrival, once the page has painted and is on screen (2026-10-22).
    if (isFirstVisit({ subscribed: false, seenBefore: Boolean(read('local', SEEN_KEY)), dismissal })) {
      let visibleMs = 0
      const STEP = 300
      const arrival = window.setInterval(() => {
        if (document.visibilityState !== 'visible') return
        visibleMs += STEP
        if (visibleMs < ARRIVAL_DELAY_MS || document.getElementById('site-menu')) return
        const show = shouldShowOnArrival({
          pathname,
          subscribed: isMarkedSubscribed(),
          seenBefore: Boolean(read('local', SEEN_KEY)),
          shownThisVisit: Boolean(read('session', SHOWN_KEY)),
          dismissal,
          typing: isTyping(),
          viewportHeight: window.innerHeight,
        })
        if (show) {
          window.clearInterval(arrival)
          appear(true)
        }
      }, STEP)
      return () => window.clearInterval(arrival)
    }

    const check = (leaving: boolean) => {
      // Not over the phone's menu: the reader is on their way somewhere. The clock asks again a second later.
      if (document.getElementById('site-menu')) return
      const show = shouldShowPrompt({
        fromPost: !!fromPost,
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
      if (show) appear(false)
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
      const d = (e as CustomEvent<Handed>).detail ?? {}
      shownInMemory = true
      write('session', SHOWN_KEY, '1')
      write('local', SEEN_KEY, String(Date.now()))
      setFirstVisit(false)
      setLayout('dialog')
      setAppearedAt(window.location.pathname)
      setEventsCtx(readEventsContext(window.location.pathname))
      readerFirms().then(setFirms)
      setCameFrom(arrivedFromPost(captureSignupSource()))
      setHanded(typeof d.token === 'string' ? { token: d.token } : typeof d.ticket === 'string' ? { ticket: d.ticket, already: Boolean(d.already) } : null)
      setCarried(false)
      setAskNow(false)
      setRequested(true)
      setOpen(true)
    }
    window.addEventListener(OPEN_SIGNUP_EVENT, onRequest)
    return () => window.removeEventListener(OPEN_SIGNUP_EVENT, onRequest)
  }, [])

  // Until 2026-10-12 the homepage had a one-line subscribe band (`#subscribe`, removed on Danny's word: enough
  // other places ask). The links that pointed at it still do — the Subscribe buttons' no-script href, the
  // preferences and 404 pages, the unsubscribe email's "Resubscribe" — and the outreach emails' `?e=` deep-link
  // pre-filled its field. Both land here now: the box opens, with the address in when the link carried one.
  useEffect(() => {
    const prefill = decodePrefillEmail()
    if (prefill) sub.setEmail(prefill)
    if (prefill || window.location.hash === '#subscribe') openSignupCard()
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const finished = sub.status === 'success' || sub.status === 'already' || !!handed
  // Whoever is here was already on the list: told so, not promised a first edition.
  const already = sub.status === 'already' || Boolean(handed?.already)
  // The key the tick-boxes save with, when they are still to be asked: handed over by another form, or this box's own
  // ticket for an address that turned out to be on the list.
  const ownTicket = sub.status === 'already' && sub.preferencesTicket ? sub.preferencesTicket : null
  const pass: FollowPass | null = handed ? (handed.token ? { token: handed.token } : { ticket: handed.ticket }) : ownTicket && askNow ? { ticket: ownTicket } : null

  // They ticked boxes in this box and then gave an address already on the list: the boxes were not stored with a
  // signup (there was none), so they are stored now.
  useEffect(() => {
    if (!ownTicket || carried || askNow || handed) return
    if (!followed.length && !role.length) return setAskNow(true)
    setCarried(true)
    fetch('/api/newsletter/preferences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket: ownTicket, interests: followed, role: role[0] }) }).catch(() => {})
    // Once, when the ticket arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownTicket])

  const shown = open && (requested || isReadingPage(pathname))
  const sheet = layout === 'sheet'

  // Signed up from the bottom panel, which has no room for the tick-boxes: the box comes up in the middle to
  // ask them, as it does after every other form. They have said yes; it is no longer an ask on arrival.
  useEffect(() => {
    if (!sheet) return
    if (sub.status === 'success') {
      if (sub.preferencesToken) setHanded({ token: sub.preferencesToken })
      setLayout('dialog')
    } else if (sub.status === 'already') {
      setLayout('dialog')
    }
  }, [sheet, sub.status, sub.preferencesToken])

  // A dialog: the page behind holds still, the focus comes in, and both go
  // back as they were when it closes. A reader who pressed Subscribe gets the
  // cursor in the email field; one it appeared to does not (on a phone that
  // would throw the keyboard up over what they were reading).
  useEffect(() => {
    // The bottom panel leaves the page as it is: it scrolls, and the focus stays where the reader put it.
    if (!shown || sheet) return
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
  }, [shown, sheet, requested, finished])

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
      if (sheet || e.key !== 'Tab' || !boxRef.current) return
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
  }, [shown, sheet, closeKind])

  if (!shown) return null

  const followedWords = interestWords(followed)
  const skipLabel = requested ? 'No thanks' : 'No thanks, show me the page'

  if (sheet && !finished) {
    return (
      // A bottom panel, at most a third of the screen: the page above stays readable and scrollable.
      <div className="paper fixed inset-x-0 bottom-0 z-[70]" style={{ background: 'transparent' }}>
        <div
          ref={boxRef}
          role="dialog"
          aria-modal="false"
          aria-label="Subscribe to FundOps Daily"
          tabIndex={-1}
          className="signup-sheet max-h-[34vh] overflow-y-auto border-t-[3px] border-[var(--tab)] bg-card text-foreground shadow-[0_-10px_36px_rgba(8,16,30,0.32)] outline-none"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <form onSubmit={sub.submit} className="px-4 pb-2.5 pt-3">
            <div className="flex items-start justify-between gap-2">
              <p className="font-news text-[17px] font-medium leading-[1.2] tracking-[-0.01em]">
                {eventsCtx ? (
                  <>
                    {eventsOfferHeadline(eventsCtx.city, { monday: eventsCtx.monday })} <span className="italic" style={{ color: 'var(--display-accent)' }}>Free.</span>
                  </>
                ) : (
                  <>
                    Every fund close, deal and move, <span className="italic" style={{ color: 'var(--display-accent)' }}>in one free morning email.</span>
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={() => close(closeKind)}
                aria-label="Close"
                className="-mr-1.5 -mt-1 shrink-0 rounded-sm p-1.5 text-foreground/70 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex items-stretch gap-2">
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
                className="h-11 min-w-0 flex-1 rounded-sm border-2 border-foreground/35 bg-background px-3 font-ui text-[16px] text-foreground placeholder:text-muted-foreground/70 focus:border-foreground focus:outline-none"
              />
              <button
                type="submit"
                disabled={sub.status === 'loading'}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-sm px-3.5 font-ui text-[12.5px] font-extrabold uppercase tracking-[0.07em] disabled:opacity-50"
                style={{ background: 'var(--tab)', color: 'var(--ink)' }}
              >
                {sub.status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Subscribe <ArrowRight className="h-3.5 w-3.5" aria-hidden /></>}
              </button>
            </div>
            {sub.status === 'error' && <p className="mt-1 font-ui text-xs text-red-400" role="alert">{sub.errorMsg}</p>}
            <div className="mt-1 flex items-center justify-between gap-3 font-ui text-[12.5px] text-muted-foreground">
              <button type="button" onClick={() => close(closeKind)} className="rounded-sm py-1.5 font-semibold text-foreground/75 underline underline-offset-2 hover:text-foreground">
                {skipLabel}
              </button>
              <button type="button" onClick={() => close('subscribed')} className="rounded-sm py-1.5 underline underline-offset-2 hover:text-foreground">
                I subscribe
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

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
              {already ? 'You’re already on the list.' : 'You’re in.'}
            </p>
            <p className="mt-1.5 font-ui text-[13.5px] leading-snug text-foreground/75" role="status">
              {already
                ? carried
                  ? `This address already gets FundOps Daily.${followedWords ? ` Stories on ${followedWords} will now be grouped for you.` : ' Your choices are saved.'}`
                  : pass
                    ? 'This address already gets FundOps Daily, so nothing changes there.'
                    : 'This address already gets FundOps Daily. To change what you follow, use the link at the foot of any edition.'
                : `Your first edition lands tomorrow morning.${followedWords ? ` Stories on ${followedWords} will be grouped for you.` : ''}`}
            </p>

            {pass && (
              <div className="mt-3.5 border-t border-border pt-3">
                <p className="mb-2.5 font-news text-[16.5px] leading-snug">
                  {already ? 'One thing we never asked: tick what you follow and those stories are grouped for you.' : 'One more thing, if you like: tick what you follow and those stories are grouped for you.'}
                </p>
                <FollowChoices pass={pass} onChange={setFollowed} />
              </div>
            )}

            <button
              type="button"
              onClick={() => close('none')}
              className="mt-2 inline-flex h-9 items-center rounded-sm border border-foreground/30 px-3.5 font-ui text-[12px] font-bold uppercase tracking-[0.08em] transition-colors hover:border-foreground"
            >
              {pass ? 'Done' : 'Back to the news'}
            </button>

            {/* The one moment a follow costs nothing: they have just said yes. */}
            <p className="mt-4 border-t border-border pt-3 font-ui text-[12.5px] leading-snug text-foreground/65">
              Through the day, follow{' '}
              {FOLLOW.map((x, i) => (
                <span key={x.href}>
                  {i === 0 ? '' : i === FOLLOW.length - 1 ? ' and ' : ', '}
                  <a href={x.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground/85 underline decoration-foreground/30 underline-offset-2 hover:text-foreground">
                    {x.label}
                  </a>
                </span>
              ))}
              .
            </p>
          </div>
        ) : (
          <form onSubmit={sub.submit} className="px-4 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
            <h2 className="font-news text-[25px] font-medium leading-[1.1] tracking-[-0.014em] sm:text-[32px]">
              {eventsCtx ? (
                <>
                  {eventsOfferHeadline(eventsCtx.city, { monday: eventsCtx.monday })}{' '}
                  <span className="italic" style={{ color: 'var(--display-accent)' }}>Free.</span>
                </>
              ) : cameFrom ? (
                <>
                  You found {cameFrom.story ? 'this' : 'us'} on {cameFrom.network}.{' '}
                  <span className="italic" style={{ color: 'var(--display-accent)' }}>Get the whole day in one morning email.</span>
                </>
              ) : (
                <>
                  Every fund close, deal and move,{' '}
                  <span className="italic" style={{ color: 'var(--display-accent)' }}>in one morning email.</span>
                </>
              )}
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

            {/* The way past it, said plainly: it is an ask, and the page is right there. */}
            {!requested && (
              <button
                type="button"
                onClick={() => close(closeKind)}
                className="mt-3 block w-full rounded-sm py-1 text-center font-ui text-[13.5px] font-semibold text-foreground/75 underline underline-offset-[3px] hover:text-foreground"
              >
                {skipLabel}
              </button>
            )}

            <div className="mt-2.5 flex items-center justify-between gap-3 font-ui text-[12px] text-muted-foreground">
              <span>
                Free. <span className="hidden sm:inline">One email a day. </span>Unsubscribe in one click.
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <button type="button" onClick={() => close('subscribed')} className="rounded-sm py-1 underline underline-offset-2 hover:text-foreground">
                  I subscribe
                </button>
                {requested && (
                  <button type="button" onClick={() => close(closeKind)} className="rounded-sm py-1 underline underline-offset-2 hover:text-foreground">
                    No thanks
                  </button>
                )}
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
