import { describe, it, expect } from 'vitest'
import {
  storyFingerprints,
  priorFundEvent,
  matchesPriorFundEvent,
  capPerFirm,
  isLpCommitment,
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
    closeType: null,
    coFirms: [],
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

describe('extended fund-event lookback (relative size matching)', () => {
  const prior = (firm: string, evt: string, size: number | null) =>
    priorFundEvent(firm, evt, size)!

  it('catches the Conifer $900M close re-running ~9 editions later', () => {
    // Regression: the same $900M close ran on 6/18 and again as the 6/27
    // subject line — beyond the 3-edition window.
    const published = [prior('Conifer Infrastructure', 'fund_close', 900)]
    const repeat = priorFundEvent('Conifer Infrastructure', 'fund_close', 900)
    expect(matchesPriorFundEvent(repeat, published)).toBe(true)
  })

  it('catches the HarbourVest raise restated at a rounded-down size', () => {
    // Regression, 2026-07: "$4.75 billion" close on 7/11 and "tops $4B" raise
    // on 7/16 are the same vehicle. The old $500M buckets put them in the
    // $5,000M and $4,000M bands respectively, so the repeat sailed through.
    const published = [prior('HarbourVest', 'fund_close', 4750)]
    const repeat = priorFundEvent('HarbourVest Partners', 'capital_raise', 4000)
    expect(matchesPriorFundEvent(repeat, published)).toBe(true)
  })

  it('treats close, launch and raise as the same underlying event', () => {
    const published = [prior('Acme Capital', 'fund_close', 1000)]
    expect(
      matchesPriorFundEvent(priorFundEvent('Acme Capital', 'capital_raise', 1000), published)
    ).toBe(true)
    expect(
      matchesPriorFundEvent(priorFundEvent('Acme Capital', 'fund_launch', 1000), published)
    ).toBe(true)
  })

  it('keeps a first close and a final close of the same fund distinct by size', () => {
    // A $400M first close followed weeks later by a $900M final close are
    // genuinely different events (55% apart) and must NOT be collapsed.
    const published = [prior('Acme Capital', 'fund_close', 400)]
    const finalClose = priorFundEvent('Acme Capital', 'fund_close', 900)
    expect(matchesPriorFundEvent(finalClose, published)).toBe(false)
  })

  it('does not collapse different firms at the same size', () => {
    const published = [prior('Acme Capital', 'fund_close', 1000)]
    expect(
      matchesPriorFundEvent(priorFundEvent('Beta Partners', 'fund_close', 1000), published)
    ).toBe(false)
  })

  it('ignores non-fund-activity events and unusable rows', () => {
    expect(priorFundEvent('Acme Capital', 'executive_hire', 900)).toBeNull()
    expect(priorFundEvent('Acme Capital', 'fund_close', null)).toBeNull()
    expect(priorFundEvent('Acme Capital', 'fund_close', 0)).toBeNull()
    expect(priorFundEvent(null, 'fund_close', 900)).toBeNull()
    expect(priorFundEvent('', 'fund_close', 900)).toBeNull()
    expect(matchesPriorFundEvent(null, [prior('Acme Capital', 'fund_close', 900)])).toBe(false)
  })
})

describe('isLpCommitment — compound pension acronyms', () => {
  const lp = (firmName: string, title = '') =>
    isLpCommitment(makeArticle({ firmName, title, eventType: 'capital_raise' }))

  it('recognizes acronyms welded onto a state or city prefix', () => {
    // Regression 2026-08-08: "NYSTRS sets private debt pacing for 2027" was
    // classified as Private Equity fund activity and ran as the subject line
    // with a $1.3B pill — an LP pacing plan presented as a fund close. The
    // bare \bSTRS\b pattern cannot match inside "NYSTRS".
    expect(lp('NYSTRS')).toBe(true)
    expect(lp('OPERS')).toBe(true)
    expect(lp('MOSERS')).toBe(true)
    expect(lp('LACERS')).toBe(true)
    expect(lp('MassPRIM')).toBe(true)
    expect(lp('STRS Ohio')).toBe(true)
  })

  it('still recognizes spelled-out and previously-covered names', () => {
    expect(lp('Arkansas Teacher Retirement System')).toBe(true)
    expect(lp('CalPERS')).toBe(true)
    expect(lp('Illinois Teachers')).toBe(true)
    expect(lp('Texas TRS')).toBe(true)
  })

  it('does not misread ordinary firm names ending in those letters', () => {
    // The pattern is case-sensitive precisely to keep these out.
    expect(lp('Developers Capital')).toBe(false)
    expect(lp('Helpers Fund')).toBe(false)
    expect(lp('Vipers Capital')).toBe(false)
    expect(lp('KKR')).toBe(false)
    expect(lp('Blackstone')).toBe(false)
  })

  it('only applies to capital_raise events', () => {
    expect(
      isLpCommitment(makeArticle({ firmName: 'NYSTRS', eventType: 'fund_close' }))
    ).toBe(false)
  })
})

describe('capPerFirm', () => {
  const article = (id: string, firm: string | null, size: number | null) =>
    ({
      id,
      title: `${firm ?? 'Unknown'} story ${id}`,
      sourceUrl: '', sourceName: 'Test', publishedDate: null,
      articleType: 'fund_close', eventType: 'fund_close',
      fundCategories: ['PE'], isHighSignal: false, relevanceScore: 0.5,
      tldr: null, firmName: firm, firmDomain: null, fundName: null,
      fundSizeUsdMillions: size, fundStrategy: null, geography: [],
      personName: null, personTitle: null, closeType: null,
      coFirms: [], alsoCoveredBy: [],
    }) as NewsletterArticle

  it('keeps at most two stories per firm, highest priority first', () => {
    const kept = capPerFirm([
      article('a', 'KKR', 10000),
      article('b', 'KKR', 5000),
      article('c', 'KKR', 100),
      article('d', 'KKR', 50),
    ])
    expect(kept).toHaveLength(2)
    expect(kept.map((a) => a.id)).toEqual(['a', 'b'])
  })

  it('normalizes firm variants to the same cap bucket', () => {
    const kept = capPerFirm([
      article('a', 'HarbourVest', 4750),
      article('b', 'HarbourVest Partners', 4000),
      article('c', 'HarbourVest Partners LLC', 900),
    ])
    expect(kept).toHaveLength(2)
  })

  it('never caps articles with no extractable firm', () => {
    const kept = capPerFirm([
      article('a', null, 100),
      article('b', null, 200),
      article('c', null, 300),
    ])
    expect(kept).toHaveLength(3)
  })

  it('leaves other firms untouched', () => {
    const kept = capPerFirm([
      article('a', 'KKR', 10000),
      article('b', 'KKR', 5000),
      article('c', 'KKR', 100),
      article('d', 'Small Manager', 40),
    ])
    expect(kept.map((a) => a.id).sort()).toEqual(['a', 'b', 'd'])
  })
})
