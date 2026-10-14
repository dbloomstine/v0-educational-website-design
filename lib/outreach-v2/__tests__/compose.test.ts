import { describe, expect, it } from 'vitest'
import {
  audienceLine, bodyOf, footer, listUnsubscribeHeaders, mockupShortUrl, mockupUrl, pitchMonth, possessive, readerWords,
  renderNewsNote, renderSponsorFollowup, renderSponsorPitch, unsubscribeUrl,
} from '../compose'
import { buildPayload } from '../send'
import { freshClause } from '../sponsor-pitch'
import { newsPhrase } from '../news-notes'

const TOKEN = 'a'.repeat(32)
const MOCK = 'https://fundopshq.com/sponsor/m/6ddb4d12'

const pitch = (over: Partial<Parameters<typeof renderSponsorPitch>[0]> = {}) =>
  renderSponsorPitch({ firstName: 'David', company: 'ToltIQ', unsubToken: TOKEN, hookClause: null, audience: audienceLine(152, 64), month: 'November', mockup: MOCK, ...over })

describe('footer and unsubscribe', () => {
  it('carries the postal address and a visible unsubscribe link, in both parts', () => {
    const r = pitch()
    expect(footer(TOKEN)).toContain('FundOpsHQ, 76 Ensign Dr, Mystic, CT 06355')
    expect(r.text.endsWith(footer(TOKEN))).toBe(true)
    expect(r.html).toContain('FundOpsHQ, 76 Ensign Dr, Mystic, CT 06355')
    expect(r.html).toContain(`<a href="${unsubscribeUrl(TOKEN)}"`)
    expect(r.html).toContain('unsubscribe here</a>')
  })

  it('sets RFC 8058 one-click headers with the link and the mailbox', () => {
    const h = listUnsubscribeHeaders(TOKEN)
    expect(h['List-Unsubscribe']).toBe(`<${unsubscribeUrl(TOKEN)}>, <mailto:unsubscribe@reply.fundopshq.com?subject=unsubscribe-${TOKEN}>`)
    expect(h['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
  })
})

describe('the Resend payload', () => {
  const r = pitch()
  const row = { id: '11111111-2222-3333-4444-555555555555', email: 'd@toltiq.com', subject: r.subject, body_text: r.text, body_html: r.html, unsub_token: TOKEN, program: 'sponsor_pitch' as const, kind: 'initial' as const }
  it('carries the HTML and the same email as text, from Danny, replies to the reply domain', () => {
    const p = buildPayload(row)
    expect(p.html).toBe(r.html)
    expect(p.text).toBe(r.text)
    expect(p.from).toBe('Danny Bloomstine <danny@fundopshq.com>')
    expect(p.reply_to).toBe('Danny Bloomstine <danny@reply.fundopshq.com>')
    expect(p.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
    // Resend's mail server sets the Message-ID; we read it back after sending.
    expect(p.headers['Message-ID']).toBeUndefined()
  })
  it('threads a follow-up under its pitch', () => {
    const p = buildPayload({ ...row, kind: 'followup' }, '<parent@email.amazonses.com>')
    expect(p.headers['In-Reply-To']).toBe('<parent@email.amazonses.com>')
    expect(p.headers['References']).toBe('<parent@email.amazonses.com>')
  })
})

describe('sponsor pitch (Danny’s copy, 2026-10-14)', () => {
  it('leads with them, links the mock-up as text, states the audience and the rate, asks for a month', () => {
    const r = pitch({ hookClause: 'Congrats on the Series A.' })
    expect(r.subject).toBe('ToltIQ in FundOps Daily?')
    expect(r.text).toMatch(/^Hi David,\n\nToltIQ's buyers read FundOps Daily every morning: ops, finance and deal teams at GPs, LPs and the firms that serve them\. Congrats on the Series A\./)
    expect(r.html).toContain(`<a href="${MOCK}" style="color:#1a4fa0">See ToltIQ&#39;s ad →</a>`.replace('&#39;', "'"))
    expect(r.text).toContain("about 150 readers at 60+ firms, plus daily TikTok and LinkedIn")
    expect(r.text).toContain("it's a founding rate of $150 a week")
    expect(r.text).toContain('Worth trying a week in November?')
    expect(r.text).toContain('Danny\nFounder, FundOpsHQ')
  })

  it('never shows a raw URL in the HTML body (only the hrefs carry them)', () => {
    const visible = pitch().html.replace(/<a [^>]*>/g, '<a>').replace(/<[^>]+>/g, ' ')
    expect(visible).not.toMatch(/https?:\/\//)
    const note = renderNewsNote({ firstName: 'Sam', company: 'Savory', unsubToken: TOKEN, news: '$200M Fund III close', storyUrl: 'https://fundopshq.com/story/x-12345678' })
    expect(note.html.replace(/<a [^>]*>/g, '<a>').replace(/<[^>]+>/g, ' ')).not.toMatch(/https?:\/\//)
  })

  it('is about 85 words before the footer, with a clause', () => {
    expect(readerWords(pitch({ hookClause: 'Congrats on the Callisto acquisition.' }))).toBeLessThanOrEqual(90)
  })

  it('leaves the audience out rather than guess', () => {
    expect(audienceLine(null, 60)).toBeNull()
    const r = pitch({ audience: null })
    expect(r.text).not.toMatch(/readers at/)
    expect(r.text).toContain("While the list is young it's a founding rate of $150 a week.")
  })

  it('rounds the figures down to ten', () => {
    expect(audienceLine(159, 67)).toBe('about 150 readers at 60+ firms, plus daily TikTok and LinkedIn')
  })

  it('suggests the next month, or the one after late in a month', () => {
    expect(pitchMonth('2026-10-14')).toBe('November')
    expect(pitchMonth('2026-10-25')).toBe('December')
    expect(pitchMonth('2026-12-03')).toBe('January')
  })

  it('uses a hook only when it is fresh and about them', () => {
    expect(freshClause({ hook_clause: 'Congrats on the Series A', hook_date: '2026-10-01' }, '2026-10-14')).toBe('Congrats on the Series A.')
    expect(freshClause({ hook_clause: 'Congrats on the Series A.', hook_date: '2026-08-01' }, '2026-10-14')).toBeNull()
    expect(freshClause({ hook_clause: 'I saw your great launch.', hook_date: '2026-10-01' }, '2026-10-14')).toBeNull()
    expect(freshClause({ hook_clause: 'Congrats on the Series A.', hook_date: null }, '2026-10-14')).toBeNull()
  })

  it('writes possessives the way people do', () => {
    expect(possessive('ToltIQ')).toBe("ToltIQ's")
    expect(possessive('73 Strings')).toBe("73 Strings'")
  })

  it('opens the ad builder on their ad preview', () => {
    const u = new URL(mockupUrl({ company: 'ToltIQ', domain: 'toltiq.com', logoUrl: 'https://toltiq.com/logo.svg', adLine: 'AI diligence.' }))
    expect(u.pathname).toBe('/sponsor')
    expect(u.hash).toBe('#ad-preview')
    expect(Object.fromEntries(u.searchParams)).toEqual({ firm: 'ToltIQ', site: 'toltiq.com', logo: 'https://toltiq.com/logo.svg', line: 'AI diligence.' })
    expect(mockupShortUrl('6DDB4D12-06ce-4582-8c35-cf9552999acd')).toBe('https://fundopshq.com/sponsor/m/6ddb4d12')
  })

  it('follows up once, as a reply, with the mock-up link', () => {
    const f = renderSponsorFollowup({ firstName: 'David', company: 'ToltIQ', unsubToken: TOKEN, mockup: MOCK, original: { subject: 'ToltIQ in FundOps Daily?' } })
    expect(f.subject).toBe('Re: ToltIQ in FundOps Daily?')
    expect(f.html).toContain(`href="${MOCK}"`)
    expect(f.text).toContain("I won't write again")
    expect(f.text.endsWith(footer(TOKEN))).toBe(true)
  })
})

describe('news note', () => {
  const r = renderNewsNote({
    firstName: 'Alex',
    company: 'Savory',
    unsubToken: TOKEN,
    news: newsPhrase({ eventType: 'fund_close', kind: 'fundraising', fundName: 'Fund III', sizeUsdM: 200, closeType: 'final' }),
    storyUrl: 'https://fundopshq.com/story/savory-raises-more-than-200m-f1076843',
  })
  it('is 50 to 80 words and leads with them', () => {
    expect(readerWords(r)).toBeGreaterThanOrEqual(50)
    expect(readerWords(r)).toBeLessThanOrEqual(80)
    expect(bodyOf(r.text)).toMatch(/^Hi Alex,\n\nWe covered Savory's \$200M Fund III close in this morning's FundOps Daily: read it here: https/)
  })
  it('names the firm in the subject, links the story and the free signup as text', () => {
    expect(r.subject).toBe('Savory in FundOps Daily today')
    expect(r.html).toContain('>read it here</a>')
    expect(r.html).toContain('>you can get it here</a>')
    expect(r.text).toContain('Feel free to share it with your team or on LinkedIn.')
    expect(r.text).toContain('https://fundopshq.com/?utm_source=outreach&utm_medium=email&utm_campaign=news_note#subscribe')
    expect(r.text).not.toMatch(/\?e=/)
  })
  it('says what was covered in a few words', () => {
    expect(newsPhrase({ eventType: 'fund_close', kind: 'fundraising', fundName: 'Fund III', sizeUsdM: 1700, closeType: 'final' })).toBe('$1.7bn Fund III close')
    expect(newsPhrase({ eventType: 'fund_close', kind: 'fundraising', fundName: null, sizeUsdM: 50, closeType: 'second' })).toBe('$50M fund second close')
    // Danny, 2026-10-14: "Savory's $200M Savory Fund III close" repeats the firm.
    expect(newsPhrase({ eventType: 'fund_close', kind: 'fundraising', fundName: 'Savory Fund III', sizeUsdM: 200, closeType: 'final' }, 'Savory')).toBe('$200M Fund III close')
    expect(newsPhrase({ eventType: 'fund_close', kind: 'fundraising', fundName: 'Audax Private Equity Fund VII', sizeUsdM: null, closeType: 'final' }, 'Audax Private Equity')).toBe('Fund VII close')
    expect(newsPhrase({ eventType: 'fund_close', kind: 'fundraising', fundName: 'Castlelake Aviation V', sizeUsdM: null, closeType: 'final' }, 'Castlelake LP')).toBe('Aviation V close')
    expect(newsPhrase({ eventType: 'fund_close', kind: 'fundraising', fundName: 'Savory', sizeUsdM: 200, closeType: 'final' }, 'Savory')).toBe('$200M fund close')
    expect(newsPhrase({ eventType: 'fund_close', kind: 'fundraising', fundName: 'Growth Fund II', sizeUsdM: null, closeType: 'final' }, 'Savory')).toBe('Growth Fund II close')
    expect(newsPhrase({ eventType: 'acquisition', kind: 'deals', fundName: null, sizeUsdM: null, closeType: null })).toBe('latest deal')
  })
})
