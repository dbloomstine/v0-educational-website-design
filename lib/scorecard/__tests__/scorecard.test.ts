import { describe, expect, it } from 'vitest'
import { formatWeek, outreachWeek, scorecard, scorecardMail, unsubSpike, viewsOf, type MetricRow, type OutreachMessageRow, type PostRow, type SubscriberRow } from '../scorecard'

const NOW = Date.parse('2026-10-12T12:30:00Z')
const ago = (days: number) => new Date(NOW - days * 86_400_000).toISOString()
const sub = (days: number, extra: Partial<SubscriberRow> = {}): SubscriberRow => ({ status: 'confirmed', created_at: ago(days), unsubscribed_at: null, signup_source: null, signup_form: null, ...extra })
const post = (id: string, date: string, extra: Partial<PostRow> = {}): PostRow => ({ id, post_date: date, slug: `0930-card-${id}`, format: 'photoCard', channel: 'tiktok', status: 'posted', permalink: `https://example.com/${id}`, caption: `Headline of ${id}\n\nMore words.`, ...extra })
const reading = (post_id: string, at: string, metrics: MetricRow['metrics']): MetricRow => ({ post_id, captured_at: at, metrics })

describe('the weekly scorecard', () => {
  it('counts the list: who is on it, who joined this week and last, who left, and where the new ones came from', () => {
    const subscribers = [
      sub(40), sub(30), sub(2, { signup_source: 'LinkedIn', signup_form: 'popup' }), sub(3, { signup_source: 'linkedin', signup_form: 'hero' }), sub(5),
      sub(9, { signup_source: 'google' }), sub(20, { status: 'unsubscribed', unsubscribed_at: ago(1) }), sub(1, { signup_form: 'test' }),
    ]
    const { list } = scorecard({ subscribers, posts: [], metrics: [], sponsorLooks: 0, now: NOW })
    expect(list).toMatchObject({ confirmed: 6, joined: 3, joinedBefore: 1, left: 1 })
    expect(list.sources).toEqual([['linkedin', 2], ['not recorded', 1]])
    expect(list.forms).toEqual([['not recorded', 1], ['the homepage field', 1], ['the signup box', 1], ['the first-visit ask', 0], ['the events offer', 0]])
  })

  it('counts a post in the week it went out, at its latest reading; a network by its own measure', () => {
    const posts = [
      post('a', '2026-10-08'), post('b', '2026-10-09'), post('c', '2026-10-10'),
      post('old', '2026-10-01'), post('li', '2026-10-11', { channel: 'linkedin', format: 'termCard' }),
      post('waiting', '2026-10-11', { status: 'scheduled' }), post('t', '2026-10-09', { slug: 'test-0930-card-t' }),
    ]
    const metrics = [
      reading('a', '2026-10-09T00:00:00Z', { views: 100 }), reading('a', '2026-10-11T00:00:00Z', { views: 400, reactions: 3, comments: 1, shares: 1 }),
      reading('b', '2026-10-11T00:00:00Z', { views: 200 }), reading('c', '2026-10-11T00:00:00Z', { views: 90 }),
      reading('old', '2026-10-05T00:00:00Z', { views: 1000 }), reading('li', '2026-10-12T00:00:00Z', { impressions: 55, reactions: 2 }),
      reading('waiting', '2026-10-12T00:00:00Z', { views: 9999 }), reading('t', '2026-10-12T00:00:00Z', { views: 9999 }),
    ]
    const card = scorecard({ subscribers: [], posts, metrics, sponsorLooks: 2, now: NOW })
    expect(card.networks).toEqual([
      { channel: 'tiktok', name: 'TikTok', posts: 3, views: 690, typical: 200, acts: 5, postsBefore: 1, viewsBefore: 1000, typicalBefore: 1000 },
      { channel: 'linkedin', name: 'LinkedIn', posts: 1, views: 55, typical: 55, acts: 2, postsBefore: 0, viewsBefore: 0, typicalBefore: 0 },
    ])
    // A format needs three posts on a network in the week to be compared.
    expect(card.formats).toEqual([{ name: 'Story cards', channel: 'TikTok', posts: 3, typical: 200 }])
    expect(card.best.map((b) => [b.title, b.views, b.channel])).toEqual([['Headline of a', 400, 'TikTok'], ['Headline of b', 200, 'TikTok'], ['Headline of c', 90, 'TikTok']])
    expect(viewsOf({ impressions: 7 })).toBe(7)
    expect(viewsOf(null)).toBe(0)
  })

  it('is a short letter to the owner that says what it does not know', () => {
    const card = scorecard({ subscribers: [sub(2, { signup_source: 'linkedin', signup_form: 'popup' })], posts: [post('a', '2026-10-08')], metrics: [reading('a', '2026-10-11T00:00:00Z', { views: 400 })], sponsorLooks: 1, now: NOW })
    const mail = scorecardMail(card)
    expect(mail.subject).toBe('FundOpsHQ, the week: 1 new readers, 400 views')
    expect(mail.html).toContain('The week of Oct 5 to Oct 11')
    expect(mail.html).toContain('Where they came from: linkedin 1.')
    expect(mail.html).toContain('<b>TikTok</b>: 1 posts, 400 views in all')
    expect(mail.html).toContain('Followers are not here')
    expect(mail.html).toContain('1 look at the sponsor page')
    // A quiet week is said plainly.
    const quiet = scorecardMail(scorecard({ subscribers: [], posts: [], metrics: [], sponsorLooks: 0, now: NOW }))
    expect(quiet.html).toContain('No post went out this week.')
    expect(quiet.html).toContain('No reader opened the sponsor page')
  })

  it('counts signups by campaign, sponsor requests, and flags a week of unsubscribes above twice the four-week average (2026-10-16)', () => {
    const subscribers = [
      sub(2, { signup_campaign: 'Oct-14-League-Post' }), sub(3, { signup_campaign: 'oct-14-league-post' }), sub(4),
      ...[1, 2, 3, 4].map((d) => sub(30, { status: 'unsubscribed', unsubscribed_at: ago(d) })),
      sub(60, { status: 'unsubscribed', unsubscribed_at: ago(10) }), sub(60, { status: 'unsubscribed', unsubscribed_at: ago(20) }),
      sub(1, { signup_form: 'test', status: 'unsubscribed', unsubscribed_at: ago(1) }),
    ]
    const card = scorecard({ subscribers, posts: [], metrics: [], sponsorLooks: 0, sponsorRequests: 2, now: NOW })
    expect(card.list.campaigns).toEqual([['oct-14-league-post', 2], ['not recorded', 1]])
    expect(card.list.unsubSpike).toEqual({ left: 4, averageBefore: 0.5, flagged: true })
    expect(card.sponsorRequests).toBe(2)
    const html = scorecardMail(card).html
    expect(html).toContain('Which post or link (utm_campaign): oct-14-league-post 2 · not recorded 1.')
    expect(html).toContain('Unsubscribes are up:</b> 4 this week against 0.5 a week on average')
    expect(html).toContain('<b>2</b> sponsor requests on the sponsor page this week.')
    // Two leaving against one a week is no spike; nor is one against none.
    expect(unsubSpike([sub(30, { unsubscribed_at: ago(1) }), sub(30, { unsubscribed_at: ago(2) }), ...[8, 15, 22, 29].map((d) => sub(60, { unsubscribed_at: ago(d) }))], NOW)).toEqual({ left: 2, averageBefore: 1, flagged: false })
    expect(unsubSpike([sub(30, { unsubscribed_at: ago(1) })], NOW)).toEqual({ left: 1, averageBefore: 0, flagged: false })
  })

  it('sums the week’s outreach: sends by program, and the webhook’s delivered / opened / clicked per message, replies, bounces', () => {
    const m = (id: string, days: number, extra: Partial<OutreachMessageRow> = {}): OutreachMessageRow => ({ id, program: 'sponsor_pitch', kind: 'initial', status: 'sent', sent_at: ago(days), replied_at: null, ...extra })
    const messages = [
      m('p1', 2), m('p2', 3, { replied_at: ago(1) }), m('f1', 2, { kind: 'followup' }), m('n1', 1, { program: 'news_note' }),
      m('old', 9), m('queued', 1, { status: 'queued', sent_at: null }), m('older', 20),
    ]
    const events = [
      { message_id: 'p1', type: 'email.delivered' }, { message_id: 'p1', type: 'email.opened' }, { message_id: 'p1', type: 'email.clicked' },
      { message_id: 'p2', type: 'email.delivered' }, { message_id: 'p2', type: 'email.opened' }, { message_id: 'p2', type: 'email.opened' },
      { message_id: 'f1', type: 'email.delivered' }, { message_id: 'n1', type: 'email.bounced' },
      { message_id: 'old', type: 'email.delivered' }, { message_id: 'old', type: 'email.clicked' }, { message_id: null, type: 'email.delivered' },
    ]
    expect(outreachWeek(messages, events, NOW - 7 * 86_400_000, NOW)).toEqual({
      sent: 4, pitches: 2, notes: 1, organizerNotes: 0, followups: 1, delivered: 3, opened: 2, clicked: 1, replied: 1, bounced: 1, complained: 0,
      programs: [{ program: 'sponsor_pitch', sent: 3, replied: 1, bounced: 0 }, { program: 'news_note', sent: 1, replied: 0, bounced: 1 }, { program: 'organizer_note', sent: 0, replied: 0, bounced: 0 }],
    })
    const card = scorecard({ subscribers: [], posts: [], metrics: [], sponsorLooks: 0, outreachMessages: messages, outreachEvents: events, now: NOW })
    expect(card.outreach?.before).toMatchObject({ sent: 1, clicked: 1 })
    const html = scorecardMail(card).html
    expect(html).toContain('<b>4</b> sent (2 sponsor pitches, 1 follow-up, 1 news note) <span style="color:#55647A;">(1 the week before)</span>: 3 delivered, <b>2</b> opened, <b>1</b> clicked, <b>1</b> replied, 1 bounced.')
    expect(html).toContain('By program: Sponsor pitches 3 sent, <b>1</b> replied, 0 bounced · News notes 1 sent, <b>0</b> replied, 1 bounced · Organizer notes none sent.')
    // No outreach either week: the section is left out.
    expect(scorecardMail(scorecard({ subscribers: [], posts: [], metrics: [], sponsorLooks: 0, now: NOW })).html).not.toContain('>Outreach<')
  })

  it('counts organizer notes beside the news notes and sponsor pitches (2026-10-22)', () => {
    const m = (id: string, program: string, extra: Partial<OutreachMessageRow> = {}): OutreachMessageRow => ({ id, program, kind: 'initial', status: 'sent', sent_at: ago(2), replied_at: null, ...extra })
    const messages = [m('o1', 'organizer_note', { replied_at: ago(1) }), m('o2', 'organizer_note'), m('o3', 'organizer_note', { status: 'queued', sent_at: null }), m('n1', 'news_note'), m('p1', 'sponsor_pitch')]
    const events = [{ message_id: 'o2', type: 'email.bounced' }, { message_id: 'o2', type: 'email.bounced' }]
    const w = outreachWeek(messages, events, NOW - 7 * 86_400_000, NOW)
    expect(w).toMatchObject({ sent: 4, organizerNotes: 2, notes: 1, pitches: 1, bounced: 1, replied: 1 })
    expect(w.programs).toEqual([
      { program: 'sponsor_pitch', sent: 1, replied: 0, bounced: 0 },
      { program: 'news_note', sent: 1, replied: 0, bounced: 0 },
      { program: 'organizer_note', sent: 2, replied: 1, bounced: 1 },
    ])
    const html = scorecardMail(scorecard({ subscribers: [], posts: [], metrics: [], sponsorLooks: 0, outreachMessages: messages, outreachEvents: events, now: NOW })).html
    expect(html).toContain('(1 sponsor pitch, 1 news note, 2 organizer notes)')
    expect(html).toContain('Organizer notes 2 sent, <b>1</b> replied, 1 bounced.')
  })

  it('names every signup form, the new ones at 0 too, and the page it was on (2026-10-22)', () => {
    const subscribers = [
      sub(1, { signup_form: 'firstvisit', signup_page: '/' }), sub(2, { signup_form: 'firstvisit', signup_page: '/story/x-1' }),
      sub(3, { signup_form: 'events', signup_page: '/events/cfo-ops' }), sub(4, { signup_form: 'popup', signup_page: '/' }),
      sub(5, { signup_form: 'someday' }), sub(10, { signup_form: 'events' }),
    ]
    const card = scorecard({ subscribers, posts: [], metrics: [], sponsorLooks: 0, now: NOW })
    expect(card.list.forms).toEqual([['the first-visit ask', 2], ['someday', 1], ['the events offer', 1], ['the signup box', 1]])
    expect(card.list.pages).toEqual([['/', 2], ['/events/cfo-ops', 1], ['/story/x-1', 1], ['not recorded', 1]])
    const html = scorecardMail(card).html
    expect(html).toContain('Where they signed up: the first-visit ask 2 · someday 1 · the events offer 1 · the signup box 1.')
    expect(html).toContain('On which page: / 2 · /events/cfo-ops 1 · /story/x-1 1 · not recorded 1.')
    // Nobody recorded a page: no page line.
    expect(scorecardMail(scorecard({ subscribers: [sub(1, { signup_form: 'popup' })], posts: [], metrics: [], sponsorLooks: 0, now: NOW })).html).not.toContain('On which page')
  })

  it('averages the views of each format over the posts that have them, the new formats first (2026-10-22)', () => {
    const posts = [
      post('m1', '2026-10-08', { format: 'meme' }), post('m2', '2026-10-09', { format: 'meme', channel: 'instagram' }), post('m3', '2026-10-10', { format: 'meme' }),
      post('c1', '2026-10-08'), post('c2', '2026-10-09'), post('c3', '2026-10-09', { channel: 'linkedin' }), post('c4', '2026-10-10'),
      post('old', '2026-10-01', { format: 'fastStory' }),
    ]
    const metrics = [
      reading('m1', '2026-10-09T00:00:00Z', { views: 100 }), reading('m1', '2026-10-11T00:00:00Z', { views: 300 }), reading('m2', '2026-10-11T00:00:00Z', { views: 101 }),
      reading('m3', '2026-10-11T00:00:00Z', { reactions: 4 }), // a reading without views is not a zero
      reading('c1', '2026-10-11T00:00:00Z', { views: 10 }), reading('c2', '2026-10-11T00:00:00Z', { views: 20 }), reading('c3', '2026-10-11T00:00:00Z', { impressions: 30 }), reading('c4', '2026-10-11T00:00:00Z', { views: 0 }),
      reading('old', '2026-10-05T00:00:00Z', { views: 5000 }),
    ]
    const card = scorecard({ subscribers: [], posts, metrics, sponsorLooks: 0, now: NOW })
    expect(card.formatWeek).toEqual([
      { format: 'meme', name: 'Memes', posts: 3, measured: 2, average: 201, isNew: true },
      { format: 'fastStory', name: 'Fast stories', posts: 0, measured: 0, average: 0, isNew: true },
      { format: 'photoCard', name: 'Story cards', posts: 4, measured: 4, average: 15, isNew: false },
    ])
    const html = scorecardMail(card).html
    expect(html).toContain('New: <b>Memes</b> 3 posts, <b>201 average views (2 with numbers)</b> · <b>Fast stories</b> none posted.')
    expect(html).toContain('Story cards 4, 15 average views.')
    expect(formatWeek([post('f', '2026-10-10', { format: 'fastStory' })], new Map())[0]).toMatchObject({ name: 'Fast stories', posts: 1, measured: 0 })
    expect(scorecardMail(scorecard({ subscribers: [], posts: [post('f', '2026-10-10', { format: 'fastStory' })], metrics: [], sponsorLooks: 0, now: NOW })).html).toContain('<b>Fast stories</b> 1 post, <b>no numbers yet</b>')
    // No post in the week: no format section.
    expect(scorecardMail(scorecard({ subscribers: [], posts: [], metrics: [], sponsorLooks: 0, now: NOW })).html).not.toContain('Posts by format')
  })
})
