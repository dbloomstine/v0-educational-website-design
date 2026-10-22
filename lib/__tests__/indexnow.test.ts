import { describe, it, expect, vi, afterEach } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import path from 'path'
import {
  INDEXNOW_ENDPOINT, INDEXNOW_KEY, INDEXNOW_KEY_LOCATION, INDEXNOW_MAX_URLS,
  indexNowEnabled, indexNowPayload, indexNowUrls, pingIndexNow,
} from '../seo/indexnow'
import { HUB_PATHS, hubsDue, newStoryPaths, previousHour } from '../seo/indexnow-pages'
import type { Story } from '../news/stories'

const PROD = { VERCEL_ENV: 'production' }
const okFetch = () => vi.fn(async () => new Response('', { status: 200 })) as unknown as typeof fetch & ReturnType<typeof vi.fn>

afterEach(() => vi.restoreAllMocks())

describe('the IndexNow key', () => {
  it('is 32 hex characters and is served from public/<key>.txt holding exactly the key', () => {
    expect(INDEXNOW_KEY).toMatch(/^[0-9a-f]{32}$/)
    const file = path.join(process.cwd(), 'public', `${INDEXNOW_KEY}.txt`)
    expect(existsSync(file)).toBe(true)
    expect(readFileSync(file, 'utf8').trim()).toBe(INDEXNOW_KEY)
    expect(INDEXNOW_KEY_LOCATION).toBe(`https://fundopshq.com/${INDEXNOW_KEY}.txt`)
  })
})

describe('which deployments submit', () => {
  it('only production on Vercel, and never with the kill switch off', () => {
    expect(indexNowEnabled({ VERCEL_ENV: 'production' })).toBe(true)
    expect(indexNowEnabled({ VERCEL_ENV: 'preview' })).toBe(false)
    expect(indexNowEnabled({})).toBe(false)
    expect(indexNowEnabled({ VERCEL_ENV: 'production', INDEXNOW_ENABLED: 'false' })).toBe(false)
  })
})

describe('the URLs sent', () => {
  it('makes paths absolute, keeps full fundopshq.com URLs, drops other hosts and http, dedupes and cuts fragments', () => {
    expect(indexNowUrls(['/story/a-1234abcd', 'https://fundopshq.com/news', '/news#top', 'https://example.com/x', 'http://fundopshq.com/a', '', null, '/story/a-1234abcd'])).toEqual([
      'https://fundopshq.com/story/a-1234abcd',
      'https://fundopshq.com/news',
    ])
  })
  it('caps at the given number and never above 10,000', () => {
    const many = Array.from({ length: INDEXNOW_MAX_URLS + 5 }, (_, i) => `/p/${i}`)
    expect(indexNowUrls(many, 3)).toHaveLength(3)
    expect(indexNowUrls(many, 50_000)).toHaveLength(INDEXNOW_MAX_URLS)
  })
})

describe('pinging', () => {
  it('POSTs the protocol payload as JSON to the shared endpoint', async () => {
    const f = okFetch()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const r = await pingIndexNow(['/', '/events', '/'], { env: PROD, fetch: f })
    expect(r).toEqual({ sent: 2, status: 200 })
    expect(f).toHaveBeenCalledTimes(1)
    const [url, init] = f.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(INDEXNOW_ENDPOINT)
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json; charset=utf-8')
    expect(JSON.parse(String(init.body))).toEqual({
      host: 'fundopshq.com',
      key: INDEXNOW_KEY,
      keyLocation: INDEXNOW_KEY_LOCATION,
      urlList: ['https://fundopshq.com/', 'https://fundopshq.com/events'],
    })
    expect(indexNowPayload(['https://fundopshq.com/'])).toMatchObject({ host: 'fundopshq.com', urlList: ['https://fundopshq.com/'] })
  })
  it('sends nothing outside production', async () => {
    const f = okFetch()
    expect(await pingIndexNow(['/'], { env: { VERCEL_ENV: 'preview' }, fetch: f })).toEqual({ sent: 0, status: null, skipped: 'not_production' })
    expect(await pingIndexNow(['/'], { env: {}, fetch: f })).toMatchObject({ skipped: 'not_production' })
    expect(f).not.toHaveBeenCalled()
  })
  it('sends nothing when there is nothing on our host', async () => {
    const f = okFetch()
    expect(await pingIndexNow(['https://example.com/'], { env: PROD, fetch: f })).toEqual({ sent: 0, status: null, skipped: 'no_urls' })
    expect(f).not.toHaveBeenCalled()
  })
  it('never throws: a refused submission is a status, a network failure is a result', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const refused = vi.fn(async () => new Response('', { status: 429 })) as unknown as typeof fetch
    await expect(pingIndexNow(['/'], { env: PROD, fetch: refused })).resolves.toEqual({ sent: 1, status: 429 })
    const down = vi.fn(async () => { throw new TypeError('fetch failed') }) as unknown as typeof fetch
    await expect(pingIndexNow(['/'], { env: PROD, fetch: down })).resolves.toEqual({ sent: 0, status: null, skipped: 'error' })
    expect(err).toHaveBeenCalledTimes(2)
  })
})

let seq = 0
const uuid = () => `${String(++seq).padStart(8, '0')}-0000-4000-8000-000000000000`
const story = (o: Partial<Story>): Story => ({
  id: uuid(), memberIds: [], headline: 'KKR closes fund', url: 'https://example.com', source: 'PE Hub', summary: 'A summary.',
  coverage: [{ source: 'Buyouts', url: 'https://example.org', headline: 'KKR closes' }], kind: 'fundraising', assetClasses: ['PE'],
  eventType: 'fund_close', closeType: 'final_close', sizeUsdM: 500, firmName: 'KKR', fundName: null, personName: null,
  geography: [], entities: [], firms: [], leadEligible: true, roundup: false,
  firstSeen: '2026-10-22T13:05:00Z', publishedDate: '2026-10-22', weight: 1, ...o,
})

describe('the story pages a classification run submits', () => {
  const NOW = new Date('2026-10-22T14:31:00Z').getTime()
  it('are the previous clock hour\'s stories, on their canonical addresses', () => {
    expect(previousHour(NOW)).toEqual({ from: Date.parse('2026-10-22T13:00:00Z'), to: Date.parse('2026-10-22T14:00:00Z') })
    const a = story({ headline: 'KKR closes Asia fund at $15bn' })
    const paths = newStoryPaths([
      a,
      story({ firstSeen: '2026-10-22T12:59:59Z' }), // the hour before: the previous run had it
      story({ firstSeen: '2026-10-22T14:00:00Z' }), // this hour: the next run will
    ], NOW)
    expect(paths).toEqual([`/story/kkr-closes-asia-fund-at-15bn-${a.id.slice(0, 8)}`])
  })
  it('leave out what the sitemap leaves out: single-outlet stories and roundups', () => {
    expect(newStoryPaths([story({ coverage: [] }), story({ roundup: true })], NOW)).toEqual([])
  })
  it('are capped', () => {
    const many = Array.from({ length: 10 }, () => story({}))
    expect(newStoryPaths(many, NOW, 4)).toHaveLength(4)
  })
})

describe('the front pages', () => {
  it('are submitted by the one run a day that falls in 12:00 UTC', () => {
    expect(HUB_PATHS).toContain('/')
    expect(hubsDue(Date.parse('2026-10-22T12:30:00Z'))).toBe(true)
    expect(hubsDue(Date.parse('2026-10-22T13:30:00Z'))).toBe(false)
  })
})
