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
