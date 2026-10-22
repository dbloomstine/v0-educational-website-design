import { describe, it, expect } from 'vitest'
import { pickWebinarsForEmail, startMinutesEastern, webinarDay, newYorkNow } from '../email-webinars'
import { renderNewsletterEmail, webinarsForEdition } from '../email-template'
import { renderNewsletterText, webinarsText } from '../email-text'
import type { IndustryEvent } from '@/lib/events/types'

let seq = 0
function webinar(o: Partial<IndustryEvent> = {}): IndustryEvent {
  const id = `w${++seq}`
  return {
    id, slug: `webinar-${id}`, name: `Fund tax update ${id}`, description: null, eventUrl: 'https://example.com', registrationUrl: null,
    organizerName: 'Crowe LLP', organizerType: 'accounting', startDate: '2026-10-28', endDate: null, timeNote: '1:00 PM ET',
    city: null, stateRegion: null, country: null, venue: null, eventFormat: 'virtual', eventKind: 'webinar', costType: 'free',
    priceNote: null, costVerified: true, fundCategories: [], topics: [], opsRelevance: 'high', region: 'north_america',
    isFeatured: false, expectedAttendance: null, isSubmitted: false, status: 'published', ...o,
  }
}

// Thursday 2026-10-22, 9:30am in New York (EDT, UTC-4).
const NOW = new Date('2026-10-22T13:30:00Z')
const TODAY = '2026-10-22'
const pick = (events: IndustryEvent[], exclude?: Set<string>) => pickWebinarsForEmail(events, { today: TODAY, now: NOW, exclude })

describe('startMinutesEastern', () => {
  it('reads single times, ranges and North American zones', () => {
    expect(startMinutesEastern('1pm ET')).toBe(13 * 60)
    expect(startMinutesEastern('11:30am–1pm ET')).toBe(11 * 60 + 30)
    expect(startMinutesEastern('1–2pm ET')).toBe(13 * 60)
    expect(startMinutesEastern('12pm CT')).toBe(13 * 60)
    expect(startMinutesEastern('10am PT')).toBe(13 * 60)
    expect(startMinutesEastern('2pm')).toBe(14 * 60)
  })
  it('gives null for what it cannot place', () => {
    expect(startMinutesEastern('2pm GMT')).toBeNull()
    expect(startMinutesEastern('Morning')).toBeNull()
  })
})

describe('dates', () => {
  it('formats the day short', () => {
    expect(webinarDay('2026-10-28')).toBe('Wed Oct 28')
    expect(webinarDay('2026-11-03')).toBe('Tue Nov 3')
  })
  it('reads the New York clock', () => {
    expect(newYorkNow(NOW)).toEqual({ date: '2026-10-22', minutes: 9 * 60 + 30 })
  })
})

describe('pickWebinarsForEmail', () => {
  it('lists qualifying webinars soonest first, with day and time', () => {
    const a = webinar({ startDate: '2026-10-29', timeNote: '2:00 PM ET' })
    const b = webinar({ startDate: '2026-10-23', timeNote: '11:00 AM ET' })
    const got = pick([a, b])
    expect(got.map((w) => w.event.id)).toEqual([b.id, a.id])
    expect(got[0].day).toBe('Fri Oct 23')
    expect(got[0].time).toBe('11am ET')
  })

  it('leaves out fewer than two: no block over one line', () => {
    expect(pick([webinar()])).toEqual([])
    expect(pick([])).toEqual([])
  })

  it('needs a stated time', () => {
    expect(pick([webinar(), webinar({ timeNote: null })])).toEqual([])
    expect(pick([webinar(), webinar({ timeNote: 'All day' })])).toEqual([])
  })

  it('needs free AND verified free', () => {
    expect(pick([webinar(), webinar({ costVerified: false })])).toEqual([])
    expect(pick([webinar(), webinar({ costType: 'paid' })])).toEqual([])
  })

  it('needs high or medium ops relevance', () => {
    expect(pick([webinar(), webinar({ opsRelevance: 'low' })])).toEqual([])
    expect(pick([webinar(), webinar({ opsRelevance: 'medium' })])).toHaveLength(2)
  })

  it('keeps to virtual events in the week, not past', () => {
    expect(pick([webinar(), webinar({ eventFormat: 'in_person' })])).toEqual([])
    expect(pick([webinar(), webinar({ startDate: '2026-10-21' })])).toEqual([])
    expect(pick([webinar(), webinar({ startDate: '2026-10-30' })])).toEqual([])
    expect(pick([webinar(), webinar({ startDate: '2026-10-29' })])).toHaveLength(2)
    // On the edition day: one that started at 9am is gone by 9:30; one at noon is listed.
    expect(pick([webinar(), webinar({ startDate: TODAY, timeNote: '9:00 AM ET' })])).toEqual([])
    expect(pick([webinar(), webinar({ startDate: TODAY, timeNote: '12:00 PM ET' })])).toHaveLength(2)
  })

  it('skips what the week ahead already lists', () => {
    const a = webinar()
    expect(pick([a, webinar()], new Set([a.id]))).toEqual([])
  })

  it('takes at most five, high relevance first, then shows them soonest first', () => {
    const mediums = [23, 24, 25].map((d) => webinar({ startDate: `2026-10-${d}`, opsRelevance: 'medium' }))
    const highs = [26, 27, 28, 29].map((d) => webinar({ startDate: `2026-10-${d}` }))
    const got = pick([...mediums, ...highs])
    expect(got).toHaveLength(5)
    expect(got.map((w) => w.event.startDate)).toEqual(['2026-10-23', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29'])
  })
})

describe('rendering', () => {
  const base = {
    groups: [], totalArticles: 0, editionDate: TODAY, unsubscribeUrl: 'https://fundopshq.com/u', now: NOW,
  }
  const two = [
    webinar({ name: 'Year-end fund tax & reporting', slug: 'year-end-fund-tax', startDate: '2026-10-28', timeNote: '1:00 PM ET', organizerName: 'Crowe LLP' }),
    webinar({ name: 'SEC exam priorities', slug: 'sec-exam-priorities', startDate: '2026-10-23', timeNote: '2:00 PM - 3:00 PM ET', organizerName: 'ACA Group' }),
  ]

  it('renders the block in HTML, after the week ahead, with links that carry the email tag', () => {
    const html = renderNewsletterEmail({ ...base, webinars: two })
    expect(html).toContain('This week&rsquo;s free <span class="fops-amber" style="font-style:italic;">webinars.</span>')
    expect(html).toContain('https://fundopshq.com/events/sec-exam-priorities?utm_source=newsletter&amp;utm_medium=email')
    expect(html).toContain('Year-end fund tax &amp; reporting')
    expect(html).toContain('<td class="fops-etd">Fri Oct 23<br>2–3pm ET</td>')
    expect(html).toContain('<div class="fops-emeta">ACA Group</div>')
    expect(html.indexOf('SEC exam priorities')).toBeLessThan(html.indexOf('Year-end fund tax'))
    expect(html).toContain('https://fundopshq.com/events/webinars?utm_source=newsletter&amp;utm_medium=email')
  })

  it('places the block right after the week ahead', () => {
    const inPerson: IndustryEvent = { ...webinar({ name: 'Fund Ops Summit', eventFormat: 'in_person', city: 'New York', stateRegion: 'NY' }) }
    const html = renderNewsletterEmail({ ...base, events: [inPerson], webinars: two })
    const weekAhead = html.indexOf('The week <span')
    const block = html.indexOf('This week&rsquo;s free')
    expect(weekAhead).toBeGreaterThan(0)
    expect(block).toBeGreaterThan(weekAhead)
    expect(html.indexOf('Fund Ops Summit')).toBeLessThan(block)
  })

  it('renders the text twin', () => {
    const text = renderNewsletterText({ ...base, webinars: two })
    expect(text).toContain(
      [
        'THIS WEEK’S FREE WEBINARS',
        '-------------------------',
        'Free, with the date and time checked at the host.',
        '',
        '- Fri Oct 23 · 2–3pm ET: SEC exam priorities',
        '  ACA Group',
        '  https://fundopshq.com/events/sec-exam-priorities?utm_source=newsletter&utm_medium=email',
        '- Wed Oct 28 · 1pm ET: Year-end fund tax & reporting',
        '  Crowe LLP',
        '  https://fundopshq.com/events/year-end-fund-tax?utm_source=newsletter&utm_medium=email',
        '',
        'Every webinar: https://fundopshq.com/events/webinars?utm_source=newsletter&utm_medium=email',
      ].join('\n'),
    )
  })

  it('fewer than two: no heading on either side', () => {
    const html = renderNewsletterEmail({ ...base, webinars: [two[0]] })
    const text = renderNewsletterText({ ...base, webinars: [two[0]] })
    expect(html).not.toContain('free <span class="fops-amber" style="font-style:italic;">webinars')
    expect(text).not.toContain('FREE WEBINARS')
    expect(webinarsText([])).toBe('')
    expect(renderNewsletterText(base)).not.toContain('FREE WEBINARS')
  })

  it('does not list a submitted webinar twice', () => {
    const submitted = { ...two[0], isSubmitted: true }
    expect(webinarsForEdition({ editionDate: TODAY, now: NOW, events: [submitted], webinars: [submitted, two[1]] })).toEqual([])
  })
})
