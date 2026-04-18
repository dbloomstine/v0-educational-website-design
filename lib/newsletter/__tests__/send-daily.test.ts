import { describe, it, expect } from 'vitest'
import { buildSubject } from '../send-daily'

function group(category: string, articles: Array<Record<string, unknown>>) {
  return {
    category,
    label: category,
    articles: articles.map((a) => ({
      title: '',
      firmName: null,
      fundName: null,
      fundSizeUsdMillions: null,
      eventType: null,
      ...a,
    })),
  } as {
    category: string
    label: string
    articles: {
      title: string
      firmName: string | null
      fundName?: string | null
      fundSizeUsdMillions: number | null
      eventType: string | null
    }[]
  }
}

describe('buildSubject', () => {
  it('picks the biggest GP fund close and includes the size hint', () => {
    const subject = buildSubject({
      totalArticles: 5,
      groups: [
        group('PE', [
          {
            firmName: 'Adams Street Partners',
            fundName: 'Private Credit III',
            fundSizeUsdMillions: 7500,
            eventType: 'fund_close',
          },
          {
            firmName: 'Apollo',
            fundName: 'Apollo Credit Fund',
            fundSizeUsdMillions: 3000,
            eventType: 'fund_close',
          },
        ]),
      ],
    })
    expect(subject).toBe('Adams Street Partners $7.5B · + 4 more moves')
  })

  it('drops AUM-leak candidates (>$30B, no fund name) from subject selection', () => {
    // Regression: 2026-04-10 "Ares Management Corp $623B" — that article's
    // fund_size_usd_millions was 623000 (Ares AUM) on an executive_hire
    // story. And 2026-04-09 "Lemssouguer Fund $20B" profile piece.
    // Safety rail: size > $30B + no fund_name → drop from subject.
    const subject = buildSubject({
      totalArticles: 5,
      groups: [
        group('PE', [
          {
            firmName: 'Ares Management Corp',
            fundName: null,
            fundSizeUsdMillions: 623000,
            eventType: 'capital_raise',
          },
          {
            firmName: 'Court Square Capital',
            fundName: 'Court Square Capital Fund V',
            fundSizeUsdMillions: 3800,
            eventType: 'capital_raise',
          },
        ]),
      ],
    })
    // The $623B row is dropped; Court Square becomes the headline.
    expect(subject).toContain('Court Square Capital')
    expect(subject).not.toContain('Ares Management Corp')
    expect(subject).not.toContain('$623B')
  })

  it('keeps genuine mega-funds when fund_name is present', () => {
    // If the classifier legitimately extracts a fund_name, the >$30B
    // rule should NOT fire — real mega-funds exist and will always be
    // named in the source article.
    const subject = buildSubject({
      totalArticles: 1,
      groups: [
        group('PE', [
          {
            firmName: 'Blackstone',
            fundName: 'Blackstone Real Estate Partners X',
            fundSizeUsdMillions: 40000,
            eventType: 'fund_close',
          },
        ]),
      ],
    })
    expect(subject).toContain('Blackstone')
    expect(subject).toContain('$40B')
  })

  it('skips LP commitments when selecting the headline', () => {
    const subject = buildSubject({
      totalArticles: 2,
      groups: [
        group('lp_commitments', [
          {
            firmName: 'Arkansas Teacher Retirement System',
            fundName: null,
            fundSizeUsdMillions: 200,
            eventType: 'capital_raise',
          },
        ]),
        group('PE', [
          {
            firmName: 'Thoma Bravo',
            fundName: 'Thoma Bravo Fund XVI',
            fundSizeUsdMillions: 24000,
            eventType: 'fund_close',
          },
        ]),
      ],
    })
    expect(subject).toContain('Thoma Bravo')
  })

  it('falls back to story count when nothing qualifies', () => {
    const subject = buildSubject({
      totalArticles: 7,
      groups: [
        group('people_moves', [
          {
            firmName: 'KKR',
            fundName: null,
            fundSizeUsdMillions: null,
            eventType: 'executive_hire',
          },
        ]),
      ],
    })
    expect(subject).toBe('7 moves across private markets')
  })
})
