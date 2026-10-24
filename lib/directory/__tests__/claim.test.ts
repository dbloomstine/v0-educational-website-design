import { describe, expect, it } from 'vitest'
import { claimDomainMatches, claimEmail, claimOutcome, signSession, validateEdits, validateRequest, verifySession } from '../claim'

describe('claim domain match', () => {
  it('accepts the firm domain and its subdomains', () => {
    expect(claimDomainMatches('Jane.Smith@Kirkland.com', 'kirkland.com')).toEqual({ ok: true, email: 'jane.smith@kirkland.com' })
    expect(claimDomainMatches('jane@ny.kirkland.com', 'www.kirkland.com')).toMatchObject({ ok: true })
    expect(claimDomainMatches('jane@kirkland.com', 'https://www.kirkland.com/')).toMatchObject({ ok: true })
  })
  it('refuses other domains, look-alikes and free mail', () => {
    expect(claimDomainMatches('jane@kirkland-ellis.com', 'kirkland.com')).toEqual({ ok: false, reason: 'wrong_domain' })
    expect(claimDomainMatches('jane@kirkland.com.evil.io', 'kirkland.com')).toEqual({ ok: false, reason: 'wrong_domain' })
    expect(claimDomainMatches('jane@gmail.com', 'gmail.com')).toEqual({ ok: false, reason: 'free_mail' })
    expect(claimDomainMatches('not an email', 'kirkland.com')).toEqual({ ok: false, reason: 'invalid' })
    expect(claimDomainMatches(undefined, 'kirkland.com')).toEqual({ ok: false, reason: 'invalid' })
  })
})

describe('the claim link and session', () => {
  it('is single-use and expires', () => {
    const now = new Date('2026-10-24T00:00:00Z')
    expect(claimOutcome(null, now)).toBe('invalid')
    expect(claimOutcome({ confirmed_at: '2026-10-23T00:00:00Z', expires_at: '2026-10-30T00:00:00Z' }, now)).toBe('already')
    expect(claimOutcome({ confirmed_at: null, expires_at: '2026-10-23T00:00:00Z' }, now)).toBe('expired')
    expect(claimOutcome({ confirmed_at: null, expires_at: '2026-10-30T00:00:00Z' }, now)).toBe('confirm')
  })
  it('signs a session for one person and refuses a forged or expired one', () => {
    const id = '11111111-2222-4333-8444-555555555555'
    const t = 1_800_000_000_000
    const s = signSession(id, t, 'k')!
    expect(verifySession(s, t + 1000, 'k')).toBe(id)
    expect(verifySession(s, t + 25 * 3_600_000, 'k')).toBeNull()
    expect(verifySession(s, t, 'other')).toBeNull()
    expect(verifySession(s.replace(id, '11111111-2222-4333-8444-555555555556'), t, 'k')).toBeNull()
    expect(signSession(id, t, '')).toBeNull()
  })
  it('repeats nothing a stranger typed, and escapes the profile name', () => {
    const m = claimEmail({ full_name: 'A <b>', firm_name: 'X & Y' }, 'tok')
    expect(m.html).toContain('A &lt;b&gt;')
    expect(m.html).toContain('/directory/claim/confirm?t=tok')
  })
})

describe('edits', () => {
  it('keeps the description to 600 characters and links to https', () => {
    expect(validateEdits({ description: 'x'.repeat(601) })).toMatchObject({ ok: false, field: 'description' })
    expect(validateEdits({ contact_url: 'http://x.com' })).toMatchObject({ ok: false, field: 'contact_url' })
    expect(validateEdits({ photo_url: 'javascript:alert(1)' })).toMatchObject({ ok: false, field: 'photo_url' })
    const ok = validateEdits({ headline: ' Forms  funds ', description: 'x'.repeat(600), practice_areas: ['secondaries', 'nope'], notable: [{ text: 'A close', year: 2025 }, { text: '' }] })
    expect(ok).toMatchObject({ ok: true, value: { headline: 'Forms funds', practice_areas: ['secondaries'], notable: [{ text: 'A close', year: 2025 }] } })
  })
})

describe('requests', () => {
  it('needs a kind, an email, and for a correction a message', () => {
    expect(validateRequest({ slug: 'a', kind: 'removal', contact_email: 'x@y.com' })).toMatchObject({ ok: true })
    expect(validateRequest({ slug: 'a', kind: 'correction', contact_email: 'x@y.com' })).toMatchObject({ ok: false, field: 'message' })
    expect(validateRequest({ slug: 'a', kind: 'delete', contact_email: 'x@y.com' })).toMatchObject({ ok: false, field: 'kind' })
    expect(validateRequest({ slug: 'A B', kind: 'removal', contact_email: 'x@y.com' })).toMatchObject({ ok: false, field: 'slug' })
  })
})

describe('the flag', () => {
  it('is off unless DIRECTORY_ENABLED says on', async () => {
    const { directoryEnabled } = await import('../taxonomy')
    const before = process.env.DIRECTORY_ENABLED
    delete process.env.DIRECTORY_ENABLED
    expect(directoryEnabled()).toBe(false)
    process.env.DIRECTORY_ENABLED = 'false'
    expect(directoryEnabled()).toBe(false)
    process.env.DIRECTORY_ENABLED = 'true'
    expect(directoryEnabled()).toBe(true)
    if (before === undefined) delete process.env.DIRECTORY_ENABLED
    else process.env.DIRECTORY_ENABLED = before
  })
})
