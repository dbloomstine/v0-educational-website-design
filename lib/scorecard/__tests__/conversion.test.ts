import { describe, expect, it } from 'vitest'
import { conversionWeek, scorecard, scorecardMail, type SubscriberRow } from '../scorecard'

const NOW = Date.parse('2026-10-26T12:30:00Z')
const ago = (days: number) => new Date(NOW - days * 86_400_000).toISOString()
const sub = (days: number, extra: Partial<SubscriberRow> = {}): SubscriberRow => ({ status: 'confirmed', created_at: ago(days), unsubscribed_at: null, signup_source: null, signup_form: null, ...extra })

describe('the conversion report', () => {
  const subscribers = [
    sub(1, { signup_form: 'inline-story', signup_source: 'LinkedIn', signup_landing_path: '/story/kkr-x' }),
    sub(2, { signup_form: 'inline-story', signup_source: 'google', signup_landing_path: '/story/kkr-x', status: 'unsubscribed', unsubscribed_at: ago(1) }),
    sub(3, { signup_form: 'takeover', signup_source: 'linkedin', signup_landing_path: '/' }),
    sub(4, { signup_form: 'inline-event', signup_landing_path: '/events/cfo-forum' }),
    sub(2, { signup_form: 'test', signup_landing_path: '/' }),
    sub(20, { signup_form: 'inline-firm', signup_landing_path: '/firm/kkr' }),
  ]

  it('counts the week’s joiners by form, confirmed and not, listing the new forms at 0', () => {
    const c = scorecard({ subscribers, posts: [], metrics: [], sponsorLooks: 0, now: NOW }).conversion
    expect(c.forms).toEqual([
      { form: 'inline-story', name: 'the line under a story', joined: 2, confirmed: 1 },
      { form: 'inline-event', name: 'the line under an event', joined: 1, confirmed: 1 },
      { form: 'takeover', name: 'the welcome screen', joined: 1, confirmed: 1 },
      { form: 'inline-firm', name: 'the line on a firm page', joined: 0, confirmed: 0 },
      { form: 'inline-league', name: 'the line on the league tables', joined: 0, confirmed: 0 },
    ])
  })

  it('counts landing pages, and source with landing page, the week’s joiners only and never a test', () => {
    const c = scorecard({ subscribers, posts: [], metrics: [], sponsorLooks: 0, now: NOW }).conversion
    expect(c.landings).toEqual([['/story/kkr-x', 2], ['/', 1], ['/events/cfo-forum', 1]])
    expect(c.sourceLandings).toEqual([['google → /story/kkr-x', 1], ['linkedin → /', 1], ['linkedin → /story/kkr-x', 1], ['not recorded → /events/cfo-forum', 1]])
  })

  it('writes it into the Monday letter, and leaves it out when nobody joined', () => {
    const html = scorecardMail(scorecard({ subscribers, posts: [], metrics: [], sponsorLooks: 0, now: NOW })).html
    expect(html).toContain('By form: the line under a story <b>2</b> (1 confirmed, 1 not) · the line under an event <b>1</b> (1 confirmed)')
    expect(html).toContain('the line on the league tables 0.')
    expect(html).toContain('The page their visit began on: /story/kkr-x 2 · / 1 · /events/cfo-forum 1.')
    expect(html).toContain('Source and landing page: google → /story/kkr-x 1')
    const none = scorecardMail(scorecard({ subscribers: [sub(30)], posts: [], metrics: [], sponsorLooks: 0, now: NOW })).html
    expect(none).not.toContain('Conversion')
    expect(conversionWeek([]).forms).toEqual([])
  })
})
