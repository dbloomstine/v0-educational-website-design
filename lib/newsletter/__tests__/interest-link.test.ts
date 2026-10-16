import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { interestLink, makeInterestToken, readInterestToken } from '../interest-link'
import { EMAIL_FOLLOW_ROW, SECTION_INTERESTS, interestSections, interestWords, sanitizeInterests } from '../interests'
import { pullFollowed } from '../personalize'
import { renderFollowRow } from '../email-template'
import type { ArticleGroup, NewsletterArticle } from '../query-articles'

const KEY = 'test-secret'
const ID = '0b2c6b1a-9f3e-4c1d-8a7b-1234567890ab'

describe('the one-click follow token', () => {
  it('names the reader, is signed, and reads back only as made', () => {
    const t = makeInterestToken(ID, KEY)!
    expect(t.startsWith(`${ID}.`)).toBe(true)
    expect(readInterestToken(t, KEY)).toBe(ID)
    expect(readInterestToken(t, 'another-key')).toBeNull()
    expect(readInterestToken(t.slice(0, -1) + (t.endsWith('A') ? 'B' : 'A'), KEY)).toBeNull()
    expect(readInterestToken(`${ID}.`, KEY)).toBeNull()
    expect(readInterestToken(`${t}.extra`, KEY)).toBeNull()
    expect(readInterestToken(ID, KEY)).toBeNull()
    expect(readInterestToken(42, KEY)).toBeNull()
  })
  it('is never made without a secret or for something that is not a subscriber id', () => {
    expect(makeInterestToken(ID, '')).toBeNull()
    expect(makeInterestToken('reader@firm.com', KEY)).toBeNull()
    expect(readInterestToken(makeInterestToken(ID, KEY), '')).toBeNull()
  })
  it('is not a preferences ticket: the two signatures differ for the same id', () => {
    const t = makeInterestToken(ID, KEY)!
    expect(t.split('.')[1]).not.toBe(createHmac('sha256', KEY).update(ID).digest('base64url'))
  })
  it('makes the link for one interest', () => {
    expect(interestLink('abc.def', 'real_estate')).toBe('https://fundopshq.com/api/newsletter/interest?t=abc.def&i=real_estate')
  })
})

describe('the section interests', () => {
  it('are saved like the others and pull their section whole', () => {
    expect(sanitizeInterests(['people', 'PE', 'nope', 'lps'])).toEqual(['PE', 'lps', 'people'])
    expect([...interestSections(['people', 'regulation', 'PE'])]).toEqual(['people_moves', 'regulatory'])
    expect(interestWords(['lps', 'people'])).toBe('LPs and people moves')
    expect(EMAIL_FOLLOW_ROW.map((f) => f.id)).toEqual(['PE', 'credit', 'VC', 'real_estate', 'infrastructure', 'secondaries', 'lps', 'people', 'regulation'])
    for (const f of EMAIL_FOLLOW_ROW) expect(sanitizeInterests([f.id])).toEqual([f.id])
    expect(SECTION_INTERESTS.every((s) => s.sections?.length)).toBe(true)
  })
  it('a reader who follows people moves gets that section under "What you follow"', () => {
    const a = (id: string, cats: string[] = []): NewsletterArticle => ({ id, title: id, sourceUrl: '', sourceName: null, publishedDate: null, articleType: null, eventType: null, fundCategories: cats, isHighSignal: false, relevanceScore: null, tldr: null, firmName: null, firmDomain: null, fundName: null, fundSizeUsdMillions: null, fundStrategy: null, geography: [], personName: null, personTitle: null, closeType: null, coFirms: [], alsoCoveredBy: [], headlineEntities: [], entityKeys: [], personKeys: [], leadEligible: true })
    const sections: ArticleGroup[] = [
      { category: 'PE', label: 'Private Equity', articles: [a('pe1', ['PE'])] },
      { category: 'people_moves', label: 'People Moves', articles: [a('p1'), a('p2')] },
    ]
    const { followed, sections: rest } = pullFollowed(sections, ['people'])
    expect(followed?.articles.map((x) => x.id)).toEqual(['p1', 'p2'])
    expect(rest.map((g) => g.category)).toEqual(['PE'])
  })
})

describe('the row in the email', () => {
  it('appears for a reader with a token and no choices, one link per interest, and not otherwise', () => {
    const html = renderFollowRow('tok.sig', undefined)
    expect(html).toContain('One click and it leads your edition. Follow:')
    for (const f of EMAIL_FOLLOW_ROW) expect(html).toContain(`href="https://fundopshq.com/api/newsletter/interest?t=tok.sig&amp;i=${f.id}"`)
    expect(html.match(/<a /g)).toHaveLength(9)
    expect(renderFollowRow('tok.sig', ['PE'])).toBe('')
    expect(renderFollowRow(undefined, [])).toBe('')
    expect(renderFollowRow('', [])).toBe('')
  })
})
