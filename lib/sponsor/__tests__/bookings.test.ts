import { describe, it, expect } from 'vitest'
import { bookedThrough, slateFor, sponsorOn, type BookingRow } from '../bookings'

const row = (o: Partial<BookingRow>): BookingRow => ({
  id: 'b1', name: 'Northwind Fund Services', blurb: 'Fund administration for emerging managers, with a dedicated controller on every fund.',
  tagline: null, cta_url: 'https://example.com/northwind', cta_text: 'See how it works', logo_url: null, logo_width: null,
  starts_on: '2026-11-02', ends_on: '2026-11-08', status: 'booked', created_at: '2026-10-20T12:00:00Z', ...o,
})

describe('the sponsor in force on a date', () => {
  it('starts and ends with its run, first and last day included', () => {
    const rows = [row({})]
    expect(sponsorOn(rows, '2026-11-01')).toBeNull()
    expect(sponsorOn(rows, '2026-11-02')?.name).toBe('Northwind Fund Services')
    expect(sponsorOn(rows, '2026-11-08')?.name).toBe('Northwind Fund Services')
    expect(sponsorOn(rows, '2026-11-09')).toBeNull()
  })
  it('is nobody when the run is paused or cancelled', () => {
    expect(sponsorOn([row({ status: 'paused' })], '2026-11-03')).toBeNull()
    expect(sponsorOn([row({ status: 'cancelled' })], '2026-11-03')).toBeNull()
  })
  it('is one sponsor even if the table held two for a day: the one booked first', () => {
    const rows = [row({ id: 'late', name: 'Late Co', created_at: '2026-10-25T00:00:00Z' }), row({ id: 'early', name: 'Early Co', created_at: '2026-10-01T00:00:00Z' })]
    expect(sponsorOn(rows, '2026-11-03')?.name).toBe('Early Co')
  })
  it('will not render a row with a link that is not https, and drops a logo that is not a plain image', () => {
    expect(sponsorOn([row({ cta_url: 'javascript:alert(1)' })], '2026-11-03')).toBeNull()
    expect(sponsorOn([row({ cta_url: 'http://example.com' })], '2026-11-03')).toBeNull()
    const s = sponsorOn([row({ logo_url: 'https://example.com/logo.svg', logo_width: 200 })], '2026-11-03')
    expect(s?.logoUrl).toBeUndefined()
    expect(s?.logoWidth).toBeUndefined()
    expect(sponsorOn([row({ logo_url: 'https://example.com/logo.png', logo_width: 200 })], '2026-11-03')).toMatchObject({ logoUrl: 'https://example.com/logo.png', logoWidth: 200 })
  })
  it('gives the email a slate: one sponsor under "PRESENTED BY", or an empty one for the house notice', () => {
    expect(slateFor(sponsorOn([row({})], '2026-11-03'))).toMatchObject({ label: 'PRESENTED BY', sponsors: [{ name: 'Northwind Fund Services', ctaUrl: 'https://example.com/northwind' }] })
    expect(slateFor(null)).toEqual({ label: 'PRESENTED BY', sponsors: [] })
  })
})

describe('"booked through"', () => {
  it('is null while the slot is open', () => {
    expect(bookedThrough([row({})], '2026-10-30')).toBeNull()
    expect(bookedThrough([], '2026-10-30')).toBeNull()
  })
  it('follows back-to-back runs to the end, and stops at a gap', () => {
    const rows = [
      row({ id: 'a', starts_on: '2026-11-02', ends_on: '2026-11-08' }),
      row({ id: 'b', starts_on: '2026-11-09', ends_on: '2026-11-15' }),
      row({ id: 'c', starts_on: '2026-11-20', ends_on: '2026-11-26' }),
    ]
    expect(bookedThrough(rows, '2026-11-04')).toBe('2026-11-15')
    expect(bookedThrough(rows, '2026-11-21')).toBe('2026-11-26')
    expect(bookedThrough(rows, '2026-11-17')).toBeNull()
  })
})
