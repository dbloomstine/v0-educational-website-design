import { describe, it, expect, vi } from 'vitest'
import { costDetail, costLabel, isVerifiedFree, verifiedPriceNote } from '../constants'
import { buildIcsCalendar } from '../ics'
import type { IndustryEvent } from '../types'

vi.mock('@/lib/supabase/client', () => ({ getSupabaseAdmin: () => { throw new Error('no database in tests') } }))
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }))

// Cost is said only where we saw it (2026-10-15): the board had called a $2,500 law-firm conference
// "Free" from its event page alone.
const ev = (o: Partial<IndustryEvent>): IndustryEvent =>
  ({
    id: 'x', slug: 'x', name: 'An event', description: null, eventUrl: 'https://example.com', registrationUrl: null, organizerName: 'Sidley Austin', organizerType: 'law_firm',
    startDate: '2026-10-20', endDate: null, timeNote: null, city: 'Dallas', stateRegion: 'TX', country: 'US', venue: null, eventFormat: 'in_person', eventKind: 'forum',
    costType: 'paid', priceNote: null, costVerified: false, fundCategories: [], topics: [], opsRelevance: 'medium', region: 'north_america', isFeatured: false, expectedAttendance: null, isSubmitted: false,
    ...o,
  }) as IndustryEvent

describe('what an event says about its cost', () => {
  it('"Free" only when free and checked on the registration page', () => {
    expect(costLabel(ev({ costType: 'free', costVerified: true }))).toBe('Free')
    expect(isVerifiedFree(ev({ costType: 'free', costVerified: true }))).toBe(true)
    expect(costLabel(ev({ costType: 'free', costVerified: false, priceNote: 'No fee listed' }))).toBeNull()
    expect(isVerifiedFree(ev({ costType: 'free', costVerified: false }))).toBe(false)
    expect(isVerifiedFree(ev({ costType: 'paid', costVerified: true }))).toBe(false)
  })

  it('keeps the access labels, checked or not, and never says "Paid" or "Mixed"', () => {
    expect(costLabel(ev({ costType: 'invite_only' }))).toBe('Invite only')
    expect(costLabel(ev({ costType: 'member_only' }))).toBe('Members only')
    expect(costLabel(ev({ costType: 'paid', costVerified: true, priceNote: '$895' }))).toBeNull()
    expect(costLabel(ev({ costType: 'mixed' }))).toBeNull()
  })

  it('shows a price note only when it was verified', () => {
    expect(verifiedPriceNote(ev({ costType: 'paid', costVerified: true, priceNote: ' $895 per attendee ' }))).toBe('$895 per attendee')
    expect(verifiedPriceNote(ev({ costType: 'paid', costVerified: false, priceNote: '$895 per attendee' }))).toBeNull()
    expect(verifiedPriceNote(ev({ costType: 'paid', costVerified: true, priceNote: '  ' }))).toBeNull()
  })

  it('an event page: the verified note, else the label, else no Cost line', () => {
    expect(costDetail(ev({ costType: 'paid', costVerified: true, priceNote: '$1,400 to $2,500' }))).toBe('$1,400 to $2,500')
    expect(costDetail(ev({ costType: 'paid', costVerified: false, priceNote: 'Paid registration' }))).toBeNull()
    expect(costDetail(ev({ costType: 'mixed', priceNote: 'Complimentary for some' }))).toBeNull()
    expect(costDetail(ev({ costType: 'free', costVerified: true, priceNote: null }))).toBe('Free')
    expect(costDetail(ev({ costType: 'free', costVerified: true, priceNote: 'Free: the RSVP form takes no payment' }))).toBe('Free: the RSVP form takes no payment')
    expect(costDetail(ev({ costType: 'free', costVerified: false, priceNote: 'No fee listed' }))).toBeNull()
    expect(costDetail(ev({ costType: 'invite_only', priceNote: 'Contact the firm' }))).toBe('Invite only')
  })

  it('the calendar file says the same', () => {
    const ics = (o: Partial<IndustryEvent>) => buildIcsCalendar([ev(o)], 'Test')
    expect(ics({ costType: 'free', costVerified: true })).toContain('Cost: Free')
    expect(ics({ costType: 'free', costVerified: false, priceNote: 'No fee listed' })).not.toContain('Cost:')
    expect(ics({ costType: 'paid', costVerified: false, priceNote: 'Paid registration' })).not.toContain('Cost:')
    expect(ics({ costType: 'paid', costVerified: true, priceNote: '$895' })).toContain('Cost: $895')
  })
})

describe('the board’s cost filter', () => {
  it('"free" asks for free and verified; others are plain; unknown values match nothing', async () => {
    const { costFilter } = await import('../api')
    expect(costFilter('free')).toBe('and(cost_type.eq.free,cost_verified.is.true)')
    expect(costFilter('free,invite_only')).toBe('and(cost_type.eq.free,cost_verified.is.true),cost_type.eq.invite_only')
    expect(costFilter('member_only')).toBe('cost_type.eq.member_only')
    expect(costFilter('bogus')).toBe('cost_type.eq.none')
    expect(costFilter('free);drop')).toBe('cost_type.eq.none')
  })
})
