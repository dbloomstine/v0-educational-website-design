import { describe, expect, it } from 'vitest'
import { ORGANIZER_APOLLO_CREDITS_PER_DAY, ORGANIZER_NOTES_PER_DAY, ORGANIZER_NOTE_DAYS, organizerMode, programLabel } from '../config'
import { OPT_OUT, bodyOf, eventDateLabel, organizerNoteSubject, readerWords, renderOrganizerNote } from '../compose'
import { organizerTitleRank, organizerTitles } from '../exclusions'
import {
  bestOrganizerHit, checkOrganizerMatch, collectOrganizerNotes, organizerCapsLeft, organizerDomains, organizerNameMatches,
  pickOrganizerEvents, registrableDomain, searchNameOf, type OrganizerCandidate, type OrganizerEventRow,
} from '../organizer-notes'

const TODAY = '2026-10-22' // a Thursday
const TOKEN = 'a'.repeat(32)

let n = 0
const ev = (over: Partial<OrganizerEventRow> = {}): OrganizerEventRow => {
  n++
  return {
    id: `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`,
    slug: `event-${n}`,
    name: `Event ${n}`,
    start_date: '2026-11-12',
    end_date: null,
    organizer_name: `Organizer ${n} Association`,
    organizer_type: 'association',
    ops_relevance: 'medium',
    status: 'published',
    region: 'north_america',
    event_format: 'in_person',
    is_submitted: false,
    event_url: `https://www.organizer${n}.org/events/x`,
    registration_url: null,
    source_url: null,
    source_organizer_type: null,
    ...over,
  }
}

describe('picking events for organizer notes', () => {
  it('keeps published North American in-person events 7 to 60 days out', () => {
    const rows = [
      ev({ name: 'Too soon', start_date: '2026-10-28' }),
      ev({ name: 'First day in', start_date: '2026-10-29' }),
      ev({ name: 'Last day in', start_date: '2026-12-21' }),
      ev({ name: 'Too far', start_date: '2026-12-22' }),
      ev({ name: 'Draft', status: 'draft' }),
      ev({ name: 'London', region: 'europe' }),
      ev({ name: 'Webinar', event_format: 'virtual' }),
      ev({ name: 'Sent in by them', is_submitted: true }),
    ]
    const { picked, dropped } = pickOrganizerEvents(rows, TODAY)
    expect(picked.map((p) => p.event.name).sort()).toEqual(['First day in', 'Last day in'])
    expect(dropped.find((d) => d.event === 'Too soon')?.reason).toMatch(/outside 7 to 60 days/)
    expect(dropped.find((d) => d.event === 'Too far')?.reason).toMatch(/outside 7 to 60 days/)
    expect(dropped.find((d) => d.event === 'Sent in by them')?.reason).toBe('the organizer sent it in')
  })

  it('never picks a fund administrator, an IQ-EQ competitor, media, a regulator or a government site', () => {
    const rows = [
      ev({ name: 'Admin forum', organizer_type: 'fund_admin' }),
      ev({ name: 'Admin via source', organizer_type: 'association', source_organizer_type: 'fund_admin' }),
      ev({ name: 'Citco day', organizer_name: 'Citco', organizer_type: 'tech_vendor' }),
      ev({ name: 'IQ-EQ breakfast', organizer_name: 'IQ-EQ', organizer_type: 'community' }),
      ev({ name: 'Admin summit', organizer_name: 'Acme Fund Administration', organizer_type: 'conference_producer' }),
      ev({ name: 'Kroll seminar', organizer_name: 'Kroll', organizer_type: 'other' }),
      ev({ name: 'SEC conference', organizer_name: 'U.S. Securities and Exchange Commission', organizer_type: 'other' }),
      ev({ name: 'Media summit', organizer_name: 'With Intelligence', organizer_type: 'media' }),
      ev({ name: 'Gov site', organizer_name: 'Some Agency Association', event_url: 'https://www.agency.gov/e' }),
      ev({ name: 'Fine', organizer_name: 'Fund Finance Association', event_url: 'https://fundfinanceassociation.com/e' }),
    ]
    const { picked, dropped } = pickOrganizerEvents(rows, TODAY)
    expect(picked.map((p) => p.event.name)).toEqual(['Fine'])
    const why = Object.fromEntries(dropped.map((d) => [d.event, d.reason]))
    expect(why['Admin forum']).toBe('fund administrator')
    expect(why['Admin via source']).toBe('fund administrator')
    expect(why['Citco day']).toBe('fund administrator / IQ-EQ competitor')
    expect(why['IQ-EQ breakfast']).toBe('fund administrator / IQ-EQ competitor')
    expect(why['Admin summit']).toBe('fund administrator / IQ-EQ competitor')
    expect(why['SEC conference']).toBe('organizer type other')
    expect(why['Media summit']).toBe('organizer type media')
    expect(why['Gov site']).toBe('government')
  })

  it('picks one event per organizer, by domain and by name, ops-focused first', () => {
    const rows = [
      ev({ name: 'ACG Boston lunch', organizer_name: 'ACG Boston', event_url: 'https://www.acg.org/boston/events/1', start_date: '2026-11-02' }),
      ev({ name: 'ACG Chicago dinner', organizer_name: 'ACG Chicago', event_url: 'https://acg.org/chicago/events/2', start_date: '2026-11-03' }),
      ev({ name: 'PEI one', organizer_name: 'PEI Group', organizer_type: 'conference_producer', event_url: 'https://live.peievents.com/a', start_date: '2026-11-20' }),
      ev({ name: 'PEI two', organizer_name: 'PEI Group', organizer_type: 'conference_producer', event_url: 'https://peievents.com/b', start_date: '2026-11-10' }),
      ev({ name: 'NSCP high', organizer_name: 'National Society of Compliance Professionals', ops_relevance: 'high', event_url: 'https://nscp.org/e', start_date: '2026-12-10' }),
      ev({ name: 'NSCP again', organizer_name: 'National Society of Compliance Professionals (NSCP)', ops_relevance: 'medium', event_url: 'https://www.nscp.org/f', start_date: '2026-11-05' }),
    ]
    const { picked, dropped } = pickOrganizerEvents(rows, TODAY)
    expect(picked.map((p) => p.event.name)).toEqual(['NSCP high', 'ACG Boston lunch', 'PEI two'])
    expect(dropped.filter((d) => d.reason === 'organizer already picked').map((d) => d.event).sort()).toEqual(['ACG Chicago dinner', 'NSCP again', 'PEI one'])
    expect(picked[0].url).toBe(`https://fundopshq.com/events/${picked[0].event.slug}`)
  })

  it(`skips an organizer noted in the last ${ORGANIZER_NOTE_DAYS} days, matched by its domain or its name`, () => {
    const rows = [
      ev({ name: 'ILPA summit', organizer_name: 'Institutional Limited Partners Association (ILPA)', event_url: 'https://ilpa.org/summit' }),
      ev({ name: 'LSTA conference', organizer_name: 'LSTA', event_url: 'https://www.lsta.org/conf' }),
      ev({ name: 'Opal forum', organizer_name: 'Opal Group', organizer_type: 'conference_producer', event_url: 'https://opalgroup.net/x' }),
    ]
    const noted = [
      { domain: 'ilpa.org', sourceUrl: null, company: 'Someone else' }, // the contact's domain
      { domain: 'elsewhere.com', sourceUrl: 'https://events.lsta.org/old', company: 'LSTA (old name)' }, // the event's page
    ]
    const { picked, dropped } = pickOrganizerEvents(rows, TODAY, noted)
    expect(picked.map((p) => p.event.name)).toEqual(['Opal forum'])
    expect(dropped.filter((d) => /last 180 days/.test(d.reason)).map((d) => d.event).sort()).toEqual(['ILPA summit', 'LSTA conference'])
    // By name alone, too.
    expect(pickOrganizerEvents([ev({ organizer_name: 'Opal Group', organizer_type: 'conference_producer', event_url: 'https://new-opal.com' })], TODAY, [{ domain: null, sourceUrl: null, company: 'Opal Group' }]).picked).toHaveLength(0)
  })

  it('needs an organizer domain that is not an event platform, and leaves out organizers on a foreign domain', () => {
    const rows = [
      ev({ name: 'On Luma', organizer_name: 'NEVCA', event_url: 'https://lu.ma/abc', source_url: 'https://lu.ma/nevca' }),
      ev({ name: 'On Cvent', organizer_name: 'Capitalize for Kids', organizer_type: 'community', event_url: 'https://web.cvent.com/event/1', source_url: 'https://www.capitalizeforkids.org' }),
      ev({ name: 'Canadian', organizer_name: 'CVCA', event_url: 'https://www.cvca.ca/e' }),
    ]
    const { picked, dropped } = pickOrganizerEvents(rows, TODAY)
    expect(picked.map((p) => [p.event.name, p.domains])).toEqual([['On Cvent', ['capitalizeforkids.org']]])
    expect(dropped.find((d) => d.event === 'On Luma')?.reason).toMatch(/event platform/)
    expect(dropped.find((d) => d.event === 'Canadian')?.reason).toMatch(/outside the US/)
  })

  it('reads an organizer’s own domains from its pages', () => {
    expect(registrableDomain('https://app.100women.org/events/1')).toBe('100women.org')
    expect(registrableDomain('https://www.foo.co.uk/x')).toBe('foo.co.uk')
    expect(organizerDomains({ event_url: 'https://pkfoconnordavies.registration.goldcast.io/e', registration_url: null, source_url: 'https://www.pkfod.com/events' })).toEqual(['pkfod.com'])
  })
})

describe('the organizer contact', () => {
  const cand = (over: Partial<OrganizerEventRow> = {}): OrganizerCandidate => {
    const e = ev({ organizer_name: 'Institutional Limited Partners Association (ILPA)', event_url: 'https://ilpa.org/summit', ...over })
    return { event: e, organizer: e.organizer_name, searchName: 'Institutional Limited Partners Association', domains: organizerDomains(e), url: 'https://fundopshq.com/events/x' }
  }
  const person = {
    id: 'p1', first_name: 'Jo', last_name: 'Ray', title: 'Director of Events', email: 'jo@ilpa.org', email_status: 'verified', country: 'United States',
    organization: { name: 'Institutional Limited Partners Association', primary_domain: 'ilpa.org' },
  }

  it('ranks events people first, then marketing; a founder only at a small organizer; never an intern', () => {
    expect(organizerTitleRank('Director of Events')).toBe(0)
    expect(organizerTitleRank('Events Coordinator')).toBe(1)
    expect(organizerTitleRank('Marketing Manager')).toBe(2)
    expect(organizerTitleRank('Head of Partnerships')).toBe(2)
    expect(organizerTitleRank('Founder & CEO', 'conference_producer')).toBe(3)
    expect(organizerTitleRank('Executive Director', 'association')).toBe(3)
    expect(organizerTitleRank('President', 'law_firm')).toBeNull()
    expect(organizerTitleRank('Events Intern')).toBeNull()
    expect(organizerTitleRank('Partner')).toBeNull()
    expect(organizerTitles('law_firm')).not.toContain('Founder')
    expect(organizerTitles('association')).toContain('Executive Director')
  })

  it('searches Apollo for the organizer’s plain name', () => {
    expect(searchNameOf('Institutional Limited Partners Association (ILPA)')).toBe('Institutional Limited Partners Association')
    expect(searchNameOf('NYCPA (New York State Society of CPAs) / Foundation for Accounting Education')).toBe('NYCPA')
    expect(searchNameOf('K&L Gates')).toBe('K&L Gates')
  })

  it('matches the organizer by any of its names', () => {
    expect(organizerNameMatches('ILPA', 'Institutional Limited Partners Association (ILPA)')).toBe(true)
    expect(organizerNameMatches('Morgan, Lewis & Bockius LLP', 'Morgan Lewis')).toBe(true)
    expect(organizerNameMatches('AICPA & CIMA', 'AICPA & CIMA')).toBe(true)
    expect(organizerNameMatches('CIMA', 'AICPA & CIMA')).toBe(true)
    expect(organizerNameMatches('Opal Fuels', 'Opal Group')).toBe(false)
    expect(organizerNameMatches('Atreides Management', 'iConnections (with Atreides and Valor)')).toBe(false)
  })

  it('takes the best-titled hit at the organizer, spending nothing on others', () => {
    const hit = bestOrganizerHit(cand(), [
      { id: 'a', title: 'Marketing Manager', organization: { name: 'ILPA' } },
      { id: 'b', title: 'Director of Events', organization: { name: 'Institutional Limited Partners Association' } },
      { id: 'c', title: 'Director of Events', organization: { name: 'Other Org' } },
      { id: 'd', title: 'Events Intern', organization: { name: 'ILPA' } },
    ])
    expect(hit?.id).toBe('b')
  })

  it('accepts a verified US contact at the organizer’s own domain, and nothing else', () => {
    expect(checkOrganizerMatch(cand(), person)).toMatchObject({ ok: true, contact: { email: 'jo@ilpa.org', domain: 'ilpa.org' } })
    expect(checkOrganizerMatch(cand(), { ...person, country: 'Canada' })).toMatchObject({ ok: false })
    expect(checkOrganizerMatch(cand(), { ...person, email_status: 'guessed' })).toMatchObject({ ok: false })
    expect(checkOrganizerMatch(cand(), { ...person, email: 'jo@gmail.com' })).toMatchObject({ ok: false, reason: /email not at/ })
    expect(checkOrganizerMatch(cand(), { ...person, organization: { name: 'ILPA', primary_domain: 'ilpa-events.com' } })).toMatchObject({ ok: false, reason: /not the organizer's/ })
    expect(checkOrganizerMatch(cand(), { ...person, title: 'Partner' })).toMatchObject({ ok: false })
    expect(checkOrganizerMatch(cand(), { ...person, title: 'Head of Fund Administration Events' })).toMatchObject({ ok: false, reason: /competitor/ })
  })
})

describe('the organizer note', () => {
  const r = renderOrganizerNote({
    firstName: 'Jo',
    unsubToken: TOKEN,
    eventName: 'ILPA Summit 2026',
    dateLabel: eventDateLabel('2026-11-12', '2026-11-13', 2026),
    eventUrl: 'https://fundopshq.com/events/ilpa-summit-2026',
  })

  it('reads as Danny wrote it, with the event page as its one link', () => {
    expect(r.subject).toBe('ILPA Summit 2026 on FundOpsHQ')
    expect(r.text).toBe(
      'Hi Jo,\n\n' +
      "ILPA Summit 2026 on November 12-13 is listed on the FundOpsHQ events board, where fund CFOs, ops and compliance people find what's on: https://fundopshq.com/events/ilpa-summit-2026\n\n" +
      "If any detail is off, or you'd like your other events listed, just reply. Feel free to share the page with your attendees.\n\n" +
      `${OPT_OUT}\n\n` +
      'Danny\nFounder, FundOpsHQ\nFundOpsHQ, 76 Ensign Dr, Mystic, CT 06355\n',
    )
    expect(r.html).toBe('')
    expect((r.text.match(/https?:\/\//g) ?? []).length).toBe(1)
  })

  it('stays under 70 words before the signature', () => {
    expect(readerWords(r)).toBeLessThan(70)
    const long = renderOrganizerNote({ firstName: 'Jo', unsubToken: TOKEN, eventName: 'The Annual Private Equity CFO and COO Forum of the Americas', dateLabel: 'December 1-3', eventUrl: 'https://fundopshq.com/events/x' })
    expect(readerWords(long)).toBeLessThan(70)
    expect(bodyOf(long.text)).toContain('The Annual Private Equity CFO and COO Forum of the Americas on December 1-3 is listed')
  })

  it('writes the dates as the row has them', () => {
    expect(eventDateLabel('2026-11-12', null, 2026)).toBe('November 12')
    expect(eventDateLabel('2026-11-12', '2026-11-12', 2026)).toBe('November 12')
    expect(eventDateLabel('2026-11-30', '2026-12-02', 2026)).toBe('November 30 to December 2')
    expect(eventDateLabel('2027-01-14', null, 2026)).toBe('January 14, 2027')
    expect(eventDateLabel('2026-12-30', '2027-01-02', 2026)).toBe('December 30, 2026 to January 2, 2027')
  })

  it('cuts a long event name in the subject at a word', () => {
    const s = organizerNoteSubject('The Annual Private Equity, Private Credit and Infrastructure Operations, Finance and Compliance Summit')
    expect(s.length).toBeLessThanOrEqual(78)
    expect(s).toBe('The Annual Private Equity, Private Credit and Infrastructure… on FundOpsHQ')
  })

  it('is called an organizer note in alerts', () => {
    expect(programLabel('organizer_note')).toBe('organizer note')
    expect(programLabel('news_note')).toBe('news note')
    expect(programLabel('sponsor_pitch')).toBe('sponsor pitch')
  })
})

describe('the caps on organizer notes', () => {
  const cands: OrganizerCandidate[] = Array.from({ length: 12 }, (_, i) => {
    const e = ev({ organizer_name: `Org${i} Association`, event_url: `https://org${i}.org/e` })
    return { event: e, organizer: e.organizer_name, searchName: e.organizer_name, domains: [`org${i}.org`], url: 'https://fundopshq.com/events/x' }
  })
  const domainOf = (name: string) => `${name.split(' ')[0].toLowerCase()}.org`
  const apollo = {
    search: async (name: string) => [{ id: name, title: 'Director of Events', organization: { name } }],
    match: async (id: string) => ({ id, first_name: 'A', title: 'Director of Events', email: `a@${domainOf(id)}`, email_status: 'verified', country: 'United States', organization: { name: id, primary_domain: domainOf(id) } }),
  }
  const ok = { apollo, screen: async () => null, store: async () => null }

  it('makes at most five a day within six Apollo credits', async () => {
    expect(ORGANIZER_NOTES_PER_DAY).toBe(5)
    expect(ORGANIZER_APOLLO_CREDITS_PER_DAY).toBe(6)
    const r = await collectOrganizerNotes(cands, ok, organizerCapsLeft(0, 0), 'preview')
    expect(r.created).toHaveLength(5)
    expect(r.credits).toBe(5)
  })

  it('stops at the credit cap when reveals fail, counting every credit spent', async () => {
    const r = await collectOrganizerNotes(cands, { ...ok, apollo: { ...apollo, match: async () => null } }, organizerCapsLeft(0, 0), 'preview')
    expect(r.created).toHaveLength(0)
    expect(r.credits).toBe(6)
  })

  it('counts what was made and spent earlier today, and never asks for more than the caps', () => {
    expect(organizerCapsLeft(3, 4)).toEqual({ notes: 2, credits: 2 })
    expect(organizerCapsLeft(0, 0, { noteCap: 50, creditCap: 50 })).toEqual({ notes: 5, credits: 6 })
    expect(organizerCapsLeft(0, 0, { creditCap: 2 })).toEqual({ notes: 5, credits: 2 })
    expect(organizerCapsLeft(9, 9)).toEqual({ notes: 0, credits: 0 })
  })

  it('uses a contact from an earlier preview for free, and screens every address', async () => {
    const screened: string[] = []
    const r = await collectOrganizerNotes(cands.slice(0, 3), {
      ...ok,
      cached: async (c) => (c.organizer === 'Org0 Association' ? { personId: 'p', email: 'old@org0.org', firstName: 'Old', lastName: '', title: 'Events Manager', orgName: 'Org0 Association', domain: 'org0.org', country: 'United States' } : null),
      screen: async (email) => { screened.push(email); return email.startsWith('a@org1') ? 'contacted_recently' : null },
    }, { notes: 5, credits: 0 }, 'preview')
    expect(r.credits).toBe(0)
    expect(r.created.map((c) => [c.email, c.reused])).toEqual([['old@org0.org', true]])
    expect(screened).toEqual(['old@org0.org'])
  })

  it('passes over a contact who is not at the organizer, after the one credit', async () => {
    const r = await collectOrganizerNotes(cands.slice(0, 1), { ...ok, apollo: { ...apollo, match: async (id: string) => ({ ...(await apollo.match(id)), email: 'a@gmail.com' }) } }, { notes: 5, credits: 6 }, 'preview')
    expect(r.credits).toBe(1)
    expect(r.created).toHaveLength(0)
    expect(r.passed[0].reason).toMatch(/email not at/)
  })
})

describe('the organizer notes switch (OUTREACH_V2_ORGANIZER_MODE)', () => {
  it('stays in preview unless set live, and never raises the shared mode', () => {
    expect(organizerMode('live', undefined)).toBe('preview')
    expect(organizerMode('live', '')).toBe('preview')
    expect(organizerMode('live', 'live')).toBe('live')
    expect(organizerMode('live', 'off')).toBe('off')
    expect(organizerMode('preview', 'live')).toBe('preview')
    expect(organizerMode('off', 'live')).toBe('off')
  })
})
