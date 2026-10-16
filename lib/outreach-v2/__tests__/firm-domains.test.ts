import { describe, expect, it } from 'vitest'
import { bareDomain, domainCheck, domainsAgree, knownFirmDomains, nameLetters } from '../firm-domains'
import { checkMatch, knownDomainsFor, pickCandidates, storyDomains } from '../news-notes'
import type { Story } from '@/lib/news/stories'

const story = (over: Partial<Story>): Story => ({
  id: '1a2b3c4d-0000-0000-0000-000000000000', memberIds: [], headline: 'EQT closes Fund XI at €22bn', url: 'https://www.eqtgroup.com/news/eqt-xi-close', source: 'EQT',
  summary: null, coverage: [{ url: 'https://www.penews.com/articles/eqt-closes', source: 'PE News' } as Story['coverage'][number]], kind: 'fundraising', assetClasses: [], eventType: 'fund_close', closeType: 'final',
  sizeUsdM: 24000, firmName: 'EQT', fundName: null, personName: null, geography: ['Europe'], entities: [], firms: [], leadEligible: true, roundup: false,
  firstSeen: '2026-10-15T10:00:00Z', publishedDate: '2026-10-15', weight: 5, ...over,
})

describe('what is known of a firm’s domain', () => {
  it('reads the hand-kept list by any of the firm’s names', () => {
    expect(knownFirmDomains('EQT')).toEqual(['eqtgroup.com'])
    expect(knownFirmDomains('Kohlberg Kravis Roberts')).toEqual(['kkr.com'])
    expect(knownFirmDomains('KKR')).toEqual(['kkr.com'])
    expect(knownFirmDomains('Some Unknown Capital')).toEqual([])
  })
  it('agrees across www and subdomains, never across different names', () => {
    expect(domainsAgree('www.eqtgroup.com', 'eqtgroup.com')).toBe(true)
    expect(domainsAgree('careers.kkr.com', 'kkr.com')).toBe(true)
    expect(domainsAgree('eqt.co', 'eqtgroup.com')).toBe(false)
    expect(bareDomain('https://www.KKR.com/about')).toBe('kkr.com')
    expect(nameLetters('H.I.G.')).toBe(3)
  })
  it('a known firm must match its domain; an unknown short name is never matched on its name alone', () => {
    expect(domainCheck('EQT', 'eqt.co', ['eqtgroup.com'])).toMatchObject({ ok: false, reason: expect.stringContaining('eqt.co is not the firm') })
    expect(domainCheck('EQT', 'www.eqtgroup.com', ['eqtgroup.com'])).toEqual({ ok: true })
    expect(domainCheck('TPG', 'tpg.co', [])).toMatchObject({ ok: false, reason: expect.stringContaining('too short') })
    expect(domainCheck('Acme Capital', 'acmecap.com', [])).toEqual({ ok: true })
    expect(domainCheck('Acme Capital', '', [])).toMatchObject({ ok: false })
  })
  it('a story’s own sources count when they carry the firm’s name (a press release), not when they are a publisher', () => {
    expect(storyDomains(story({}))).toEqual(['eqtgroup.com', 'penews.com'])
    expect(knownDomainsFor('EQT', story({}))).toEqual(['eqtgroup.com'])
    expect(knownDomainsFor('Savory Fund', story({ url: 'https://www.savoryfund.com/news/1', coverage: [] }))).toEqual(['savoryfund.com'])
    expect(knownDomainsFor('Savory Fund', story({ url: 'https://www.prnewswire.com/news/1', coverage: [] }))).toEqual([])
  })
})

describe('the EQT draft of 2026-10-15', () => {
  const person = { id: 'p1', first_name: 'Kyle', last_name: 'R', title: 'Head of Marketing', email: 'kyle@eqt.co', email_status: 'verified', country: 'United States', organization: { name: 'EQT', primary_domain: 'eqt.co' } }
  it('is refused: the company’s domain is a record label’s, not EQT’s', () => {
    expect(checkMatch('EQT', person)).toMatchObject({ ok: false, reason: expect.stringContaining('eqt.co') })
    expect(checkMatch('EQT', person, knownDomainsFor('EQT', story({})))).toMatchObject({ ok: false })
    expect(checkMatch('EQT', { ...person, email: 'kyle@eqtgroup.com', organization: { name: 'EQT', primary_domain: 'eqtgroup.com' } }).ok).toBe(true)
  })
  it('a firm of four letters or fewer with no known domain is passed over', () => {
    expect(checkMatch('Zyxo', { ...person, email: 'kyle@zyxo.co', organization: { name: 'Zyxo', primary_domain: 'zyxo.co' } }, [])).toMatchObject({ ok: false, reason: expect.stringContaining('too short') })
    expect(checkMatch('Zyxo Capital', { ...person, email: 'kyle@zyxocap.com', organization: { name: 'Zyxo Capital', primary_domain: 'zyxocap.com' } }, []).ok).toBe(true)
  })
})

describe('what a note is about', () => {
  it('a close, a launch, a raise or a hire; never a deal, a promotion or a commitment', () => {
    const { picked, dropped } = pickCandidates([
      story({ id: 'a0000000-0000', firmName: 'Acme Capital', eventType: 'fund_close', headline: 'Acme Capital closes Fund III', geography: ['North America'] }),
      story({ id: 'b0000000-0000', firmName: 'Beta Partners', eventType: 'executive_hire', headline: 'Beta Partners hires a CFO', geography: ['North America'] }),
      story({ id: 'c0000000-0000', firmName: 'Gamma Group', eventType: 'acquisition', headline: 'Gamma Group buys Widget Co', geography: ['North America'] }),
      story({ id: 'd0000000-0000', firmName: 'Delta Advisors', eventType: 'executive_change', headline: 'Delta Advisors promotes three', geography: ['North America'] }),
      story({ id: 'e0000000-0000', firmName: 'Epsilon', eventType: 'fund_launch', headline: 'Epsilon launches Fund II', geography: ['North America'] }),
    ])
    expect(picked.map((p) => p.firm)).toEqual(['Acme Capital', 'Beta Partners', 'Epsilon'])
    expect(dropped.map((d) => d.reason)).toEqual(['not a close, launch, raise or hire', 'not a close, launch, raise or hire'])
  })
})
