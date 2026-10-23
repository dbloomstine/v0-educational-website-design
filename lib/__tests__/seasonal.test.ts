import { describe, it, expect } from 'vitest'
import { seasonOn, SEASONS, SEASON_SCRIPT, todayInNewYork } from '@/lib/seasonal'
import { seasonalFundOps } from '@/lib/newsletter/email-template'

describe('holiday marks', () => {
  it('names the season on each date, inclusive, and nothing between seasons', () => {
    expect(seasonOn('2026-10-20')).toBeNull()
    expect(seasonOn('2026-10-21')).toBe('halloween')
    expect(seasonOn('2026-10-31')).toBe('halloween')
    expect(seasonOn('2026-11-01')).toBe('thanksgiving')
    expect(seasonOn('2026-11-27')).toBe('thanksgiving')
    expect(seasonOn('2026-11-28')).toBeNull()
    expect(seasonOn('2026-12-04')).toBe('hanukkah')
    expect(seasonOn('2026-12-13')).toBe('christmas')
    expect(seasonOn('2026-12-27')).toBeNull()
    expect(seasonOn('2026-10-25T11:30:00Z')).toBe('halloween')
  })
  it('no two seasons overlap', () => {
    const s = [...SEASONS].sort((a, b) => a.from.localeCompare(b.from))
    for (let i = 1; i < s.length; i++) expect(s[i].from > s[i - 1].to).toBe(true)
  })
  it('the email swaps the O for the picture on holiday dates, keeping "O" for text-only readers', () => {
    expect(seasonalFundOps('2026-10-20')).toBe('FundOps')
    const h = seasonalFundOps('2026-10-28')
    // Outlook on Windows gets the letter; everyone else the mark, with "O" as its alt text in the wordmark's type.
    expect(h).toMatch(/^Fund<!--\[if mso\]>O<!\[endif\]--><!--\[if !mso\]><!--><img src="https:\/\/fundopshq\.com\/seasonal\/o-pumpkin\.png" alt="O" width="34" height="30"/)
    expect(h).toMatch(/style="[^"]*font-family:Georgia[^"]*font-size:34px/)
    expect(h.endsWith('<!--<![endif]-->ps')).toBe(true)
    // Images off and the comments read as nothing, the word is whole.
    expect(h.replace(/<!--\[if !mso\]><!-->.*?<!--<!\[endif\]-->/, '').replace(/<!--\[if mso\]>(.*?)<!\[endif\]-->/, '$1')).toBe('FundOps')
  })
  it('today in New York is YYYY-MM-DD from the date parts, across midnight UTC', () => {
    expect(todayInNewYork(new Date('2026-10-22T02:30:00Z'))).toBe('2026-10-21')
    expect(todayInNewYork(new Date('2026-10-22T05:00:00Z'))).toBe('2026-10-22')
  })
  it('the head script sets the season, and clears it on a plain day', () => {
    const run = (iso: string, search = '') => {
      const attrs: Record<string, string> = {}
      const doc = { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v), removeAttribute: (k: string) => delete attrs[k] } }
      const RealDate = Date
      const fake = class extends RealDate { constructor(...a: unknown[]) { super(...((a.length ? a : [iso]) as [string])) } }
      new Function('document', 'location', 'Date', SEASON_SCRIPT)(doc, { search }, fake)
      return attrs['data-season'] ?? null
    }
    expect(run('2026-10-25T15:00:00Z')).toBe('halloween')
    expect(run('2026-10-20T15:00:00Z')).toBeNull()
    expect(run('2026-11-02T15:00:00Z')).toBe('thanksgiving')
    expect(run('2026-10-20T15:00:00Z', '?season=christmas')).toBe('christmas')
  })
  it('the head script carries every window and the ?season override', () => {
    for (const s of SEASONS) expect(SEASON_SCRIPT).toContain(s.from)
    expect(SEASON_SCRIPT).toContain("get('season')")
  })
})

describe('the seasonal O in a whole edition', () => {
  it('survives the comment stripping: the mark for most clients, the letter for Outlook', async () => {
    const { renderNewsletterEmail } = await import('@/lib/newsletter/email-template')
    const html = renderNewsletterEmail({ groups: [], totalArticles: 0, editionDate: '2026-10-28', unsubscribeUrl: 'https://example.com/u' })
    expect(html).toContain('Fund<!--[if mso]>O<![endif]--><!--[if !mso]><!--><img src="https://fundopshq.com/seasonal/o-pumpkin.png" alt="O"')
    expect(html).toMatch(/<!--<!\[endif\]-->ps<\/span>/)
  })
})
