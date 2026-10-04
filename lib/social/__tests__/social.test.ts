import { afterEach, describe, expect, it } from 'vitest'
import { socialGate } from '../auth'
import { isUploadPath, parseAll, parseMetricRow, parsePostRow, parseUpdateRow } from '../records'

const req = (auth?: string) => new Request('https://fundopshq.com/api/social/export', { headers: auth ? { authorization: auth } : {} })

describe('socialGate', () => {
  const saved = process.env.SOCIAL_SECRET
  afterEach(() => {
    if (saved === undefined) delete process.env.SOCIAL_SECRET
    else process.env.SOCIAL_SECRET = saved
  })

  it('is closed to everyone until the secret is set', () => {
    delete process.env.SOCIAL_SECRET
    expect(socialGate(req('Bearer anything'))?.status).toBe(503)
    // An empty secret must not be matched by an empty token.
    process.env.SOCIAL_SECRET = ''
    expect(socialGate(req('Bearer '))?.status).toBe(503)
  })

  it('lets the right secret through and nothing else', () => {
    process.env.SOCIAL_SECRET = 's3cret-of-some-length'
    expect(socialGate(req('Bearer s3cret-of-some-length'))).toBeNull()
    expect(socialGate(req())?.status).toBe(401)
    expect(socialGate(req('Bearer wrong'))?.status).toBe(401)
    expect(socialGate(req('s3cret-of-some-length'))?.status).toBe(401)
    expect(socialGate(req('Bearer s3cret-of-some-length-and-more'))?.status).toBe(401)
  })

  it('does not accept the secret that opens the cron routes', () => {
    process.env.SOCIAL_SECRET = 'social'
    const before = process.env.CRON_SECRET
    process.env.CRON_SECRET = 'cron'
    expect(socialGate(req('Bearer cron'))?.status).toBe(401)
    if (before === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = before
  })
})

describe('isUploadPath', () => {
  it('accepts the files the job makes', () => {
    for (const p of [
      '2026-10-05/03-big-number-ares/video.mp4',
      '2026-10-05/01-daily-five/slide-01.jpg',
      '2026-10-05/01-daily-five/4x5/slide-07.jpg',
      '2026-10-05/01-daily-five/4x5/carousel.pdf',
    ]) expect(isUploadPath(p), p).toBe(true)
  })

  it('refuses anything that could land outside its folder or be another kind of file', () => {
    for (const p of [
      'video.mp4',
      '2026-10-05/video.mp4',
      '2026-10-05/../secrets/video.mp4',
      '2026-10-05/a/b/c/d/video.mp4',
      '2026-10-05/post/page.html',
      '2026-10-05/post/slide.svg',
      '/2026-10-05/post/slide-01.jpg',
      '2026-10-05/Post/slide-01.jpg',
      '2026-10-05/post/slide 01.jpg',
      `2026-10-05/${'a'.repeat(300)}/slide-01.jpg`,
      42,
      null,
    ]) expect(isUploadPath(p), String(p)).toBe(false)
  })
})

const post = {
  post_date: '2026-10-05',
  slug: '03-big-number-ares',
  format: 'bigNumber',
  kind: 'video',
  channel: 'tiktok',
  story_ids: ['89fbff99-974d-417b-b4d5-f66d8e5847d5'],
  caption: 'Ares set out to raise $1B. It closed on about $4.2B.',
  media_urls: ['https://example.supabase.co/storage/v1/object/public/social/2026-10-05/03-big-number-ares/video.mp4'],
  status: 'scheduled',
  scheduled_for: '2026-10-06T11:30:00.000Z',
  buffer_post_id: 'abc123',
}

describe('parsePostRow', () => {
  it('takes a full row and fills what was left out', () => {
    const row = parsePostRow(post)
    expect(typeof row).toBe('object')
    expect(row).toMatchObject({ slug: '03-big-number-ares', channel: 'tiktok', hold_reason: null, permalink: null, error: null })
  })

  it('normalises the scheduled time', () => {
    const row = parsePostRow({ ...post, scheduled_for: '2026-10-06T07:30:00-04:00' })
    expect(row).toMatchObject({ scheduled_for: '2026-10-06T11:30:00.000Z' })
  })

  it.each([
    [{ post_date: '10/05/2026' }, 'post_date'],
    [{ slug: '../etc' }, 'slug'],
    [{ kind: 'gif' }, 'kind'],
    [{ channel: 'x' }, 'channel'],
    [{ status: 'live' }, 'status'],
    [{ story_ids: ['not-an-id'] }, 'story_ids'],
    [{ caption: 'x'.repeat(5001) }, 'caption'],
    [{ media_urls: ['http://insecure.example/video.mp4'] }, 'media_urls'],
    [{ media_urls: ['javascript:alert(1)'] }, 'media_urls'],
    [{ scheduled_for: 'tomorrow' }, 'scheduled_for'],
    [{ permalink: 'ftp://tiktok.com/x' }, 'permalink'],
  ])('refuses %j', (change, word) => {
    const row = parsePostRow({ ...post, ...change })
    expect(typeof row).toBe('string')
    expect(row).toContain(word)
  })
})

describe('parseUpdateRow', () => {
  const id = '461ff6ea-0956-46a2-b63f-83c5b8a8ed7f'

  it('carries only the fields that were sent', () => {
    expect(parseUpdateRow({ id, status: 'posted', permalink: 'https://www.tiktok.com/@fundopshq/video/1' })).toEqual({
      id,
      status: 'posted',
      permalink: 'https://www.tiktok.com/@fundopshq/video/1',
    })
    // A field sent as null is cleared; a field left out is left alone.
    expect(parseUpdateRow({ id, error: null })).toEqual({ id, error: null })
  })

  it('refuses a change to nothing, a bad id, or a bad value', () => {
    expect(parseUpdateRow({ id })).toBe('nothing to change')
    expect(typeof parseUpdateRow({ id: 'x', status: 'posted' })).toBe('string')
    expect(typeof parseUpdateRow({ id, status: 'live' })).toBe('string')
    expect(typeof parseUpdateRow({ id, permalink: 'javascript:alert(1)' })).toBe('string')
  })

  it('cannot change what a post says or which story it rests on', () => {
    const row = parseUpdateRow({ id, status: 'posted', caption: 'rewritten', story_ids: [], media_urls: [], slug: 'other' })
    expect(row).toEqual({ id, status: 'posted' })
  })
})

describe('parseMetricRow', () => {
  it('takes a bag of numbers', () => {
    expect(parseMetricRow({ post_id: '89fbff99-974d-417b-b4d5-f66d8e5847d5', metrics: { views: 412, likes: 9 } })).toEqual({
      post_id: '89fbff99-974d-417b-b4d5-f66d8e5847d5',
      metrics: { views: 412, likes: 9 },
      source: 'buffer',
    })
  })

  it('refuses anything that is not numbers', () => {
    const id = '89fbff99-974d-417b-b4d5-f66d8e5847d5'
    expect(typeof parseMetricRow({ post_id: id, metrics: { views: '412' } })).toBe('string')
    expect(typeof parseMetricRow({ post_id: id, metrics: {} })).toBe('string')
    expect(typeof parseMetricRow({ post_id: id, metrics: [1, 2] })).toBe('string')
    expect(typeof parseMetricRow({ post_id: 'x', metrics: { views: 1 } })).toBe('string')
    expect(typeof parseMetricRow({ post_id: id, metrics: { 'drop table': 1 } })).toBe('string')
  })
})

describe('parseAll', () => {
  it('names the first item that fails', () => {
    expect(parseAll([post, { ...post, channel: 'x' }], 10, parsePostRow)).toEqual({ error: expect.stringContaining('item 1: channel') })
  })

  it('refuses an empty or oversized list', () => {
    expect(parseAll([], 10, parsePostRow)).toHaveProperty('error')
    expect(parseAll([post, post, post], 2, parsePostRow)).toHaveProperty('error')
    expect(parseAll('posts', 10, parsePostRow)).toHaveProperty('error')
  })
})
