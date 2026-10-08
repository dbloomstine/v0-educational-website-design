/**
 * The browser's half of "where did this subscriber come from": the label for
 * each kind of referrer, UTM values winning over it, bad values dropped, and
 * the first touch of a session surviving later page views.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  computeSignupSource,
  referrerLabel,
  sanitizeSignupSource,
  signupColumns,
} from '../signup-source'

describe('referrerLabel', () => {
  it.each([
    ['https://www.tiktok.com/@fundopshq', 'tiktok'],
    ['https://vm.tiktok.com/abc', 'tiktok'],
    ['https://www.linkedin.com/feed/', 'linkedin'],
    ['https://lnkd.in/x1', 'linkedin'],
    ['https://l.instagram.com/?u=x', 'instagram'],
    ['https://l.facebook.com/l.php?u=x', 'facebook'],
    ['https://m.facebook.com/', 'facebook'],
    ['https://t.co/abc', 'x'],
    ['https://twitter.com/i/status/1', 'x'],
    ['https://x.com/home', 'x'],
    ['https://www.google.com/', 'google'],
    ['https://www.google.co.uk/', 'google'],
    ['https://www.bing.com/search?q=x', 'bing'],
    ['https://duckduckgo.com/', 'duckduckgo'],
    ['https://html.duckduckgo.com/html/', 'duckduckgo'],
  ])('%s is %s', (referrer, label) => {
    expect(referrerLabel(referrer)).toBe(label)
  })

  it('reduces any other site to its bare host', () => {
    expect(referrerLabel('https://www.reddit.com/r/privateequity/comments/1')).toBe('reddit.com')
    expect(referrerLabel('https://news.ycombinator.com/item?id=1')).toBe('news.ycombinator.com')
  })

  it('does not call a click from Gmail a Google search', () => {
    expect(referrerLabel('https://mail.google.com/')).toBe('mail.google.com')
  })

  it('is direct with no referrer, and for our own site', () => {
    expect(referrerLabel('')).toBe('direct')
    expect(referrerLabel('https://fundopshq.com/news')).toBe('direct')
    expect(referrerLabel('https://www.fundopshq.com/')).toBe('direct')
    expect(referrerLabel('http://localhost:3000/', 'localhost')).toBe('direct')
  })

  it('gives nothing for a host that cannot be stored', () => {
    expect(referrerLabel('not a url')).toBeUndefined()
    expect(referrerLabel(`https://${'a'.repeat(50)}.com/`)).toBeUndefined()
  })
})

describe('computeSignupSource', () => {
  const at = (path: string) => `https://fundopshq.com${path}`

  it('uses the referrer when there are no UTM values, and records the landing path', () => {
    expect(computeSignupSource({ href: at('/news/private-equity'), referrer: 'https://www.linkedin.com/' })).toEqual({
      source: 'linkedin',
      path: '/news/private-equity',
    })
  })

  it('is direct with no referrer', () => {
    expect(computeSignupSource({ href: at('/'), referrer: '' })).toEqual({ source: 'direct', path: '/' })
  })

  it('lets UTM values win over the referrer', () => {
    const s = computeSignupSource({
      href: at('/?utm_source=TikTok&utm_medium=bio&utm_campaign=Launch-1'),
      referrer: 'https://www.linkedin.com/',
    })
    expect(s).toEqual({ source: 'tiktok', medium: 'bio', campaign: 'launch-1', path: '/' })
  })

  it('takes a medium or campaign alone and still reads the referrer for the source', () => {
    expect(computeSignupSource({ href: at('/?utm_medium=video'), referrer: 'https://www.tiktok.com/' })).toEqual({
      source: 'tiktok',
      medium: 'video',
      path: '/',
    })
  })

  it('reads the ?ref= links already in sent editions as the newsletter', () => {
    expect(computeSignupSource({ href: at('/?ref=fwd'), referrer: 'https://mail.google.com/' })).toEqual({
      source: 'newsletter',
      medium: 'email',
      campaign: 'forward',
      path: '/',
    })
    expect(computeSignupSource({ href: at('/?ref=share') }).medium).toBe('share')
    expect(computeSignupSource({ href: at('/?ref=whatever'), referrer: '' }).source).toBe('direct')
  })

  it('reads the outreach deep link without touching the address in it', () => {
    const s = computeSignupSource({ href: at('/?e=ZGFubnlAZXhhbXBsZS5jb20'), referrer: '' })
    expect(s).toEqual({ source: 'outreach', medium: 'email', path: '/' })
    expect(JSON.stringify(s)).not.toContain('ZGFubnk')
  })

  it('drops values that fail the pattern instead of storing them', () => {
    const s = computeSignupSource({
      href: at('/story/Ab%20c?utm_source=<script>&utm_medium=has%20space&utm_campaign=' + 'x'.repeat(41)),
      referrer: 'https://www.google.com/',
    })
    // utm_source is bad, so the referrer supplies the source; the rest are simply absent
    expect(s).toEqual({ source: 'google' })
  })

  it('drops a landing path that is too long', () => {
    expect(computeSignupSource({ href: at('/' + 'a'.repeat(120)), referrer: '' })).toEqual({ source: 'direct' })
    expect(computeSignupSource({ href: at('/' + 'a'.repeat(119)), referrer: '' }).path).toHaveLength(120)
  })

  it('returns nothing for an address that is not a URL', () => {
    expect(computeSignupSource({ href: 'nope' })).toEqual({})
  })
})

describe('sanitizeSignupSource', () => {
  it('keeps good values, lower-cased', () => {
    expect(sanitizeSignupSource({ source: ' LinkedIn ', medium: 'bio', campaign: 'a_b-c.d', path: '/news/x' })).toEqual({
      source: 'linkedin',
      medium: 'bio',
      campaign: 'a_b-c.d',
      path: '/news/x',
    })
  })

  it('drops anything outside the pattern', () => {
    const bad = {
      source: 'x'.repeat(41),
      medium: 'bio;drop table',
      campaign: "o'brien",
      path: 'no-leading-slash',
    }
    expect(sanitizeSignupSource(bad)).toEqual({})
    expect(sanitizeSignupSource({ source: 'ok', path: '/a?b=1' })).toEqual({ source: 'ok' })
    expect(sanitizeSignupSource({ path: '/' + 'a'.repeat(120) })).toEqual({})
  })

  it('ignores non-strings, unknown keys and non-objects', () => {
    expect(sanitizeSignupSource({ source: 5, medium: ['bio'], extra: 'x' })).toEqual({})
    expect(sanitizeSignupSource(null)).toEqual({})
    expect(sanitizeSignupSource('tiktok')).toEqual({})
  })
})

describe('signupColumns', () => {
  it('maps only the values present', () => {
    expect(signupColumns({ source: 'tiktok', path: '/' })).toEqual({ signup_source: 'tiktok', signup_landing_path: '/' })
    expect(signupColumns({})).toEqual({})
  })
})

describe('first touch across a session', () => {
  async function freshHelper() {
    // the module keeps the first touch in memory too; a fresh import is a new page load
    vi.resetModules()
    return await import('../signup-source')
  }
  function setReferrer(value: string) {
    Object.defineProperty(document, 'referrer', { value, configurable: true })
  }

  beforeEach(() => {
    window.sessionStorage.clear()
    window.history.pushState({}, '', '/')
    setReferrer('')
  })

  it('keeps the first page view and ignores later ones', async () => {
    const { captureSignupSource } = await freshHelper()
    window.history.pushState({}, '', '/news/private-equity?utm_source=tiktok&utm_medium=bio')
    expect(captureSignupSource()).toMatchObject({ source: 'tiktok', medium: 'bio', path: '/news/private-equity' })

    window.history.pushState({}, '', '/story/123?utm_source=linkedin')
    expect(captureSignupSource()).toMatchObject({ source: 'tiktok', medium: 'bio', path: '/news/private-equity' })
  })

  it('survives a reload of the page within the session', async () => {
    const first = await freshHelper()
    window.history.pushState({}, '', '/?utm_source=instagram')
    first.captureSignupSource()

    const reloaded = await freshHelper()
    window.history.pushState({}, '', '/firms')
    expect(reloaded.captureSignupSource()).toMatchObject({ source: 'instagram', path: '/' })
  })

  it('is a new first touch in a new session', async () => {
    const a = await freshHelper()
    window.history.pushState({}, '', '/?utm_source=instagram')
    a.captureSignupSource()

    window.sessionStorage.clear()
    const b = await freshHelper()
    window.history.pushState({}, '', '/?utm_source=tiktok')
    expect(b.captureSignupSource().source).toBe('tiktok')
  })

  it('does not trust what is in storage', async () => {
    window.sessionStorage.setItem('fops_signup_src', JSON.stringify({ source: '<b>', medium: 'bio' }))
    const { captureSignupSource } = await freshHelper()
    expect(captureSignupSource()).toEqual({ medium: 'bio' })
  })

  it('still holds the first touch in memory when storage is blocked', async () => {
    const { captureSignupSource } = await freshHelper()
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    try {
      window.history.pushState({}, '', '/?utm_source=tiktok')
      expect(captureSignupSource().source).toBe('tiktok')
      window.history.pushState({}, '', '/?utm_source=linkedin')
      expect(captureSignupSource().source).toBe('tiktok')
    } finally {
      get.mockRestore()
      set.mockRestore()
    }
  })

  it('hands the form the same first touch', async () => {
    const { signupSourceForRequest } = await freshHelper()
    window.history.pushState({}, '', '/?utm_source=linkedin&utm_medium=post')
    expect(signupSourceForRequest()).toEqual({ source: 'linkedin', medium: 'post', path: '/' })
  })
})
