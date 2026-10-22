import { describe, it, expect } from 'vitest'
import { ENGAGED_SECONDS, ENGAGED_SECONDS_NO_SCROLL, EXIT_SECONDS, POST_SECONDS, MAX_SKIPS, PHONE_MAX_WIDTH, QUIET_DAYS_FIRST, SCROLL_PX, SECOND_PAGE_SECONDS, SETTLE_SECONDS, arrivedAsSubscriber, arrivedFromPost, isFirstVisit, isQuiet, promptForm, promptLayout, shouldShowOnArrival, type ArrivalState, isReadingPage, nextDismissal, parseDismissal, shouldShowPrompt, type PromptState } from '../prompt-rules'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2026, 9, 8)
const ready: PromptState = {
  pathname: '/story/abc', subscribed: false, shownThisVisit: false, dismissal: null, now: NOW,
  engagedSeconds: ENGAGED_SECONDS, secondsOnPage: ENGAGED_SECONDS, pageViews: 1, scrolledPx: SCROLL_PX, typing: false, viewportHeight: 800,
}

describe('where the signup card may appear', () => {
  it('on the reading pages', () => {
    for (const p of ['/', '/news', '/news/private-credit', '/story/123', '/firm/kkr', '/firms', '/league-tables', '/events', '/archive/2026-09', '/about', '/glossary', '/glossary/clawback']) expect(isReadingPage(p)).toBe(true)
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
  it('stays away 30 days after a skip, may then come once more, and never by itself after a second skip', () => {
    expect(QUIET_DAYS_FIRST).toBe(30)
    const once = nextDismissal(null, NOW)
    expect(isQuiet(once, NOW + 29 * DAY)).toBe(true)
    expect(isQuiet(once, NOW + 31 * DAY)).toBe(false)
    expect(shouldShowPrompt({ ...ready, dismissal: once })).toBe(false)
    expect(shouldShowPrompt({ ...ready, dismissal: once, now: NOW + 31 * DAY })).toBe(true)
    const twice = nextDismissal(once, NOW + 31 * DAY)
    expect(twice.times).toBe(MAX_SKIPS)
    expect(isQuiet(twice, NOW + 31 * DAY + 400 * DAY)).toBe(true)
    expect(shouldShowPrompt({ ...ready, dismissal: twice, now: NOW + 5 * 365 * DAY })).toBe(false)
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

describe('a reader who came over from one of our posts', () => {
  it('is known by the network, and by whether they landed on a story', () => {
    expect(arrivedFromPost({ source: 'linkedin', medium: 'social', path: '/story/abc' })).toEqual({ network: 'LinkedIn', story: true })
    expect(arrivedFromPost({ source: 'tiktok', medium: 'bio', path: '/' })).toEqual({ network: 'TikTok', story: false })
  })
  it('nobody else is: search, direct, the email, a network we do not post on, a name borrowed from Object', () => {
    for (const source of ['google', 'direct', 'newsletter', 'instagram', 'x', 'constructor', 'toString', undefined]) expect(arrivedFromPost({ source, path: '/story/abc' })).toBeNull()
  })
  it('is asked sooner, scroll or none, and under every other rule as before', () => {
    const fresh = { ...ready, scrolledPx: 0, engagedSeconds: POST_SECONDS, secondsOnPage: POST_SECONDS }
    expect(shouldShowPrompt(fresh)).toBe(false)
    expect(shouldShowPrompt({ ...fresh, fromPost: true })).toBe(true)
    expect(shouldShowPrompt({ ...fresh, fromPost: true, engagedSeconds: POST_SECONDS - 1 })).toBe(false)
    expect(shouldShowPrompt({ ...fresh, fromPost: true, subscribed: true })).toBe(false)
    expect(shouldShowPrompt({ ...fresh, fromPost: true, dismissal: { at: NOW - DAY, times: 1 } })).toBe(false)
    expect(shouldShowPrompt({ ...fresh, fromPost: true, pathname: '/sponsor' })).toBe(false)
  })
})

describe('the first-visit ask (2026-10-22)', () => {
  const arriving: ArrivalState = { pathname: '/events/8th-annual-lpgp-connect-cfo-coo-forum-chicago', subscribed: false, seenBefore: false, shownThisVisit: false, dismissal: null, typing: false, viewportHeight: 800 }

  it('shows on arrival to a browser that has never seen it, on any reading page', () => {
    expect(shouldShowOnArrival(arriving)).toBe(true)
    for (const pathname of ['/', '/story/abc', '/events', '/events/chicago', '/glossary/clawback']) expect(shouldShowOnArrival({ ...arriving, pathname })).toBe(true)
  })
  it('not to a subscriber, nor once seen, skipped or shown this visit', () => {
    expect(shouldShowOnArrival({ ...arriving, subscribed: true })).toBe(false)
    expect(shouldShowOnArrival({ ...arriving, seenBefore: true })).toBe(false)
    expect(shouldShowOnArrival({ ...arriving, dismissal: nextDismissal(null, NOW) })).toBe(false)
    expect(shouldShowOnArrival({ ...arriving, shownThisVisit: true })).toBe(false)
  })
  it('not on pages that are not for reading, over someone typing, or on a screen too short', () => {
    expect(shouldShowOnArrival({ ...arriving, pathname: '/events/submit' })).toBe(false)
    expect(shouldShowOnArrival({ ...arriving, pathname: '/desk' })).toBe(false)
    expect(shouldShowOnArrival({ ...arriving, typing: true })).toBe(false)
    expect(shouldShowOnArrival({ ...arriving, viewportHeight: 400 })).toBe(false)
  })
  it('counts as a first visit only with no sign of an earlier one', () => {
    expect(isFirstVisit({ subscribed: false, seenBefore: false, dismissal: null })).toBe(true)
    expect(isFirstVisit({ subscribed: false, seenBefore: true, dismissal: null })).toBe(false)
  })
  it('is a bottom panel on a phone when it came by itself, never a cover; the box when asked for', () => {
    expect(promptLayout(375, false)).toBe('sheet')
    expect(promptLayout(PHONE_MAX_WIDTH - 1, false)).toBe('sheet')
    expect(promptLayout(PHONE_MAX_WIDTH, false)).toBe('dialog')
    expect(promptLayout(1440, false)).toBe('dialog')
    expect(promptLayout(375, true)).toBe('dialog')
  })
  it('is counted apart from the box the reading clock opens', () => {
    expect(promptForm(true)).toBe('firstvisit')
    expect(promptForm(false)).toBe('popup')
  })
})
