import { describe, it, expect } from 'vitest'
import { eventsWeeklyMode, mondayEmailLive } from '../weekly-mode'

describe('the Monday events email switch (EVENTS_WEEKLY_MODE)', () => {
  it('is off unless set to preview or live', () => {
    expect(eventsWeeklyMode({})).toBe('off')
    expect(eventsWeeklyMode({ EVENTS_WEEKLY_MODE: '' })).toBe('off')
    expect(eventsWeeklyMode({ EVENTS_WEEKLY_MODE: 'off' })).toBe('off')
    expect(eventsWeeklyMode({ EVENTS_WEEKLY_MODE: 'true' })).toBe('off')
    expect(eventsWeeklyMode({ EVENTS_WEEKLY_MODE: 'on' })).toBe('off')
    expect(eventsWeeklyMode({ EVENTS_WEEKLY_MODE: 'preview' })).toBe('preview')
    expect(eventsWeeklyMode({ EVENTS_WEEKLY_MODE: ' Live ' })).toBe('live')
  })

  it('lets the site promise the Monday email only when it is live', () => {
    expect(mondayEmailLive({})).toBe(false)
    expect(mondayEmailLive({ EVENTS_WEEKLY_MODE: 'preview' })).toBe(false)
    expect(mondayEmailLive({ EVENTS_WEEKLY_MODE: 'live' })).toBe(true)
  })
})
