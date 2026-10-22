import { describe, it, expect } from 'vitest'
import { eventsOfferHeadline, possessive } from '../offer'

describe('the events offer', () => {
  it('names the city when the page has one', () => {
    expect(eventsOfferHeadline('Chicago')).toBe('Get the week’s Chicago and North American fund events, with the morning news.')
    expect(eventsOfferHeadline('Los Angeles')).toBe('Get the week’s Los Angeles and North American fund events, with the morning news.')
  })
  it('offers the week’s events when there is no city', () => {
    expect(eventsOfferHeadline(null)).toBe('Get the week’s fund events and the morning news in one email.')
    expect(eventsOfferHeadline('  ')).toBe('Get the week’s fund events and the morning news in one email.')
  })
  it('writes possessives', () => {
    expect(possessive('Washington DC')).toBe('Washington DC’s')
    expect(possessive('Dallas')).toBe('Dallas’')
  })
})
