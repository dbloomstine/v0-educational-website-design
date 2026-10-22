'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowRight, CheckCircle2, Loader2, X } from 'lucide-react'
import { Logo } from '@/components/logo'
import { captureSignupSource } from '@/lib/newsletter/signup-source'
import { INTERESTS, ROLES, eventSignupTags, interestWords } from '@/lib/newsletter/interests'
import { eventsOfferHeadline } from '@/lib/events/offer'
import { isMarkedSubscribed, markSubscribed } from '@/lib/newsletter/subscribed-flag'
import { useSubscribe } from '@/lib/newsletter/use-subscribe'
import { arrivedAsSubscriber, arrivedFromPost } from '@/lib/newsletter/prompt-rules'
import {
  TAKEOVER_DISMISSED_KEY,
  TAKEOVER_ON,
  TAKEOVER_SHOWN_KEY,
  TAKEOVER_VIEWS_KEY,
  isBot,
  isSearchArrival,
  parseDismissedAt,
  shouldShowTakeover,
} from '@/lib/newsletter/takeover-rules'
import { firstEditionSentence } from '@/lib/newsletter/first-edition'
import { FOLLOW } from '@/lib/brand/social'
import { ChoiceChips } from './ChoiceChips'
import { openSignupCard, readEventsContext } from './SubscribePrompt'
import type { TakeoverStory } from '@/app/api/newsletter/top-stories/route'

/**
 * The welcome screen (2026-10-22). Danny: "make this more aggressive to force
 * people to put their email in... we're getting organic traffic... but not
 * capturing visitors", showing Substack's full-page welcome: "ugly as shit,
 * but the outcome is the outcome we're looking for."
 *
 * So the first page of a visit is covered, wholly, by a page of our own: the
 * wordmark on the navy strip, a headline, the reader figure, this morning's
 * top three stories as proof, the optional tick-boxes, one email field and the
 * gold button. Below it, plainly, the way past: "No thanks, show me the page".
 * The X and Esc count as the same no. When it comes, and when it stays away,
 * is lib/newsletter/takeover-rules.ts.
 *
 * Nothing is rendered on the server, so crawlers and readers without
 * JavaScript get the page. Signups are stored with the form `takeover` and the
 * page it covered. After a signup with nothing ticked, the signup box opens at
 * its tick-boxes, as it does after every other form.
 *
 * NEXT_PUBLIC_SIGNUP_TAKEOVER=off: this renders nothing and the signup box's
 * own arrival and reading-clock asks come back.
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
    // storage blocked: the in-memory flags below hold for this page load
  }
}

/** For a browser that refuses storage: once per page load, and the page-view count kept in memory. */
let shownInMemory = false
let viewsInMemory = 0

function readerFirms(): Promise<number | null> {
  return fetch('/api/newsletter/readers')
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => (typeof d?.firms === 'number' ? d.firms : null))
    .catch(() => null)
}
function topStories(): Promise<TakeoverStory[]> {
  return fetch('/api/newsletter/top-stories')
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => (Array.isArray(d?.stories) ? (d.stories as TakeoverStory[]) : []))
    .catch(() => [])
}

/** How long it waits for the figure and the stories before it shows without them. */
const DATA_WAIT_MS = 700

export function SignupTakeover() {
  const pathname = usePathname() ?? '/'
  const [open, setOpen] = useState(false)
  const [firms, setFirms] = useState<number | null>(null)
  const [stories, setStories] = useState<TakeoverStory[]>([])
  const [cameFrom, setCameFrom] = useState<ReturnType<typeof arrivedFromPost>>(null)
  const [eventsCtx, setEventsCtx] = useState<{ city: string | null; monday: boolean } | null>(null)
  const [appearedAt, setAppearedAt] = useState<string | null>(null)
  const [followed, setFollowed] = useState<string[]>([])
  const [role, setRole] = useState<string[]>([])
  const sub = useSubscribe('takeover', () => ({
    interests: [...followed, ...(eventsCtx ? eventSignupTags(eventsCtx.city) : [])],
    role: role[0],
    ...(appearedAt ? { page: appearedAt } : {}),
  }))
  const rootRef = useRef<HTMLDivElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const viewCounted = useRef<string | null>(null)

  // Each page view: counted, then the rules asked.
  useEffect(() => {
    if (!TAKEOVER_ON || open) return
    if (viewCounted.current === pathname) return
    viewCounted.current = pathname
    const stored = Number(read('session', TAKEOVER_VIEWS_KEY) ?? 0)
    const views = Math.max(stored, viewsInMemory) + 1
    viewsInMemory = views
    write('session', TAKEOVER_VIEWS_KEY, String(views))

    const source = captureSignupSource()
    if (arrivedAsSubscriber(source)) markSubscribed()
    const show = shouldShowTakeover({
      pathname,
      pageViews: views,
      subscribed: isMarkedSubscribed(),
      dismissedAt: parseDismissedAt(read('local', TAKEOVER_DISMISSED_KEY)),
      now: Date.now(),
      shownThisSession: shownInMemory || Boolean(read('session', TAKEOVER_SHOWN_KEY)),
      searchArrival: isSearchArrival(source),
      viewportWidth: window.innerWidth,
      bot: isBot(navigator.userAgent, navigator.webdriver === true),
      askedAlready: window.location.hash === '#subscribe' || new URLSearchParams(window.location.search).has('e'),
    })
    if (!show) return

    shownInMemory = true
    write('session', TAKEOVER_SHOWN_KEY, '1')
    setCameFrom(arrivedFromPost(source))
    setEventsCtx(readEventsContext(pathname))
    setAppearedAt(pathname)
    let cancelled = false
    // The figure and the stories fill in whenever they arrive; the screen waits a moment for them, no longer.
    const data = Promise.all([readerFirms().then(setFirms), topStories().then(setStories)])
    const wait = new Promise((r) => window.setTimeout(r, DATA_WAIT_MS))
    Promise.race([data, wait]).then(() => !cancelled && setOpen(true))
    return () => {
      cancelled = true
      // A navigation before it opened: it was counted as shown; open it anyway, on whatever page is there now.
      setOpen(true)
    }
  }, [pathname, open])

  const finished = sub.status === 'success' || sub.status === 'already'

  // A signup: with nothing ticked, the signup box takes over and asks (it opens at its tick-boxes); with boxes
  // ticked here, they went with the signup, and this screen says thank you itself.
  useEffect(() => {
    if (!finished) return
    if (followed.length || role.length) {
      if (sub.status === 'already' && sub.preferencesTicket) {
        fetch('/api/newsletter/preferences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket: sub.preferencesTicket, interests: followed, role: role[0] }) }).catch(() => {})
      }
      return
    }
    if (sub.status === 'success' && sub.preferencesToken) {
      setOpen(false)
      openSignupCard({ token: sub.preferencesToken })
    } else if (sub.status === 'already' && sub.preferencesTicket) {
      setOpen(false)
      openSignupCard({ ticket: sub.preferencesTicket, already: true })
    }
    // Once, when the signup comes back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])

  // A modal page: the site behind is held still and out of reach (inert), the cursor goes to the email field,
  // and both come back as they were when it closes.
  useEffect(() => {
    if (!open) return
    const before = document.activeElement as HTMLElement | null
    const root = document.documentElement
    const overflow = root.style.overflow
    root.style.overflow = 'hidden'
    const others = [...document.body.children].filter((el) => el !== rootRef.current && !/^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(el.tagName) && !el.hasAttribute('inert')) as HTMLElement[]
    for (const el of others) el.setAttribute('inert', '')
    emailRef.current?.focus({ preventScroll: true })
    return () => {
      root.style.overflow = overflow
      for (const el of others) el.removeAttribute('inert')
      before?.focus?.({ preventScroll: true })
    }
  }, [open])

  function dismiss() {
    if (!finished) write('local', TAKEOVER_DISMISSED_KEY, String(Date.now()))
    setOpen(false)
  }
  function alreadyGetIt() {
    markSubscribed()
    setOpen(false)
  }

  // Esc is No thanks; Tab stays inside.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        return dismiss()
      }
      if (e.key !== 'Tab' || !rootRef.current) return
      const stops = [...rootRef.current.querySelectorAll<HTMLElement>('button, input, a[href]')].filter(
        (el) => !el.hasAttribute('disabled') && el.getClientRects().length > 0,
      )
      if (stops.length === 0) return
      const first = stops[0]
      const last = stops[stops.length - 1]
      const at = document.activeElement
      if (e.shiftKey && at === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && at === last) {
        e.preventDefault()
        first.focus()
      } else if (!rootRef.current.contains(at)) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, finished])

  if (!TAKEOVER_ON || !open) return null

  const firmsLine = firms && firms >= 25 ? `${Math.floor(firms / 10) * 10}+ firms` : null
  const followedWords = interestWords(followed)
  const date = new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric' })

  const headline = eventsCtx ? (
    <>
      {eventsOfferHeadline(eventsCtx.city, { monday: eventsCtx.monday })} <em className="italic" style={{ color: 'var(--display-accent)' }}>Free.</em>
    </>
  ) : cameFrom ? (
    <>
      You found {cameFrom.story ? 'this' : 'us'} on {cameFrom.network}.{' '}
      <em className="italic" style={{ color: 'var(--display-accent)' }}>Get the whole day in one morning email.</em>
    </>
  ) : (
    <>
      Every fund close, deal and hire, <em className="italic" style={{ color: 'var(--display-accent)' }}>in one morning email.</em>
    </>
  )

  const storyList = stories.length > 0 && (
    <section aria-labelledby="takeover-stories" className="border border-foreground/15 bg-card">
      <div className="flex items-baseline justify-between gap-3 border-b border-foreground/15 px-4 py-2">
        <h3 id="takeover-stories" className="font-ui text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
          This morning’s top stories
        </h3>
        <span className="shrink-0 font-ui text-[11px] text-muted-foreground">{date}</span>
      </div>
      <ol className="px-4">
        {stories.map((s) => (
          <li key={s.id} className="border-b border-border py-2.5 last:border-b-0">
            {s.kicker && <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">{s.kicker}</p>}
            <p className="mt-0.5 font-news text-[16px] leading-[1.28] text-foreground">
              {s.segments.map((seg, i) => (seg.bold ? <strong key={i} className="font-bold">{seg.text}</strong> : <span key={i}>{seg.text}</span>))}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="takeover-title"
      aria-describedby="takeover-desc"
      className="paper fixed inset-0 z-[90] overflow-y-auto overscroll-contain bg-background text-foreground"
    >
      <div className="sticky top-0 z-10 bg-[var(--ink)] text-[var(--ink-foreground)]">
        <div className="mx-auto flex h-12 max-w-[1120px] items-center justify-between gap-3 px-4 lg:px-6">
          <Logo height={20} className="text-[var(--ink-foreground)]" />
          <button
            type="button"
            onClick={dismiss}
            aria-label="No thanks, close and show me the page"
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-sm opacity-85 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--tab)]"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="takeover-body mx-auto grid max-w-[1120px] gap-x-14 gap-y-7 px-4 pb-12 pt-5 sm:pt-12 lg:min-h-[calc(100dvh-3rem)] lg:grid-cols-[minmax(0,1fr)_400px] lg:content-center lg:px-6 lg:py-12">
        <div className="min-w-0 max-w-[640px]">
          <p className="font-ui text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
            FundOps Daily{' '}
            <span className="ml-1.5 font-semibold tracking-[0.08em] text-amber-700">
              Free<span className="hidden sm:inline">, every morning</span> by 7:30am ET
            </span>
          </p>

          {finished ? (
            <div className="mt-3">
              <h2 id="takeover-title" className="flex items-start gap-2.5 font-news text-[30px] font-medium leading-[1.08] tracking-[-0.018em] sm:text-[44px]">
                <CheckCircle2 className="mt-[0.18em] h-[0.8em] w-[0.8em] shrink-0 text-emerald-700" aria-hidden />
                {sub.status === 'already' ? 'You’re already on the list.' : 'You’re in.'}
              </h2>
              <p id="takeover-desc" role="status" className="mt-3 font-news text-[18px] leading-snug text-foreground/80">
                {sub.status === 'already'
                  ? 'This address already gets FundOps Daily, so nothing changes there.'
                  : `${firstEditionSentence()}${followedWords ? ` Stories on ${followedWords} will be grouped for you.` : ''}`}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-6 inline-flex h-12 items-center gap-1.5 rounded-sm px-5 font-ui text-[13px] font-extrabold uppercase tracking-[0.07em]"
                style={{ background: 'var(--tab)', color: 'var(--ink)' }}
              >
                Go to the news <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </button>
              <p className="mt-6 border-t border-border pt-3 font-ui text-[13px] leading-snug text-foreground/70">
                Through the day, follow{' '}
                {FOLLOW.map((x, i) => (
                  <span key={x.href}>
                    {i === 0 ? '' : i === FOLLOW.length - 1 ? ' and ' : ', '}
                    <a href={x.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground underline decoration-foreground/30 underline-offset-2">
                      {x.label}
                    </a>
                  </span>
                ))}
                .
              </p>
            </div>
          ) : (
            <form onSubmit={sub.submit} className="mt-3">
              <h2 id="takeover-title" className="font-news text-[29px] font-medium leading-[1.07] tracking-[-0.018em] sm:text-[46px] lg:text-[52px]">
                {headline}
              </h2>
              <p id="takeover-desc" className="mt-3 font-news text-[17px] leading-snug text-foreground/80 sm:text-[19px]">
                {firmsLine ? (
                  <>
                    Read each morning at <strong className="font-bold text-foreground">{firmsLine}</strong>: GPs, LPs and fund service providers.
                  </>
                ) : (
                  'Read each morning by GPs, LPs and fund service providers.'
                )}
              </p>

              {/* On a desk the tick-boxes come first, as in the signup box; on a phone they wait under the field. */}
              <div className="mt-6 hidden space-y-4 sm:block">
                <ChoiceChips legend="I follow (optional)" options={INTERESTS} selected={followed} onChange={setFollowed} />
                <ChoiceChips legend="I’m at a" options={ROLES} selected={role} onChange={setRole} single inline />
              </div>

              <label htmlFor="takeover-email" className="sr-only">
                Email address
              </label>
              <div className="mt-5 flex items-stretch gap-2 sm:mt-6">
                <input
                  id="takeover-email"
                  ref={emailRef}
                  type="email"
                  value={sub.email}
                  onChange={(e) => sub.setEmail(e.target.value)}
                  placeholder="name@firm.com"
                  required
                  autoComplete="email"
                  inputMode="email"
                  aria-invalid={sub.status === 'error' || undefined}
                  aria-describedby={sub.status === 'error' ? 'takeover-error' : undefined}
                  className="h-[52px] min-w-0 flex-1 rounded-sm border-2 border-foreground/45 bg-card px-3 font-ui text-[16px] text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sub.status === 'loading'}
                  className="group inline-flex h-[52px] shrink-0 items-center justify-center gap-1.5 rounded-sm px-4 font-ui text-[13px] font-extrabold uppercase tracking-[0.07em] transition-[filter] hover:brightness-95 disabled:opacity-50 sm:px-6"
                  style={{ background: 'var(--tab)', color: 'var(--ink)' }}
                >
                  {sub.status === 'loading' ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-label="Subscribing" role="img" />
                  ) : (
                    <>
                      Get it free <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </>
                  )}
                </button>
              </div>
              {sub.status === 'error' && (
                <p id="takeover-error" className="mt-1.5 font-ui text-[13px] text-red-800" role="alert">
                  {sub.errorMsg}
                </p>
              )}
              <p className="mt-2 font-ui text-[12.5px] text-muted-foreground">Free. One email a day. Unsubscribe in one click.</p>

              <div className="mt-5 space-y-3 sm:hidden">
                <ChoiceChips legend="I follow (optional)" options={INTERESTS} selected={followed} onChange={setFollowed} compact />
                <ChoiceChips legend="I’m at a" options={ROLES} selected={role} onChange={setRole} single compact inline />
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-border pt-3 font-ui text-[13.5px]">
                <button type="button" onClick={dismiss} className="inline-flex min-h-[44px] items-center rounded-sm text-foreground/80 underline underline-offset-[3px] hover:text-foreground">
                  No thanks, show me the page →
                </button>
                <button type="button" onClick={alreadyGetIt} className="inline-flex min-h-[44px] items-center rounded-sm text-muted-foreground underline underline-offset-2 hover:text-foreground">
                  I already get it
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="min-w-0 max-w-[640px] lg:pt-1">{storyList}</div>
      </div>
    </div>
  )
}
