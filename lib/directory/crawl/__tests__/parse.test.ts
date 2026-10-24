import { describe, expect, it } from 'vitest'
import { chunkText, extractLinks, filterLines, htmlToText, parseRobots, parseSitemap, robotsAllows } from '../parse'
import { listingUrls } from '../discover'
import { parseSource, runnable } from '../sources'
import { Budget, BudgetExceeded } from '../extract'
import { bodyText } from '../crawl'
import { sample } from '../qa'
import seed from '../../../../scripts/directory/crawl/sources.seed.json'

describe('robots.txt', () => {
  const txt = `User-agent: *\nDisallow: /search\nAllow: /search/people\nCrawl-delay: 3\n\nUser-agent: BadBot\nDisallow: /\n\nSitemap: https://x.com/sitemap.xml`
  it('reads the * group, sitemaps and crawl delay', () => {
    const r = parseRobots(txt)
    expect(r.crawlDelay).toBe(3)
    expect(r.sitemaps).toEqual(['https://x.com/sitemap.xml'])
    expect(robotsAllows(r, 'https://x.com/people/jane')).toBe(true)
    expect(robotsAllows(r, 'https://x.com/search?q=a')).toBe(false)
    expect(robotsAllows(r, 'https://x.com/search/people/jane')).toBe(true)
  })
  it('prefers a group naming our bot', () => {
    const r = parseRobots(`User-agent: *\nAllow: /\n\nUser-agent: FundOpsHQ-directory-bot\nDisallow: /people`)
    expect(robotsAllows(r, 'https://x.com/people/jane')).toBe(false)
  })
  it('supports * and $ in rules', () => {
    const r = parseRobots(`User-agent: *\nDisallow: /*.pdf$\nDisallow: /*?print=`)
    expect(robotsAllows(r, 'https://x.com/a.pdf')).toBe(false)
    expect(robotsAllows(r, 'https://x.com/a.pdf?x=1')).toBe(true)
    expect(robotsAllows(r, 'https://x.com/bio?print=1')).toBe(false)
  })
})

describe('sitemaps', () => {
  it('reads an index and a urlset, CDATA and entities', () => {
    expect(parseSitemap(`<sitemapindex><sitemap><loc>https://x.com/people-sitemap.xml</loc></sitemap></sitemapindex>`)).toEqual({ urls: [], sitemaps: ['https://x.com/people-sitemap.xml'] })
    expect(parseSitemap(`<urlset><url><loc><![CDATA[https://x.com/a?b=1&amp;c=2]]></loc></url><url><loc>https://x.com/b</loc></url></urlset>`).urls).toEqual(['https://x.com/a?b=1&c=2', 'https://x.com/b'])
  })
})

describe('html', () => {
  it('drops scripts, nav and footer; keeps blocks on lines', () => {
    const t = htmlToText('<nav>Menu</nav><h1>Jane Smith</h1><p>Partner &amp; Co-Chair</p><script>x()</script><footer>Call us</footer>')
    expect(t).toBe('Jane Smith\nPartner & Co-Chair')
  })
  it('reads an HTML field inside JSON', () => {
    expect(bodyText('{"html":"\\u003ch2\\u003eJane Smith\\u003c/h2\\u003e\\u003cp\\u003ePartner\\u003c/p\\u003e"}')).toContain('Jane Smith')
  })
  it('extracts absolute links from hrefs and JSON', () => {
    const l = extractLinks('<a href="/people/jane/">J</a> {"url":"https:\\/\\/x.com\\/people\\/bob"} <a href="mailto:a@b.c">m</a>', 'https://x.com/team')
    expect(l.sort()).toEqual(['https://x.com/people/bob', 'https://x.com/people/jane'])
  })
  it('chunks long text with overlap and filters lines around a match', () => {
    const text = Array.from({ length: 400 }, (_, i) => `line ${i} ${'x'.repeat(60)}`).join('\n')
    const cs = chunkText(text, 5000)
    expect(cs.length).toBeGreaterThan(4)
    expect(cs.join('\n')).toContain('line 399')
    expect(filterLines('A\nMD\nPCA\nNY\nB\nMD\nM&A\nSF', { line: '^PCA$', before: 2, after: 1 })).toBe('A\nMD\nPCA\nNY\n')
  })
  it('expands pagination', () => {
    expect(listingUrls({ url: 'https://x.com/p?f=1', pages: { param: 'page', start: 1, max: 3 } })).toEqual(['https://x.com/p?f=1&page=1', 'https://x.com/p?f=1&page=2', 'https://x.com/p?f=1&page=3'])
  })
})

describe('registry', () => {
  it('every seeded source parses, keys are unique, and every slug suffix is set', () => {
    const keys = new Set<string>()
    for (const r of seed as unknown[]) {
      const p = parseSource(r)
      expect(p.ok, JSON.stringify(p)).toBe(true)
      if (p.ok) {
        expect(keys.has(p.value.key)).toBe(false)
        keys.add(p.value.key)
      }
    }
    expect(keys.size).toBeGreaterThan(100)
  })
  it('refuses a bad pattern or a missing slug suffix', () => {
    const base = { key: 'x', firm_name: 'X', firm_domain: 'x.com', category: 'fund_lawyer', method: 'sitemap', status: 'ok', selectors: { slug_suffix: 'x' } }
    expect(parseSource({ ...base, person_url_pattern: '([' }).ok).toBe(false)
    expect(parseSource({ ...base, selectors: {} }).ok).toBe(false)
    expect(parseSource(base).ok).toBe(true)
  })
  it('never runs a blocked source, and no headless source in CI', () => {
    const p = parseSource({ key: 'x', firm_name: 'X', firm_domain: 'x.com', category: 'fund_lawyer', method: 'headless', status: 'ok', selectors: { slug_suffix: 'x' } })
    if (!p.ok) throw new Error('parse')
    expect(runnable(p.value, { ci: true }).run).toBe(false)
    expect(runnable(p.value, { ci: false }).run).toBe(true)
    expect(runnable({ ...p.value, status: 'blocked' }, { ci: false, retryEmpty: true }).run).toBe(false)
  })
})

describe('budget', () => {
  it('stops before a call that could pass the cap', () => {
    const b = new Budget(0.001)
    b.add({ input_tokens: 5000, output_tokens: 500 })
    expect(b.usd).toBeCloseTo(0.00075, 6)
    expect(() => b.reserve(30000, 8000)).toThrow(BudgetExceeded)
    expect(() => new Budget(5).reserve(30000, 8000)).not.toThrow()
  })
})

describe('qa sample', () => {
  it('is reproducible for a seed', () => {
    const xs = Array.from({ length: 50 }, (_, i) => i)
    expect(sample(xs, 20, '2026-10-25')).toEqual(sample(xs, 20, '2026-10-25'))
    expect(new Set(sample(xs, 20, '2026-10-25')).size).toBe(20)
    expect(sample(xs, 20, '2026-10-25')).not.toEqual(sample(xs, 20, '2026-10-26'))
  })
})
