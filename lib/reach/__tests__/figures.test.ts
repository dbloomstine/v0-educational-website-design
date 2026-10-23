import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { atLeast, manualSiteTraffic, networkList, parseVercelCount, reachLines, sumSocialViews } from '../figures'

const NOW = Date.parse('2026-10-23T15:00:00Z')
const day = (n: number) => new Date(NOW - n * 86_400_000).toISOString()

describe('atLeast', () => {
  it('rounds down to two significant figures and marks the cut', () => {
    expect(atLeast(163)).toBe('160+')
    expect(atLeast(160)).toBe('160')
    expect(atLeast(97)).toBe('97')
    expect(atLeast(54_264)).toBe('54,000+')
    expect(atLeast(12)).toBe('12')
    expect(atLeast(1_049)).toBe('1,000+')
  })
})

describe('parseVercelCount', () => {
  it('reads the count endpoint', () => {
    expect(parseVercelCount({ version: 1, query: {}, data: { pageviews: 1250, visitors: 980 } }, '2026-10-23')).toEqual({
      pageviews: 1250, visitors: 980, asOf: '2026-10-23', source: 'vercel-api',
    })
  })
  it('never turns a missing or odd answer into a zero', () => {
    expect(parseVercelCount(null, '2026-10-23')).toBeNull()
    expect(parseVercelCount({ error: { code: 'forbidden' } }, '2026-10-23')).toBeNull()
    expect(parseVercelCount({ data: { pageviews: 0, visitors: 0 } }, '2026-10-23')).toBeNull()
    expect(parseVercelCount({ data: { pageviews: '12', visitors: null } }, '2026-10-23')).toBeNull()
  })
})

describe('manualSiteTraffic', () => {
  it('is hidden by default', () => {
    expect(manualSiteTraffic({}, '2026-10-23')).toBeNull()
  })
  it('needs an as-of date, and goes stale by itself', () => {
    expect(manualSiteTraffic({ SITE_MONTHLY_VISITORS: '2,400' }, '2026-10-23')).toBeNull()
    expect(manualSiteTraffic({ SITE_MONTHLY_VISITORS: '2,400', SITE_MONTHLY_AS_OF: 'Oct 2026' }, '2026-10-23')).toBeNull()
    expect(manualSiteTraffic({ SITE_MONTHLY_VISITORS: '2,400', SITE_MONTHLY_AS_OF: '2026-10-22' }, '2026-10-23')).toEqual({
      visitors: 2400, pageviews: null, asOf: '2026-10-22', source: 'manual',
    })
    expect(manualSiteTraffic({ SITE_MONTHLY_VISITORS: '2400', SITE_MONTHLY_AS_OF: '2026-07-01' }, '2026-10-23')).toBeNull()
    expect(manualSiteTraffic({ SITE_MONTHLY_VISITORS: 'lots', SITE_MONTHLY_AS_OF: '2026-10-22' }, '2026-10-23')).toBeNull()
  })
})

describe('sumSocialViews', () => {
  const posts = [
    { id: 'a', channel: 'tiktok', scheduled_for: day(3) },
    { id: 'b', channel: 'instagram', scheduled_for: day(5) },
    { id: 'c', channel: 'tiktok', scheduled_for: day(40) }, // outside the 30 days
    { id: 'd', channel: 'linkedin', scheduled_for: day(4) }, // read with no views
    { id: 'e', channel: 'youtube', scheduled_for: day(2) }, // never read
  ]
  it("counts each post once, at its latest reading, inside the 30 days up to the newest reading", () => {
    const readings = [
      { post_id: 'a', captured_at: day(2), views: 100 },
      { post_id: 'a', captured_at: day(1), views: 400 },
      { post_id: 'b', captured_at: day(1), views: 50 },
      { post_id: 'c', captured_at: day(1), views: 9_000 },
      { post_id: 'd', captured_at: day(1), views: null },
    ]
    expect(sumSocialViews(posts, readings, NOW)).toEqual({ views: 450, posts: 2, networks: ['tiktok', 'instagram'], through: day(1).slice(0, 10) })
  })
  it('hides the line when the job has stopped reporting', () => {
    expect(sumSocialViews(posts, [{ post_id: 'a', captured_at: day(11), views: 400 }], NOW)).toBeNull()
  })
  it('hides the line with nothing to show', () => {
    expect(sumSocialViews(posts, [], NOW)).toBeNull()
    expect(sumSocialViews(posts, [{ post_id: 'a', captured_at: day(1), views: 0 }], NOW)).toBeNull()
  })
})

describe('reachLines', () => {
  it('prints only what it has, with its source', () => {
    const lines = reachLines({
      subscribers: 163, firms: 94,
      site: { visitors: 2_430, pageviews: 8_100, asOf: '2026-10-23', source: 'vercel-api' },
      video: { views: 54_264, posts: 233, networks: ['tiktok', 'instagram', 'youtube'], through: '2026-10-20' },
    })
    expect(lines.map((l) => l.text)).toEqual([
      '160+ email readers at 94 firms',
      '2,400+ site visitors and 8,100 page views a month',
      '54,000+ video views a month on TikTok, Instagram and YouTube',
    ])
    expect(lines[1].note).toMatch(/Vercel Web Analytics/)
  })
  it('hides a line rather than guess', () => {
    expect(reachLines({ subscribers: null, firms: null, site: null, video: null })).toEqual([])
    expect(reachLines({ subscribers: 163, firms: null, site: null, video: null }).map((l) => l.key)).toEqual(['email'])
  })
  it('names networks in plain English', () => {
    expect(networkList(['tiktok'])).toBe('TikTok')
    expect(networkList(['tiktok', 'youtube'])).toBe('TikTok and YouTube')
  })
})

describe('no typed figures', () => {
  it('the block and the pages print only computed numbers', () => {
    for (const f of ['components/reach/AudienceReach.tsx', 'app/about/page.tsx']) {
      const src = readFileSync(join(__dirname, '..', '..', '..', f), 'utf8')
      expect(src).not.toMatch(/\b\d[\d,]*\+?\s+(page views|visitors|video views|email readers)\b/i)
    }
  })
})
