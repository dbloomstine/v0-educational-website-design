import { describe, it, expect } from 'vitest'
import { buildSubject, subjectFirmName, resolveLookback } from '../send-daily'

/** Minimal supabase stub returning the given date as the last 'sent' edition. */
function dbWithLastSent(lastSent: string | null) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    lt: () => chain,
    order: () => chain,
    limit: () => Promise.resolve({ data: lastSent ? [{ edition_date: lastSent }] : [] }),
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { from: () => chain } as any
}

describe('resolveLookback', () => {
  it('leaves the normal daily cadence alone', async () => {
    expect(await resolveLookback(dbWithLastSent('2026-08-07'), '2026-08-08', 26)).toBe(26)
  })

  it('widens to cover a multi-day gap', async () => {
    // Regression: the 2026-08-04 → 08-08 outage. The next edition ran a 26h
    // window and could never reach the four days of news it had missed.
    expect(await resolveLookback(dbWithLastSent('2026-08-04'), '2026-08-09', 26)).toBe(5 * 24 + 2)
  })

  it('never narrows an explicit override', async () => {
    expect(await resolveLookback(dbWithLastSent('2026-08-07'), '2026-08-08', 120)).toBe(120)
  })

  it('caps the catch-up window at a week', async () => {
    expect(await resolveLookback(dbWithLastSent('2026-05-01'), '2026-08-08', 26)).toBe(168)
  })

  it('falls back to the requested window with no prior edition', async () => {
    expect(await resolveLookback(dbWithLastSent(null), '2026-08-08', 26)).toBe(26)
  })
})

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
  it('lists firms, biggest GP fund close first, then the count of the rest', () => {
    const subject = buildSubject({
      totalArticles: 5,
      groups: [
        group('PE', [
          { firmName: 'Apollo', fundName: 'Apollo Credit Fund', fundSizeUsdMillions: 3000, eventType: 'fund_close' },
          { firmName: 'Adams Street Partners', fundName: 'Private Credit III', fundSizeUsdMillions: 7500, eventType: 'fund_close' },
        ]),
        group('deals', [{ firmName: 'Blackstone', eventType: 'acquisition' }]),
      ],
    })
    expect(subject).toBe('Adams Street Partners, Apollo, Blackstone + 2 more')
  })

  it('ranks closes over launches over raises, then by size', () => {
    const subject = buildSubject({
      totalArticles: 3,
      groups: [
        group('credit', [
          { firmName: 'HarbourVest Partners', fundSizeUsdMillions: 2400, eventType: 'capital_raise' },
          { firmName: 'EQT', fundSizeUsdMillions: 0, eventType: 'fund_launch' },
          { firmName: 'Arini', fundSizeUsdMillions: 4000, eventType: 'fund_close' },
        ]),
      ],
    })
    expect(subject).toBe('Arini, EQT, HarbourVest Partners')
  })

  it('demotes AUM-leak rows (>$30B, no fund name) instead of letting them lead', () => {
    // Regression: 2026-04-10 "Ares Management Corp $623B" — firm AUM on an
    // executive_hire story. The firm may still appear, but never on "size".
    const subject = buildSubject({
      totalArticles: 3,
      groups: [
        group('PE', [
          { firmName: 'Ares Management Corp', fundName: null, fundSizeUsdMillions: 623000, eventType: 'capital_raise' },
          { firmName: 'Court Square Capital', fundName: 'Court Square Capital Fund V', fundSizeUsdMillions: 3800, eventType: 'capital_raise' },
        ]),
      ],
    })
    expect(subject.startsWith('Court Square Capital, Ares Management')).toBe(true)
    expect(subject).not.toContain('$')
  })

  it('keeps genuine mega-funds when fund_name is present', () => {
    const subject = buildSubject({
      totalArticles: 2,
      groups: [
        group('PE', [
          { firmName: 'Thoma Bravo', fundName: 'Thoma Bravo XVI', fundSizeUsdMillions: 24000, eventType: 'fund_close' },
          { firmName: 'Blackstone', fundName: 'Blackstone Real Estate Partners X', fundSizeUsdMillions: 40000, eventType: 'fund_close' },
        ]),
      ],
    })
    expect(subject).toBe('Blackstone, Thoma Bravo')
  })

  it('puts LP commitments last, after GP events and deals', () => {
    const subject = buildSubject({
      totalArticles: 3,
      groups: [
        group('lp_commitments', [{ firmName: 'Arkansas Teacher Retirement System', fundSizeUsdMillions: 200, eventType: 'capital_raise' }]),
        group('deals', [{ firmName: 'Audax', eventType: 'acquisition' }]),
        group('PE', [{ firmName: 'Thoma Bravo', fundSizeUsdMillions: 100, eventType: 'capital_raise' }]),
      ],
    })
    expect(subject).toBe('Thoma Bravo, Audax, Arkansas Teacher Retirement System')
  })

  it('dedups repeated firms and strips legal suffixes and internal commas', () => {
    const subject = buildSubject({
      totalArticles: 4,
      groups: [
        group('people_moves', [
          { firmName: 'Reed Smith LLP', eventType: 'executive_hire' },
          { firmName: 'Reed Smith', eventType: 'executive_hire' },
          { firmName: 'Clayton, Dubilier & Rice, LLC', eventType: 'executive_hire' },
          { firmName: 'Cerberus Capital Management, L.P.', eventType: 'executive_hire' },
        ]),
      ],
    })
    // Three names would run to 73 chars, past the 70-char budget, so the third drops.
    expect(subject).toBe('Reed Smith, Clayton Dubilier & Rice + 2 more')
    expect(subjectFirmName('Cerberus Capital Management, L.P.')).toBe('Cerberus Capital Management')
    expect(subjectFirmName('Apollo Global Management, Inc.')).toBe('Apollo Global Management')
    expect(subjectFirmName('Permira')).toBe('Permira')
  })

  it('stays within the inbox budget and always names at least one firm', () => {
    const long = Array.from({ length: 8 }, (_, i) => ({ firmName: `Very Long Firm Name Number ${i + 1} Partners`, eventType: 'fund_close', fundSizeUsdMillions: 100 - i }))
    const subject = buildSubject({ totalArticles: 44, groups: [group('PE', long)] })
    expect(subject.length).toBeLessThanOrEqual(70 + 10)
    expect(subject.startsWith('Very Long Firm Name Number 1 Partners')).toBe(true)
    expect(subject).toMatch(/\+ \d+ more$/)
  })

  it('falls back to a count when no article names a firm', () => {
    expect(buildSubject({ totalArticles: 7, groups: [group('PE', [{ firmName: null, eventType: 'fund_close' }])] })).toBe('7 moves across private markets')
  })
})
