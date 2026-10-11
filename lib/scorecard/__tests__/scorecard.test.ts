import { describe, expect, it } from 'vitest'
import { scorecard, scorecardMail, viewsOf, type MetricRow, type PostRow, type SubscriberRow } from '../scorecard'

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
    expect(list.forms).toEqual([['not recorded', 1], ['the homepage field', 1], ['the signup box', 1]])
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
})
