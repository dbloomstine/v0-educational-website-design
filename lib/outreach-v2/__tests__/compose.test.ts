import { describe, expect, it } from 'vitest'
import { bodyOf, footer, listUnsubscribeHeaders, mockupShortUrl, mockupUrl, renderNewsNote, renderSponsorFollowup, renderSponsorPitch, unsubscribeUrl, wordCount } from '../compose'
import { buildPayload } from '../send'

const TOKEN = 'a'.repeat(32)

describe('footer and unsubscribe', () => {
  it('carries the postal address and a visible unsubscribe link', () => {
    const f = footer(TOKEN)
    expect(f).toContain('FundOpsHQ, 76 Ensign Dr, Mystic, CT 06355')
    expect(f).toContain(`https://fundopshq.com/api/outreach/unsubscribe?t=${TOKEN}`)
  })

  it('sets RFC 8058 one-click headers with the link and the mailbox', () => {
    const h = listUnsubscribeHeaders(TOKEN)
    expect(h['List-Unsubscribe']).toBe(`<${unsubscribeUrl(TOKEN)}>, <mailto:unsubscribe@reply.fundopshq.com?subject=unsubscribe-${TOKEN}>`)
    expect(h['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
  })

  it('every rendered email ends with the footer', () => {
    const pitch = renderSponsorPitch({ firstName: 'Jane', company: 'Acme', unsubToken: TOKEN, hook: 'Saw your launch last week.', subscribers: 157, mockup: 'https://fundopshq.com/sponsor?firm=Acme#book' })
    const note = renderNewsNote({ firstName: 'Jane', company: 'Acme', unsubToken: TOKEN, headline: 'Acme closes Fund II', storyUrl: 'https://fundopshq.com/story/x-12345678' })
    for (const r of [pitch, note]) {
      expect(r.text.endsWith(footer(TOKEN))).toBe(true)
      expect(r.text).toContain('Danny Bloomstine\nFounder, FundOpsHQ')
    }
  })
})

describe('the Resend payload', () => {
  const row = { id: '11111111-2222-3333-4444-555555555555', email: 'jane@acme.com', subject: 'S', body_text: 'T', unsub_token: TOKEN, program: 'sponsor_pitch' as const, kind: 'initial' as const }
  it('is plain text only (no HTML part, so Resend adds no pixel and rewrites no links), from Danny, replies to the reply domain', () => {
    const p = buildPayload(row)
    expect(p).not.toHaveProperty('html')
    expect(p.text).toBe('T')
    expect(p.from).toBe('Danny Bloomstine <danny@fundopshq.com>')
    expect(p.reply_to).toBe('Danny Bloomstine <danny@reply.fundopshq.com>')
    expect(p.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
    // Resend's mail server sets the Message-ID; we read it back after sending.
    expect(p.headers['Message-ID']).toBeUndefined()
    expect(p.headers['In-Reply-To']).toBeUndefined()
  })
  it('threads a follow-up under its pitch', () => {
    const p = buildPayload({ ...row, kind: 'followup' }, '<parent@fundopshq.com>')
    expect(p.headers['In-Reply-To']).toBe('<parent@fundopshq.com>')
    expect(p.headers['References']).toBe('<parent@fundopshq.com>')
  })
})

describe('sponsor pitch', () => {
  const hook = 'I saw that PwC Deals named ToltIQ its sole professional-services AI adviser in June, which is quite a vote of confidence.'
  const mockup = mockupUrl({ company: 'ToltIQ', domain: 'toltiq.com', logoUrl: 'https://toltiq.com/logo.svg', adLine: 'AI diligence for private markets.' })
  const r = renderSponsorPitch({ firstName: 'Jane', company: 'ToltIQ', unsubToken: TOKEN, hook, subscribers: 157, mockup })

  it('is 90 to 120 words above the footer with a one-sentence hook', () => {
    const n = wordCount(bodyOf(r.text))
    expect(n).toBeGreaterThanOrEqual(90)
    expect(n).toBeLessThanOrEqual(120)
  })

  it('stays inside 90 to 120 words for any hook of 4 to 24 words', () => {
    for (const words of [4, 12, 24]) {
      const h = Array.from({ length: words }, () => 'word').join(' ')
      const n = wordCount(bodyOf(renderSponsorPitch({ firstName: 'Jane', company: 'ToltIQ', unsubToken: TOKEN, hook: h, subscribers: 157, mockup }).text))
      expect(n).toBeGreaterThanOrEqual(90)
      expect(n).toBeLessThanOrEqual(120)
    }
  })

  it('says who we are, the honest size, the founding rates, the mock-up and the hook', () => {
    expect(r.text).toContain('GPs, LPs and fund service providers')
    expect(r.text).toContain('about 157 subscribers')
    expect(r.text).toContain('TikTok and LinkedIn')
    expect(r.text).toContain('$150 a week, $450 for four weeks or $1,200 a quarter')
    expect(r.text).toContain(mockup)
    expect(r.text).toContain(hook)
    expect(r.subject).toBe('A FundOps Daily ad for ToltIQ')
  })

  it('never claims readers at named firms', () => {
    expect(r.text).not.toMatch(/read(?:ers|s)? (?:at|by|from) [A-Z]/)
    expect(r.text).not.toMatch(/\bfirms? (?:like|such as)\b/i)
  })

  it('puts a short mock-up link in the email', () => {
    expect(mockupShortUrl('6DDB4D12-06ce-4582-8c35-cf9552999acd')).toBe('https://fundopshq.com/sponsor/m/6ddb4d12')
  })

  it('builds the mock-up link the ad builder reads', () => {
    const u = new URL(mockup)
    expect(u.pathname).toBe('/sponsor')
    expect(u.hash).toBe('#book')
    expect(u.searchParams.get('firm')).toBe('ToltIQ')
    expect(u.searchParams.get('site')).toBe('toltiq.com')
    expect(u.searchParams.get('logo')).toBe('https://toltiq.com/logo.svg')
    expect(u.searchParams.get('line')).toBe('AI diligence for private markets.')
  })

  it('follows up once, as a reply, quoting the pitch', () => {
    const f = renderSponsorFollowup({ firstName: 'Jane', company: 'ToltIQ', unsubToken: TOKEN, mockup, original: { subject: r.subject, text: r.text, sentAt: new Date('2026-10-15T14:00:00Z') } })
    expect(f.subject).toBe(`Re: ${r.subject}`)
    expect(f.text).toContain('> Here is a mock-up')
    expect(f.text).toContain("I won't write again")
    expect(f.text.endsWith(footer(TOKEN))).toBe(true)
    // The quote does not carry the pitch's own footer twice.
    expect(f.text.split('76 Ensign Dr').length).toBe(2)
  })
})

describe('news note', () => {
  const r = renderNewsNote({
    firstName: 'Sam',
    company: 'AE Industrial Partners',
    unsubToken: TOKEN,
    headline: 'AE Industrial promotes Chris Aguemon and Bill Strobel to principal',
    storyUrl: 'https://fundopshq.com/story/ae-industrial-promotes-chris-aguemon-and-bill-strobel-to-principal-1a2b3c4d',
  })
  it('is 50 to 80 words above the footer', () => {
    const n = wordCount(bodyOf(r.text))
    expect(n).toBeGreaterThanOrEqual(50)
    expect(n).toBeLessThanOrEqual(80)
  })
  it('names the firm in the subject, links the story and the free signup', () => {
    expect(r.subject).toBe('AE Industrial Partners in FundOps Daily today')
    expect(r.text).toContain('https://fundopshq.com/story/')
    expect(r.text).toContain('Feel free to share it')
    expect(r.text).toContain('free morning email')
    expect(r.text).toContain('https://fundopshq.com/?utm_source=outreach&utm_medium=email&utm_campaign=news_note#subscribe')
    // No address of theirs in any link.
    expect(r.text).not.toMatch(/\?e=/)
  })
})
