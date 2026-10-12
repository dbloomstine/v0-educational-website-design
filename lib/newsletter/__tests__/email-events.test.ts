import { describe, it, expect } from 'vitest'
import { pickEventsForEmail, eventRank, EVENTS_PER_DAY } from '../email-events'
import { renderNewsletterEmail } from '../email-template'
import type { IndustryEvent } from '@/lib/events/types'

const ev = (o: Partial<IndustryEvent>): IndustryEvent =>
  ({
    id: 'x', slug: 'x', name: 'An event', description: null, eventUrl: 'https://example.com', registrationUrl: null, organizerName: 'ACG', organizerType: 'association',
    startDate: '2026-10-14', endDate: null, timeNote: null, city: 'New York', stateRegion: 'NY', country: 'US', venue: null, eventFormat: 'in_person', eventKind: 'conference',
    costType: 'paid', priceNote: null, fundCategories: [], topics: [], opsRelevance: 'medium', region: 'north_america', isFeatured: false, expectedAttendance: null, boardException: false, clickCount: 0,
    ...o,
  }) as IndustryEvent

describe('the events the daily email shows', () => {
  it('cuts each day to its best two and counts the rest; a short day is left whole', () => {
    const wed = [
      ev({ slug: 'social', name: 'Chapter social', opsRelevance: 'low' }),
      ev({ slug: 'cfo', name: 'PE CFO Forum', opsRelevance: 'high' }),
      ev({ slug: 'big', name: 'Big summit', opsRelevance: 'medium', expectedAttendance: 3000 }),
      ev({ slug: 'star', name: 'Featured one', opsRelevance: 'low', isFeatured: true }),
    ]
    const thu = [ev({ slug: 'only', startDate: '2026-10-15' })]
    const days = pickEventsForEmail([...wed, ...thu], (e) => e.startDate)
    expect(days.map((d) => d.heading)).toEqual(['2026-10-14', '2026-10-15'])
    expect(days[0].shown.map((e) => e.slug)).toEqual(['star', 'cfo'])
    expect(days[0].more).toBe(2)
    expect(days[1].shown.map((e) => e.slug)).toEqual(['only'])
    expect(days[1].more).toBe(0)
    expect(EVENTS_PER_DAY).toBe(2)
  })
  it('ranks: featured, then fund-operations relevance, then size; an invitation-only event after an open one; ties keep the board\'s order', () => {
    expect(eventRank(ev({ isFeatured: true, opsRelevance: 'low' }))).toBeLessThan(eventRank(ev({ opsRelevance: 'high' })))
    expect(eventRank(ev({ opsRelevance: 'high' }))).toBeLessThan(eventRank(ev({ opsRelevance: 'medium', expectedAttendance: 5000 })))
    expect(eventRank(ev({ expectedAttendance: 2000 }))).toBeLessThan(eventRank(ev({})))
    expect(eventRank(ev({ costType: 'invite_only' }))).toBeGreaterThan(eventRank(ev({ costType: 'paid' })))
    const same = [ev({ slug: 'a' }), ev({ slug: 'b' }), ev({ slug: 'c' })]
    expect(pickEventsForEmail(same, () => 'd')[0].shown.map((e) => e.slug)).toEqual(['a', 'b'])
  })
  it('in the email: two rows a day, then "N more on the calendar"', () => {
    const events = Array.from({ length: 5 }, (_, i) => ev({ slug: `e${i}`, name: `Event ${i}` }))
    const html = renderNewsletterEmail({ groups: [], totalArticles: 0, editionDate: '2026-10-13', unsubscribeUrl: 'https://fundopshq.com/u', events })
    expect((html.match(/class="fops-etitle"/g) ?? []).length).toBe(2)
    expect(html).toContain('3 more on the calendar')
    const one = renderNewsletterEmail({ groups: [], totalArticles: 0, editionDate: '2026-10-13', unsubscribeUrl: 'https://fundopshq.com/u', events: events.slice(0, 3) })
    expect(one).toContain('One more on the calendar')
    expect(renderNewsletterEmail({ groups: [], totalArticles: 0, editionDate: '2026-10-13', unsubscribeUrl: 'https://fundopshq.com/u', events: events.slice(0, 2) })).not.toContain('on the calendar')
  })
})
