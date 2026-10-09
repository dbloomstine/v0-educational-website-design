/**
 * When the signup card may appear (2026-10-08).
 *
 * Danny asked for a "polite gentle" ask after a visitor has "been on the site
 * for a little bit". The rules, all of which must hold:
 *
 *   - a public reading page (never Lead Desk, admin, the sample email, legal pages)
 *   - the visitor has spent real time reading and has either scrolled or
 *     opened a second page
 *   - they are not known to subscribe already, and are not typing
 *   - it has not been shown this visit, and was not closed recently
 *
 * It is a card in the corner, not a screen-covering box: the page stays
 * readable and usable behind it, and it closes on the X, "No thanks" or Esc.
 *
 * Pure functions here; the component (components/newsletter/SubscribePrompt.tsx)
 * owns the timers and the storage.
 */
import type { SignupSource } from './signup-source'

/** Seconds of the page actually being on screen, added up across the visit. */
export const ENGAGED_SECONDS = 35
/** How far down a page counts as reading it. */
export const SCROLL_PX = 500
/** A phone on its side has no room for the card. */
export const MIN_VIEWPORT_HEIGHT = 520

const DAY_MS = 24 * 60 * 60 * 1000
/** Closed once: a month's quiet. Closed twice: half a year. */
export const QUIET_DAYS_FIRST = 30
export const QUIET_DAYS_REPEAT = 180

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
  pageViews: number
  scrolledPx: number
  typing: boolean
  viewportHeight: number
}

export function shouldShowPrompt(s: PromptState): boolean {
  if (!isReadingPage(s.pathname)) return false
  if (s.subscribed || s.shownThisVisit || s.typing) return false
  if (isQuiet(s.dismissal, s.now)) return false
  if (s.viewportHeight < MIN_VIEWPORT_HEIGHT) return false
  if (s.engagedSeconds < ENGAGED_SECONDS) return false
  return s.pageViews >= 2 || s.scrolledPx >= SCROLL_PX
}
