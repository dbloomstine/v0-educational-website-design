import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { SECTIONS } from '../sections'

describe('sections', () => {
  it('every section slug is exempt from the legacy /news/* redirect', () => {
    // next.config redirects /news/<anything> to /news for old article links.
    // A section added here but not there would silently redirect to Latest.
    const root = join(__dirname, '..', '..', '..')
    const file = readdirSync(root).find((f) => f.startsWith('next.config.'))!
    const config = readFileSync(join(root, file), 'utf8')
    const list = config.match(/const SECTION_SLUGS = \[([\s\S]*?)\]/)?.[1] ?? ''
    const inConfig = Array.from(list.matchAll(/'([a-z-]+)'/g)).map((m) => m[1]).sort()
    expect(inConfig).toEqual(SECTIONS.map((s) => s.slug).sort())
  })

  it('redirects step around a section and its cuts, and still catch old article links', async () => {
    // A cut of a section is a path (/news/private-equity/deals): the legacy
    // redirects must not swallow it, and the old ?f= form must lead to it.
    const { default: config } = await import('../../../next.config.mjs')
    const redirects = (await config.redirects!()) as { source: string; destination: string; has?: { key?: string; value?: string }[] }[]
    const news = redirects.filter((r) => r.source.startsWith('/news'))
    // Next compiles a source with path-to-regexp. The same rules by hand:
    // ":name" is one segment, ":name(pattern)" that pattern, ":name+" one or more segments.
    const toRegExp = (source: string) => {
      let out = ''
      for (let i = 0; i < source.length; ) {
        if (source[i] !== ':') { out += source[i++]; continue }
        i++
        while (i < source.length && /\w/.test(source[i])) i++
        let pattern = '[^/]+'
        if (source[i] === '(') {
          let depth = 0
          const start = i
          do { if (source[i] === '(') depth++; if (source[i] === ')') depth--; i++ } while (depth > 0)
          pattern = source.slice(start + 1, i - 1)
        }
        if (source[i] === '+') { i++; out = out.replace(/\/$/, ''); out += `(?:/(?:${pattern}))+` } else out += `(?:${pattern})`
      }
      return new RegExp(`^${out}$`)
    }
    const matches = (source: string, path: string) => toRegExp(source).test(path)
    const redirected = (path: string) => news.some((r) => !r.has && matches(r.source, path))
    expect(redirected('/news/some-old-article-slug')).toBe(true)
    expect(redirected('/news/2025/some-old-article')).toBe(true)
    for (const s of SECTIONS) {
      expect(redirected(`/news/${s.slug}`), s.slug).toBe(false)
      expect(redirected(`/news/${s.slug}/deals`), `${s.slug}/deals`).toBe(false)
    }
    const old = news.find((r) => r.has?.some((h) => h.key === 'f'))
    expect(old?.destination).toBe('/news/:section/:facet')
    expect(matches(old!.source, '/news/private-credit')).toBe(true)
    expect(matches(old!.source, '/news/not-a-section')).toBe(false)
  })

  it('slugs are unique and every section can be reached by kind or asset class', () => {
    expect(new Set(SECTIONS.map((s) => s.slug)).size).toBe(SECTIONS.length)
    for (const s of SECTIONS) expect(Boolean(s.kind) !== Boolean(s.assetClasses?.length), s.slug).toBe(true)
  })
})
