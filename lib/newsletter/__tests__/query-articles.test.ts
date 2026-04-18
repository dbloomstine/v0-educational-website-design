import { describe, it, expect } from 'vitest'
import { storyFingerprints } from '../query-articles'

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
