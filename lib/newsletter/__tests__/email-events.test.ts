import { describe, it, expect } from 'vitest'
import { pickEventsForEmail, eventRank, EVENTS_PER_DAY } from '../email-events'
import { renderNewsletterEmail } from '../email-template'
import type { IndustryEvent } from '@/lib/events/types'

const ev = (o: Partial<IndustryEvent>): IndustryEvent =>
  ({
    id: 'x', slug: 'x', name: 'An event', description: null, eventUrl: 'https://example.com', registrationUrl: null, organizerName: 'ACG', organizerType: 'association',
    startDate: '2026-10-14', endDate: null, timeNote: null, city: 'New York', stateRegion: 'NY', country: 'US', venue: null, eventFormat: 'in_person', eventKind: 'conference',
    costType: 'paid', priceNote: null, costVerified: false, fundCategories: [], topics: [], opsRelevance: 'medium', region: 'north_america', isFeatured: false, expectedAttendance: null, isSubmitted: false, boardException: false, clickCount: 0,
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
  it('in the email: "Free" only for an event whose registration page was checked', () => {
    const html = (costVerified: boolean) =>
      renderNewsletterEmail({ groups: [], totalArticles: 0, editionDate: '2026-10-13', unsubscribeUrl: 'https://fundopshq.com/u', events: [ev({ slug: 'f', name: 'A free one', costType: 'free', costVerified })] })
    expect(html(true)).toContain('ACG \u00b7 New York, NY \u00b7 Free')
    expect(html(false)).toContain('ACG \u00b7 New York, NY')
    expect(html(false)).not.toContain('\u00b7 Free')
  })
  it('an event its organizer submitted is always shown on its day, first; the rest of the two is the best of the others', () => {
    const day = [
      ev({ slug: 'cfo', opsRelevance: 'high' }),
      ev({ slug: 'star', isFeatured: true }),
      ev({ slug: 'webinar', opsRelevance: 'low', isSubmitted: true }),
      ev({ slug: 'social', opsRelevance: 'low' }),
    ]
    const [d] = pickEventsForEmail(day, () => 'd')
    expect(d.shown.map((e) => e.slug)).toEqual(['webinar', 'star'])
    expect(d.more).toBe(2)
    // Three submitted on one day: all three, and nothing else.
    const three = [ev({ slug: 'a', isSubmitted: true }), ev({ slug: 'b', isSubmitted: true }), ev({ slug: 'c', isSubmitted: true }), ev({ slug: 'cfo', opsRelevance: 'high' })]
    const [t] = pickEventsForEmail(three, () => 'd')
    expect(t.shown.map((e) => e.slug)).toEqual(['a', 'b', 'c'])
    expect(t.more).toBe(1)
    const html = renderNewsletterEmail({ groups: [], totalArticles: 0, editionDate: '2026-10-21', unsubscribeUrl: 'https://fundopshq.com/u', events: day.map((e, i) => ({ ...e, name: `Event ${e.slug}`, id: String(i) })) })
    expect(html).toContain('Event webinar')
    expect(html).not.toContain('Event cfo')
  })
})
