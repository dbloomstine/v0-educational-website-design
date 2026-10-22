import { describe, it, expect } from 'vitest'
import { SECTIONS, SECTION_BY_SLUG, sectionSearchTitle } from '../sections'

// The section fronts' search titles and descriptions (2026-10-22): in the words people search with, and short
// enough that a search result shows them whole.
describe('section search titles', () => {
  it('fit in a search result: titles within 60 characters, descriptions within 155', () => {
    for (const s of SECTIONS) {
      const title = sectionSearchTitle(s)
      expect(title.length, title).toBeLessThanOrEqual(60)
      expect(s.metaDescription.length, s.slug).toBeLessThanOrEqual(155)
      expect(s.metaDescription.length, s.slug).toBeGreaterThanOrEqual(110)
    }
  })

  it('say "news" (or "people moves") and keep the brand where it fits', () => {
    expect(sectionSearchTitle(SECTION_BY_SLUG.get('private-credit')!)).toBe('Private credit news: fund closes, deals & hires | FundOpsHQ')
    for (const s of SECTIONS) expect(s.searchTitle.toLowerCase(), s.slug).toMatch(/\bnews\b|people moves/)
  })

  it('never call the site educational', () => {
    for (const s of SECTIONS) expect(`${s.searchTitle} ${s.metaDescription}`.toLowerCase(), s.slug).not.toContain('educat')
  })
})
