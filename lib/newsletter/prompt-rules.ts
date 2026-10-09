/**
 * When the signup card may appear (2026-10-08; made earlier and easier to
 * reach on 2026-10-09).
 *
 * Danny asked for a "polite gentle" ask after a visitor has "been on the site
 * for a little bit", then, having seen it: "a little bit more obvious... show
 * up sooner... I don't want to be obnoxious... not too subtle that it gets
 * breezed over". So it comes sooner, and it also catches a reader on the way
 * out. All of these must hold:
 *
 *   - a public reading page (never Lead Desk, admin, the sample email, legal pages)
 *   - one of: a quarter of a minute's reading and a scroll; 25 seconds'
 *     reading without one (a short story page has nothing to scroll); a few
 *     seconds into a second page; or the pointer leaving through the top of
 *     the window after a few seconds (desktop: the reader is about to go)
 *   - they are not known to subscribe already, and are not typing
 *   - it has not been shown this visit, and was not closed recently
 *
 * A reader who presses a Subscribe button gets the card at once, whatever the
 * rules above say: they asked (see `OPEN_SIGNUP_EVENT`).
 *
 * It is a card in the corner, not a screen-covering box: the page stays
 * readable and usable behind it, and it closes on the X, "No thanks" or Esc.
 *
 * Pure functions here; the component (components/newsletter/SubscribePrompt.tsx)
 * owns the timers and the storage.
 */
import type { SignupSource } from './signup-source'

/** Seconds of the page actually being on screen, added up across the visit: with a scroll... */
export const ENGAGED_SECONDS = 15
/** ...or without one. */
export const ENGAGED_SECONDS_NO_SCROLL = 25
/** On a second page the visitor has already shown interest: this long in all... */
export const SECOND_PAGE_SECONDS = 6
/** ...and long enough on the new page to have started reading it. */
export const SETTLE_SECONDS = 3
/** Leaving after less than this is a bounce, not a reader. */
export const EXIT_SECONDS = 5
/** How far down a page counts as reading it. */
export const SCROLL_PX = 300
/** A phone on its side has no room for the card. */
export const MIN_VIEWPORT_HEIGHT = 460

const DAY_MS = 24 * 60 * 60 * 1000
/** Closed once: a fortnight's quiet. Closed twice: three months. */
export const QUIET_DAYS_FIRST = 14
export const QUIET_DAYS_REPEAT = 90

/** Dispatched on `window` by any Subscribe button that wants the card opened now. */
export const OPEN_SIGNUP_EVENT = 'fops:open-signup'

export const SUBSCRIBED_KEY = 'fops_subscribed'
export const DISMISSED_KEY = 'fops_prompt_dismissed'
export const SHOWN_KEY = 'fops_prompt_shown'
export const SECONDS_KEY = 'fops_prompt_secs'
export const VIEWS_KEY = 'fops_prompt_views'

const READING_PATHS = [/^\/$/, /^\/news(\/|$)/, /^\/story\//, /^\/firm\//, /^\/firms$/, /^\/league-tables$/, /^\/events(\/|$)/, /^\/archive(\/|$)/, /^\/about$/]
/** Pages inside those sections where an ask would be in the way. */
const NEVER = [/^\/events\/submit/]

export function isReadingPage(pathname: string): boolean {
  return READING_PATHS.some((p) => p.test(pathname)) && !NEVER.some((p) => p.test(pathname))
}

export interface Dismissal {
  at: number
  times: number
}

export function parseDismissal(raw: string | null): Dismissal | null {
  if (!raw) return null
  try {
    const d = JSON.parse(raw) as Partial<Dismissal>
    if (typeof d.at === 'number' && typeof d.times === 'number') return { at: d.at, times: d.times }
  } catch {
    // not ours
  }
  return null
}

export function nextDismissal(previous: Dismissal | null, now: number): Dismissal {
  return { at: now, times: (previous?.times ?? 0) + 1 }
}

export function isQuiet(dismissal: Dismissal | null, now: number): boolean {
  if (!dismissal) return false
  const days = dismissal.times >= 2 ? QUIET_DAYS_REPEAT : QUIET_DAYS_FIRST
  return now - dismissal.at < days * DAY_MS
}

/**
 * A visitor who arrived from a link in their own copy of the email already
 * subscribes. A forwarded copy (`campaign: forward`) is somebody new.
 */
export function arrivedAsSubscriber(source: SignupSource): boolean {
  return source.source === 'newsletter' && source.medium === 'email' && source.campaign !== 'forward'
}

export interface PromptState {
  pathname: string
  subscribed: boolean
  shownThisVisit: boolean
  dismissal: Dismissal | null
  now: number
  engagedSeconds: number
  /** Seconds on screen on this page alone. */
  secondsOnPage: number
  pageViews: number
  scrolledPx: number
  typing: boolean
  viewportHeight: number
  /** The pointer has just left through the top of the window. */
  leaving?: boolean
}

export function shouldShowPrompt(s: PromptState): boolean {
  if (!isReadingPage(s.pathname)) return false
  if (s.subscribed || s.shownThisVisit || s.typing) return false
  if (isQuiet(s.dismissal, s.now)) return false
  if (s.viewportHeight < MIN_VIEWPORT_HEIGHT) return false
  if (s.leaving) return s.engagedSeconds >= EXIT_SECONDS
  if (s.pageViews >= 2) return s.engagedSeconds >= SECOND_PAGE_SECONDS && s.secondsOnPage >= SETTLE_SECONDS
  if (s.engagedSeconds >= ENGAGED_SECONDS_NO_SCROLL) return true
  return s.engagedSeconds >= ENGAGED_SECONDS && s.scrolledPx >= SCROLL_PX
}
