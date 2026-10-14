import { describe, it, expect } from 'vitest'
import { minutesIntoDayET, sendWindowOpen } from '../send-time'

// vercel.json fires the send at 10:30 and 11:30 UTC every day.
const at = (iso: string) => new Date(iso)

describe('the 6:30 New York send, on both sides of daylight saving', () => {
  it('in summer time (EDT, UTC-4) the 10:30 UTC fire is 6:30 and sends', () => {
    expect(minutesIntoDayET(at('2026-10-15T10:30:00Z'))).toBe(6 * 60 + 30)
    expect(sendWindowOpen(at('2026-10-15T10:30:00Z'))).toBe(true)
    // 11:30 UTC is 7:30: open, and send-daily skips an edition already sent.
    expect(sendWindowOpen(at('2026-10-15T11:30:00Z'))).toBe(true)
  })

  it('in winter time (EST, UTC-5, from 2026-11-01) the 10:30 UTC fire is 5:30 and waits; 11:30 UTC is 6:30 and sends', () => {
    expect(minutesIntoDayET(at('2026-11-02T10:30:00Z'))).toBe(5 * 60 + 30)
    expect(sendWindowOpen(at('2026-11-02T10:30:00Z'))).toBe(false)
    expect(minutesIntoDayET(at('2026-11-02T11:30:00Z'))).toBe(6 * 60 + 30)
    expect(sendWindowOpen(at('2026-11-02T11:30:00Z'))).toBe(true)
  })

  it('on the morning the clocks change (Sunday 2026-11-01) and back in spring (Sunday 2027-03-14)', () => {
    expect(sendWindowOpen(at('2026-11-01T10:30:00Z'))).toBe(false) // 5:30 EST
    expect(sendWindowOpen(at('2026-11-01T11:30:00Z'))).toBe(true) // 6:30 EST
    expect(sendWindowOpen(at('2027-03-14T10:30:00Z'))).toBe(true) // 6:30 EDT
  })

  it('a fire a few seconds early still sends; midnight is closed', () => {
    expect(sendWindowOpen(at('2026-10-15T10:29:55Z'))).toBe(true)
    expect(sendWindowOpen(at('2026-10-15T04:00:00Z'))).toBe(false)
  })
})
