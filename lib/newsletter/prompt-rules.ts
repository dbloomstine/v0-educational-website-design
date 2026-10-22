/**
 * When the signup card may appear (2026-10-08; made earlier and easier to
 * reach on 2026-10-09; shown on arrival to a first visit since 2026-10-22).
 *
 * 2026-10-22, the first-visit ask (Substack style): event pages bring more
 * search visitors than the front page and almost none signed up. So a browser
 * that has never seen the box gets it on arrival (`shouldShowOnArrival`): in
 * the middle of the screen on a desk, as today; on a phone a bottom panel of
 * at most a third of the screen, never a cover (`promptLayout`: search
 * engines demote phone pages that cover their content on arrival, and event
 * traffic is search traffic). Skipped, it stays away 30 days; after that the
 * reading rules below may offer it once more; skipped twice, it never comes
 * back by itself. A Subscribe button still opens it whenever asked.
 *
 * The reading rules (every visit after the first; `shouldShowPrompt`). Danny asked for a "polite gentle" ask after a visitor has "been on the site
 * for a little bit", then, having seen it: "a little bit more obvious... show
 * up sooner... I don't want to be obnoxious... not too subtle that it gets
 * breezed over". So it comes sooner, and it also catches a reader on the way
 * out. All of these must hold:
 *
 *   - a public reading page (never Lead Desk, admin, the sample email, legal pages)
 *   - one of: a quarter of a minute's reading and a scroll; 25 seconds'
 *     reading without one (a short story page has nothing to scroll); a few
 *     seconds into a second page; or the pointer leaving through the top of
 *     the window after a few seconds (desktop: the reader is about to go);
 *     or, for a reader who came over from one of our LinkedIn or TikTok
 *     posts, eight seconds (2026-10-11: they followed a link to be here)
 *   - they are not known to subscribe already, and are not typing
 *   - it has not been shown this visit, and was not closed recently
 *
 * A reader who presses a Subscribe button gets the card at once, whatever the
 * rules above say: they asked (see `OPEN_SIGNUP_EVENT`).
 *
 * Since 2026-10-09 (Danny: "in the middle of the screen... a tint out...
 * like how Substack does it, maybe not as takeover") it is a box in the
 * middle of the screen over a tinted page. It closes on the X, "No thanks",
 * Esc or a click outside it. (Until 2026-10-22 it never appeared on arrival; see above.)
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
/** A reader who followed one of our own posts here came for this story: asked this soon, scroll or none. */
export const POST_SECONDS = 8
/** Leaving after less than this is a bounce, not a reader. */
export const EXIT_SECONDS = 5
/** How far down a page counts as reading it. */
export const SCROLL_PX = 300
/** A phone on its side has no room for the card. */
export const MIN_VIEWPORT_HEIGHT = 460

const DAY_MS = 24 * 60 * 60 * 1000
/** Closed once: thirty days' quiet, then it may be offered once more. Closed twice: it never comes back by itself. */
export const QUIET_DAYS_FIRST = 30
/** How many skips end the asking. */
export const MAX_SKIPS = 2
/** Below this width the box is a bottom panel, not a box over the page (Tailwind's `md`). */
export const PHONE_MAX_WIDTH = 768
/** A first visit gets the box this soon: after the page has painted, so the reader sees what they came for behind it. */
export const ARRIVAL_DELAY_MS = 900

/** Dispatched on `window` by any Subscribe button that wants the card opened now. */
export const OPEN_SIGNUP_EVENT = 'fops:open-signup'

export const SUBSCRIBED_KEY = 'fops_subscribed'
export const DISMISSED_KEY = 'fops_prompt_dismissed'
export const SHOWN_KEY = 'fops_prompt_shown'
export const SECONDS_KEY = 'fops_prompt_secs'
export const VIEWS_KEY = 'fops_prompt_views'
/** localStorage: when this browser first saw the box (by itself or asked for). Set, it is no longer a first visit. */
export const SEEN_KEY = 'fops_prompt_seen'

// The glossary (2026-10-12) is a reading page: a reader who looked up a term came from a search and is new here.
const READING_PATHS = [/^\/$/, /^\/news(\/|$)/, /^\/story\//, /^\/firm\//, /^\/firms$/, /^\/league-tables$/, /^\/events(\/|$)/, /^\/archive(\/|$)/, /^\/about$/, /^\/glossary(\/|$)/]
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
  if (dismissal.times >= MAX_SKIPS) return true
  return now - dismissal.at < QUIET_DAYS_FIRST * DAY_MS
}

export interface ArrivalState {
  pathname: string
  subscribed: boolean
  /** The box has been seen on this browser before (`SEEN_KEY`). */
  seenBefore: boolean
  shownThisVisit: boolean
  dismissal: Dismissal | null
  typing: boolean
  viewportHeight: number
}

/** A first visit: never seen the box, never said no, not a subscriber. */
export function isFirstVisit(s: Pick<ArrivalState, 'subscribed' | 'seenBefore' | 'dismissal'>): boolean {
  return !s.subscribed && !s.seenBefore && !s.dismissal
}

/** The box on arrival: a first visit to a reading page, with room to show it and nobody typing. */
export function shouldShowOnArrival(s: ArrivalState): boolean {
  if (!isReadingPage(s.pathname)) return false
  if (!isFirstVisit(s) || s.shownThisVisit || s.typing) return false
  return s.viewportHeight >= MIN_VIEWPORT_HEIGHT
}

/**
 * How the box is laid out. A phone gets a bottom panel when the box came by itself: it never covers the page
 * on arrival. A reader who pressed Subscribe asked for it and gets the box in the middle, on any screen.
 */
export function promptLayout(viewportWidth: number, requested: boolean): 'sheet' | 'dialog' {
  return !requested && viewportWidth < PHONE_MAX_WIDTH ? 'sheet' : 'dialog'
}

/** The form name a signup through the box is stored with: the first-visit ask is counted apart from the others. */
export function promptForm(firstVisit: boolean): 'firstvisit' | 'popup' {
  return firstVisit ? 'firstvisit' : 'popup'
}

/**
 * A visitor who arrived from a link in their own copy of the email already
 * subscribes. A forwarded copy (`campaign: forward`) is somebody new.
 */
export function arrivedAsSubscriber(source: SignupSource): boolean {
  return source.source === 'newsletter' && source.medium === 'email' && source.campaign !== 'forward'
}

/** The networks our posts go out on, as the box names them. */
const POST_NETWORKS: Record<string, string> = { linkedin: 'LinkedIn', tiktok: 'TikTok' }

/**
 * The network a reader came over from, when it is one we post on (2026-10-11): the box then says so
 * and comes a little sooner. Null for every other arrival, and for anything not a plain own-key match.
 */
export function arrivedFromPost(source: SignupSource): { network: string; story: boolean } | null {
  const network = Object.hasOwn(POST_NETWORKS, source.source ?? '') ? POST_NETWORKS[source.source as string] : undefined
  if (!network) return null
  return { network, story: (source.path ?? '').startsWith('/story/') }
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
  /** They came over from one of our posts (`arrivedFromPost`). */
  fromPost?: boolean
}

export function shouldShowPrompt(s: PromptState): boolean {
  if (!isReadingPage(s.pathname)) return false
  if (s.subscribed || s.shownThisVisit || s.typing) return false
  if (isQuiet(s.dismissal, s.now)) return false
  if (s.viewportHeight < MIN_VIEWPORT_HEIGHT) return false
  if (s.leaving) return s.engagedSeconds >= EXIT_SECONDS
  if (s.pageViews >= 2) return s.engagedSeconds >= SECOND_PAGE_SECONDS && s.secondsOnPage >= SETTLE_SECONDS
  if (s.fromPost && s.engagedSeconds >= POST_SECONDS) return true
  if (s.engagedSeconds >= ENGAGED_SECONDS_NO_SCROLL) return true
  return s.engagedSeconds >= ENGAGED_SECONDS && s.scrolledPx >= SCROLL_PX
}
