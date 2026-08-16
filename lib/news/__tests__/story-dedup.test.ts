import { describe, it, expect } from 'vitest'
import {
  normalizeFirmName,
  fundSizesMatch,
  titleJaccard,
  titlesShareSignificantNumber,
  isSameStory,
  type StoryCandidate,
} from '../story-dedup'

// ─── normalizeFirmName ──────────────────────────────────────────────────────

describe('normalizeFirmName', () => {
  it('strips common corporate suffixes', () => {
    expect(normalizeFirmName('Blackstone Group')).toBe('blackstone')
    expect(normalizeFirmName('Eclipse Ventures')).toBe('eclipse')
    expect(normalizeFirmName('Apollo Global Management')).toBe('apollo')
    expect(normalizeFirmName('Silver Lake Partners')).toBe('silver lake')
    expect(normalizeFirmName('The Carlyle Group')).toBe('carlyle')
  })

  it('collapses equivalent variations', () => {
    expect(normalizeFirmName('KKR')).toBe(normalizeFirmName('KKR & Co'))
    expect(normalizeFirmName('KKR')).toBe(normalizeFirmName('KKR & Company'))
    expect(normalizeFirmName('HIG Capital')).toBe(normalizeFirmName('HIG'))
  })

  it('keeps distinct firms distinct', () => {
    expect(normalizeFirmName('General Atlantic')).not.toBe(normalizeFirmName('General Catalyst'))
    expect(normalizeFirmName('KKR')).not.toBe(normalizeFirmName('KKR Credit Advisors'))
  })

  it('handles null and empty input', () => {
    expect(normalizeFirmName(null)).toBe('')
    expect(normalizeFirmName(undefined)).toBe('')
    expect(normalizeFirmName('')).toBe('')
  })

  it('falls back to descriptive tokens when every token is noise', () => {
    // Regression for 2026-04-18 "Partners Group $9B" quad-clone. Both
    // "partners" and "group" are in the descriptive-noise set, so the
    // aggressive pass stripped them all and the function returned "".
    // firmMatch in isSameStory then false-negatived and the same story
    // ran 4×. The two-pass normalizer keeps them when there's nothing
    // else left.
    expect(normalizeFirmName('Partners Group')).toBe('partners group')
    // Legal-form tokens always strip, so "Corporation" drops but the
    // distinctive pair survives.
    expect(normalizeFirmName('International Finance Corporation')).toBe(
      'international finance'
    )
    expect(normalizeFirmName('International Finance Corp')).toBe('international finance')
    expect(normalizeFirmName('International Finance Inc')).toBe('international finance')
    // Case and legal-form variations still collapse to the same key.
    expect(normalizeFirmName('Partners Group')).toBe(normalizeFirmName('PARTNERS GROUP'))
    expect(normalizeFirmName('Partners Group')).toBe(normalizeFirmName('Partners Group LLC'))
  })
})

// ─── fundSizesMatch ─────────────────────────────────────────────────────────

describe('fundSizesMatch', () => {
  it('matches values within 10%', () => {
    expect(fundSizesMatch(1100, 1200)).toBe(true) // €1bn → $1.1B vs $1.2B
    expect(fundSizesMatch(1000, 1050)).toBe(true)
    expect(fundSizesMatch(2000, 2000)).toBe(true)
  })

  it('rejects values outside 10%', () => {
    expect(fundSizesMatch(1000, 2000)).toBe(false)
    expect(fundSizesMatch(1000, 1200)).toBe(false) // 20% apart
  })

  it('rejects when either side is null', () => {
    expect(fundSizesMatch(null, 1000)).toBe(false)
    expect(fundSizesMatch(1000, null)).toBe(false)
    expect(fundSizesMatch(null, null)).toBe(false)
  })
})

// ─── isSameStory ────────────────────────────────────────────────────────────

function candidate(overrides: Partial<StoryCandidate>): StoryCandidate {
  return {
    title: '',
    firmName: null,
    fundName: null,
    fundSizeUsdMillions: null,
    personName: null,
    ...overrides,
  }
}

describe('isSameStory', () => {
  it('clusters same firm + fund sizes within tolerance (currency drift)', () => {
    // Real case: €1bn Jeito II Fund reported as $1.1B by one outlet and $1.2B by another.
    const a = candidate({
      title: 'Jeito Capital closes €1bn Jeito II Fund',
      firmName: 'Jeito Capital',
      fundSizeUsdMillions: 1200,
    })
    const b = candidate({
      title: 'Biotech investor Jeito Capital collects over €1bn for sophomore fund',
      firmName: 'Jeito Capital',
      fundSizeUsdMillions: 1100,
    })
    expect(isSameStory(a, b)).toBe(true)
  })

  it('clusters firms differing only in stripped suffixes', () => {
    // Real case: "Eclipse Ventures" and "Eclipse" both cover the $1.3B fund launch.
    const a = candidate({
      title: 'Eclipse Ventures Launches $1.3 Billion Fund',
      firmName: 'Eclipse Ventures',
      fundSizeUsdMillions: 1300,
    })
    const b = candidate({
      title: 'Eclipse brings AUM to $10bn with new double fund close',
      firmName: 'Eclipse',
      fundSizeUsdMillions: 1300,
    })
    expect(isSameStory(a, b)).toBe(true)
  })

  it('does NOT cluster different funds from the same firm', () => {
    // Regression: before the fix, shared {apollo, fund, closes} gave
    // title Jaccard > 0.3 and falsely merged these.
    const a = candidate({
      title: 'Apollo Infrastructure Fund III closes at $2B',
      firmName: 'Apollo',
      fundName: 'Apollo Infrastructure Fund III',
      fundSizeUsdMillions: 2000,
    })
    const b = candidate({
      title: 'Apollo Credit Opportunities Fund closes at $1B',
      firmName: 'Apollo',
      fundName: 'Apollo Credit Opportunities Fund',
      fundSizeUsdMillions: 1000,
    })
    expect(isSameStory(a, b)).toBe(false)
  })

  it('clusters exec moves by person name even if firm extraction differs', () => {
    const a = candidate({
      title: 'HIG Capital names Brian Schwartz CEO',
      firmName: 'HIG Capital',
      personName: 'Brian Schwartz',
    })
    const b = candidate({
      title: 'HIG taps Brian Schwartz as chief executive',
      firmName: 'H.I.G.',
      personName: 'Brian Schwartz',
    })
    expect(isSameStory(a, b)).toBe(true)
  })

  it('clusters stories with asymmetric firm extraction but matching fund name', () => {
    // Real case: Zero Shot Fund — one outlet extracted firm as "Zero Shot",
    // the other left firm_name null but extracted the fund name.
    const a = candidate({
      title: 'OpenAI veterans launch $100M VC fund Zero Shot',
      firmName: 'Zero Shot',
      fundName: 'Zero Shot Fund',
      fundSizeUsdMillions: 100,
    })
    const b = candidate({
      title: "Former OpenAI Leaders Launch $100 Million 'Zero Shot Fund'",
      firmName: null,
      fundName: 'Zero Shot Fund',
      fundSizeUsdMillions: 100,
    })
    expect(isSameStory(a, b)).toBe(true)
  })

  it('does not cluster unrelated articles from different firms', () => {
    const a = candidate({
      title: 'KKR raises $23bn for North America Fund XIV',
      firmName: 'KKR',
      fundSizeUsdMillions: 23000,
    })
    const b = candidate({
      title: 'Blackstone closes $10bn credit opps fund',
      firmName: 'Blackstone',
      fundSizeUsdMillions: 10000,
    })
    expect(isSameStory(a, b)).toBe(false)
  })

  it('clusters "BTG Pactual" with "BTG Pactual TIG" at matching size (2026-04-18)', () => {
    // Regression: classifier extracted firm differently on two articles
    // about the same $370M Latin America Timberland close.
    const a = candidate({
      title: 'BTG Pactual TIG Raises $370 Million for Latin America Timberland Strategy',
      firmName: 'BTG Pactual TIG',
      fundSizeUsdMillions: 370,
    })
    const b = candidate({
      title: 'BTG TIG reaches $370m first close for LatAm timber fund',
      firmName: 'BTG Pactual',
      fundSizeUsdMillions: 370,
    })
    expect(isSameStory(a, b)).toBe(true)
  })

  it('clusters "Vesper" with "Vesper Infrastructure Partners" at matching size (2026-04-18)', () => {
    // Regression: same €1bn Next Gen Infrastructure Fund close, firm
    // extracted as "Vesper" by one outlet and "Vesper Infrastructure
    // Partners" by another.
    const a = candidate({
      title: 'Vesper Next Generation Infrastructure Fund I reaches final close surpassing €1b of total AUM',
      firmName: 'Vesper',
      fundSizeUsdMillions: 1100,
    })
    const b = candidate({
      title: 'Vesper Infrastructure Partners picks up over €1bn at hard cap close of next-gen fund',
      firmName: 'Vesper Infrastructure Partners',
      fundSizeUsdMillions: 1100,
    })
    expect(isSameStory(a, b)).toBe(true)
  })

  it('keeps KKR distinct from KKR Credit Advisors when sizes diverge', () => {
    // Prefix-firm match is gated on a tight (≤5%) size match. Distinct
    // parent/subsidiary arms with their own independently-sized deals
    // must stay separate stories.
    const a = candidate({
      title: 'KKR raises $23bn for North America Fund XIV',
      firmName: 'KKR',
      fundSizeUsdMillions: 23000,
    })
    const b = candidate({
      title: 'KKR Credit Advisors closes $2bn direct lending fund',
      firmName: 'KKR Credit Advisors',
      fundSizeUsdMillions: 2000,
    })
    expect(isSameStory(a, b)).toBe(false)
  })

  it('clusters the Partners Group quad-clone from 2026-04-18', () => {
    // Regression: all four rows had firm="Partners Group", fund=null,
    // size=$9B, event=capital_raise|fund_close. Before the empty-string
    // fallback in normalizeFirmName, the firm normalized to "" on both
    // sides and firmMatch went false. Now all four collapse.
    const a = candidate({
      title: 'Partners Group raises over $9 billion for private equity secondaries',
      firmName: 'Partners Group',
      fundName: null,
      fundSizeUsdMillions: 9000,
    })
    const b = candidate({
      title: 'Partners Group hits $9bn close for flagship secondaries programme - pe',
      firmName: 'Partners Group',
      fundName: null,
      fundSizeUsdMillions: 9000,
    })
    const c = candidate({
      title: 'Partners Group closes latest PE secondaries programme on $9bn+',
      firmName: 'Partners Group',
      fundName: null,
      fundSizeUsdMillions: 9000,
    })
    expect(isSameStory(a, b)).toBe(true)
    expect(isSameStory(a, c)).toBe(true)
    expect(isSameStory(b, c)).toBe(true)
  })
})

// ─── titleJaccard ───────────────────────────────────────────────────────────

describe('titleJaccard', () => {
  it('returns high similarity for near-identical titles', () => {
    expect(
      titleJaccard(
        'Blackstone closes flagship credit opps fund at hard-cap',
        'Blackstone closes its largest opportunistic private credit fund at over $10 billion'
      )
    ).toBeGreaterThan(0.2)
  })

  it('returns zero for empty input', () => {
    expect(titleJaccard('', 'anything')).toBe(0)
    expect(titleJaccard('something', '')).toBe(0)
  })

  it('filters out short words', () => {
    // "a is of to at" are all ≤2 chars — ignored.
    expect(titleJaccard('a is of to', 'at is a on')).toBe(0)
  })
})

// ─── 2026-08-15 dedup hardening regressions ─────────────────────────────────

describe('isSameStory — close-stage + currency-drift merges (2026-08-14 Mirae leak)', () => {
  it('merges same firm, differing fund names, same close stage, sizes within 20%', () => {
    // DealStreetAsia used spot FX ($118M) while the classifier converted
    // ₹1,125 crore to $135M — 12.6% apart, outside the 2% band. Outlets also
    // invented different fund names, so the fund-name-mismatch branch fired.
    const a = candidate({
      title: 'Mirae Asset hits first close of third India-focused venture fund at $118m',
      firmName: 'Mirae Asset',
      fundName: 'Mirae Asset India Fund III',
      fundSizeUsdMillions: 118,
      closeType: 'first_close',
    })
    const b = candidate({
      title: 'Mirae Asset’s venture fund raises ₹1,125 crore in first close, targets ₹1,800 crore corpus',
      firmName: 'Mirae Asset',
      fundName: 'Mirae Asset Venture Opportunity Fund II',
      fundSizeUsdMillions: 135,
      closeType: 'first_close',
    })
    expect(isSameStory(a, b)).toBe(true)
  })

  it('still keeps two genuinely distinct funds from one firm separate', () => {
    const a = candidate({
      title: 'Apollo closes Infrastructure Fund IV at $10bn',
      firmName: 'Apollo',
      fundName: 'Apollo Infrastructure Fund IV',
      fundSizeUsdMillions: 10000,
      closeType: 'final_close',
    })
    const b = candidate({
      title: 'Apollo wraps up credit vehicle at $4bn hard cap',
      firmName: 'Apollo',
      fundName: 'Apollo Credit Fund II',
      fundSizeUsdMillions: 4000,
      closeType: 'final_close',
    })
    expect(isSameStory(a, b)).toBe(false)
  })

  it('merges prefix-firm variants at the same close stage with similar titles', () => {
    const a = candidate({
      title: 'Mirae Asset Venture Investments Marks First Close Of Fund II At ₹1,125 Cr',
      firmName: 'Mirae Asset Venture Investments',
      fundName: 'Mirae Asset Venture Investments Fund II',
      fundSizeUsdMillions: 135,
      closeType: 'first_close',
    })
    const b = candidate({
      title: 'Mirae Asset Venture makes first Close of Fund II at Rs 1,125 cr',
      firmName: 'Mirae Asset Venture',
      fundName: 'Mirae Asset Venture Fund II',
      fundSizeUsdMillions: 135,
      closeType: 'first_close',
    })
    expect(isSameStory(a, b)).toBe(true)
  })

  it('merges same firm with differing fund names when titles are near-identical', () => {
    const a = candidate({
      title: 'KKR closes $19.2 billion infrastructure fund for North America, Europe',
      firmName: 'KKR',
      fundName: 'KKR Global Infrastructure Investors V',
      fundSizeUsdMillions: 19200,
    })
    const b = candidate({
      title: 'KKR closes $19.2 billion infrastructure fund',
      firmName: 'KKR',
      fundName: 'KKR Infrastructure Fund',
      fundSizeUsdMillions: 19200,
    })
    expect(isSameStory(a, b)).toBe(true)
  })
})

describe('titlesShareSignificantNumber', () => {
  it('matches the same figure across currency formats', () => {
    expect(
      titlesShareSignificantNumber(
        'Mirae makes first close of Rs 1,800 crore India growth fund',
        'Mirae Asset’s venture fund raises ₹1,125 crore in first close, targets ₹1,800 crore corpus'
      )
    ).toBe(true)
  })

  it('ignores years and short numbers', () => {
    expect(
      titlesShareSignificantNumber(
        'Firm A targets 2026 close for Fund II',
        'Firm B eyes 2026 vintage for debut vehicle'
      )
    ).toBe(false)
  })

  it('prefix-firm same-close-stage stories sharing a figure merge', () => {
    const a = candidate({
      title: 'Mirae makes first close of Rs 1,800 crore India growth fund',
      firmName: 'Mirae',
      fundName: 'Mirae India Growth Fund',
      fundSizeUsdMillions: 216,
      closeType: 'first_close',
    })
    const b = candidate({
      title: 'Mirae Asset’s venture fund raises ₹1,125 crore in first close, targets ₹1,800 crore corpus',
      firmName: 'Mirae Asset',
      fundName: 'Mirae Asset Venture Opportunity Fund II',
      fundSizeUsdMillions: 135,
      closeType: 'first_close',
    })
    expect(isSameStory(a, b)).toBe(true)
  })
})

describe('isSameStory — identical titles with conflicting firm extraction (2026-08-16 L1 dupe)', () => {
  it('merges verbatim duplicate titles even when extracted firms differ', () => {
    const a = candidate({
      title: 'L1 Group backs former analyst to launch new long-short hedge fund',
      firmName: 'L1 Group',
    })
    const b = candidate({
      title: 'L1 Group backs former analyst to launch new long-short hedge fund',
      firmName: 'PXC Advisors',
    })
    expect(isSameStory(a, b)).toBe(true)
  })

  it('does not merge different stories with different firms', () => {
    const a = candidate({
      title: 'Blackstone closes $10bn credit fund',
      firmName: 'Blackstone',
      fundSizeUsdMillions: 10000,
    })
    const b = candidate({
      title: 'Ares launches $2bn direct lending vehicle',
      firmName: 'Ares',
      fundSizeUsdMillions: 2000,
    })
    expect(isSameStory(a, b)).toBe(false)
  })
})
