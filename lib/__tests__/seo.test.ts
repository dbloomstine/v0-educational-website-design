import { describe, it, expect } from 'vitest'
import { breadcrumbJsonLd, metaDescription, shareCard, OG_IMAGES } from '../seo'

describe('the breadcrumb list', () => {
  it('starts at the front page, numbers the crumbs and leaves the page itself without an address', () => {
    const ld = breadcrumbJsonLd([{ name: 'Firms', path: '/firms' }, { name: 'KKR' }])
    expect(ld['@type']).toBe('BreadcrumbList')
    expect(ld.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'FundOpsHQ', item: 'https://fundopshq.com/' },
      { '@type': 'ListItem', position: 2, name: 'Firms', item: 'https://fundopshq.com/firms' },
      { '@type': 'ListItem', position: 3, name: 'KKR' },
    ])
  })
})

describe('a meta description', () => {
  it('is left alone when it fits, and cut on a word with an ellipsis when it does not', () => {
    expect(metaDescription('Short and tidy.')).toBe('Short and tidy.')
    const long = 'word '.repeat(60).trim()
    const cut = metaDescription(long)
    expect(cut.length).toBeLessThanOrEqual(160)
    expect(cut.endsWith('…')).toBe(true)
    expect(cut).not.toMatch(/ …$/)
    // Whitespace runs collapse; a trailing comma or dash is not left hanging before the ellipsis.
    expect(metaDescription('one  two\n three')).toBe('one two three')
    expect(metaDescription(`${'a'.repeat(150)} bbbbb, ccccc ddddd`, 160)).toBe(`${'a'.repeat(150)} bbbbb…`)
  })
})

describe('the share card', () => {
  it('sets Open Graph and the Twitter card together, with the site image and the page’s own address', () => {
    const card = shareCard('Submit an event | FundOpsHQ', 'How to list one.', '/events/submit')
    expect(card.openGraph.url).toBe('https://fundopshq.com/events/submit')
    expect(card.openGraph.title).toBe('Submit an event | FundOpsHQ')
    expect(card.openGraph.images).toBe(OG_IMAGES)
    expect(card.twitter.title).toBe(card.openGraph.title)
    expect(card.twitter.description).toBe('How to list one.')
    expect(card.twitter.images).toEqual([OG_IMAGES[0].url])
  })
})
