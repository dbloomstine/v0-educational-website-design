import { describe, expect, it } from 'vitest'
import { countHumanClicks, parseResendEvent, type EngagementEvent } from '../engagement-events'

const SENT = '2026-10-16T11:30:00Z'
const at = (s: number) => new Date(Date.parse(SENT) + s * 1000).toISOString()
const ev = (id: string, type: EngagementEvent['type'], s: number): EngagementEvent => ({ resend_email_id: id, type, occurred_at: at(s) })

describe('reading a Resend engagement event', () => {
  it('keeps delivered, opened and clicked, with the recipient, the time and the link', () => {
    const e = parseResendEvent({ type: 'email.clicked', created_at: at(5), data: { email_id: 'abc', to: ['Reader@Firm.com'], created_at: at(4), click: { link: 'https://fundopshq.com/story/1', timestamp: at(3), userAgent: 'Mozilla' } } })
    expect(e).toEqual({ type: 'clicked', emailId: 'abc', email: 'reader@firm.com', occurredAt: at(3), link: 'https://fundopshq.com/story/1', userAgent: 'Mozilla' })
    expect(parseResendEvent({ type: 'email.delivered', data: { email_id: 'd', to: 'x@y.com', created_at: at(1) } })).toMatchObject({ type: 'delivered', email: 'x@y.com', occurredAt: at(1), link: null })
  })
  it('ignores everything else, and a payload with no id', () => {
    expect(parseResendEvent({ type: 'email.bounced', data: { email_id: 'abc' } })).toBeNull()
    expect(parseResendEvent({ type: 'email.opened', data: {} })).toBeNull()
    expect(parseResendEvent(null)).toBeNull()
    expect(parseResendEvent('x')).toBeNull()
  })
})

describe('human clickers', () => {
  it('a click more than a minute after delivery, not on the heels of an open, is a person', () => {
    const events = [
      // a: delivered, opened 10 min later, clicked a minute after that: a reader
      ev('a', 'delivered', 2), ev('a', 'opened', 600), ev('a', 'clicked', 660),
      // b: delivered, then open and click in the same second, 1s after delivery: a scanner
      ev('b', 'delivered', 2), ev('b', 'opened', 3), ev('b', 'clicked', 3),
      // c: clicks 90s after delivery but within 2s of an open: still the scanner
      ev('c', 'delivered', 0), ev('c', 'opened', 90), ev('c', 'clicked', 91),
      // d: a scanner's burst at delivery, then the reader at lunch
      ev('d', 'delivered', 1), ev('d', 'opened', 2), ev('d', 'clicked', 2), ev('d', 'clicked', 2), ev('d', 'clicked', 14_400),
      // e: opened, never clicked
      ev('e', 'delivered', 1), ev('e', 'opened', 300),
      // f: no delivery event, a click 20s after the send: counted from the send, too soon
      ev('f', 'clicked', 20),
    ]
    expect(countHumanClicks(events, SENT)).toEqual({ clickers: 5, human: 2, openers: 5, clicks: 7 })
  })
  it('an empty day', () => {
    expect(countHumanClicks([], SENT)).toEqual({ clickers: 0, human: 0, openers: 0, clicks: 0 })
  })
})
