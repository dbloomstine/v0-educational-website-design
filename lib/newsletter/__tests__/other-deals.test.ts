import { describe, expect, it } from 'vitest'
import { isOtherDeal, placeArticle, type NewsletterArticle } from '../query-articles'

const row = (title: string, firmName: string | null, eventType = 'other') =>
  ({ title, firmName, eventType, sourceName: 'PE Hub', headlineEntities: [] }) as unknown as NewsletterArticle

describe('a deal the classifier filed as "other"', () => {
  it('is placed in Deals, never as a lead, when an investment firm in the headline bought or took a stake', () => {
    for (const [title, firm] of [
      ['Exclusive: Vista agrees to acquire HID’s PKI business unit', 'Vista Equity Partners'],
      ['Fengate Private Equity takes majority stake in Florida clinical research network CRWF', 'Fengate Private Equity'],
      ['Kian Capital to acquire Bay Area commercial landscaper Integrity Landscape', 'Kian Capital'],
      ['ECI Partners’ CSL Group buys US IoT eSIM provider SIMPL Wireless', 'ECI Partners'],
    ]) {
      expect(isOtherDeal(row(title, firm))).toBe(true)
      expect(placeArticle(row(title, firm))).toEqual({ section: 'deals', assetClass: null, leadEligible: false })
    }
  })

  it('stays out when the buyer is not named as an investment firm, or is not the one in the headline', () => {
    expect(isOtherDeal(row('Maximus to Buy Agile Defense for $660M, Expanding AI and Cybersecurity Reach', 'Maximus'))).toBe(false)
    expect(isOtherDeal(row('Ørsted buys out partners in 172MW UK offshore wind farm', 'Ørsted'))).toBe(false)
    expect(isOtherDeal(row('Goldman Sachs Alternatives’ LRQA acquires supply chain auditor Omega Compliance', null))).toBe(false)
    expect(isOtherDeal(row('Hines buys retail portfolio in Dallas', 'Acme Capital'))).toBe(false)
  })

  it('stays out for lists, roundups, trackers, clearances and court stories', () => {
    expect(isOtherDeal(row('Healthcare & Life Sciences Private Equity Deal Tracker: 1315 Acquires Argonaut’s LSDx Division', '1315 Capital'))).toBe(false)
    expect(isOtherDeal(row('Deal Roundup: Trive Capital announces close of the sale of EarthLink, Shrieve acquires Research Solutions', 'Trive Capital'))).toBe(false)
    expect(isOtherDeal(row('European Commission clears Blue Capital’s acquisition of Mitie', 'Blue Capital'))).toBe(false)
    expect(isOtherDeal(row('7 Best Treasury ETFs to Buy Now', 'US News Capital'))).toBe(false)
  })

  it('leaves a row the classifier typed as a deal or a fund event to the rules it had', () => {
    expect(isOtherDeal(row('Kian Capital to acquire Integrity Landscape', 'Kian Capital', 'acquisition'))).toBe(false)
    expect(isOtherDeal(row('Kian Capital acquires stake', 'Kian Capital', 'fund_close'))).toBe(false)
  })
})
