import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EventRow } from '../EventRow'
import type { IndustryEvent } from '@/lib/events/types'

// A board row says "Free" only when the registration page was checked (2026-10-15), keeps the access
// labels, and says nothing about anything else.
const ev = (o: Partial<IndustryEvent>): IndustryEvent =>
  ({
    id: 'x', slug: 'hpe-nyc-2026', name: 'HPE NYC 2026', description: null, eventUrl: 'https://example.com', registrationUrl: null, organizerName: 'McDermott Will & Schulte', organizerType: 'law_firm',
    startDate: '2026-10-22', endDate: null, timeNote: null, city: 'New York', stateRegion: 'NY', country: 'US', venue: null, eventFormat: 'in_person', eventKind: 'conference',
    costType: 'paid', priceNote: null, costVerified: false, fundCategories: [], topics: [], opsRelevance: 'medium', region: 'north_america', isFeatured: false, expectedAttendance: null, isSubmitted: false,
    ...o,
  }) as IndustryEvent

const row = (o: Partial<IndustryEvent>) => render(<EventRow event={ev(o)} />).container.textContent ?? ''

describe('a board row’s cost', () => {
  it('"Free" for a checked free event, with the checked note on hover', () => {
    render(<EventRow event={ev({ costType: 'free', costVerified: true, priceNote: 'Free: the RSVP form takes no payment' })} />)
    const free = screen.getAllByText(/Free/)
    expect(free.length).toBeGreaterThan(0)
    expect(free.some((el) => el.getAttribute('title') === 'Free: the RSVP form takes no payment')).toBe(true)
  })

  it('nothing for an unchecked free event, and no unchecked note on hover', () => {
    const { container } = render(<EventRow event={ev({ costType: 'free', costVerified: false, priceNote: 'No fee listed' })} />)
    expect(container.textContent).not.toMatch(/Free/)
    expect(container.querySelector('[title="No fee listed"]')).toBeNull()
  })

  it('never "Paid" or "Mixed"', () => {
    expect(row({ costType: 'paid', costVerified: true, priceNote: '$2,500' })).not.toMatch(/Paid|\$2,500/)
    expect(row({ costType: 'mixed' })).not.toMatch(/Mixed/)
  })

  it('"Invite only" and "Members only" stay', () => {
    expect(row({ costType: 'invite_only' })).toContain('Invite only')
    expect(row({ costType: 'member_only' })).toContain('Members only')
  })
})
