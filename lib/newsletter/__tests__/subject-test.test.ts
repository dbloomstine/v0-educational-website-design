import { describe, it, expect } from 'vitest'
import { buildHeadlineSubject, subjectHeadline, subjectStyleFor, SUBJECT_MAX_CHARS } from '../send-daily'
import { buildPreheader } from '../email-template'
import type { TopPick } from '../top-stories'
import type { NewsletterArticle } from '../query-articles'

function pick(o: Partial<NewsletterArticle> & { title: string }, category = 'credit', label = 'Credit'): TopPick {
  const article = {
    id: 'lead', sourceUrl: 'https://example.com/lead', sourceName: 'PE Hub', publishedDate: '2026-10-14', articleType: 'fund_close',
    eventType: 'fund_close', fundCategories: ['credit'], isHighSignal: true, relevanceScore: 0.9, tldr: null,
    firmName: null, firmDomain: null, fundName: null, fundSizeUsdMillions: null, fundStrategy: null, geography: [], personName: null,
    personTitle: null, closeType: null, coFirms: [], alsoCoveredBy: [], headlineEntities: [], entityKeys: [], personKeys: [],
    leadEligible: true, ...o,
  } as NewsletterArticle
  return { article, category, label } as TopPick
}

describe('the subject-line test: which style an edition gets', () => {
  it('alternates by day of the year from 2026-10-15 to 2026-10-28, so each weekday gets both', () => {
    const days = Array.from({ length: 14 }, (_, i) => new Date(Date.UTC(2026, 9, 15 + i)).toISOString().slice(0, 10))
    const styles = days.map(subjectStyleFor)
    expect(styles.filter((s) => s === 'B')).toHaveLength(7)
    for (let i = 1; i < styles.length; i++) expect(styles[i]).not.toBe(styles[i - 1])
    // Each weekday's two dates (a week apart, an odd number of days) get one of each.
    for (let i = 0; i < 7; i++) expect(styles[i]).not.toBe(styles[i + 7])
  })
  it('is style A before and after the test', () => {
    expect(subjectStyleFor('2026-10-14')).toBe('A')
    expect(subjectStyleFor('2026-10-29')).toBe('A')
    expect(subjectStyleFor('2026-10-30')).toBe('A')
  })
})

describe('style B: the lead headline and a count', () => {
  it('uses the headline as written when it fits', () => {
    const top = [pick({ title: 'Audax raises $6.3B for private debt', firmName: 'Audax Private Debt', fundSizeUsdMillions: 6300, closeType: 'final_close' })]
    expect(buildHeadlineSubject(top, 48)).toBe('Audax raises $6.3B for private debt, plus 47 more')
    expect(buildHeadlineSubject(top, 1)).toBe('Audax raises $6.3B for private debt')
  })

  it('takes the outlet’s tag and a closing full stop off the headline', () => {
    expect(subjectHeadline('EQT targets €21bn for seventh infrastructure fund - IPE Real Assets', ['PE Hub', 'IPE Real Assets'])).toBe('EQT targets €21bn for seventh infrastructure fund')
    expect(subjectHeadline('Ares closes fund.', ['PE Hub'])).toBe('Ares closes fund')
    // A dash that is part of the headline stays.
    expect(subjectHeadline('KKR buys stake - and more', ['PE Hub'])).toBe('KKR buys stake - and more')
  })

  it('a story with no amount: the headline, cut at a word when it is long', () => {
    const top = [pick({ title: 'Blackstone names longtime credit executive as new global head of insurance solutions and asset-backed finance', firmName: 'Blackstone' }, 'people_moves', 'People Moves')]
    const s = buildHeadlineSubject(top, 30)!
    expect(s.length).toBeLessThanOrEqual(SUBJECT_MAX_CHARS)
    expect(s).toMatch(/^Blackstone names longtime credit executive .*…, plus 29 more$/)
    expect(s).not.toMatch(/\b(as|of|and|the)…/)
  })

  it('a long headline with a figure: the firm, its figure and stage, in the kicker’s words', () => {
    const top = [pick({ title: 'Audax Private Credit blows past its target to close its seventh senior debt fund on $6.3 billion after a year on the road', firmName: 'Audax Private Credit, LLC', fundSizeUsdMillions: 6300, closeType: 'final_close' })]
    expect(buildHeadlineSubject(top, 48)).toBe('Audax Private Credit: $6.3B final close, plus 47 more')
  })

  it('a long firm name falls back to the cut headline, still under the limit', () => {
    const top = [pick({
      title: 'The Teacher Retirement System of Texas Private Markets Opportunity Vehicle closes its continuation fund on $2.1bn',
      firmName: 'The Teacher Retirement System of Texas Private Markets Opportunity Vehicle', fundSizeUsdMillions: 2100, closeType: 'final_close',
    })]
    const s = buildHeadlineSubject(top, 12)!
    expect(s.length).toBeLessThanOrEqual(SUBJECT_MAX_CHARS)
    expect(s.endsWith('…, plus 11 more')).toBe(true)
    expect(s.startsWith('The Teacher Retirement System of Texas')).toBe(true)
  })

  it('no top story: no style B subject (the edition goes out with style A)', () => {
    expect(buildHeadlineSubject([], 5)).toBeNull()
  })

  it('under style B the preview text starts at the second story', () => {
    const lead = pick({ title: 'Lead story' })
    const second = pick({ title: 'Second story' })
    second.article.id = 'second'
    const groups = [{ category: 'credit', label: 'Credit', articles: [lead.article, second.article] }]
    expect(buildPreheader([lead, second], groups, 2)).toBe('Lead story · Second story')
    expect(buildPreheader([lead, second], groups, 2, true)).toBe('Second story')
  })
})
