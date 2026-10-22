// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  LIMITS,
  alertSubject,
  alertText,
  cleanBlock,
  cleanLine,
  cleanUrl,
  clientIp,
  hashIp,
  looksLikeSpam,
  validateNewsSubmission,
} from '../news-submission'

const good = {
  firm: 'Example Capital',
  kind: 'fund_close',
  headline: 'Example Capital closes Fund III at $450M',
  details: 'Above its $350M target.\nLPs include pensions.',
  url: 'https://www.example.com/news/fund-iii',
  contact_name: 'Pat Doe',
  contact_email: 'Pat@Example.com',
  contact_role: 'Head of IR',
  wants_newsletter: 'on',
}

describe('validateNewsSubmission', () => {
  it('accepts a complete submission and normalises it', () => {
    const r = validateNewsSubmission(good)
    expect(r).toEqual({
      ok: true,
      value: {
        kind: 'fund_close',
        firm: 'Example Capital',
        headline: 'Example Capital closes Fund III at $450M',
        details: 'Above its $350M target.\nLPs include pensions.',
        url: 'https://www.example.com/news/fund-iii',
        contact_name: 'Pat Doe',
        contact_email: 'pat@example.com',
        contact_role: 'Head of IR',
        wants_newsletter: true,
      },
    })
  })

  it('needs only the required fields', () => {
    const r = validateNewsSubmission({ ...good, details: '', contact_role: '   ', wants_newsletter: undefined })
    expect(r.ok && r.value).toMatchObject({ details: null, contact_role: null, wants_newsletter: false })
  })

  it.each([
    ['firm', { firm: '' }],
    ['firm', { firm: 'X' }],
    ['kind', { kind: 'press_release' }],
    ['kind', { kind: undefined }],
    ['headline', { headline: 'Too short' }],
    ['url', { url: '' }],
    ['url', { url: 'not a link' }],
    ['url', { url: 'javascript:alert(1)' }],
    ['url', { url: 'ftp://example.com/file' }],
    ['url', { url: 'http://localhost:3000/x' }],
    ['url', { url: 'http://10.0.0.1/admin' }],
    ['url', { url: 'https://user:pw@example.com/' }],
    ['url', { url: 'https://intranet/' }],
    ['contact_name', { contact_name: '' }],
    ['contact_email', { contact_email: 'nobody' }],
    ['contact_email', { contact_email: '' }],
  ])('rejects a bad %s', (field, patch) => {
    const r = validateNewsSubmission({ ...good, ...patch })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.field).toBe(field)
      expect(r.error).toBeTruthy()
    }
  })

  it('says the link is required when it is missing', () => {
    const r = validateNewsSubmission({ ...good, url: undefined })
    expect(r).toEqual({ ok: false, field: 'url', error: 'A link to the announcement is required' })
  })

  it('treats a non-object body as empty', () => {
    expect(validateNewsSubmission(null).ok).toBe(false)
    expect(validateNewsSubmission('firm=x').ok).toBe(false)
    expect(validateNewsSubmission([1, 2]).ok).toBe(false)
  })

  it('ignores fields of the wrong type', () => {
    expect(validateNewsSubmission({ ...good, firm: { $ne: '' } }).ok).toBe(false)
    expect(validateNewsSubmission({ ...good, headline: ['a', 'b'] }).ok).toBe(false)
  })

  it('only a tick, "on", "true" or "1" asks for the newsletter', () => {
    for (const v of [true, 'on', 'true', '1']) {
      const r = validateNewsSubmission({ ...good, wants_newsletter: v })
      expect(r.ok && r.value.wants_newsletter).toBe(true)
    }
    for (const v of [false, 'off', 'yes please', 0, null]) {
      const r = validateNewsSubmission({ ...good, wants_newsletter: v })
      expect(r.ok && r.value.wants_newsletter).toBe(false)
    }
  })

  it('cuts every field to its limit', () => {
    const r = validateNewsSubmission({
      ...good,
      firm: 'F'.repeat(500),
      headline: 'H'.repeat(500),
      details: 'D'.repeat(5000),
      contact_name: 'N'.repeat(500),
      contact_role: 'R'.repeat(500),
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.firm).toHaveLength(LIMITS.firm)
      expect(r.value.headline).toHaveLength(LIMITS.headline)
      expect(r.value.details).toHaveLength(LIMITS.details)
      expect(r.value.contact_name).toHaveLength(LIMITS.contactName)
      expect(r.value.contact_role).toHaveLength(LIMITS.contactRole)
    }
  })
})

describe('cleaning typed text', () => {
  it('makes a headline one line without control or direction characters', () => {
    expect(cleanLine('  Firm\ncloses\t\tfund\u0000 \u202Eevil  ', 200)).toBe('Firm closes fund evil')
    expect(cleanLine('   ', 10)).toBeNull()
    expect(cleanLine(42, 10)).toBeNull()
  })

  it('keeps the lines of the details, at most one blank line in a row', () => {
    expect(cleanBlock('one\r\ntwo\n\n\n\n three  \u0007four', 100)).toBe('one\ntwo\n\nthree four')
  })

  it('keeps a good link as the browser would write it', () => {
    expect(cleanUrl(' https://Example.com/a b')).toBeNull()
    expect(cleanUrl('https://Example.com/path?x=1')).toBe('https://example.com/path?x=1')
    expect(cleanUrl('http://news.example.co.uk')).toBe('http://news.example.co.uk/')
    expect(cleanUrl('data:text/html,<script>')).toBeNull()
    expect(cleanUrl('https://[::1]/')).toBeNull()
    expect(cleanUrl(`https://example.com/${'a'.repeat(600)}`)).toBeNull()
  })
})

describe('looksLikeSpam', () => {
  it('flags more than three links in the headline and details', () => {
    expect(looksLikeSpam({ headline: 'Firm closes fund', details: 'See https://a.com and www.b.com' })).toBe(false)
    expect(looksLikeSpam({ headline: 'Buy https://a.com', details: 'http://b.com www.c.com https://d.com' })).toBe(true)
  })
})

describe('the sender', () => {
  it('reads the first forwarded address', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' }))).toBe('203.0.113.9')
    expect(clientIp(new Headers({ 'x-real-ip': '198.51.100.2' }))).toBe('198.51.100.2')
    expect(clientIp(new Headers())).toBeNull()
  })

  it('keeps only a keyed hash of the address', () => {
    const a = hashIp('203.0.113.9', 'secret')
    expect(a).toMatch(/^[0-9a-f]{32}$/)
    expect(a).not.toContain('203')
    expect(hashIp('203.0.113.9', 'secret')).toBe(a)
    expect(hashIp('203.0.113.9', 'other')).not.toBe(a)
    expect(hashIp('203.0.113.10', 'secret')).not.toBe(a)
    expect(hashIp(null, 'secret')).toBeNull()
    expect(hashIp('203.0.113.9', '')).toBeNull()
  })
})

describe('the owner alert', () => {
  const r = validateNewsSubmission(good)
  if (!r.ok) throw new Error('fixture')
  const s = r.value

  it('says what it is in the subject', () => {
    expect(alertSubject(s)).toBe('[News submission] Fund close: Example Capital — Example Capital closes Fund III at $450M')
  })

  it('labels every typed value and says none of it is checked', () => {
    const text = alertText(s, { stored: true, newsletter: 'subscribed' })
    expect(text).toContain('UNVERIFIED')
    expect(text).toContain('Link: https://www.example.com/news/fund-iii')
    expect(text).toContain('From: Pat Doe, Head of IR <pat@example.com>')
    expect(text).toContain('FundOps Daily: asked to subscribe (subscribed)')
    expect(text).toContain("status = 'pending'")
  })

  it('says when the row was not saved', () => {
    expect(alertText(s, { stored: false })).toContain('NOT SAVED')
  })
})

describe('the signup it brings', () => {
  it('is recorded as form "submit"', async () => {
    const { sanitizeSignupForm } = await import('@/lib/newsletter/interests')
    expect(sanitizeSignupForm('submit')).toBe('submit')
  })
})
