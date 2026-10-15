import { describe, it, expect } from 'vitest'
import { compactTimeNote } from '../constants'

describe('compactTimeNote', () => {
  it('reads a range whose start has no am/pm (2026-10-15: VentureCrushFG showed 8pm for 5-8pm)', () => {
    expect(compactTimeNote('5:00-8:00 PM ET in person; 5:30-7:00 PM ET by Zoom')).toBe('5–8pm ET')
    expect(compactTimeNote('5:00-7:30 PM ET')).toBe('5–7:30pm ET')
  })
  it('keeps both ends of a range written out in full', () => {
    expect(compactTimeNote('6:00 PM - 8:00 PM ET')).toBe('6–8pm ET')
    expect(compactTimeNote('7:30 AM - 9:00 AM ET')).toBe('7:30–9am ET')
    expect(compactTimeNote('11:30 AM - 1:00 PM ET')).toBe('11:30am–1pm ET')
    expect(compactTimeNote('9:00 AM-5:00 PM ET')).toBe('9am–5pm ET')
  })
  it('crosses noon when the start would otherwise fall after the end', () => {
    expect(compactTimeNote('11:30-1:00 PM ET')).toBe('11:30am–1pm ET')
    expect(compactTimeNote('11:00-12:00 PM ET')).toBe('11am–12pm ET')
  })
  it('a single time stays a single time', () => {
    expect(compactTimeNote('Begins 12:30 PM ET')).toBe('12:30pm ET')
    expect(compactTimeNote('1:00 PM ET (60 minutes)')).toBe('1pm ET')
    expect(compactTimeNote('8:00 AM CT')).toBe('8am CT')
    expect(compactTimeNote('5:00 PM ET registration; 5:30 PM start')).toBe('5pm ET')
  })
  it('takes the earliest time in the note', () => {
    expect(compactTimeNote('Registration 4:30 PM; program 5:00-7:00 PM ET')).toBe('4:30pm ET')
  })
  it('reads Mountain time and 24-hour French-style times', () => {
    expect(compactTimeNote('5:00 PM - 8:00 PM MST')).toBe('5–8pm MST')
    expect(compactTimeNote('17h00 ET')).toBe('5pm ET')
    expect(compactTimeNote('12h00 ET')).toBe('12pm ET')
  })
  it('nothing to read is null', () => {
    expect(compactTimeNote('All day')).toBeNull()
    expect(compactTimeNote(null)).toBeNull()
  })
})
