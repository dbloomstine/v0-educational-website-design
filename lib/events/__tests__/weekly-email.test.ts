import { describe, it, expect } from 'vitest'
import {
  WEEKLY_UTM,
  cityKey,
  cityName,
  eventUrl,
  isUsOrCanada,
  mondayOf,
  planForReader,
  renderWeeklyEmail,
  renderWeeklyText,
  rowDate,
  selectWeeklyEvents,
  weeklySendWindowOpen,
  weeklySubject,
  THIS_WEEK_MAX,
} from '../weekly-email'
import { FIXTURE_EVENTS, FIXTURE_TODAY, ev } from './weekly-fixture'

const week = selectWeeklyEvents(FIXTURE_EVENTS, FIXTURE_TODAY)
const ids = (list: { id: string }[]) => list.map((e) => e.id)

describe('which events the Monday email lists', () => {
  it('takes this week (today to Sunday) and next week (Monday to Sunday), nothing before or after', () => {
    expect(ids(week.thisWeek)).not.toContain('past')
    expect(ids([...week.thisWeek, ...week.nextWeek])).not.toContain('later')
    expect(ids(week.nextWeek).sort()).toEqual(['chi-next', 'dal-sum', 'sf-small'])
  })

  it('is US and Canada only: no Mexico, no hand-flagged exception elsewhere', () => {
    expect(ids(week.thisWeek)).toEqual(expect.arrayContaining(['tor-tax', 'nyc-cfo', 'web']))
    expect(ids(week.thisWeek)).not.toContain('mex')
    expect(ids(week.thisWeek)).not.toContain('ldn')
    expect(isUsOrCanada({ region: 'north_america', country: 'USA' })).toBe(true)
    expect(isUsOrCanada({ region: 'north_america', country: null })).toBe(true)
    expect(isUsOrCanada({ region: 'north_america', country: 'Mexico' })).toBe(false)
    expect(isUsOrCanada({ region: 'europe', country: 'United Kingdom' })).toBe(false)
  })

  it('runs by day, the more notable first within a day, each event once', () => {
    const doubled = selectWeeklyEvents([...FIXTURE_EVENTS, ...FIXTURE_EVENTS], FIXTURE_TODAY)
    expect(doubled.thisWeek).toHaveLength(week.thisWeek.length)
    // Oct 29: the ops summit (high relevance, a summit) before the tax day.
    expect(ids(week.thisWeek)).toEqual(['nyc-cfo', 'chi-lp', 'chi-ops', 'tor-tax', 'web', 'bos-vc'])
  })
})

describe('a reader’s city comes first', () => {
  it('with no city: this week, then next week’s notable few', () => {
    const plan = planForReader(week, [])
    expect(plan.cityLabel).toBeNull()
    expect(plan.sections.map((s) => s.title)).toEqual(['This week', 'Next week: worth planning for'])
    expect(ids(plan.sections[0].events)).toEqual(ids(week.thisWeek))
    // The featured summit leads next week's picks by notability, but they are shown by date.
    expect(ids(plan.sections[1].events)).toEqual(['chi-next', 'dal-sum', 'sf-small'])
  })

  it('with Chicago: Chicago this week, the rest of North America, Chicago next week, then the rest', () => {
    const plan = planForReader(week, ['chicago'])
    expect(plan.cityLabel).toBe('Chicago')
    expect(plan.sections.map((s) => s.title)).toEqual([
      'This week in Chicago',
      'This week across North America',
      'Next week in Chicago',
      'Next week elsewhere: worth planning for',
    ])
    expect(ids(plan.sections[0].events)).toEqual(['chi-lp', 'chi-ops'])
    expect(ids(plan.sections[1].events)).toEqual(['nyc-cfo', 'tor-tax', 'web', 'bos-vc'])
    expect(ids(plan.sections[2].events)).toEqual(['chi-next'])
    expect(ids(plan.sections[3].events)).toEqual(['dal-sum', 'sf-small'])
    // Nothing twice.
    const all = plan.sections.flatMap((s) => ids(s.events))
    expect(new Set(all).size).toBe(all.length)
    // The city page is linked under the city's last list.
    expect(plan.sections[2].link?.url).toBe(`https://fundopshq.com/events/chicago?${WEEKLY_UTM}`)
  })

  it('says so when the reader’s city has nothing this week, and still lists the rest', () => {
    const plan = planForReader(week, ['denver'])
    expect(plan.sections[0]).toMatchObject({ title: 'This week in Denver', events: [], emptyNote: 'Nothing on the board in Denver this week.' })
    expect(plan.sections[1].events).toHaveLength(week.thisWeek.length)
  })

  it('takes a virtual event as nowhere in particular', () => {
    const plan = planForReader(week, ['new-york'])
    expect(ids(plan.sections[0].events)).toEqual(['nyc-cfo'])
    expect(ids(plan.sections[1].events)).toContain('web')
  })

  it('names two cities, and more than two as “your cities”', () => {
    expect(planForReader(week, ['chicago', 'boston']).cityLabel).toBe('Chicago and Boston')
    expect(ids(planForReader(week, ['chicago', 'boston']).sections[0].events)).toEqual(['chi-lp', 'chi-ops', 'bos-vc'])
    expect(planForReader(week, ['chicago', 'boston', 'toronto']).cityLabel).toBe('your cities')
  })

  it('names a city from its page, else from an event, else from the slug', () => {
    expect(cityName('washington-dc')).toBe('Washington DC')
    expect(cityName('kansas-city', [ev('k', '2026-10-27', { city: 'Kansas City' })])).toBe('Kansas City')
    expect(cityName('st-louis')).toBe('St Louis')
    expect(cityName('arlington-dc')).toBe('Arlington DC')
  })

  it('renders once per set of cities, whatever their order', () => {
    expect(cityKey(['chicago', 'boston'])).toBe(cityKey(['boston', 'chicago', 'boston']))
    expect(cityKey([])).toBe('')
  })

  it('caps a crowded week and says how many more', () => {
    const many = Array.from({ length: THIS_WEEK_MAX + 5 }, (_, i) => ev(`m${i}`, '2026-10-28'))
    const plan = planForReader(selectWeeklyEvents(many, FIXTURE_TODAY), [])
    expect(plan.sections[0].events).toHaveLength(THIS_WEEK_MAX)
    expect(plan.sections[0].more).toBe(5)
  })
})

describe('the words', () => {
  it('opens the subject on the reader’s city', () => {
    expect(weeklySubject(planForReader(week, ['chicago']))).toBe('Chicago this week: 2 fund events, plus 4 across North America')
    expect(weeklySubject(planForReader(week, ['boston']))).toBe('Boston this week: 1 fund event, plus 5 across North America')
    expect(weeklySubject(planForReader(week, []))).toBe('This week: 6 fund events across North America')
    expect(weeklySubject(planForReader(week, ['denver']))).toBe('This week: 6 fund events across North America')
    const quiet = selectWeeklyEvents([ev('n', '2026-11-03')], FIXTURE_TODAY)
    expect(weeklySubject(planForReader(quiet, []))).toBe('Next week: 1 fund event across North America')
  })

  it('dates a row with its weekday', () => {
    expect(rowDate({ startDate: '2026-10-29', endDate: '2026-10-30' })).toMatch(/^Thu Oct 29–30/)
  })

  it('links every event to its page on fundopshq.com, tagged as this email', () => {
    expect(eventUrl('fund-cfo-breakfast')).toBe('https://fundopshq.com/events/fund-cfo-breakfast?utm_source=newsletter&utm_medium=email&utm_campaign=events-monday')
  })
})

describe('the email', () => {
  const params = { plan: planForReader(week, ['chicago']), todayIso: FIXTURE_TODAY, eventsUnsubscribeUrl: 'EVENTS_UNSUB', unsubscribeAllUrl: 'ALL_UNSUB' }
  const html = renderWeeklyEmail(params)
  const text = renderWeeklyText(params)

  it('is small clean sans-serif, with no serif hero, and every link coloured inline', () => {
    expect(html).not.toMatch(/Georgia|[^-]serif|Times/)
    expect(html).toContain('Arial,Helvetica,sans-serif')
    const anchors = html.match(/<a [^>]*>/g) ?? []
    expect(anchors.length).toBeGreaterThan(10)
    for (const a of anchors) expect(a).toMatch(/style="color:[^"]+;text-decoration:/)
    expect(Buffer.byteLength(html)).toBeLessThan(60_000)
  })

  it('links events with the campaign tag, escaped in the HTML', () => {
    expect(html).toContain('href="https://fundopshq.com/events/event-chi-ops?utm_source=newsletter&amp;utm_medium=email&amp;utm_campaign=events-monday"')
    expect(text).toContain('https://fundopshq.com/events/event-chi-ops?utm_source=newsletter&utm_medium=email&utm_campaign=events-monday')
  })

  it('offers both ways out: this email only, and everything', () => {
    expect(html).toContain('href="EVENTS_UNSUB"')
    expect(html).toContain('Stop the Monday events email')
    expect(html).toContain('href="ALL_UNSUB"')
    expect(text).toContain('Stop the Monday events email: EVENTS_UNSUB')
    expect(text).toContain('Unsubscribe from all FundOpsHQ email: ALL_UNSUB')
  })

  it('escapes what the board holds', () => {
    const odd = selectWeeklyEvents([ev('x', '2026-10-27', { name: 'Ops & <Tax> "Day"' })], FIXTURE_TODAY)
    const out = renderWeeklyEmail({ ...params, plan: planForReader(odd, []) })
    expect(out).toContain('Ops &amp; &lt;Tax&gt; &quot;Day&quot;')
    expect(out).not.toContain('<Tax>')
  })

  it('has a plain-text part with the same lists in the same order', () => {
    const order = ['THIS WEEK IN CHICAGO', 'Midwest LP Roundtable', 'THIS WEEK ACROSS NORTH AMERICA', 'Fund CFO Breakfast', 'NEXT WEEK IN CHICAGO', 'Chicago Fund Finance Lunch', 'NEXT WEEK ELSEWHERE']
    const at = order.map((s) => text.indexOf(s))
    expect(at.every((i) => i >= 0)).toBe(true)
    expect([...at].sort((a, b) => a - b)).toEqual(at)
    expect(text).toContain('Canadian Fund Tax Day\nThu Oct 29 · Bay Street Tax Group · Toronto, ON · Free')
    expect(text).not.toMatch(/<[a-z]/i)
  })

  it('says “Free” only when it was checked, and “Invite only” as an access note', () => {
    expect(text).toMatch(/Midwest LP Roundtable\n[^\n]*Invite only/)
    expect(text).not.toMatch(/Fund CFO Breakfast\n[^\n]*Free/)
  })
})

describe('when it goes out: 6:45 New York time on Mondays, on both sides of daylight saving', () => {
  // vercel.json fires at 10:45 and 11:45 UTC on Mondays.
  it('in summer time (EDT) the 10:45 UTC fire sends and the 11:45 does not', () => {
    expect(weeklySendWindowOpen(new Date('2026-10-26T10:45:00Z'))).toBe(true)
    expect(weeklySendWindowOpen(new Date('2026-10-26T11:45:00Z'))).toBe(false)
  })
  it('in winter time (EST) the 10:45 UTC fire waits and the 11:45 sends', () => {
    expect(weeklySendWindowOpen(new Date('2026-11-02T10:45:00Z'))).toBe(false)
    expect(weeklySendWindowOpen(new Date('2026-11-02T11:45:00Z'))).toBe(true)
  })
  it('a fire a little early still sends; never on another day', () => {
    expect(weeklySendWindowOpen(new Date('2026-10-26T10:44:30Z'))).toBe(true)
    expect(weeklySendWindowOpen(new Date('2026-10-27T10:45:00Z'))).toBe(false)
    expect(weeklySendWindowOpen(new Date('2026-10-25T10:45:00Z'))).toBe(false)
  })
  it('records a week under its Monday', () => {
    expect(mondayOf('2026-10-26')).toBe('2026-10-26')
    expect(mondayOf('2026-10-28')).toBe('2026-10-26')
    expect(mondayOf('2026-11-01')).toBe('2026-10-26')
    expect(mondayOf('2027-01-01')).toBe('2026-12-28')
  })
})
