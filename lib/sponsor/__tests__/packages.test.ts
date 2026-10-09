import { describe, it, expect } from 'vitest'
import { PACKAGES, LEAD_DAYS, LIMITS, LOGO_RULES, checkBooking, emailLogoWidth, isMonday, openMondays, packageOf, runEnd, runIsFree } from '../packages'
import { readLogo, hostedLogo, imageSize, LOGO_MAX_BYTES } from '../requests'
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
  it('holds the firm name to what fits a phone, and a line or a button to their lengths', () => {
    expect(checkBooking({ ...good, company: 'x'.repeat(LIMITS.company + 1) }, TODAY).errors.company).toBeTruthy()
    expect(checkBooking({ ...good, tagline: 'x'.repeat(LIMITS.tagline + 1) }, TODAY).errors.tagline).toBeTruthy()
    expect(checkBooking({ ...good, ctaText: 'x'.repeat(LIMITS.ctaText + 1) }, TODAY).errors.ctaText).toBeTruthy()
    // A link has to be a real web address: not a script, not a bare word, not one with a password in it.
    for (const bad of ['javascript:alert(1)', 'localhost', 'https://user:pw@acme.example/x', 'ftp://acme.example']) expect(checkBooking({ ...good, ctaUrl: bad }, TODAY).errors.ctaUrl, bad).toBeTruthy()
    expect(checkBooking({ ...good, ctaUrl: 'acme.example/funds?x=1' }, TODAY).errors.ctaUrl).toBeUndefined()
  })
  it('holds the copy to sixty words and refuses a start that is too soon', () => {
    expect(checkBooking({ ...good, blurb: Array(61).fill('word').join(' ') }, TODAY).errors.blurb).toMatch(/60 words/)
    expect(checkBooking({ ...good, startsOn: '2026-10-05' }, TODAY).errors.startsOn).toBeTruthy()
    expect(checkBooking({ ...good, startsOn: '2026-10-12' }, '2026-10-10').errors.startsOn).toBeTruthy()
  })
})

/** The first 24 bytes of a PNG of the given size (signature and IHDR), padded: enough for a header to be read. */
const png = (w: number, h: number, pad = 40) => {
  const head = Buffer.alloc(24)
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(head)
  head.writeUInt32BE(13, 8); head.write('IHDR', 12); head.writeUInt32BE(w, 16); head.writeUInt32BE(h, 20)
  return Buffer.concat([head, Buffer.alloc(pad)])
}
/** A JPEG's opening: start marker, one application block, then the frame header that carries the size. */
const jpeg = (w: number, h: number) => {
  const app = Buffer.from([0xff, 0xe0, 0x00, 0x04, 0x00, 0x00])
  const sof = Buffer.alloc(11); sof[0] = 0xff; sof[1] = 0xc2; sof.writeUInt16BE(9, 2); sof[4] = 8; sof.writeUInt16BE(h, 5); sof.writeUInt16BE(w, 7)
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app, sof, Buffer.alloc(20)])
}
const url = (b: Buffer, type = 'png') => `data:image/${type};base64,${b.toString('base64')}`

describe('a logo sent with a request', () => {
  it('has its size read from its own header, PNG or JPEG', () => {
    expect(imageSize(png(640, 160))).toEqual({ width: 640, height: 160 })
    expect(imageSize(jpeg(500, 250))).toEqual({ width: 500, height: 250 })
    expect(imageSize(Buffer.from('not a picture at all, just words'))).toBeNull()
  })
  it('is believed only if its own first bytes say it is a picture', () => {
    const ok = readLogo(url(png(640, 160)))
    expect(ok && 'ext' in ok && [ok.ext, ok.width, ok.height]).toEqual(['png', 640, 160])
    const jpg = readLogo(url(jpeg(500, 250), 'jpeg'))
    expect(jpg && 'ext' in jpg && jpg.ext).toBe('jpg')
    expect(readLogo(url(Buffer.from('<svg onload=alert(1)>')))).toEqual({ error: expect.stringMatching(/PNG or JPEG/) })
    expect(readLogo('data:image/svg+xml;base64,AAAA')).toEqual({ error: expect.stringMatching(/PNG or JPEG/) })
    expect(readLogo('')).toBeNull()
  })
  it('is refused when it is too heavy, too small to be sharp, or absurdly large', () => {
    expect(readLogo(url(png(640, 160, LOGO_MAX_BYTES)))).toEqual({ error: expect.stringMatching(/400 KB/) })
    expect(readLogo(url(png(LOGO_RULES.minWidth - 1, 40)))).toEqual({ error: expect.stringMatching(/pixels wide/) })
    expect(readLogo(url(png(LOGO_RULES.maxSide + 1, 400)))).toEqual({ error: expect.stringMatching(/very large/) })
  })
  it('is drawn in the email at about the same height whatever its shape', () => {
    // A 4:1 wordmark and a square mark both come out near 44 px tall; neither is ever tiny or huge.
    expect(emailLogoWidth(640, 160)).toBe(176)
    expect(emailLogoWidth(400, 400)).toBe(70)
    expect(emailLogoWidth(2000, 100)).toBe(220)
    expect(emailLogoWidth(0, 0)).toBe(160)
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
    expect(approvedMail(row).html).toMatch(/by invoice/)
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
