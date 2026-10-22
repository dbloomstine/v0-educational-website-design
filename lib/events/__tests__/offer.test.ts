import { describe, it, expect } from 'vitest'
import { eventsOfferHeadline, possessive } from '../offer'

describe('the events offer', () => {
  it('names the city when the page has one', () => {
    expect(eventsOfferHeadline('Chicago')).toBe('Get Chicago’s private-markets events every Monday, plus the morning news.')
    expect(eventsOfferHeadline('Los Angeles')).toBe('Get Los Angeles’ private-markets events every Monday, plus the morning news.')
  })
  it('offers the week’s events when there is no city', () => {
    expect(eventsOfferHeadline(null)).toBe('Get the week’s fund events every Monday, plus the morning news.')
    expect(eventsOfferHeadline('  ')).toBe('Get the week’s fund events every Monday, plus the morning news.')
  })
  it('writes possessives', () => {
    expect(possessive('Washington DC')).toBe('Washington DC’s')
    expect(possessive('Dallas')).toBe('Dallas’')
  })
})
