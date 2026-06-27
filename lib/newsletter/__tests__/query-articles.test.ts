import { describe, it, expect } from 'vitest'
import {
  storyFingerprints,
  closeEventFingerprint,
  isLikelyAumLeak,
  FUND_SIZE_SANITY_CEILING_MILLIONS,
  deduplicateAcrossSections,
  type NewsletterArticle,
  type ArticleGroup,
} from '../query-articles'

function makeArticle(overrides: Partial<NewsletterArticle>): NewsletterArticle {
  return {
    id: crypto.randomUUID(),
    title: '',
    sourceUrl: 'https://example.com/x',
    sourceName: 'Example',
    publishedDate: null,
    articleType: null,
    eventType: null,
    fundCategories: [],
    isHighSignal: false,
    relevanceScore: null,
    tldr: null,
    firmName: null,
    firmDomain: null,
    fundName: null,
    fundSizeUsdMillions: null,
    fundStrategy: null,
    geography: [],
    personName: null,
    personTitle: null,
    alsoCoveredBy: [],
    ...overrides,
  }
}

describe('storyFingerprints', () => {
  it('emits firm|fund when fund name is present', () => {
    const fps = storyFingerprints('Adams Street Partners', 'Private Credit III', 'fund_close', 7500)
    expect(fps).toContain('adams street|private credit iii')
  })

  it('emits a firm|event|bucketed-size key so asymmetric-fund-name articles still dedup', () => {
    // Regression: 2026-04-14 → 2026-04-15 Adams Street repeat.
    // 4/14 row had fund_name="Private Credit III", 4/15 had fund=null.
    // Old fingerprint emitted either `firm|fund` or `firm|event` but not
    // both, so the asymmetric case slipped through. With the size-
    // bucketed key added, both sides emit `adams street|fund_close|7500`
    // and the second-day article is caught by the prior-edition set.
    const dayOne = storyFingerprints(
      'Adams Street Partners',
      'Private Credit III',
      'fund_close',
      7500
    )
    const dayTwo = storyFingerprints('Adams Street Partners', null, 'fund_close', 7500)
    const intersection = dayOne.filter((k) => dayTwo.includes(k))
    expect(intersection.length).toBeGreaterThan(0)
  })

  it('buckets sizes to 500M bands so small drift does not break the match', () => {
    // "$7.5bn" and "$7.3bn" in two different outlets should still match.
    const a = storyFingerprints('Ares', null, 'fund_close', 7500)
    const b = storyFingerprints('Ares', null, 'fund_close', 7300)
    expect(a.filter((k) => b.includes(k)).length).toBeGreaterThan(0)
  })

  it('does not match across very different sizes at the same firm', () => {
    // $2B vs $10B at the same firm are clearly different funds.
    const a = storyFingerprints('Apollo', null, 'fund_close', 2000)
    const b = storyFingerprints('Apollo', null, 'fund_close', 10000)
    expect(a.filter((k) => b.includes(k)).length).toBe(0)
  })

  it('returns [] when firm name is missing', () => {
    expect(storyFingerprints(null, 'Fund X', 'fund_close', 1000)).toEqual([])
    expect(storyFingerprints('', 'Fund X', 'fund_close', 1000)).toEqual([])
  })

  it('falls back to firm|event for exec moves with no fund or size', () => {
    const fps = storyFingerprints('KKR', null, 'executive_hire', null)
    expect(fps).toEqual(['kkr|executive_hire'])
  })

  it('normalizes Partners-Group-style all-noise firm names so fingerprints are non-empty', () => {
    // Pairs with the normalizeFirmName empty-string-fallback fix.
    const fps = storyFingerprints('Partners Group', null, 'capital_raise', 9000)
    expect(fps.length).toBeGreaterThan(0)
    expect(fps[0].startsWith('partners group|')).toBe(true)
  })
})

describe('isLikelyAumLeak', () => {
  it('flags oversize unnamed funds as AUM leaks', () => {
    // 2026-04-18 regression: Nest/Crescent private credit mandate row
    // showed "$81B" pill — classifier put £60bn firm AUM into
    // fund_size_usd_millions on an unnamed mandate story.
    expect(isLikelyAumLeak(81000, null)).toBe(true)
    expect(isLikelyAumLeak(81000, undefined)).toBe(true)
    // Prior incidents: Ares $623B exec hire, Lemssouguer $20B... wait
    // $20B would NOT flag since < $30B ceiling. Lemssouguer leak was
    // caught by the subject-line event-type filter, not this rail.
    expect(isLikelyAumLeak(623000, null)).toBe(true)
  })

  it('does not flag legitimate large named funds', () => {
    // Large named funds can legitimately exceed $30B (very rare but
    // real — Blackstone flagship buyout fund, GPIF mandates, etc.).
    expect(isLikelyAumLeak(50000, 'Blackstone Capital Partners IX')).toBe(false)
    expect(isLikelyAumLeak(100000, 'GPIF Alternatives Mandate')).toBe(false)
  })

  it('does not flag normal-sized unnamed funds', () => {
    expect(isLikelyAumLeak(1000, null)).toBe(false)
    expect(isLikelyAumLeak(FUND_SIZE_SANITY_CEILING_MILLIONS, null)).toBe(false)
    expect(isLikelyAumLeak(FUND_SIZE_SANITY_CEILING_MILLIONS + 1, null)).toBe(true)
  })

  it('does not flag null or zero size', () => {
    expect(isLikelyAumLeak(null, null)).toBe(false)
    expect(isLikelyAumLeak(0, null)).toBe(false)
    expect(isLikelyAumLeak(undefined, null)).toBe(false)
  })
})

describe('deduplicateAcrossSections', () => {
  it('collapses the 2026-04-18 sovereign-fund consortium cross-section clone', () => {
    // Same $1B PE platform story classified into two sections because
    // the classifier extracted different firm names: "China Sovereign
    // Fund" on the PE-section article, "China State Pension Fund" on
    // the LP-commitments article. Firm strings share no tokens past
    // "china" so isSameStory correctly refused to merge pre-section.
    // The cross-section pass catches this via size + title Jaccard.
    const peRow = makeArticle({
      title: 'Sovereign funds from China, Indonesia, Azerbaijan team up to launch $1B PE fund',
      firmName: 'China Sovereign Fund',
      fundSizeUsdMillions: 1000,
      sourceName: 'TNGlobal',
    })
    const lpRow = makeArticle({
      title: 'Wealth funds of China, Indonesia, Azerbaijan launch $1b PE platform',
      firmName: 'China State Pension Fund',
      fundSizeUsdMillions: 1000,
      sourceName: 'DealStreetAsia',
    })
    const groups: ArticleGroup[] = [
      { category: 'PE', label: 'Private Equity', articles: [peRow] },
      { category: 'lp_commitments', label: 'LP Commitments', articles: [lpRow] },
    ]

    deduplicateAcrossSections(groups)

    expect(groups[0].articles).toHaveLength(1)
    expect(groups[1].articles).toHaveLength(0)
    expect(groups[0].articles[0].id).toBe(peRow.id)
    // alsoCoveredBy should have absorbed the LP-row source
    expect(groups[0].articles[0].alsoCoveredBy).toContain('DealStreetAsia')
  })

  it('leaves unrelated stories across sections alone', () => {
    const a = makeArticle({
      title: 'KKR raises $23bn for North America Fund XIV',
      firmName: 'KKR',
      fundSizeUsdMillions: 23000,
    })
    const b = makeArticle({
      title: 'Arkansas Teachers commits $900M to alternatives',
      firmName: 'Arkansas Teachers Retirement System',
      fundSizeUsdMillions: 900,
    })
    const groups: ArticleGroup[] = [
      { category: 'PE', label: 'Private Equity', articles: [a] },
      { category: 'lp_commitments', label: 'LP Commitments', articles: [b] },
    ]

    deduplicateAcrossSections(groups)

    expect(groups[0].articles).toHaveLength(1)
    expect(groups[1].articles).toHaveLength(1)
  })

  it('does not dedup stories at coincident sizes when titles are dissimilar', () => {
    // Two unrelated $1B raises on the same day — sizes match but
    // title Jaccard is low. Must stay separate.
    const a = makeArticle({
      title: 'Apollo closes $1B credit fund',
      firmName: 'Apollo',
      fundSizeUsdMillions: 1000,
    })
    const b = makeArticle({
      title: 'Carlyle wraps $1B secondaries vehicle',
      firmName: 'Carlyle',
      fundSizeUsdMillions: 1000,
    })
    const groups: ArticleGroup[] = [
      { category: 'credit', label: 'Credit', articles: [a] },
      { category: 'secondaries', label: 'Secondaries', articles: [b] },
    ]

    deduplicateAcrossSections(groups)

    expect(groups[0].articles).toHaveLength(1)
    expect(groups[1].articles).toHaveLength(1)
  })
})

describe('closeEventFingerprint (extended close/launch lookback)', () => {
  it('matches the size-bucketed key storyFingerprints emits for the same close', () => {
    // The extended-window dedup works only if a NEW article (fingerprinted via
    // storyFingerprints) collides with the strong key stored from an older
    // edition via closeEventFingerprint. They must agree byte-for-byte.
    const strong = closeEventFingerprint('Conifer Infrastructure', 'fund_close', 900)
    expect(strong).not.toBeNull()
    expect(strong!.endsWith('|fund_close|1000')).toBe(true) // 900 → $1000M band
    // The new article's full fingerprint set must include the strong key.
    expect(storyFingerprints('Conifer Infrastructure', null, 'fund_close', 900)).toContain(strong!)
  })

  it('catches the Conifer $900M close re-running ~9 editions later', () => {
    // Regression: the same $900M close ran on 6/18 and again as the 6/27
    // subject line — beyond the 3-edition window. The 14-edition close/launch
    // window keys both runs to the same fingerprint.
    const firstRun = closeEventFingerprint('Conifer Infrastructure', 'fund_close', 900)
    const secondRun = closeEventFingerprint('Conifer Infrastructure', 'fund_close', 900)
    expect(secondRun).toBe(firstRun)
  })

  it('keeps a first close and a final close of the same fund distinct by size', () => {
    // A $400M first close followed weeks later by a $900M final close are
    // genuinely different events and must NOT be collapsed — they land in
    // different $500M bands.
    const firstClose = closeEventFingerprint('Acme Capital', 'fund_close', 400) // → 500 band
    const finalClose = closeEventFingerprint('Acme Capital', 'fund_close', 900) // → 1000 band
    expect(firstClose).not.toBe(finalClose)
  })

  it('returns null without a usable firm or size (the recent window covers those)', () => {
    expect(closeEventFingerprint('Acme Capital', 'fund_close', null)).toBeNull()
    expect(closeEventFingerprint('Acme Capital', 'fund_close', 0)).toBeNull()
    expect(closeEventFingerprint(null, 'fund_close', 900)).toBeNull()
    expect(closeEventFingerprint('', 'fund_close', 900)).toBeNull()
  })
})
