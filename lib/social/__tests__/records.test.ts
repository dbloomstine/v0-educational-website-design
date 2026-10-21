import { describe, it, expect } from 'vitest'
import { parsePostRow } from '@/lib/social/records'

const row = (channel: string) => ({ post_date: '2026-10-22', slug: 'rs-1200-explainer-first-close', format: 'termCard', kind: 'video', channel, story_ids: [], caption: 'What is a first close?', media_urls: [], status: 'scheduled', hold_reason: null, scheduled_for: '2026-10-22T13:00:00Z', buffer_post_id: 'b1' })

describe('social post records', () => {
  it('accepts a YouTube Short (since 2026-10-20) as well as the other networks', () => {
    for (const c of ['tiktok', 'instagram', 'linkedin', 'youtube']) expect(typeof parsePostRow(row(c))).toBe('object')
  })
  it('still refuses a network it does not know', () => {
    expect(parsePostRow(row('facebook'))).toMatch(/channel must be one of/)
  })
})
