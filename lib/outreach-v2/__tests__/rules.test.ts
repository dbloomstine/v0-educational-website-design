import { describe, expect, it } from 'vitest'
import { addBusinessDays, envMode, followupDue, isOutreachReplyAddress, nyDay, nyDayStart } from '../config'
import { isBadNews, isExcludedFirm, isIqeqEmail, isUsCountry, noteTitleRank, sameFirm } from '../exclusions'
import { bestHit, checkMatch, collectNotes, pickCandidates, type NoteCandidate } from '../news-notes'
import { checkLead } from '../sponsor-pitch'
import { inSendingHours } from '../send'
import type { Story } from '@/lib/news/stories'

describe('the mode switch', () => {
  it('is off unless set to preview or live', () => {
    expect(envMode(undefined)).toBe('off')
    expect(envMode('')).toBe('off')
    expect(envMode('yes')).toBe('off')
    expect(envMode(' Preview ')).toBe('preview')
    expect(envMode('LIVE')).toBe('live')
  })
})

describe('exclusions', () => {
  it('drops fund administrators, IQ-EQ competitors and IQ-EQ itself', () => {
    for (const firm of ['IQ-EQ', 'IQEQ Fund Services', 'Apex Group', 'Alter Domus', 'Citco', 'JTC', 'Ocorian', 'Acme Fund Administration', 'Northgate Fund Services', 'Harbor Corporate Services', 'Atlantic Depositary', 'Keystone Transfer Agency']) {
      expect(isExcludedFirm(firm), firm).toBe(true)
    }
    expect(isExcludedFirm('Audax Private Equity')).toBe(false)
    expect(isExcludedFirm('ToltIQ')).toBe(false)
    expect(isExcludedFirm('Acme Partners', 'Head of Fund Administration')).toBe(true)
    expect(isIqeqEmail('someone@iqeq.com')).toBe(true)
    expect(isIqeqEmail('someone@uk.iqeq.com')).toBe(true)
    expect(isIqeqEmail('someone@notiqeq.com')).toBe(false)
  })

  it('drops bad news: lawsuits, enforcement, layoffs, wind-downs', () => {
    expect(isBadNews({ headline: 'LPs sue Acme Capital over fees' })).toBe(true)
    expect(isBadNews({ headline: 'SEC charges adviser with fraud' })).toBe(true)
    expect(isBadNews({ headline: 'Acme settles with regulator for $2m' })).toBe(true)
    expect(isBadNews({ headline: 'Acme Capital lays off 40 staff', summary: 'The firm announced layoffs.' })).toBe(true)
    expect(isBadNews({ headline: 'Acme to wind down its third fund' })).toBe(true)
    expect(isBadNews({ headline: 'Australian regulator blocks selling of units in Ares credit fund' })).toBe(true)
    expect(isBadNews({ eventType: 'regulatory_action', headline: 'FCA consults on redemption terms' })).toBe(true)
    expect(isBadNews({ eventType: 'executive_departure', headline: 'Five traders leave Verition' })).toBe(true)
    expect(isBadNews({ eventType: 'fund_close', headline: 'BBAM closes third aviation fund above $1.7bn' })).toBe(false)
    expect(isBadNews({ eventType: 'executive_change', headline: 'Castlelake promotes two new partners' })).toBe(false)
  })

  it('news notes go to US contacts only', () => {
    expect(isUsCountry('United States')).toBe(true)
    expect(isUsCountry('USA')).toBe(true)
    expect(isUsCountry('Canada')).toBe(false)
    expect(isUsCountry('United Kingdom')).toBe(false)
    expect(isUsCountry(null)).toBe(false)
  })

  it('prefers senior IR, marketing and communications, then other comms, IR, marketing, and never junior titles', () => {
    for (const t of ['Head of Investor Relations', 'Director of Investor Relations', 'VP, Investor Relations', 'Vice President - Investor Relations', 'Investor Relations Manager', 'Head of IR', 'Head of Marketing', 'Marketing Director', 'Chief Marketing Officer', 'CMO', 'Communications Director', 'Director, Corporate Communications', 'Partner, Head of Investor Relations', 'Managing Director, Communications']) {
      expect(noteTitleRank(t), t).toBe(0)
    }
    expect(noteTitleRank('Communications Manager')).toBe(1)
    expect(noteTitleRank('Investor Relations')).toBe(2)
    expect(noteTitleRank('Principal, Capital Development & Investor Relations')).toBe(2)
    expect(noteTitleRank('Marketing Manager')).toBe(3)
    expect(noteTitleRank('Marketing Coordinator')).toBeNull()
    expect(noteTitleRank('Marketing Intern')).toBeNull()
    expect(noteTitleRank('Managing Partner')).toBeNull()
  })

  it('matches a firm name across sources, and only the same firm', () => {
    expect(sameFirm('StepStone', 'StepStone Group')).toBe(true)
    expect(sameFirm('AE Industrial Partners', 'AE Industrial')).toBe(true)
    expect(sameFirm('H.I.G. Capital', 'HIG Capital')).toBe(true)
    expect(sameFirm('Blackstone Credit & Insurance', 'Blackstone')).toBe(false)
    expect(sameFirm('Ares', 'Aresco')).toBe(false)
    expect(sameFirm('Ares', 'Ares Management')).toBe(true)
    expect(sameFirm('Capital Group', 'Carlyle Group')).toBe(false)
  })

  it('sends replies to the reply subdomain only', () => {
    expect(isOutreachReplyAddress('Danny <danny@reply.fundopshq.com>')).toBe(true)
    expect(isOutreachReplyAddress('events@fundopshq.com')).toBe(false)
  })
})

describe('timing', () => {
  it('counts five business days over a weekend', () => {
    expect(addBusinessDays('2026-10-16', 5)).toBe('2026-10-23') // Fri → next Fri
    expect(addBusinessDays('2026-10-14', 5)).toBe('2026-10-21') // Wed → next Wed
    expect(addBusinessDays('2026-10-17', 1)).toBe('2026-10-19') // Sat → Mon
  })

  it('a follow-up is due on the fifth business day, not before', () => {
    const sent = new Date('2026-10-16T14:00:00Z') // Fri 10am New York
    expect(followupDue(sent, '2026-10-22')).toBe(false)
    expect(followupDue(sent, '2026-10-23')).toBe(true)
    expect(followupDue(sent, '2026-10-26')).toBe(true)
  })

  it('a New York day starts at New York midnight', () => {
    expect(nyDayStart('2026-10-14').toISOString()).toBe('2026-10-14T04:00:00.000Z')
    expect(nyDayStart('2026-12-01').toISOString()).toBe('2026-12-01T05:00:00.000Z')
    expect(nyDay(new Date('2026-10-15T03:30:00Z'))).toBe('2026-10-14')
  })

  it('sends only on weekdays, 9am to 6pm New York', () => {
    expect(inSendingHours(new Date('2026-10-14T13:00:00Z'))).toBe(true) // Wed 9:00
    expect(inSendingHours(new Date('2026-10-14T12:59:00Z'))).toBe(false) // Wed 8:59
    expect(inSendingHours(new Date('2026-10-14T22:00:00Z'))).toBe(false) // Wed 18:00
    expect(inSendingHours(new Date('2026-10-17T15:00:00Z'))).toBe(false) // Sat
  })
})

const story = (over: Partial<Story>): Story => ({
  id: '1a2b3c4d-0000-0000-0000-000000000000',
  memberIds: [],
  headline: 'Acme Capital closes Fund III at $500m',
  url: 'https://example.com',
  source: null,
  summary: null,
  coverage: [],
  kind: 'fundraising',
  assetClasses: [],
  eventType: 'fund_close',
  closeType: 'final',
  sizeUsdM: 500,
  firmName: 'Acme Capital',
  fundName: null,
  personName: null,
  geography: ['North America'],
  entities: [],
  firms: [],
  leadEligible: true,
  roundup: false,
  firstSeen: '2026-10-14T10:00:00Z',
  publishedDate: '2026-10-14',
  weight: 1,
  ...over,
})

describe('picking firms from the edition', () => {
  it('keeps one note per firm, drops bad news, competitors, roundups and described firms, North America first', () => {
    const { picked, dropped } = pickCandidates([
      story({ id: 'a0000000-0000', firmName: 'Euro Partners', geography: ['Europe'], weight: 9 }),
      story({ id: 'b0000000-0000', firmName: 'Acme Capital', weight: 2 }),
      story({ id: 'c0000000-0000', firmName: 'Acme Capital', headline: 'Acme Capital buys Widget Co', weight: 1 }),
      story({ id: 'd0000000-0000', firmName: 'Bad Co', headline: 'LPs sue Bad Co' }),
      story({ id: 'e0000000-0000', firmName: 'Apex Group' }),
      story({ id: 'f0000000-0000', firmName: 'Wire', roundup: true }),
      story({ id: '10000000-0000', firmName: 'Texas private equity firm' }),
    ])
    expect(picked.map((p) => p.firm)).toEqual(['Acme Capital', 'Euro Partners'])
    expect(picked[0].url).toMatch(/^https:\/\/fundopshq\.com\/story\/acme-capital-closes-fund-iii-at-500m-b0000000$/)
    expect(dropped.map((d) => d.reason).sort()).toEqual(['bad news', 'firm already picked', 'firm is a description', 'fund administrator / IQ-EQ competitor', 'roundup'].sort())
  })
})

describe('the firm the story is about', () => {
  it('puts a firm that leads its headline ahead of one named further on', () => {
    const { picked } = pickCandidates([
      story({ id: 'a1000000-0000', firmName: 'BlackRock', headline: 'WCAS sells $2.8bn CenterWell clinic stake to BlackRock’s HPS', weight: 5 }),
      story({ id: 'b1000000-0000', firmName: 'Savory', headline: 'Savory Closes $200M Fund III for Restaurant Growth', weight: 1 }),
    ])
    expect(picked.map((p) => p.firm)).toEqual(['Savory', 'BlackRock'])
  })
})

describe('the Apollo contact checks', () => {
  const person = {
    id: 'p1',
    first_name: 'Sam',
    last_name: 'Lee',
    title: 'Head of Marketing',
    email: 'sam@acmecap.com',
    email_status: 'verified',
    country: 'United States',
    organization: { name: 'Acme Capital', primary_domain: 'acmecap.com' },
  }
  it('takes the best-titled hit at the same firm', () => {
    const hit = bestHit('Acme Capital', [
      { id: 'x', title: 'Investor Relations', organization: { name: 'Acme Capital' } },
      { id: 'y', title: 'Head of Marketing', organization: { name: 'Acme Capital Partners' } },
      { id: 'z', title: 'Head of Marketing', organization: { name: 'Other Firm' } },
      { id: 'w', title: 'Marketing Intern', organization: { name: 'Acme Capital' } },
    ])
    expect(hit?.id).toBe('y')
  })
  it('picks the firm\'s press owner over other marketing, IR or proposal staff', () => {
    const org = { name: 'Acme Capital' }
    const hit = bestHit('Acme Capital', [
      { id: 'a', title: 'Marketing Leader Proposal Management', organization: org },
      { id: 'b', title: 'Marketing Manager', organization: org },
      { id: 'c', title: 'Investor Relations Associate Director', organization: org },
      { id: 'd', title: 'Vice President, Investor Relations', organization: org },
      { id: 'e', title: 'Managing Partner', organization: org },
    ])
    expect(hit?.id).toBe('c')
    expect(bestHit('Acme Capital', [
      { id: 'b', title: 'Marketing Manager', organization: org },
      { id: 'd', title: 'Vice President, Investor Relations', organization: org },
    ])?.id).toBe('d')
  })
  it('falls back to an off-target press title only when no one better is found, and never to a partner or CEO', () => {
    const org = { name: 'Acme Capital' }
    expect(noteTitleRank('Marketing Leader Proposal Management')).toBe(4)
    expect(noteTitleRank('Director, RFP & Proposals Marketing')).toBe(4)
    expect(noteTitleRank('Product Marketing Manager')).toBe(4)
    expect(bestHit('Acme Capital', [
      { id: 'p', title: 'Managing Partner', organization: org },
      { id: 'f', title: 'Marketing Leader Proposal Management', organization: org },
    ])?.id).toBe('f')
    expect(bestHit('Acme Capital', [
      { id: 'p', title: 'Managing Partner', organization: org },
      { id: 'q', title: 'Founder & CEO', organization: org },
      { id: 'r', title: 'Partner', organization: org },
    ])).toBeNull()
    for (const t of ['Managing Partner', 'Founder', 'CEO', 'Partner', 'Chief Executive Officer', 'Chief Investment Officer']) expect(noteTitleRank(t), t).toBeNull()
  })
  it('accepts a verified US contact at the firm domain', () => {
    expect(checkMatch('Acme Capital', person).ok).toBe(true)
  })
  it('refuses non-US, unverified, wrong firm and off-domain contacts', () => {
    expect(checkMatch('Acme Capital', { ...person, country: 'Canada' })).toMatchObject({ ok: false })
    expect(checkMatch('Acme Capital', { ...person, email_status: 'guessed' })).toMatchObject({ ok: false })
    expect(checkMatch('Acme Capital', { ...person, organization: { name: 'Zeta', primary_domain: 'acmecap.com' } })).toMatchObject({ ok: false })
    expect(checkMatch('Acme Capital', { ...person, email: 'sam@gmail.com' })).toMatchObject({ ok: false })
  })
})

describe('the daily caps on news notes', () => {
  const cands: NoteCandidate[] = Array.from({ length: 15 }, (_, i) => ({ firm: `Firm${i} Capital`, story: story({ firmName: `Firm${i} Capital` }), url: 'https://fundopshq.com/story/x' }))
  const apollo = {
    search: async (firm: string) => [{ id: firm, title: 'Head of Marketing', organization: { name: firm } }],
    match: async (id: string) => ({ id, first_name: 'A', title: 'Head of Marketing', email: `a@${id.toLowerCase().replace(/\s/g, '')}.com`, email_status: 'verified', country: 'United States', organization: { name: id, primary_domain: `${id.toLowerCase().replace(/\s/g, '')}.com` } }),
  }
  const ok = { apollo, recentFirm: () => false, screen: async () => null, store: async () => null }

  it('makes at most ten notes', async () => {
    const r = await collectNotes(cands, ok, { notes: 10, credits: 10 }, 'preview')
    expect(r.created).toHaveLength(10)
    expect(r.credits).toBe(10)
  })

  it('stops at the credit cap even when reveals fail, and counts every credit spent', async () => {
    const failing = { ...ok, apollo: { ...apollo, match: async () => null } }
    const r = await collectNotes(cands, failing, { notes: 10, credits: 10 }, 'preview')
    expect(r.created).toHaveLength(0)
    expect(r.credits).toBe(10)
  })

  it('spends nothing on a firm with no fitting contact, a recently noted firm, and screens every address', async () => {
    let screened = 0
    const r = await collectNotes(cands.slice(0, 3), {
      ...ok,
      apollo: { ...apollo, search: async (firm: string) => (firm === 'Firm0 Capital' ? [] : apollo.search(firm)) },
      recentFirm: (f) => f === 'Firm1 Capital',
      screen: async () => { screened++; return 'contacted_recently' },
    }, { notes: 10, credits: 10 }, 'preview')
    expect(r.credits).toBe(1)
    expect(screened).toBe(1)
    expect(r.created).toHaveLength(0)
    expect(r.passed.map((p) => p.reason)).toEqual(['no marketing / communications / IR contact found', 'had a note in the last 30 days', 'contacted_recently'])
  })
})

describe('the sponsor list file', () => {
  const good = {
    company: 'ToltIQ', domain: 'toltiq.com', first_name: 'Jane', last_name: 'Doe', title: 'Head of Marketing', email: 'Jane@ToltIQ.com',
    apollo_person_id: 'abc', hook: 'I saw PwC Deals picked ToltIQ as its AI adviser in June.', source_url: 'https://pwc.com/x', logo_url: 'https://toltiq.com/logo.svg', ad_line: 'AI diligence for private markets.',
  }
  it('accepts a complete lead and lower-cases the address', () => {
    const c = checkLead(good)
    expect(c.errors).toEqual([])
    expect(c.lead.email).toBe('jane@toltiq.com')
  })
  it('reads the list agent’s own field names, preferring the written hook line', () => {
    const c = checkLead({
      company: '6lock', domain: '6lock.com', contact_first_name: 'David', contact_last_name: 'B', contact_title: 'COO', contact_email: 'db@6lock.com',
      contact_location: 'Austin, TX, US', hook: 'Oct 8, 2026: research note.', hook_clause: 'Congrats on the new insurance cover.', hook_date: '2026-10-08',
      hook_source_url: 'https://6lock.com/blog', what_they_sell: 'Verified money movement for private markets.', email_status: 'verified',
    })
    expect(c.errors).toEqual([])
    expect(c.lead).toMatchObject({ first_name: 'David', email: 'db@6lock.com', country: 'United States', hook_clause: 'Congrats on the new insurance cover.', hook_date: '2026-10-08', source_url: 'https://6lock.com/blog', ad_line: null })
  })

  it('takes a second mail domain only when the lead names it', () => {
    const npm = { ...good, company: 'Nasdaq Private Market', domain: 'nasdaqprivatemarket.com', email: 'c@npm.com' }
    expect(checkLead(npm).errors.join()).toMatch(/not at nasdaqprivatemarket\.com/)
    expect(checkLead({ ...npm, email_domain_ok: 'npm.com' }).errors).toEqual([])
  })

  it('refuses an address off the company domain, a competitor, an IQ-EQ address and an "I saw" clause', () => {
    expect(checkLead({ ...good, email: 'jane@gmail.com' }).errors.join()).toMatch(/not at toltiq\.com/)
    expect(checkLead({ ...good, company: 'Apex Group', domain: 'apexgroup.com', email: 'a@apexgroup.com' }).errors.join()).toMatch(/competitor/)
    expect(checkLead({ ...good, domain: 'iqeq.com', email: 'a@iqeq.com' }).errors.join()).toMatch(/iqeq/)
    expect(checkLead({ ...good, hook_clause: 'I saw your launch.', hook_date: '2026-10-01' }).errors.join()).toMatch(/about them/)
  })
})

describe('the news notes switch (OUTREACH_V2_NEWS_MODE)', () => {
  it('caps the news notes at preview unless set live, and never raises the shared mode', async () => {
    const { newsMode } = await import('../config')
    expect(newsMode('live', undefined)).toBe('preview')
    expect(newsMode('live', 'live')).toBe('live')
    expect(newsMode('live', 'off')).toBe('off')
    expect(newsMode('preview', 'live')).toBe('preview')
    expect(newsMode('off', 'live')).toBe('off')
  })
})

import { bounceVerdict } from '../store'
import { BOUNCE_MIN_SENT, NEWS_NOTES_PER_DAY, SPONSOR_PITCHES_PER_DAY, APOLLO_CREDITS_PER_DAY } from '../config'

describe('the ramp and its brake (2026-10-21)', () => {
  it('sends ten news notes and ten new pitches a day, within 15 Apollo credits for the notes', () => {
    expect(NEWS_NOTES_PER_DAY).toBe(10)
    expect(SPONSOR_PITCHES_PER_DAY).toBe(10)
    expect(APOLLO_CREDITS_PER_DAY).toBe(15)
  })
  it('halts on bounces over 5% once 60 went out and 3 bounced, and not before (2026-10-22: 2 of 59 halted it)', () => {
    expect(bounceVerdict(59, 2).halt).toBe(false)
    expect(bounceVerdict(BOUNCE_MIN_SENT - 1, 10).halt).toBe(false)
    expect(bounceVerdict(100, 5).halt).toBe(false)
    expect(bounceVerdict(60, 2).halt).toBe(false)
    expect(bounceVerdict(100, 6).halt).toBe(true)
    expect(bounceVerdict(100, 6).reason).toMatch(/6 of the last 100 sends/)
  })
})
