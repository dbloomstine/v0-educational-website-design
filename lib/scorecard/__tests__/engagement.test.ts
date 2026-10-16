import { describe, expect, it } from 'vitest'
import { countEngagement, editionsToCount, emailWeek, type EditionEngagement, type EditionRow } from '../engagement'
import { scorecard, scorecardMail } from '../scorecard'

const H = 3_600_000
const NOW = Date.parse('2026-10-12T12:30:00Z') // a Monday, when the scorecard goes out
const g = (clicked: number, recipients: number, final = true): EditionEngagement => ({ recipients, measured: recipients, delivered: recipients, opened: clicked, clicked, bounced: 0, complained: 0, measured_at: '2026-10-12T12:00:00Z', final })
const ed = (date: string, engagement: EditionEngagement | null, extra: Partial<EditionRow> = {}): EditionRow => ({ id: date, edition_date: date, sent_at: `${date}T11:30:00Z`, status: 'sent', resend_email_ids: { 'a@x.com': `${date}-a` }, engagement, ...extra })

describe('counting one edition', () => {
  it('counts people by their last event; a click is also an open and a delivery; an id Resend did not give is unknown', () => {
    const ids = { 'a@x.com': '1', 'b@x.com': '2', 'c@x.com': '3', 'd@x.com': '4', 'e@x.com': '5', 'f@x.com': '6' }
    const events = new Map([['1', 'clicked'], ['2', 'opened'], ['3', 'delivered'], ['4', 'bounced'], ['5', 'clicked']])
    const sent = '2026-10-10T11:30:00Z'
    const c = countEngagement(ids, events, sent, Date.parse(sent) + 25 * H)
    expect(c).toMatchObject({ recipients: 6, measured: 5, delivered: 4, opened: 3, clicked: 2, bounced: 1, complained: 0, final: false })
    expect(countEngagement(ids, events, sent, Date.parse(sent) + 73 * H).final).toBe(true)
    expect(countEngagement(null, events, sent, NOW).recipients).toBe(0)
  })
})

describe('which editions the daily job counts', () => {
  it('a day old or more, a fortnight at most, and not once its count is final', () => {
    const rows = [
      ed('2026-10-12', null), // half an hour old: too soon
      ed('2026-10-11', null), // 25 hours: first count
      ed('2026-10-10', g(10, 100, false)), // counted, not final: again
      ed('2026-10-09', g(10, 100, true)), // final: left alone
      ed('2026-09-20', null), // older than the lookback
      ed('2026-10-08', null, { status: 'failed' }),
      ed('2026-10-07', null, { resend_email_ids: {} }),
    ]
    expect(editionsToCount(rows, Date.parse('2026-10-12T12:00:00Z')).map((e) => e.edition_date)).toEqual(['2026-10-11', '2026-10-10'])
  })
})

describe('the human click count (the webhook, since 2026-10-16)', () => {
  it('is counted beside the last-event figure and labelled as people, edition by edition and on average', () => {
    const human = (clicked: number, recipients: number, people: number): EditionEngagement => ({ ...g(clicked, recipients), human_clicked: people, event_clicked: clicked, event_opened: clicked + 10, click_events: clicked * 3 })
    const rows = [ed('2026-10-05', human(40, 150, 12)), ed('2026-10-06', g(30, 150)), ed('2026-10-11', human(20, 160, 9)), ed('2026-09-30', human(10, 100, 4))]
    const w = emailWeek(rows, '2026-10-05', '2026-10-11')
    expect(w).toMatchObject({ human: 21, humanEditions: 2, humanPerEdition: 11, humanShare: 6.8 })
    expect(w.editions.map((e) => e.human)).toEqual([12, null, 9])
    expect(w.before).toMatchObject({ human: 4, humanEditions: 1, humanPerEdition: 4 })
    const html = scorecardMail(scorecard({ subscribers: [], posts: [], metrics: [], editions: rows, sponsorLooks: 0, now: NOW })).html
    expect(html).toContain('<b>11</b> of them were people, not link scanners, in an average edition (<b>6.8%</b>')
    expect(html).toContain('2 of 3 editions have the count) <span style="color:#55647A;">(4 the week before)</span>')
    expect(html).toContain('Mon Oct 5 40 of 150 (26.7%), 12 people · Tue Oct 6 30 of 150 (20%) · Sun Oct 11 20 of 160 (12.5%), 9 people')
  })
  it('one edition counted from the webhook’s events', () => {
    const sent = '2026-10-16T11:30:00Z'
    const t = (s: number) => new Date(Date.parse(sent) + s * 1000).toISOString()
    const events = [
      { resend_email_id: '1', type: 'delivered' as const, occurred_at: t(1) }, { resend_email_id: '1', type: 'opened' as const, occurred_at: t(2) }, { resend_email_id: '1', type: 'clicked' as const, occurred_at: t(2) },
      { resend_email_id: '2', type: 'delivered' as const, occurred_at: t(1) }, { resend_email_id: '2', type: 'clicked' as const, occurred_at: t(900) },
    ]
    const c = countEngagement({ 'a@x.com': '1', 'b@x.com': '2', 'c@x.com': '3' }, new Map([['1', 'clicked'], ['2', 'clicked']]), sent, Date.parse(sent) + 30 * H, events)
    expect(c).toMatchObject({ recipients: 3, clicked: 2, human_clicked: 1, event_clicked: 2, event_opened: 1, click_events: 2 })
    // Without events there is no human figure at all, not a zero.
    expect(countEngagement({ 'a@x.com': '1' }, new Map(), sent, Date.parse(sent) + 30 * H)).not.toHaveProperty('human_clicked')
  })
})

describe('the week of clicks', () => {
  it('sums the week against the week before, by edition date; an edition not yet counted is named, not guessed', () => {
    const rows = [
      ed('2026-10-05', g(40, 150)), ed('2026-10-06', g(30, 150)), ed('2026-10-11', g(20, 160, false)), ed('2026-10-10', null),
      ed('2026-09-28', g(10, 100)), ed('2026-10-04', g(30, 100)), // the week before
      ed('2026-10-12', g(99, 160)), // today's: not in either week
    ]
    const w = emailWeek(rows, '2026-10-05', '2026-10-11')
    expect(w.editions.map((e) => [e.date, e.clicked, e.share, e.final])).toEqual([['2026-10-05', 40, 26.7, true], ['2026-10-06', 30, 20, true], ['2026-10-11', 20, 12.5, false]])
    expect(w.unmeasured).toEqual(['2026-10-10'])
    expect(w).toMatchObject({ clicked: 90, recipients: 460, share: 19.6, perEdition: 30 })
    expect(w.before).toEqual({ editions: 2, clicked: 40, recipients: 200, share: 20, perEdition: 20, human: 0, humanEditions: 0, humanPerEdition: 0 })
    // No edition has the webhook's count yet: nothing is said about people as against scanners.
    expect(w).toMatchObject({ human: 0, humanEditions: 0, humanPerEdition: 0, humanShare: 0 })
    expect(w.editions.every((e) => e.human === null)).toBe(true)
  })

  it('goes into the Monday letter, and says plainly when nothing has been counted', () => {
    const card = scorecard({ subscribers: [], posts: [], metrics: [], editions: [ed('2026-10-05', g(40, 150)), ed('2026-10-11', g(20, 160, false)), ed('2026-09-30', g(10, 100))], sponsorLooks: 0, now: NOW })
    expect(card.from).toBe('2026-10-05')
    const html = scorecardMail(card).html
    expect(html).toContain('<b>30</b> people clicked a link in an average edition by Resend’s last event, <b>19.4%</b> of those it went to')
    expect(html).not.toContain('not link scanners')
    expect(html).toContain('(10, 10%, the week before)')
    expect(html).toContain('Mon Oct 5 40 of 150 (26.7%) · Sun Oct 11 20 of 160 (12.5%) so far.')
    const none = scorecardMail(scorecard({ subscribers: [], posts: [], metrics: [], editions: [ed('2026-10-06', null)], sponsorLooks: 0, now: NOW })).html
    expect(none).toContain('Not counted yet')
    const old = scorecardMail(scorecard({ subscribers: [], posts: [], metrics: [], sponsorLooks: 0, now: NOW })).html
    expect(old).toContain('No edition went out this week.')
  })
})
