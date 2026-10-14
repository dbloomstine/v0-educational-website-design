import { describe, expect, it } from 'vitest'
import { cleanLogoUrl, cleanSite, findLogoInHomepage, homepageLinksTo, onSite } from '../logo-source'
import { readPrefill } from '@/components/sponsor/SponsorBuilder'

describe('mock-up logos come from the firm’s own website only', () => {
  it('accepts a public domain and refuses addresses and local names', () => {
    expect(cleanSite('https://www.ToltIQ.com/about')).toBe('toltiq.com')
    expect(cleanSite('10.0.0.1')).toBeNull()
    expect(cleanSite('localhost')).toBeNull()
    expect(cleanSite('internal.local')).toBeNull()
    expect(cleanSite('evil.vercel.app')).toBeNull()
  })

  it('treats subdomains as the site', () => {
    expect(onSite('cdn.toltiq.com', 'toltiq.com')).toBe(true)
    expect(onSite('toltiq.com.evil.io', 'toltiq.com')).toBe(false)
  })

  it('takes only https logo URLs', () => {
    expect(cleanLogoUrl('http://toltiq.com/logo.png')).toBeNull()
    expect(cleanLogoUrl('https://user:pw@toltiq.com/logo.png')).toBeNull()
    expect(cleanLogoUrl('https://toltiq.com/logo.png')?.hostname).toBe('toltiq.com')
  })

  it('accepts a file elsewhere only when the homepage uses that exact file', () => {
    const html = '<header><img class="nav-logo" src="https://cdn.site-builder.com/abc/toltiq-logo.svg" alt="ToltIQ"></header>'
    expect(homepageLinksTo(html, 'https://toltiq.com/', new URL('https://cdn.site-builder.com/abc/toltiq-logo.svg'))).toBe(true)
    expect(homepageLinksTo(html, 'https://toltiq.com/', new URL('https://cdn.site-builder.com/abc/other.svg'))).toBe(false)
  })

  it('finds the logo a homepage shows, or its touch icon', () => {
    expect(findLogoInHomepage('<img src="/img/hero.jpg"><img src="/img/brand.svg" alt="Acme logo">', 'https://acme.com/')?.href).toBe('https://acme.com/img/brand.svg')
    expect(findLogoInHomepage('<link rel="apple-touch-icon" href="/icon.png">', 'https://acme.com/')?.href).toBe('https://acme.com/icon.png')
    expect(findLogoInHomepage('<link href="https://cdn.framer.com/a.svg" rel="icon" media="(prefers-color-scheme: dark)"><link href="https://cdn.framer.com/b.svg" rel="icon" media="(prefers-color-scheme: light)">', 'https://acme.com/')?.href).toBe('https://cdn.framer.com/b.svg')
    expect(findLogoInHomepage('<link rel="icon" href="/favicon-16.png" sizes="16x16">', 'https://acme.com/')).toBeNull()
    expect(findLogoInHomepage('<p>nothing</p>', 'https://acme.com/')).toBeNull()
  })
})

describe('the ad builder reads a mock-up link', () => {
  it('prefills firm, site, logo and line', () => {
    const p = readPrefill('?firm=ToltIQ&site=https%3A%2F%2Fwww.toltiq.com&logo=https%3A%2F%2Ftoltiq.com%2Flogo.svg&line=AI+diligence.')
    expect(p).toEqual({ firm: 'ToltIQ', site: 'toltiq.com', logo: 'https://toltiq.com/logo.svg', line: 'AI diligence.' })
  })
  it('ignores a page opened without one', () => {
    expect(readPrefill('')).toBeNull()
    expect(readPrefill('?firm=')).toBeNull()
  })
  it('holds the firm name to the form’s limit', () => {
    expect(readPrefill(`?firm=${'x'.repeat(80)}`)?.firm).toHaveLength(40)
  })
})
