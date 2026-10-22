import { describe, it, expect } from 'vitest'
import { newYorkToday, notability, pickNotableEvents, splitWeeks, weekBounds } from '../highlights'

type E = { id: string; startDate: string; name: string; isFeatured: boolean; opsRelevance: string; eventKind: string; expectedAttendance: number | null; isSubmitted: boolean }
const ev = (id: string, startDate: string, o: Partial<E> = {}): E => ({ id, startDate, name: `Event ${id}`, isFeatured: false, opsRelevance: 'medium', eventKind: 'networking', expectedAttendance: null, isSubmitted: false, ...o })

describe('weeks', () => {
  it('run Monday to Sunday', () => {
    // 2026-10-22 is a Thursday.
    expect(weekBounds('2026-10-22')).toEqual({ thisWeekEnd: '2026-10-25', nextWeekStart: '2026-10-26', nextWeekEnd: '2026-11-01' })
    // A Sunday is the last day of its week; a Monday the first.
    expect(weekBounds('2026-10-25').thisWeekEnd).toBe('2026-10-25')
    expect(weekBounds('2026-10-26').thisWeekEnd).toBe('2026-11-01')
    // Across a month and a year.
    expect(weekBounds('2026-12-30')).toEqual({ thisWeekEnd: '2027-01-03', nextWeekStart: '2027-01-04', nextWeekEnd: '2027-01-10' })
  })

  it('split the board into this week and next, in date order', () => {
    const { thisWeek, nextWeek } = splitWeeks([ev('later', '2026-11-02'), ev('next', '2026-10-26'), ev('sun', '2026-10-25'), ev('today', '2026-10-22'), ev('past', '2026-10-21')], '2026-10-22')
    expect(thisWeek.map((e) => e.id)).toEqual(['today', 'sun'])
    expect(nextWeek.map((e) => e.id)).toEqual(['next'])
  })

  it('know the newsroom’s day', () => {
    // 02:00 UTC on the 23rd is still the 22nd in New York.
    expect(newYorkToday(new Date('2026-10-23T02:00:00Z'))).toBe('2026-10-22')
  })
})

describe('the front page’s events strip', () => {
  it('ranks featured, ops-relevant conferences above the rest', () => {
    expect(notability(ev('a', '2026-10-23', { isFeatured: true }))).toBeGreaterThan(notability(ev('b', '2026-10-23', { opsRelevance: 'high' })))
    expect(notability(ev('c', '2026-10-23', { opsRelevance: 'high', eventKind: 'forum' }))).toBeGreaterThan(notability(ev('d', '2026-10-23', { opsRelevance: 'high' })))
  })

  it('takes the most notable few, at most two a day, and shows them by date', () => {
    const picks = pickNotableEvents([
      ev('low', '2026-10-23', { opsRelevance: 'low' }),
      ev('a', '2026-10-28', { opsRelevance: 'high', eventKind: 'forum' }),
      ev('b', '2026-10-24', { opsRelevance: 'high', eventKind: 'summit' }),
      ev('c', '2026-10-24', { opsRelevance: 'high', eventKind: 'conference' }),
      ev('d', '2026-10-24', { opsRelevance: 'high', eventKind: 'conference', name: 'Z' }),
      ev('e', '2026-10-25', { isFeatured: true }),
    ], 4)
    expect(picks.map((e) => e.id)).toEqual(['b', 'c', 'e', 'a'])
  })
})

describe('the /events shortcut chips', () => {
  it('each open a page that exists', async () => {
    const { CITY_SHORTCUTS, TOPIC_SHORTCUTS, COLLECTION_BY_SLUG } = await import('../collections')
    for (const c of [...CITY_SHORTCUTS, ...TOPIC_SHORTCUTS]) expect(COLLECTION_BY_SLUG.has(c.slug), c.slug).toBe(true)
    expect(COLLECTION_BY_SLUG.get('cfo-ops')?.filter).toEqual({ ops: '1' })
  })
})
