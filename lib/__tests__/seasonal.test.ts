import { describe, it, expect } from 'vitest'
import { seasonOn, SEASONS, SEASON_SCRIPT } from '@/lib/seasonal'
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
    expect(h).toMatch(/^Fund<img src="https:\/\/fundopshq\.com\/seasonal\/o-pumpkin\.png" alt="O"/)
    expect(h.endsWith('ps')).toBe(true)
  })
  it('the head script carries every window and the ?season override', () => {
    for (const s of SEASONS) expect(SEASON_SCRIPT).toContain(s.from)
    expect(SEASON_SCRIPT).toContain("get('season')")
  })
})
