import { describe, it, expect } from 'vitest'
import { extractArticleText } from '../enrich-articles'

const para = (text: string) => `<p>${text}</p>`
const LONG = 'Ardian has closed its ninth secondaries fund at 20 billion dollars, above its 18 billion target, drawing commitments from pensions and sovereign wealth funds.'

describe('extractArticleText', () => {
  it('pulls paragraph text out of a plain page', () => {
    const html = `<html><body><div>${para(LONG)}${para(LONG)}</div></body></html>`
    const text = extractArticleText(html)
    expect(text).toContain('Ardian has closed its ninth secondaries fund')
    expect(text.split('\n\n')).toHaveLength(2)
  })

  it('strips scripts, styles and page furniture', () => {
    const html = `
      <html><body>
        <script>window.dataLayer=[{fund:'should not appear'}]</script>
        <style>.ad { color: red }</style>
        <nav>${para('Home About Contact Subscribe to our newsletter today')}</nav>
        <footer>${para('Copyright 2026 all rights reserved contact us here please')}</footer>
        <div>${para(LONG)}</div>
      </body></html>`
    const text = extractArticleText(html)
    expect(text).toContain('Ardian')
    expect(text).not.toContain('should not appear')
    expect(text).not.toContain('Copyright 2026')
    expect(text).not.toContain('Home About Contact')
  })

  it('prefers the <article> region over sidebar rails', () => {
    // Related-story rails are the main source of contamination — they inject
    // other firms' headlines, which the classifier would then extract as
    // entities for this story.
    const html = `
      <html><body>
        <div class="sidebar">${para('Related: Blackstone closes its tenth flagship buyout fund at 25 billion')}</div>
        <article>${para(LONG)}${para(LONG)}</article>
      </body></html>`
    const text = extractArticleText(html)
    expect(text).toContain('Ardian')
    expect(text).not.toContain('Blackstone')
  })

  it('drops one-line boilerplate but keeps real sentences', () => {
    const html = `<body>${para('Share this')}${para('Sign up')}${para(LONG)}</body>`
    const text = extractArticleText(html)
    expect(text).toBe(LONG)
  })

  it('decodes the entities that show up in fund copy', () => {
    const html = `<body>${para('Ardian&rsquo;s fund raised &euro;20bn &amp; closed &mdash; above target, per the firm&#39;s statement to investors today.')}</body>`
    const text = extractArticleText(html)
    expect(text).toContain("Ardian's fund")
    expect(text).toContain('&')
    expect(text).toContain('—')
    expect(text).not.toContain('&amp;')
    expect(text).not.toContain('&rsquo;')
  })

  it('returns empty string for a page with no article text', () => {
    expect(extractArticleText('<html><body><div>no paragraphs</div></body></html>')).toBe('')
    expect(extractArticleText('')).toBe('')
  })
})

// ─── The shared fetcher ─────────────────────────────────────────────────────

import { afterEach, vi } from 'vitest'
import { fetchArticleBody, isPaywalledHost, newFetchContext, registrableDomain } from '../enrich-articles'

const BODY = Array.from({ length: 6 }, () => `<p>${LONG}</p>`).join('')
const html = (inner = BODY) => new Response(`<html><body><article>${inner}</article></body></html>`, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })
const robots = (text = '') => new Response(text, { status: text ? 200 : 404, headers: { 'content-type': 'text/plain' } })
const redirect = (to: string) => new Response(null, { status: 302, headers: { location: to } })

function stubFetch(handler: (url: string) => Response) {
  const seen: { url: string; ua: string | null }[] = []
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    seen.push({ url, ua: new Headers(init?.headers).get('user-agent') })
    return handler(url)
  }))
  return seen
}
// Hosts are spaced a second apart; the tests do not wait for that.
const instant = () => vi.useFakeTimers({ shouldAdvanceTime: true, advanceTimeAfterCycles: 0 } as never)

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

describe('hosts and domains', () => {
  it('knows a paywalled host by itself and by its subdomains, and no one else', () => {
    expect(isPaywalledHost('pehub.com')).toBe(true)
    expect(isPaywalledHost('www.pehub.com')).toBe(true)
    expect(isPaywalledHost('news.pehub.com')).toBe(true)
    expect(isPaywalledHost('notpehub.com')).toBe(false)
    expect(isPaywalledHost('investmentweek.co.uk')).toBe(false)
  })
  it('finds the registrable domain, with the usual two-part suffixes', () => {
    expect(registrableDomain('www.example.com')).toBe('example.com')
    expect(registrableDomain('example.com')).toBe('example.com')
    expect(registrableDomain('a.b.example.com')).toBe('example.com')
    expect(registrableDomain('www.investmentweek.co.uk')).toBe('investmentweek.co.uk')
    expect(registrableDomain('example.co.uk')).toBe('example.co.uk')
  })
})

describe('fetchArticleBody', () => {
  it('asks for nothing at all of a paywalled host or a Google News redirect', async () => {
    const seen = stubFetch(() => html())
    const ctx = newFetchContext()
    for (const u of ['https://www.pehub.com/a', 'https://news.pehub.com/a', 'https://www.privateequityinternational.com/a', 'https://news.google.com/rss/articles/CBMi']) {
      const r = await fetchArticleBody(u, ctx)
      expect(r).toMatchObject({ ok: false, outcome: 'skipped' })
    }
    expect(seen).toEqual([])
  })

  it('reads robots.txt first, names itself, and returns the article text', async () => {
    instant()
    const seen = stubFetch((u) => (u.endsWith('/robots.txt') ? robots() : html()))
    const r = await fetchArticleBody('https://www.example.com/deal', newFetchContext())
    expect(r.ok).toBe(true)
    expect(seen.map((s) => s.url)).toEqual(['https://www.example.com/robots.txt', 'https://www.example.com/deal'])
    expect(seen.every((s) => s.ua?.startsWith('FundOpsHQBot/'))).toBe(true)
  })

  it('does not fetch a page robots.txt disallows', async () => {
    instant()
    const seen = stubFetch((u) => (u.endsWith('/robots.txt') ? robots('User-agent: *\nDisallow: /deal') : html()))
    const r = await fetchArticleBody('https://www.example.com/deal/1', newFetchContext())
    expect(r).toEqual({ ok: false, outcome: 'skipped', reason: 'disallowed by robots.txt' })
    expect(seen.map((s) => s.url)).toEqual(['https://www.example.com/robots.txt'])
  })

  it('follows a redirect within the publisher’s domain', async () => {
    instant()
    const seen = stubFetch((u) => (u.endsWith('/robots.txt') ? robots() : u.endsWith('/old') ? redirect('https://news.example.com/new') : html()))
    const r = await fetchArticleBody('https://www.example.com/old', newFetchContext())
    expect(r.ok).toBe(true)
    expect(seen.map((s) => s.url)).toContain('https://news.example.com/new')
  })

  it('refuses a redirect to another domain without asking that domain for anything', async () => {
    instant()
    const seen = stubFetch((u) => (u.endsWith('/robots.txt') ? robots() : redirect('https://elsewhere.example.org/x')))
    const r = await fetchArticleBody('https://www.example.com/old', newFetchContext())
    expect(r).toMatchObject({ ok: false, outcome: 'skipped' })
    expect(seen.some((s) => s.url.includes('elsewhere'))).toBe(false)
  })

  it('reads no more than the size cap of a page', async () => {
    instant()
    const big = `<html><body><article>${BODY}</article>${'<div>x</div>'.repeat(400_000)}<p>${'TAILMARK '.repeat(10)}</p></body></html>`
    stubFetch((u) => (u.endsWith('/robots.txt') ? robots() : new Response(big, { status: 200, headers: { 'content-type': 'text/html' } })))
    const r = await fetchArticleBody('https://www.example.com/long', newFetchContext())
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.text).not.toContain('TAILMARK')
  })

  it('reports a page that would not load as failed, and a short one as skipped', async () => {
    instant()
    stubFetch((u) => (u.endsWith('/robots.txt') ? robots() : new Response('nope', { status: 503 })))
    expect(await fetchArticleBody('https://www.example.com/a', newFetchContext())).toEqual({ ok: false, outcome: 'failed', reason: 'fetch failed' })
    stubFetch((u) => (u.endsWith('/robots.txt') ? robots() : html('<p>Too short to be an article body but longer than forty characters.</p>')))
    expect(await fetchArticleBody('https://www.example.com/b', newFetchContext())).toMatchObject({ ok: false, outcome: 'skipped' })
  })
})
