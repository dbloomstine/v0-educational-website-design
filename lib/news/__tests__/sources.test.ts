import { describe, expect, it } from 'vitest'
import { hostFromSourceName, lowGradeSource, normalizeSourceName } from '../constants'

describe('normalizeSourceName (2026-10-16: one outlet, one name)', () => {
  it('folds the names one outlet arrives under', () => {
    expect(normalizeSourceName('Hedge Week')).toBe('Hedgeweek')
    expect(normalizeSourceName('hedgeweek.com')).toBe('Hedgeweek')
    expect(normalizeSourceName('Hedgeweek')).toBe('Hedgeweek')
    expect(normalizeSourceName('AltAssets Private Equity News')).toBe('AltAssets')
    expect(normalizeSourceName('altassets.net')).toBe('AltAssets')
    expect(normalizeSourceName('HedgeCo Insights')).toBe('HedgeCo')
    expect(normalizeSourceName('HedgeCo.Net')).toBe('HedgeCo')
    expect(normalizeSourceName('Institutional Real Estate, Inc.')).toBe('IREI')
    expect(normalizeSourceName('irei.com')).toBe('IREI')
    expect(normalizeSourceName('www.pei-privaterealestate.com')).toBe('PERE')
    expect(normalizeSourceName('www.ai-cio.com')).toBe('Chief Investment Officer')
    expect(normalizeSourceName('TOKENPOST')).toBe('TokenPost')
  })
  it('shows a bare address as its host', () => {
    expect(hostFromSourceName('https://www.connectmoney.com/')).toBe('connectmoney.com')
    expect(hostFromSourceName('www.dakota.com')).toBe('dakota.com')
    expect(hostFromSourceName('Pensions & Investments')).toBeNull()
    expect(normalizeSourceName('https://www.connectmoney.com/')).toBe('connectmoney.com')
    expect(normalizeSourceName('https://ascendants.in/')).toBe('ascendants.in')
    expect(normalizeSourceName('www.trendingtopics.eu')).toBe('trendingtopics.eu')
  })
  it('leaves a real name alone', () => {
    expect(normalizeSourceName('Pensions & Investments')).toBe('Pensions & Investments')
    expect(normalizeSourceName('Bloomberg Law')).toBe('Bloomberg Law')
    expect(normalizeSourceName(null)).toBeNull()
  })
})

describe('lowGradeSource', () => {
  it('never shows a reprint site, and an aggregator only when the row is plainly about funds', () => {
    expect(lowGradeSource('ad-hoc-news.de', 0.9)).toBe('reprint site')
    expect(lowGradeSource('Pulse 2.0', 0.9)).toBe('reprint site')
    expect(lowGradeSource('www.tokenpost.com', 0.9)).toBe('reprint site')
    expect(lowGradeSource('citybiz', 0.6)).toBe('low-grade source')
    expect(lowGradeSource('TradingView', 0.5)).toBe('low-grade source')
    expect(lowGradeSource('TradingView', 0.8)).toBeNull()
    expect(lowGradeSource('PE Hub', 0.3)).toBeNull()
    expect(lowGradeSource(null, 0.9)).toBeNull()
  })
})
