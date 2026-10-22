/**
 * The welcome screen (2026-10-22): when the full-page signup screen covers the
 * site on arrival. Danny, after a week of organic traffic and few signups:
 * "make this more aggressive to force people to put their email in", pointing
 * at Substack's full-page welcome ("ugly as shit, but the outcome is the
 * outcome we're looking for").
 *
 * The rules, all of which must hold:
 *   - a public reading page (`isReadingPage`), and never a page where the
 *     reader is already doing something with us: /join, /submit*, /sponsor*,
 *     /preferences, /unsubscribe, /privacy, /terms, any confirm page
 *   - a person: not a crawler or an automated browser (the server renders
 *     nothing, so a crawler sees the page whatever this says)
 *   - not known to subscribe (a signup on any form, "I already get it", or a
 *     click from their own copy of the email)
 *   - not dismissed in the last three days (No thanks, the X or Esc)
 *   - not already shown in this browser session
 *   - the session's first page view; except that a visitor who landed from a
 *     search engine on a phone-width screen gets it on their second page view,
 *     not the page they searched for (Google's intrusive-interstitial
 *     guideline demotes phone pages that cover the content on arrival from
 *     search). On a desk a search arrival gets it at once.
 *
 * Kill switch: NEXT_PUBLIC_SIGNUP_TAKEOVER=off (read at build, so it takes a
 * redeploy) brings back the signup box and its reading clock as they were.
 *
 * Pure functions; components/newsletter/SignupTakeover.tsx owns the storage.
 */
import { isReadingPage, PHONE_MAX_WIDTH } from './prompt-rules'
import type { SignupSource } from './signup-source'

/** True unless the env says `off` (any case, spaces ignored). */
export function takeoverEnabled(raw: string | undefined): boolean {
  return (raw ?? '').trim().toLowerCase() !== 'off'
}

/** The switch as this build has it. Next inlines NEXT_PUBLIC_ values into the browser bundle. */
export const TAKEOVER_ON = takeoverEnabled(process.env.NEXT_PUBLIC_SIGNUP_TAKEOVER)

const DAY_MS = 24 * 60 * 60 * 1000
/** After No thanks: this long before it covers the page again. */
export const TAKEOVER_QUIET_DAYS = 3

/** localStorage: when it was last dismissed (ms since epoch). */
export const TAKEOVER_DISMISSED_KEY = 'fops_takeover_dismissed'
/** sessionStorage: it has been shown in this session. */
export const TAKEOVER_SHOWN_KEY = 'fops_takeover_shown'
/** sessionStorage: page views in this session, counted by the takeover. */
export const TAKEOVER_VIEWS_KEY = 'fops_takeover_views'

/** Pages where it never appears, even where they sit inside a reading section. */
const EXCLUDED = [
  /^\/join(\/|$)/,
  /^\/submit/,
  /^\/events\/submit/,
  /^\/sponsor/,
  /^\/preferences(\/|$)/,
  /^\/unsubscribe(\/|$)/,
  /^\/newsletter\/(unsubscribe|confirm)/,
  /^\/privacy(\/|$)/,
  /^\/terms(\/|$)/,
  /\/confirm(ed)?(\/|$)/,
]

export function isTakeoverPage(pathname: string): boolean {
  return isReadingPage(pathname) && !EXCLUDED.some((p) => p.test(pathname))
}

/** The search engines, by the label lib/newsletter/signup-source.ts gives a referrer (or a utm_source of the same name). */
const SEARCH_LABELS = new Set(['google', 'bing', 'duckduckgo', 'yahoo', 'ecosia', 'yandex', 'baidu', 'brave', 'startpage', 'qwant', 'ask', 'aol'])
/** Hosts the label function leaves as a bare host: search.yahoo.com, yandex.ru, search.brave.com... */
const SEARCH_HOST = /(^|\.)(yahoo|ecosia|yandex|baidu|startpage|qwant|ask|aol)\.[a-z.]+$|^search\.brave\.com$/

/** The visitor's first touch this session was a search engine. */
export function isSearchArrival(source: SignupSource): boolean {
  const s = source.source ?? ''
  if (!s || source.medium === 'email') return false
  return SEARCH_LABELS.has(s) || SEARCH_HOST.test(s)
}

export function isPhoneWidth(width: number): boolean {
  return width < PHONE_MAX_WIDTH
}

/** Crawlers, previews and automated browsers: never shown the screen. */
const BOT_UA = /bot\b|bot\/|crawl|spider|slurp|mediapartners|lighthouse|pagespeed|headlesschrome|phantomjs|facebookexternalhit|embedly|quora link preview|whatsapp|telegrambot|preview/i

export function isBot(userAgent: string, webdriver = false): boolean {
  return webdriver || BOT_UA.test(userAgent)
}

export function isTakeoverQuiet(dismissedAt: number | null, now: number): boolean {
  return dismissedAt != null && now - dismissedAt < TAKEOVER_QUIET_DAYS * DAY_MS
}

/** A stored timestamp, or null for anything else. */
export function parseDismissedAt(raw: string | null): number | null {
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

export interface TakeoverState {
  pathname: string
  /** Page views in this session, this one included (1 on landing). */
  pageViews: number
  subscribed: boolean
  dismissedAt: number | null
  now: number
  shownThisSession: boolean
  searchArrival: boolean
  viewportWidth: number
  bot: boolean
  /** The page is already asking (an outreach link's ?e= or a #subscribe link opens the signup box). */
  askedAlready?: boolean
}

/** Which page view of the session it waits for. */
export function takeoverPageView(s: Pick<TakeoverState, 'searchArrival' | 'viewportWidth'>): number {
  return s.searchArrival && isPhoneWidth(s.viewportWidth) ? 2 : 1
}

export function shouldShowTakeover(s: TakeoverState): boolean {
  if (s.bot || s.subscribed || s.shownThisSession || s.askedAlready) return false
  if (!isTakeoverPage(s.pathname)) return false
  if (isTakeoverQuiet(s.dismissedAt, s.now)) return false
  // The first page view (or the second, for a phone that came from search); a later one when that page was one
  // it never shows on (a reader who landed on /sponsor gets it on the next reading page).
  return s.pageViews >= takeoverPageView(s)
}
