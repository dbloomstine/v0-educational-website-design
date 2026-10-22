// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  CONFIRM_TTL_DAYS,
  FREE_MAIL_ERROR,
  LIMITS,
  alertSubject,
  alertText,
  baseDomain,
  cleanBlock,
  cleanDate,
  cleanLine,
  cleanPeople,
  cleanUrl,
  clientIp,
  confirmEmail,
  confirmOutcome,
  confirmUrl,
  domainsMatch,
  hashIp,
  hashToken,
  isExpired,
  isFreeMail,
  looksLikeSpam,
  looksLikeToken,
  newConfirmToken,
  parseAmount,
  validateNewsSubmission,
} from '../news-submission'
import { submitNewsHref } from '../fields'

const NOW = new Date('2026-10-22T15:00:00Z')

const good = {
  kind: 'fund_close',
  firm: 'Example Capital',
  firm_website: 'www.example.com',
  headline: 'Example Capital closes Fund III at $450M',
  details: 'Above its $350M target.\nLPs include pensions.',
  amount: '450M',
  currency: 'USD',
  news_date: '2026-10-20',
  url: 'https://www.example.com/news/fund-iii',
  person_name_0: 'Sam Lee',
  person_role_0: 'Managing Partner',
  contact_name: 'Pat Doe',
  contact_role: 'Head of IR',
  contact_email: 'Pat@IR.Example.com',
  wants_newsletter: 'on',
}

const validate = (patch: Record<string, unknown> = {}) => validateNewsSubmission({ ...good, ...patch }, NOW)

describe('validateNewsSubmission', () => {
  it('accepts a complete submission and normalises it', () => {
    expect(validate()).toEqual({
      ok: true,
      value: {
        kind: 'fund_close',
        firm: 'Example Capital',
        firm_website: 'https://www.example.com/',
        headline: 'Example Capital closes Fund III at $450M',
        details: 'Above its $350M target.\nLPs include pensions.',
        amount: 450_000_000,
        currency: 'USD',
        news_date: '2026-10-20',
        url: 'https://www.example.com/news/fund-iii',
        people: [{ name: 'Sam Lee', role: 'Managing Partner' }],
        contact_name: 'Pat Doe',
        contact_email: 'pat@ir.example.com',
        contact_role: 'Head of IR',
        wants_newsletter: true,
        domain_match: true,
      },
    })
  })

  it('needs only the required fields: no amount, link or people', () => {
    const r = validate({ amount: '', currency: 'EUR', url: '', person_name_0: '', wants_newsletter: undefined })
    expect(r.ok && r.value).toMatchObject({ amount: null, currency: null, url: null, people: [], wants_newsletter: false })
  })

  it.each([
    ['kind', { kind: 'press_release' }],
    ['kind', { kind: undefined }],
    ['firm', { firm: '' }],
    ['firm', { firm: 'X' }],
    ['firm_website', { firm_website: '' }],
    ['firm_website', { firm_website: 'not a site' }],
    ['firm_website', { firm_website: 'http://localhost:3000' }],
    ['headline', { headline: 'Too short' }],
    ['details', { details: '' }],
    ['details', { details: 'Closed.' }],
    ['amount', { amount: 'lots' }],
    ['amount', { amount: '-5' }],
    ['currency', { currency: 'XYZ' }],
    ['news_date', { news_date: '' }],
    ['news_date', { news_date: '2026-02-30' }],
    ['news_date', { news_date: '20/10/2026' }],
    ['news_date', { news_date: '2024-01-01' }],
    ['news_date', { news_date: '2027-06-01' }],
    ['url', { url: 'not a link' }],
    ['url', { url: 'javascript:alert(1)' }],
    ['url', { url: 'http://10.0.0.1/admin' }],
    ['url', { url: 'https://user:pw@example.com/' }],
    ['contact_name', { contact_name: '' }],
    ['contact_role', { contact_role: '  ' }],
    ['contact_email', { contact_email: 'nobody' }],
    ['contact_email', { contact_email: '' }],
  ])('rejects a bad %s', (field, patch) => {
    const r = validate(patch)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.field).toBe(field)
      expect(r.error).toBeTruthy()
    }
  })

  it('treats a non-object body as empty', () => {
    expect(validateNewsSubmission(null, NOW).ok).toBe(false)
    expect(validateNewsSubmission('firm=x', NOW).ok).toBe(false)
    expect(validateNewsSubmission([1, 2], NOW).ok).toBe(false)
  })

  it('ignores fields of the wrong type', () => {
    expect(validate({ firm: { $ne: '' } }).ok).toBe(false)
    expect(validate({ headline: ['a', 'b'] }).ok).toBe(false)
  })

  it('defaults the currency to USD when an amount is given without one', () => {
    const r = validate({ currency: '' })
    expect(r.ok && r.value.currency).toBe('USD')
  })

  it('only a tick, "on", "true" or "1" asks for the newsletter', () => {
    for (const v of [true, 'on', 'true', '1']) {
      const r = validate({ wants_newsletter: v })
      expect(r.ok && r.value.wants_newsletter).toBe(true)
    }
    for (const v of [false, 'off', 'yes please', 0, null]) {
      const r = validate({ wants_newsletter: v })
      expect(r.ok && r.value.wants_newsletter).toBe(false)
    }
  })

  it('cuts every free-text field to its limit', () => {
    const r = validate({
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

describe('the work email', () => {
  it.each([
    'pat@gmail.com', 'pat@googlemail.com', 'pat@yahoo.com', 'pat@yahoo.co.uk', 'pat@ymail.com',
    'pat@outlook.com', 'pat@hotmail.com', 'pat@hotmail.fr', 'pat@live.com', 'pat@msn.com',
    'pat@icloud.com', 'pat@me.com', 'pat@aol.com', 'pat@proton.me', 'pat@protonmail.com', 'pat@pm.me',
  ])('refuses free mail: %s', (email) => {
    expect(isFreeMail(email)).toBe(true)
    expect(validate({ contact_email: email })).toEqual({ ok: false, field: 'contact_email', error: FREE_MAIL_ERROR })
  })

  it.each(['pat@example.com', 'pat@kkr.com', 'pat@outlookcapital.com', 'pat@gmail-partners.com', 'pat@liveoak.vc'])(
    'accepts a firm address: %s',
    (email) => {
      expect(isFreeMail(email)).toBe(false)
    },
  )

  it('asks politely for a work address', () => {
    expect(FREE_MAIL_ERROR).toMatch(/work email/)
  })
})

describe('domain match (a flag, never a block)', () => {
  it('finds the registered domain', () => {
    expect(baseDomain('www.example.com')).toBe('example.com')
    expect(baseDomain('ir.news.example.com')).toBe('example.com')
    expect(baseDomain('www.example.co.uk')).toBe('example.co.uk')
    expect(baseDomain('example.com.au')).toBe('example.com.au')
    expect(baseDomain('example.de')).toBe('example.de')
  })

  it.each([
    ['pat@example.com', 'https://www.example.com/'],
    ['pat@ir.example.com', 'https://example.com/'],
    ['pat@example.co.uk', 'https://www.example.co.uk/about'],
    ['PAT@EXAMPLE.COM', 'https://example.com/'],
  ])('matches %s with %s', (email, site) => {
    expect(domainsMatch(email, site)).toBe(true)
  })

  it.each([
    ['pat@example.com', 'https://example.co.uk/'],
    ['pat@other.co.uk', 'https://example.co.uk/'],
    ['pat@examplecapital.com', 'https://example.com/'],
    ['pat@example.com', 'not a url'],
  ])('does not match %s with %s', (email, site) => {
    expect(domainsMatch(email, site)).toBe(false)
  })

  it('a mismatch is accepted and flagged', () => {
    const r = validate({ contact_email: 'pat@placementagent.com' })
    expect(r.ok).toBe(true)
    expect(r.ok && r.value.domain_match).toBe(false)
  })
})

describe('amount, date and people', () => {
  it.each([
    ['450000000', 450_000_000],
    ['450,000,000', 450_000_000],
    ['$450M', 450_000_000],
    ['450 million', 450_000_000],
    ['1.2bn', 1_200_000_000],
    ['2B', 2_000_000_000],
    ['750k', 750_000],
    ['USD 300m', 300_000_000],
  ])('reads %s', (raw, n) => {
    expect(parseAmount(raw)).toBe(n)
  })

  it('reads nothing as null and nonsense as NaN', () => {
    expect(parseAmount('')).toBeNull()
    expect(parseAmount(undefined)).toBeNull()
    expect(parseAmount('about 400')).toBeNaN()
    expect(parseAmount('0')).toBeNaN()
    expect(parseAmount({})).toBeNaN()
  })

  it('takes a real date within the past year or the next 90 days', () => {
    expect(cleanDate('2026-10-22', NOW)).toBe('2026-10-22')
    expect(cleanDate('2025-10-25', NOW)).toBe('2025-10-25')
    expect(cleanDate('2027-01-15', NOW)).toBe('2027-01-15')
    expect(cleanDate('2025-09-01', NOW)).toBeNull()
    expect(cleanDate('2027-03-01', NOW)).toBeNull()
    expect(cleanDate('2026-13-01', NOW)).toBeNull()
  })

  it('keeps up to five people with names, roles optional', () => {
    const b: Record<string, unknown> = {}
    for (let i = 0; i < 7; i++) {
      b[`person_name_${i}`] = i === 1 ? '' : `Person ${i}`
      b[`person_role_${i}`] = i === 2 ? '' : 'Partner'
    }
    // The form sends rows 0–4 only; a sixth and seventh are never read.
    expect(cleanPeople(b)).toEqual([
      { name: 'Person 0', role: 'Partner' },
      { name: 'Person 2', role: null },
      { name: 'Person 3', role: 'Partner' },
      { name: 'Person 4', role: 'Partner' },
    ])
    const many = Array.from({ length: 8 }, (_, i) => ({ name: `P${i}`, role: 'r' }))
    expect(cleanPeople({ people: many })).toHaveLength(5)
    expect(cleanPeople({ people: [null, 'x', { name: '  ' }, { name: 'A', role: 42 }] })).toEqual([{ name: 'A', role: null }])
  })
})

describe('the confirm token', () => {
  it('is random, URL-safe and stored only as its hash', () => {
    const a = newConfirmToken(NOW)
    const b = newConfirmToken(NOW)
    expect(a.token).not.toBe(b.token)
    expect(looksLikeToken(a.token)).toBe(true)
    expect(a.hash).toBe(hashToken(a.token))
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/)
    expect(a.hash).not.toContain(a.token)
  })

  it(`expires after ${CONFIRM_TTL_DAYS} days`, () => {
    const { expiresAt } = newConfirmToken(NOW)
    expect(new Date(expiresAt).getTime() - NOW.getTime()).toBe(7 * 86_400_000)
    expect(isExpired(expiresAt, new Date(NOW.getTime() + 6 * 86_400_000))).toBe(false)
    expect(isExpired(expiresAt, new Date(NOW.getTime() + 7 * 86_400_000))).toBe(true)
    expect(isExpired(expiresAt, new Date(NOW.getTime() + 8 * 86_400_000))).toBe(true)
    expect(isExpired(null, NOW)).toBe(true)
    expect(isExpired('garbage', NOW)).toBe(true)
  })

  it('is single-use: only an unconfirmed row within its time is confirmed', () => {
    const future = new Date(NOW.getTime() + 86_400_000).toISOString()
    const past = new Date(NOW.getTime() - 1000).toISOString()
    expect(confirmOutcome({ status: 'unconfirmed', confirm_expires_at: future }, NOW)).toBe('confirm')
    expect(confirmOutcome({ status: 'unconfirmed', confirm_expires_at: past }, NOW)).toBe('expired')
    for (const status of ['pending', 'approved', 'rejected']) {
      expect(confirmOutcome({ status, confirm_expires_at: future }, NOW)).toBe('already')
    }
    expect(confirmOutcome({ status: 'spam', confirm_expires_at: future }, NOW)).toBe('spam')
    expect(confirmOutcome(null, NOW)).toBe('invalid')
  })

  it('refuses anything that is not a token of ours before any lookup', () => {
    for (const t of ['', 'abc', 'a'.repeat(44), `${'a'.repeat(42)}=`, 42, null, "x' or 1=1 --"]) {
      expect(looksLikeToken(t)).toBe(false)
    }
  })

  it('the email links to the confirm page and repeats nothing the sender typed', () => {
    const r = validate({ headline: 'Buy cheap pills at spam.example now please', firm: 'Spam Firm Ltd' })
    if (!r.ok) throw new Error('fixture')
    const { token } = newConfirmToken(NOW)
    const mail = confirmEmail(r.value, token, NOW)
    expect(confirmUrl(token)).toBe(`https://fundopshq.com/submit/confirm?t=${token}`)
    for (const body of [mail.text, mail.html]) {
      expect(body).toContain(confirmUrl(token))
      expect(body).toContain('fund close')
      expect(body).toContain('October 22, 2026')
      expect(body).not.toContain('spam.example')
      expect(body).not.toContain('Spam Firm')
      expect(body).not.toContain('Pat Doe')
    }
    expect(mail.subject).toBe('Confirm your news for FundOpsHQ')
  })
})

describe('cleaning typed text', () => {
  it('makes a headline one line without control or direction characters', () => {
    expect(cleanLine('  Firm\ncloses\t\tfund\u0000 ‮evil  ', 200)).toBe('Firm closes fund evil')
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

  it('reads a bare website as https only when asked', () => {
    expect(cleanUrl('example.com')).toBeNull()
    expect(cleanUrl('example.com', 300, { bareHost: true })).toBe('https://example.com/')
    expect(cleanUrl('javascript:alert(1)', 300, { bareHost: true })).toBeNull()
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
    expect(hashIp('203.0.113.9', 'secret')).toBe(a)
    expect(hashIp('203.0.113.9', 'other')).not.toBe(a)
    expect(hashIp(null, 'secret')).toBeNull()
    expect(hashIp('203.0.113.9', '')).toBeNull()
  })
})

describe('the owner alert', () => {
  const r = validate()
  if (!r.ok) throw new Error('fixture')
  const s = r.value

  it('says what it is in the subject', () => {
    expect(alertSubject(s)).toBe('[News submission] Fund close: Example Capital — Example Capital closes Fund III at $450M')
  })

  it('labels every typed value and says none of it is checked', () => {
    const text = alertText(s, { state: 'confirmed', newsletter: 'subscribed' })
    expect(text).toContain('UNVERIFIED')
    expect(text).toContain('Firm: Example Capital (https://www.example.com/)')
    expect(text).toContain('Amount: USD 450,000,000')
    expect(text).toContain('Date: 2026-10-20')
    expect(text).toContain('Link: https://www.example.com/news/fund-iii')
    expect(text).toContain('  - Sam Lee, Managing Partner')
    expect(text).toContain('From: Pat Doe, Head of IR <pat@ir.example.com>')
    expect(text).toContain('Email domain matches the website: yes')
    expect(text).toContain('FundOps Daily: asked to subscribe (subscribed)')
    expect(text).toContain("status = 'pending'")
  })

  it('flags a domain mismatch, a lost row and a failed confirmation email', () => {
    expect(alertText({ ...s, domain_match: false }, { state: 'confirmed' })).toContain('NO, check the sender is at the firm')
    expect(alertText(s, { state: 'not_saved' })).toContain('NOT SAVED')
    expect(alertText(s, { state: 'confirm_email_failed' })).toContain('UNCONFIRMED')
  })
})

describe('links to the form', () => {
  it('fills in the firm from a firm page', () => {
    expect(submitNewsHref()).toBe('/submit')
    expect(submitNewsHref('Smith & Co. Partners')).toBe('/submit?firm=Smith%20%26%20Co.%20Partners')
  })
})

describe('the signup it brings', () => {
  it('is recorded as form "submit"', async () => {
    const { sanitizeSignupForm } = await import('@/lib/newsletter/interests')
    expect(sanitizeSignupForm('submit')).toBe('submit')
  })
})
