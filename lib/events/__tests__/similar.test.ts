import { describe, it, expect } from 'vitest'
import { nameSimilarity, nameWords, pickNextEdition, pickSimilarEvents } from '../similar'

type E = { id: string; name: string; organizerName: string; startDate: string; city: string | null; topics: string[]; fundCategories: string[]; eventKind: string }
const ev = (id: string, o: Partial<E> = {}): E => ({ id, name: `Event ${id}`, organizerName: 'Org', startDate: '2026-11-10', city: null, topics: [], fundCategories: [], eventKind: 'conference', ...o })
const TODAY = '2026-10-22'

describe('similar events', () => {
  const base = ev('x', { name: 'IVCA CFO Summit', city: 'Chicago', topics: ['accounting_tax', 'fund_finance'], fundCategories: ['VC'] })

  it('puts the same city and topic first, then city, then topic, then asset class', () => {
    const picks = pickSimilarEvents(base, [
      ev('asset', { fundCategories: ['VC'], startDate: '2026-10-25' }),
      ev('topic', { topics: ['fund_finance'], city: 'Boston' }),
      ev('city', { city: 'Chicago' }),
      ev('both', { city: 'chicago', topics: ['accounting_tax'] }),
    ], TODAY)
    expect(picks.map((e) => e.id)).toEqual(['both', 'city', 'topic', 'asset'])
  })

  it('never the event itself, another listing of it, a past event, a repeat, or something unrelated', () => {
    const picks = pickSimilarEvents(base, [
      base,
      ev('copy', { name: 'IVCA CFO Summit 2026', city: 'Chicago' }),
      ev('past', { city: 'Chicago', startDate: '2026-10-01' }),
      ev('a', { city: 'Chicago' }),
      ev('a', { city: 'Chicago' }),
      ev('unrelated', { eventKind: 'conference' }),
    ], TODAY)
    expect(picks.map((e) => e.id)).toEqual(['a'])
  })

  it('shows at most six, sooner first among equals', () => {
    const many = Array.from({ length: 10 }, (_, i) => ev(`c${i}`, { city: 'Chicago', startDate: `2026-11-${String(20 - i).padStart(2, '0')}` }))
    const picks = pickSimilarEvents(base, many, TODAY)
    expect(picks).toHaveLength(6)
    expect(picks[0].id).toBe('c9')
  })
})

describe('the next edition of a past event', () => {
  const past = ev('p', { name: '8th Annual LPGP Connect CFO/COO Forum Chicago', organizerName: 'LPGP Connect', startDate: '2026-10-01', city: 'Chicago' })

  it('reads names without the edition, the year or filler', () => {
    expect(nameWords('8th Annual LPGP Connect CFO/COO Forum Chicago 2026')).toEqual(['lpgp', 'connect', 'cfo', 'coo', 'chicago'])
    expect(nameSimilarity('8th Annual LPGP Connect CFO/COO Forum Chicago', '9th Annual LPGP Connect CFO/COO Forum Chicago')).toBe(1)
  })

  it('finds the next edition from the same organizer', () => {
    const next = pickNextEdition(past, [
      ev('la', { name: '3rd Annual LPGP Connect Private Debt Los Angeles', organizerName: 'LPGP Connect', startDate: '2026-10-29', city: 'Los Angeles' }),
      ev('nine', { name: '9th Annual LPGP Connect CFO/COO Forum Chicago', organizerName: 'LPGP Connect', startDate: '2027-10-20', city: 'Chicago' }),
      ev('other', { name: '9th Annual LPGP Connect CFO/COO Forum Chicago', organizerName: 'Someone Else', startDate: '2026-11-01' }),
    ], TODAY)
    expect(next).toEqual({ event: expect.objectContaining({ id: 'nine' }), edition: true })
  })

  it('falls back to the organizer’s next event, not called an edition', () => {
    const next = pickNextEdition(past, [ev('la', { name: '3rd Annual LPGP Connect Private Debt Los Angeles', organizerName: 'LPGP Connect', startDate: '2026-10-29' })], TODAY)
    expect(next?.event.id).toBe('la')
    expect(next?.edition).toBe(false)
  })

  it('prefers the same city among a big organizer’s chapters', () => {
    const acg = ev('r', { name: 'ACG Richmond October Breakfast: Transaction Panel', organizerName: 'ACG', city: 'Richmond', startDate: '2026-10-01' })
    const next = pickNextEdition(acg, [
      ev('ny', { name: 'ACG New York Breakfast', organizerName: 'ACG', city: 'New York', startDate: '2026-10-25' }),
      ev('rva', { name: 'ACG Richmond Holiday Party', organizerName: 'ACG', city: 'Richmond', startDate: '2026-12-10' }),
    ], TODAY)
    expect(next?.event.id).toBe('rva')
  })

  it('is null when the organizer has nothing upcoming', () => {
    expect(pickNextEdition(past, [ev('old', { organizerName: 'LPGP Connect', startDate: '2026-09-01' })], TODAY)).toBeNull()
  })
})
