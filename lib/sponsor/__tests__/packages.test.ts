import { describe, it, expect } from 'vitest'
import { PACKAGES, LEAD_DAYS, checkBooking, isMonday, openMondays, packageOf, runEnd, runIsFree } from '../packages'
import { readLogo, hostedLogo, LOGO_MAX_BYTES } from '../requests'
import { approvedMail, decideMail, receivedMail, interestMail, payUrl, type RequestRow } from '../mail'
import { tagSponsorLinks } from '@/lib/newsletter/email-template'

const week = packageOf('week')!, month = packageOf('month')!
const TODAY = '2026-10-09' // a Friday

describe('what is for sale', () => {
  it('is one product in three lengths, each cheaper per edition than the one before', () => {
    expect(PACKAGES.map((p) => p.id)).toEqual(['week', 'month', 'quarter'])
    const each = PACKAGES.map((p) => p.priceUsd / p.editions)
    expect(each[1]).toBeLessThan(each[0])
    expect(each[2]).toBeLessThan(each[1])
    for (const p of PACKAGES) expect(p.days % 7).toBe(0)
  })
})

describe('when a run can start', () => {
  it('on a Monday, far enough off for the ad to be read and placed', () => {
    const open = openMondays(TODAY, [])
    expect(open[0]).toBe('2026-10-12')
    expect(open.every(isMonday)).toBe(true)
    // On a Saturday the Monday two days off is too soon.
    expect(openMondays('2026-10-10', [])[0]).toBe('2026-10-19')
    expect(LEAD_DAYS).toBeGreaterThanOrEqual(2)
  })
  it('never in a week somebody else holds', () => {
    const taken = [{ starts_on: '2026-10-19', ends_on: '2026-10-25' }]
    const open = openMondays(TODAY, taken)
    expect(open).not.toContain('2026-10-19')
    expect(open.slice(0, 2)).toEqual(['2026-10-12', '2026-10-26'])
  })
  it('a longer run is refused when any day of it is taken', () => {
    const taken = [{ starts_on: '2026-10-26', ends_on: '2026-11-01' }]
    expect(runIsFree('2026-10-12', week, taken)).toBe(true)
    expect(runIsFree('2026-10-12', month, taken)).toBe(false)
    expect(runEnd('2026-10-12', week)).toBe('2026-10-18')
    expect(runEnd('2026-10-12', month)).toBe('2026-11-08')
  })
})

const good = {
  packageId: 'week', startsOn: '2026-10-19', company: 'Northgate Fund Services', contactName: 'Ana Reyes', email: 'Ana@Northgate.example',
  website: 'northgate.example', tagline: '', blurb: 'Fund administration for managers raising their first three funds, with a team that answers the phone.',
  ctaUrl: 'http://northgate.example/funds', ctaText: '', logoLink: '', notes: '',
}

describe('a booking request', () => {
  it('is tidied: the address lower-cased, a bare site given https', () => {
    const { input, errors } = checkBooking(good, TODAY)
    expect(errors).toEqual({})
    expect(input.email).toBe('ana@northgate.example')
    expect(input.website).toBe('https://northgate.example')
    expect(input.ctaUrl).toBe('https://northgate.example/funds')
  })
  it('says what is wrong, field by field', () => {
    const { errors } = checkBooking({ ...good, packageId: 'year', startsOn: '2026-10-20', email: 'nope', blurb: 'Too short', ctaUrl: '' }, TODAY)
    expect(Object.keys(errors).sort()).toEqual(['blurb', 'ctaUrl', 'email', 'packageId', 'startsOn'])
  })
  it('holds the copy to sixty words and refuses a start that is too soon', () => {
    expect(checkBooking({ ...good, blurb: Array(61).fill('word').join(' ') }, TODAY).errors.blurb).toMatch(/60 words/)
    expect(checkBooking({ ...good, startsOn: '2026-10-05' }, TODAY).errors.startsOn).toBeTruthy()
    expect(checkBooking({ ...good, startsOn: '2026-10-12' }, '2026-10-10').errors.startsOn).toBeTruthy()
  })
})

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40)])
describe('a logo sent with a request', () => {
  it('is believed only if its own first bytes say it is a picture', () => {
    const ok = readLogo(`data:image/png;base64,${PNG.toString('base64')}`)
    expect(ok && 'ext' in ok && ok.ext).toBe('png')
    expect(readLogo(`data:image/png;base64,${Buffer.from('<svg onload=alert(1)>').toString('base64')}`)).toEqual({ error: expect.stringMatching(/PNG or JPEG/) })
    expect(readLogo('data:image/svg+xml;base64,AAAA')).toEqual({ error: expect.stringMatching(/PNG or JPEG/) })
    expect(readLogo('')).toBeNull()
  })
  it('is refused when it is too large', () => {
    const big = Buffer.concat([PNG, Buffer.alloc(LOGO_MAX_BYTES)])
    expect(readLogo(`data:image/png;base64,${big.toString('base64')}`)).toEqual({ error: expect.stringMatching(/400 KB/) })
  })
  it('goes into a booking only from our own storage', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://proj.supabase.co'
    expect(hostedLogo('https://proj.supabase.co/storage/v1/object/public/sponsors/requests/a.png')).toBeTruthy()
    expect(hostedLogo('https://elsewhere.example/logo.png')).toBeNull()
    expect(hostedLogo(null)).toBeNull()
  })
})

const row: RequestRow = {
  id: 'r1', created_at: '2026-10-09T12:00:00Z', status: 'pending', package: 'week', price_usd: 400, starts_on: '2026-10-19', ends_on: '2026-10-25',
  company: 'Acme <b>Bold</b>', contact_name: 'Ana Reyes', email: 'ana@acme.example', website: 'https://acme.example', tagline: null,
  blurb: 'We do <script>alert(1)</script> fund administration.', cta_url: 'https://acme.example/x?a=1&b=2', cta_text: null, logo_link: null, notes: 'Hello "there"',
  arrived_from: 'linkedin / post', action_token: '11111111-1111-4111-8111-111111111111', decided_at: null, booking_id: null, reminded_at: null,
}
describe('the letters', () => {
  it('print what a stranger typed as text, never as markup', () => {
    for (const mail of [receivedMail(row), decideMail(row), approvedMail(row)]) {
      expect(mail.html).not.toContain('<script>')
      expect(mail.html).not.toContain('<b>Bold</b>')
      expect(mail.html).toContain('&lt;script&gt;')
    }
  })
  it('send the owner to the page where he decides; no link in the email decides by itself', () => {
    const mail = decideMail(row)
    expect(mail.html).toContain('https://fundopshq.com/sponsor/decide?token=11111111-1111-4111-8111-111111111111')
    expect(mail.html).not.toMatch(/action=approve|do=approve/)
    expect(mail.replyTo).toBe('ana@acme.example')
  })
  it('say how to pay: by the link when one is set, by invoice when not', () => {
    delete process.env.SPONSOR_PAY_URL_WEEK
    expect(payUrl('week')).toBeNull()
    expect(approvedMail(row).html).toMatch(/invoice follows/)
    process.env.SPONSOR_PAY_URL_WEEK = 'https://buy.stripe.com/test_123'
    expect(approvedMail(row).html).toContain('href="https://buy.stripe.com/test_123"')
    delete process.env.SPONSOR_PAY_URL_WEEK
  })
  it('tell the owner which reader looked, by address and firm', () => {
    const mail = interestMail({ email: 'cfo@bigfund.example', role: 'gp', since: '2026-05-02T00:00:00Z' }, 2)
    expect(mail.subject).toBe('A reader at bigfund.example looked at the sponsor page')
    expect(mail.html).toContain('cfo@bigfund.example')
  })
})

describe('the email’s links to the sponsor page', () => {
  it('carry the reader’s tag, whatever else they carry; no other link is touched', () => {
    const html = '<a href="https://fundopshq.com/sponsor?ref=email-top">a</a><a href="https://fundopshq.com/sponsor">b</a><a href="https://fundopshq.com/sponsors/x.png">c</a><a href="https://fundopshq.com/news">d</a>'
    const out = tagSponsorLinks(html, 'ID')
    expect(out).toContain('href="https://fundopshq.com/sponsor?ref=email-top&amp;r=ID"')
    expect(out).toContain('href="https://fundopshq.com/sponsor?r=ID"')
    expect(out).toContain('href="https://fundopshq.com/sponsors/x.png"')
    expect(out).toContain('href="https://fundopshq.com/news"')
  })
})
