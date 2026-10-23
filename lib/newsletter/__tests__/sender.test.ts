import { afterEach, describe, expect, it, vi } from 'vitest'
import { readerFromEmail, readerReplyTo } from '../sender'
import { NEWSLETTER_FROM, newsletterQuery } from '@/lib/outreach/newsletter-fetch'

afterEach(() => vi.unstubAllEnvs())

describe('reader sender', () => {
  it('defaults to the person address, not the role address or RESEND_FROM_EMAIL', () => {
    vi.stubEnv('READER_FROM_EMAIL', '')
    vi.stubEnv('READER_REPLY_TO', '')
    vi.stubEnv('RESEND_FROM_EMAIL', 'feedback@fundopshq.com')
    expect(readerFromEmail()).toBe('danny@fundopshq.com')
    expect(readerReplyTo()).toBe('danny@fundopshq.com')
  })

  it('can be changed by env', () => {
    vi.stubEnv('READER_FROM_EMAIL', 'news@fundopshq.com')
    vi.stubEnv('READER_REPLY_TO', 'replies@fundopshq.com')
    expect(readerFromEmail()).toBe('news@fundopshq.com')
    expect(readerReplyTo()).toBe('replies@fundopshq.com')
  })
})

describe('newsletter lookup in the inbox', () => {
  it('finds an edition from either the new or the old sender', () => {
    expect(NEWSLETTER_FROM).toEqual(['danny@fundopshq.com', 'feedback@fundopshq.com'])
    expect(newsletterQuery()).toBe('{from:danny@fundopshq.com from:feedback@fundopshq.com} -subject:"[TEST]" newer_than:1d')
  })
})
