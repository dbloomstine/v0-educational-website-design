import { describe, it, expect } from 'vitest'
import {
  normalizeFirmName,
  fundSizesMatch,
  titleJaccard,
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
