import { describe, it, expect } from 'vitest'
import { GLOSSARY_GROUPS, GLOSSARY_TERMS, getTerm, relatedTerms, storiesUsing, termMatcher, termsByGroup } from '../terms'

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

describe('the glossary', () => {
  it('has the 88 terms of the social desk’s explainer, each with a unique slug fit for an address', () => {
    expect(GLOSSARY_TERMS).toHaveLength(88)
    const slugs = GLOSSARY_TERMS.map((t) => t.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('files every term in one of the groups, and every group has terms', () => {
    for (const t of GLOSSARY_TERMS) expect(GLOSSARY_GROUPS, t.slug).toContain(t.group)
    expect(termsByGroup().map((g) => g.group)).toEqual(GLOSSARY_GROUPS)
    expect(termsByGroup().flatMap((g) => g.terms)).toHaveLength(88)
  })

  it('has text of a sane length in every field, and a title that fits a search result with the site’s suffix', () => {
    for (const t of GLOSSARY_TERMS) {
      expect(t.term.length, t.slug).toBeGreaterThan(1)
      expect(t.title, t.slug).toMatch(/^What (is|are) .+\?$/)
      expect(`${t.title} | FundOpsHQ`.length, t.slug).toBeLessThanOrEqual(60)
      expect(words(t.define), `${t.slug} define`).toBeGreaterThanOrEqual(8)
      expect(words(t.define), `${t.slug} define`).toBeLessThanOrEqual(40)
      expect(words(t.explanation), `${t.slug} explanation`).toBeGreaterThanOrEqual(15)
      expect(words(t.explanation), `${t.slug} explanation`).toBeLessThanOrEqual(90)
      expect(words(t.example), `${t.slug} example`).toBeGreaterThanOrEqual(8)
      expect(words(t.why), `${t.slug} why`).toBeGreaterThanOrEqual(5)
      // The definition is the meta description: whole, under the limit.
      expect(t.define.length, t.slug).toBeLessThanOrEqual(260)
    }
  })

  it('relates every term to real terms other than itself, and never to a dead slug', () => {
    for (const t of GLOSSARY_TERMS) {
      expect(t.related.length, t.slug).toBeGreaterThanOrEqual(2)
      expect(t.related, t.slug).not.toContain(t.slug)
      for (const r of t.related) expect(getTerm(r), `${t.slug} → ${r}`).toBeDefined()
      expect(relatedTerms(t)).toHaveLength(t.related.length)
    }
  })

  it('keeps the writing plain: no hype, no second person, no real firm in an example', () => {
    // ("Your" is allowed: "know your customer" is the term.)
    const banned = /\byou\b|fast-paced|game-changer|in today’s|in today's|\bBlackstone\b|\bKKR\b|\bApollo\b|\bCarlyle\b|\bAres\b/
    for (const t of GLOSSARY_TERMS) {
      for (const field of [t.define, t.explanation, t.example, t.why]) expect(field, t.slug).not.toMatch(banned)
    }
  })

  it('compiles every match pattern, and finds the stories that use a term', () => {
    for (const t of GLOSSARY_TERMS) expect(() => termMatcher(t), t.slug).not.toThrow()
    const stories = [
      { id: 'a', headline: 'Firm A closes continuation vehicle for two assets', summary: null },
      { id: 'b', headline: 'Pension B sells fund stakes', summary: 'A $500M LP-led secondary at a discount to NAV.' },
      { id: 'c', headline: 'Firm C hires a partner', summary: 'From a rival.' },
    ]
    expect(storiesUsing(getTerm('continuation-vehicle')!, stories).map((s) => s.id)).toEqual(['a'])
    expect(storiesUsing(getTerm('lp-led-secondary')!, stories).map((s) => s.id)).toEqual(['b'])
    // Plain "NAV" is the term; "NAV loan" is another term's.
    expect(storiesUsing(getTerm('nav')!, stories).map((s) => s.id)).toEqual(['b'])
    expect(storiesUsing(getTerm('nav-loan')!, stories)).toEqual([])
    expect(storiesUsing(getTerm('continuation-vehicle')!, [stories[0], stories[0], stories[0]], 2)).toHaveLength(2)
  })
})
