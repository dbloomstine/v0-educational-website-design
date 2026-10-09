import { describe, it, expect } from 'vitest'
import { ENGAGED_SECONDS, ENGAGED_SECONDS_NO_SCROLL, EXIT_SECONDS, QUIET_DAYS_FIRST, QUIET_DAYS_REPEAT, SCROLL_PX, SECOND_PAGE_SECONDS, SETTLE_SECONDS, arrivedAsSubscriber, isQuiet, isReadingPage, nextDismissal, parseDismissal, shouldShowPrompt, type PromptState } from '../prompt-rules'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2026, 9, 8)
const ready: PromptState = {
  pathname: '/story/abc', subscribed: false, shownThisVisit: false, dismissal: null, now: NOW,
  engagedSeconds: ENGAGED_SECONDS, secondsOnPage: ENGAGED_SECONDS, pageViews: 1, scrolledPx: SCROLL_PX, typing: false, viewportHeight: 800,
}

describe('where the signup card may appear', () => {
  it('on the reading pages', () => {
    for (const p of ['/', '/news', '/news/private-credit', '/story/123', '/firm/kkr', '/firms', '/league-tables', '/events', '/archive/2026-09', '/about']) expect(isReadingPage(p)).toBe(true)
  })
  it('never on the desk, admin, legal, sponsor, preferences or form pages', () => {
    for (const p of ['/desk', '/desk/leads', '/admin', '/privacy', '/terms', '/sponsor', '/preferences', '/newsletter/sample', '/events/submit', '/brand', '/newsroom']) expect(isReadingPage(p)).toBe(false)
  })
})

describe('when the signup card appears', () => {
  it('after a quarter of a minute and a scroll', () => {
    expect(shouldShowPrompt(ready)).toBe(true)
    expect(shouldShowPrompt({ ...ready, engagedSeconds: ENGAGED_SECONDS - 1 })).toBe(false)
  })
  it('on a page with nothing to scroll, a little later', () => {
    expect(shouldShowPrompt({ ...ready, scrolledPx: 0 })).toBe(false)
    expect(shouldShowPrompt({ ...ready, scrolledPx: 0, engagedSeconds: ENGAGED_SECONDS_NO_SCROLL })).toBe(true)
  })
  it('a few seconds into a second page, once they have settled on it', () => {
    const second = { ...ready, scrolledPx: 0, pageViews: 2, engagedSeconds: SECOND_PAGE_SECONDS }
    expect(shouldShowPrompt({ ...second, secondsOnPage: SETTLE_SECONDS })).toBe(true)
    expect(shouldShowPrompt({ ...second, secondsOnPage: SETTLE_SECONDS - 1 })).toBe(false)
    expect(shouldShowPrompt({ ...second, engagedSeconds: SECOND_PAGE_SECONDS - 1, secondsOnPage: SETTLE_SECONDS })).toBe(false)
  })
  it('as a reader makes to leave, but not to someone who bounced', () => {
    const leaving = { ...ready, scrolledPx: 0, leaving: true }
    expect(shouldShowPrompt({ ...leaving, engagedSeconds: EXIT_SECONDS })).toBe(true)
    expect(shouldShowPrompt({ ...leaving, engagedSeconds: EXIT_SECONDS - 1 })).toBe(false)
    expect(shouldShowPrompt({ ...leaving, engagedSeconds: 60, subscribed: true })).toBe(false)
  })
  it('never to a subscriber, twice in a visit, or over someone typing', () => {
    expect(shouldShowPrompt({ ...ready, subscribed: true })).toBe(false)
    expect(shouldShowPrompt({ ...ready, shownThisVisit: true })).toBe(false)
    expect(shouldShowPrompt({ ...ready, typing: true })).toBe(false)
  })
  it('not on a screen too short to hold it', () => {
    expect(shouldShowPrompt({ ...ready, viewportHeight: 400 })).toBe(false)
  })
})

describe('after it is closed', () => {
  it('stays away a fortnight the first time and three months after the second', () => {
    const once = nextDismissal(null, NOW)
    expect(isQuiet(once, NOW + (QUIET_DAYS_FIRST - 1) * DAY)).toBe(true)
    expect(isQuiet(once, NOW + (QUIET_DAYS_FIRST + 1) * DAY)).toBe(false)
    const twice = nextDismissal(once, NOW)
    expect(twice.times).toBe(2)
    expect(isQuiet(twice, NOW + (QUIET_DAYS_FIRST + 1) * DAY)).toBe(true)
    expect(isQuiet(twice, NOW + (QUIET_DAYS_REPEAT + 1) * DAY)).toBe(false)
    expect(shouldShowPrompt({ ...ready, dismissal: once })).toBe(false)
  })
  it('reads back what it stored and ignores anything else', () => {
    expect(parseDismissal(JSON.stringify(nextDismissal(null, NOW)))).toEqual({ at: NOW, times: 1 })
    expect(parseDismissal('1')).toBeNull()
    expect(parseDismissal('{oops')).toBeNull()
    expect(parseDismissal(null)).toBeNull()
  })
})

describe('a visitor arriving from the email', () => {
  it('is a subscriber when the link is from their own copy', () => {
    expect(arrivedAsSubscriber({ source: 'newsletter', medium: 'email' })).toBe(true)
  })
  it('is somebody new when the copy was forwarded or shared', () => {
    expect(arrivedAsSubscriber({ source: 'newsletter', medium: 'email', campaign: 'forward' })).toBe(false)
    expect(arrivedAsSubscriber({ source: 'newsletter', medium: 'share' })).toBe(false)
    expect(arrivedAsSubscriber({ source: 'tiktok', medium: 'bio' })).toBe(false)
  })
})
