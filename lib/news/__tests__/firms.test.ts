import { describe, it, expect } from 'vitest'
import { buildStories, type Story } from '../stories'
import { firmIndex, firmsByLetter, firmsInTheNews } from '../firms'
import { fundraisingChartViews, chartHasData } from '../chart-views'
import type { FundClose } from '../league'

let seq = 0
const uuid = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`
const NOW = new Date('2026-09-30T18:00:00Z').getTime()

const story = (o: Partial<Story>): Story => ({
  id: uuid(), memberIds: [], headline: 'A headline', url: 'https://example.com', source: 'PE Hub', summary: 'A summary.',
  coverage: [], kind: 'fundraising', assetClasses: ['PE'], eventType: 'fund_close', closeType: 'final_close', sizeUsdM: 500,
  firmName: null, fundName: null, personName: null, geography: [], entities: [], firms: [], leadEligible: true, roundup: false,
  firstSeen: '2026-09-29T14:00:00Z', publishedDate: '2026-09-29', weight: 1, ...o,
})

describe('firm index', () => {
  it('files every spelling of a firm under one page, and keeps the fuller name', () => {
    const idx = firmIndex([
      story({ firmName: 'Ares' }), story({ firmName: 'Ares' }), story({ firmName: 'Ares Management' }),
      story({ firmName: 'KKR', kind: 'deals' }),
    ])
    const ares = idx.find((f) => f.slug === 'ares')
    expect(ares).toMatchObject({ name: 'Ares Management', shortName: 'Ares', stories: 3, topKind: 'fundraising' })
    expect(idx[0].slug).toBe('ares')
  })
  it('skips wires, descriptions and names with no usable key', () => {
    const idx = firmIndex([
      story({ firmName: 'Blackstone', roundup: true }),
      story({ firmName: 'New London private equity firm' }),
      story({ firmName: '—' }),
    ])
    expect(idx).toHaveLength(0)
  })
  it('“in the news” is about firms: regulators out, sovereign funds in, old stories out', () => {
    const top = firmsInTheNews([
      story({ firmName: 'SEC', kind: 'regulation' }), story({ firmName: 'SEC', kind: 'regulation' }),
      story({ firmName: 'Abu Dhabi Investment Authority', kind: 'lps' }),
      story({ firmName: 'Oaktree' }),
      story({ firmName: 'Carlyle', firstSeen: '2026-09-01T14:00:00Z', publishedDate: '2026-09-01' }),
    ], NOW, 7, 10)
    expect(top.map((f) => f.shortName).sort()).toEqual(['Abu Dhabi Investment Authority', 'Oaktree'])
  })
  it('groups the directory by first letter, digits last', () => {
    const groups = firmsByLetter(firmIndex([story({ firmName: 'abrdn' }), story({ firmName: 'Apax Partners' }), story({ firmName: '17Capital' }), story({ firmName: 'KKR' })]))
    expect(groups.map((g) => g.letter)).toEqual(['A', 'K', '#'])
    expect(groups[0].firms.map((f) => f.name)).toEqual(['abrdn', 'Apax Partners'])
  })
})

describe('the firms a story names', () => {
  it('lists the subject first, then the other firms — and never a person', () => {
    const [s] = buildStories([{
      id: uuid(), title: 'Diversis buys majority stake in port software provider Tideworks from Blackstone-backed Carrix',
      source_url: 'https://example.com/a', source_name: 'PE Hub', published_date: '2026-09-29', created_at: '2026-09-29T14:00:00Z',
      fund_categories: ['PE'], is_high_signal: true, relevance_score: 0.8, article_type: 'acquisition', event_type: 'acquisition',
      tldr: 'Diversis Capital acquired a majority stake in Tideworks from Carrix, which is backed by Blackstone; Jane Smith led the deal.',
      entities_raw: [
        { name: 'Diversis', type: 'firm', confidence: 0.95 }, { name: 'Tideworks', type: 'firm', confidence: 0.95 },
        { name: 'Blackstone', type: 'firm', confidence: 0.9 }, { name: 'Jane Smith', type: 'person', confidence: 0.95 },
        { name: 'Morgan Stanley', type: 'firm', confidence: 0.95 },
      ],
      extracted_data: { firm_name: 'Diversis' },
    }])
    expect(s.firms[0]).toBe('Diversis')
    expect(s.firms).toEqual(expect.arrayContaining(['Tideworks', 'Blackstone']))
    expect(s.firms).not.toContain('Jane Smith')
    // Named by the classifier, never mentioned by the report.
    expect(s.firms).not.toContain('Morgan Stanley')
  })
})

describe('the chart on a section page', () => {
  const mk = (o: Partial<FundClose>): FundClose => ({
    id: uuid(), memberIds: [], firm: 'A', firmSlug: 'a', fund: null, sizeUsdM: 100, stage: 'final', date: '2026-09-20',
    assetClass: 'PE', headline: '', source: null, url: '', sources: 1, converted: false, ...o,
  })
  const league = [mk({ assetClass: 'VC', sizeUsdM: 250 }), mk({ assetClass: 'VC', sizeUsdM: 40 }), mk({ assetClass: 'credit', sizeUsdM: 5000 })]
  it('is cut to the section’s market and drops the by-market view', () => {
    const views = fundraisingChartViews(league, NOW, { assetClasses: ['VC'] })
    expect(views.map((v) => v.key)).toEqual(['week', 'size'])
    expect(views[0].bars.reduce((s, b) => s + b.value, 0)).toBe(290)
    expect(chartHasData(views)).toBe(true)
  })
  it('has nothing to draw for a market with no closes', () => {
    expect(chartHasData(fundraisingChartViews(league, NOW, { assetClasses: ['hedge'] }))).toBe(false)
    expect(fundraisingChartViews(league, NOW).map((v) => v.key)).toEqual(['asset', 'week', 'size'])
  })
})
