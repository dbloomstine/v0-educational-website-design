import { describe, it, expect } from 'vitest'
import {
  TAKEOVER_QUIET_DAYS,
  isBot,
  isSearchArrival,
  isTakeoverPage,
  isTakeoverQuiet,
  parseDismissedAt,
  shouldShowTakeover,
  takeoverEnabled,
  takeoverPageView,
  type TakeoverState,
} from '../takeover-rules'
import { computeSignupSource } from '../signup-source'
import { sanitizeSignupForm } from '../interests'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2026, 9, 22, 14)
const fresh: TakeoverState = {
  pathname: '/',
  pageViews: 1,
  subscribed: false,
  dismissedAt: null,
  now: NOW,
  shownThisSession: false,
  searchArrival: false,
  viewportWidth: 1280,
  bot: false,
}
const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

describe('the welcome screen: the session', () => {
  it('covers the first page view of a new session', () => {
    expect(shouldShowTakeover(fresh)).toBe(true)
    expect(shouldShowTakeover({ ...fresh, pathname: '/story/abc-123' })).toBe(true)
    expect(shouldShowTakeover({ ...fresh, pathname: '/events/superreturn-boston' })).toBe(true)
  })
  it('once a session', () => {
    expect(shouldShowTakeover({ ...fresh, shownThisSession: true })).toBe(false)
    expect(shouldShowTakeover({ ...fresh, shownThisSession: true, pageViews: 2 })).toBe(false)
  })
  it('never to a subscriber or a bot', () => {
    expect(shouldShowTakeover({ ...fresh, subscribed: true })).toBe(false)
    expect(shouldShowTakeover({ ...fresh, bot: true })).toBe(false)
  })
  it('not when the page is already asking (an outreach ?e= link or #subscribe)', () => {
    expect(shouldShowTakeover({ ...fresh, askedAlready: true })).toBe(false)
  })
  it('a landing on a page it never covers moves it to the next reading page', () => {
    expect(shouldShowTakeover({ ...fresh, pathname: '/sponsor' })).toBe(false)
    expect(shouldShowTakeover({ ...fresh, pathname: '/news/private-credit', pageViews: 2 })).toBe(true)
  })
})

describe('the welcome screen: three days after No thanks', () => {
  it('stays away for three days, then comes back', () => {
    expect(TAKEOVER_QUIET_DAYS).toBe(3)
    expect(shouldShowTakeover({ ...fresh, dismissedAt: NOW - 1000 })).toBe(false)
    expect(shouldShowTakeover({ ...fresh, dismissedAt: NOW - 3 * DAY + 60_000 })).toBe(false)
    expect(shouldShowTakeover({ ...fresh, dismissedAt: NOW - 3 * DAY })).toBe(true)
    expect(shouldShowTakeover({ ...fresh, dismissedAt: NOW - 10 * DAY })).toBe(true)
  })
  it('reads the stored time safely', () => {
    expect(parseDismissedAt(null)).toBeNull()
    expect(parseDismissedAt('junk')).toBeNull()
    expect(parseDismissedAt('-5')).toBeNull()
    expect(parseDismissedAt(String(NOW))).toBe(NOW)
    expect(isTakeoverQuiet(null, NOW)).toBe(false)
  })
})

describe('the welcome screen: a search arrival', () => {
  const search = { ...fresh, searchArrival: true }
  it('on a phone: the second page view, never the page they searched for', () => {
    const phone = { ...search, viewportWidth: 375, pathname: '/events/superreturn-boston' }
    expect(takeoverPageView(phone)).toBe(2)
    expect(shouldShowTakeover(phone)).toBe(false)
    expect(shouldShowTakeover({ ...phone, pathname: '/events', pageViews: 2 })).toBe(true)
    expect(shouldShowTakeover({ ...phone, pageViews: 2, shownThisSession: true })).toBe(false)
  })
  it('on a desk: at once', () => {
    expect(takeoverPageView(search)).toBe(1)
    expect(shouldShowTakeover(search)).toBe(true)
  })
  it('a phone that did not come from search: at once', () => {
    expect(shouldShowTakeover({ ...fresh, viewportWidth: 375 })).toBe(true)
  })
  it('knows the search engines from the referrer', () => {
    const from = (referrer: string) => isSearchArrival(computeSignupSource({ href: 'https://fundopshq.com/events/x', referrer, ownHost: 'fundopshq.com' }))
    expect(from('https://www.google.com/')).toBe(true)
    expect(from('https://www.google.co.uk/')).toBe(true)
    expect(from('https://www.bing.com/search?q=x')).toBe(true)
    expect(from('https://duckduckgo.com/')).toBe(true)
    expect(from('https://search.yahoo.com/search?p=x')).toBe(true)
    expect(from('https://yandex.ru/')).toBe(true)
    expect(from('https://www.ecosia.org/')).toBe(true)
    expect(from('https://search.brave.com/')).toBe(true)
    expect(from('https://mail.google.com/')).toBe(false)
    expect(from('https://www.linkedin.com/')).toBe(false)
    expect(from('')).toBe(false)
    expect(from('https://fundopshq.com/')).toBe(false)
  })
})

describe('the welcome screen: where', () => {
  it('on the reading pages', () => {
    for (const p of ['/', '/news', '/news/venture', '/story/1', '/firm/kkr', '/firms', '/league-tables', '/events', '/events/new-york', '/archive', '/about', '/glossary/carry']) expect(isTakeoverPage(p)).toBe(true)
  })
  it('never on the join, submit, sponsor, preferences, unsubscribe, legal or confirm pages', () => {
    for (const p of ['/join', '/submit', '/submit/confirm', '/events/submit', '/sponsor', '/sponsor/decide', '/preferences', '/unsubscribe', '/newsletter/unsubscribe', '/newsletter/confirm', '/privacy', '/terms', '/desk', '/admin', '/news/confirm'])
      expect(isTakeoverPage(p)).toBe(false)
  })
})

describe('the welcome screen: bots and the switch', () => {
  it('spots crawlers and automated browsers', () => {
    expect(isBot(CHROME)).toBe(false)
    expect(isBot(IPHONE)).toBe(false)
    expect(isBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true)
    expect(isBot('Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36 (compatible; Googlebot/2.1)')).toBe(true)
    expect(isBot('Mozilla/5.0 (compatible; bingbot/2.0)')).toBe(true)
    expect(isBot('Mozilla/5.0 Chrome-Lighthouse')).toBe(true)
    expect(isBot('Mozilla/5.0 HeadlessChrome/141.0')).toBe(true)
    expect(isBot('facebookexternalhit/1.1')).toBe(true)
    expect(isBot(CHROME, true)).toBe(true)
  })
  it('is on unless the env says off', () => {
    expect(takeoverEnabled(undefined)).toBe(true)
    expect(takeoverEnabled('')).toBe(true)
    expect(takeoverEnabled('on')).toBe(true)
    expect(takeoverEnabled('off')).toBe(false)
    expect(takeoverEnabled(' OFF ')).toBe(false)
  })
  it('signups through it are recorded as `takeover`', () => {
    expect(sanitizeSignupForm('takeover')).toBe('takeover')
  })
})
