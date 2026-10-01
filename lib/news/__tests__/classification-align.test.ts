import { describe, it, expect } from 'vitest'
import { alignClassifications, resultFitsArticle } from '../classification-align'

const articles = [
  { title: 'Audax Agrees to Sell GCG to Rexel for $1.4 Billion', text: 'Audax Private Equity has agreed to sell GCG, a distributor of wire and cable, to Rexel.' },
  { title: 'HighPost Capital Forms Aerospace, Defense and Cybersecurity Vertical', text: 'HighPost Capital has hired David Walsh to lead a new vertical.' },
  { title: 'DwyerOmega Takes SOR’s Measure', text: 'Arcline portfolio company DwyerOmega has acquired SOR Controls Group.' },
]
const audax = { firm_name: 'Audax Private Equity', entities: [{ name: 'Rexel' }, { name: 'GCG' }] }
const highpost = { firm_name: 'HighPost Capital', person_name: 'David Walsh', entities: [{ name: 'HighPost Capital' }] }
const dwyer = { firm_name: 'Arcline', entities: [{ name: 'DwyerOmega' }, { name: 'SOR Controls Group' }] }

describe('alignClassifications', () => {
  it('pairs by echoed id even when the model returns results out of order', () => {
    // The exact failure of 2026-09-30: two neighbours swapped.
    const out = alignClassifications(articles, [
      { id: 1, ...highpost },
      { id: 0, ...audax },
      { id: 2, ...dwyer },
    ])
    expect(out[0]?.firm_name).toBe('Audax Private Equity')
    expect(out[1]?.firm_name).toBe('HighPost Capital')
    expect(out[2]?.firm_name).toBe('Arcline')
  })

  it('leaves a gap, not a shift, when the model skips an article', () => {
    const out = alignClassifications(articles, [
      { id: 0, ...audax },
      { id: 2, ...dwyer },
    ])
    expect(out[0]?.firm_name).toBe('Audax Private Equity')
    expect(out[1]).toBeNull()
    expect(out[2]?.firm_name).toBe('Arcline')
  })

  it('without ids, refuses a positional result that belongs to a neighbour', () => {
    // No ids and one item skipped: position 1 now holds article 2's result.
    const out = alignClassifications(articles, [audax, dwyer])
    expect(out[0]?.firm_name).toBe('Audax Private Equity')
    expect(out[1]).toBeNull()
    expect(out[2]).toBeNull()
  })

  it('without ids, a swapped pair is rejected on both sides', () => {
    const out = alignClassifications(articles, [highpost, audax, dwyer])
    expect(out[0]).toBeNull()
    expect(out[1]).toBeNull()
    expect(out[2]?.firm_name).toBe('Arcline')
  })

  it('ignores ids that are duplicated or out of range and falls back to position', () => {
    const out = alignClassifications(articles, [
      { id: 0, ...audax },
      { id: 0, ...highpost },
      { id: 9, ...dwyer },
    ])
    expect(out.map((r) => r?.firm_name)).toEqual(['Audax Private Equity', 'HighPost Capital', 'Arcline'])
  })

  it('keeps a result that names nobody (commentary) and one whose names fit no article at all', () => {
    const out = alignClassifications(
      [{ title: 'Why private credit spreads are tightening', text: 'Analysis.' }, { title: 'KKR raises $6.6bn', text: 'KKR closed its fund.' }],
      [{ id: 0, firm_name: null, entities: [] }, { id: 1, firm_name: 'Kohlberg Kravis Roberts', entities: [] }],
    )
    expect(out[0]).not.toBeNull()
    // Expanded name appears in neither article: odd, but not evidence of a mix-up.
    expect(out[1]?.firm_name).toBe('Kohlberg Kravis Roberts')
  })
})

describe('resultFitsArticle', () => {
  it('matches on any extracted name, ignoring generic words', () => {
    expect(resultFitsArticle(articles[0], audax)).toBe(true)
    expect(resultFitsArticle(articles[0], highpost)).toBe(false)
    // "Capital" and "Partners" alone never count as a match.
    expect(resultFitsArticle({ title: 'Bain Capital buys a firm', text: '' }, { firm_name: 'Apex Capital Partners' })).toBe(false)
  })
  it('handles very short names by exact substring', () => {
    expect(resultFitsArticle({ title: 'Hg to debut in Greece', text: '' }, { firm_name: 'Hg' })).toBe(true)
  })
})
