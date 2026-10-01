import { describe, it, expect } from 'vitest'
import {
  clusterBy, dealStage, entityKey, entityMentioned, findPriorStory, isDigest, isRoundup,
  keysMatch, sameStoryLoose, type StoryLike,
} from '../story-links'

const story = (o: Partial<StoryLike> & { title: string; eventType: string }): StoryLike => ({
  firmName: null, fundName: null, fundSizeUsdMillions: null, closeType: null,
  entityKeys: [], personKeys: [], ...o,
  ...(o.entityKeys ? {} : { entityKeys: [o.firmName, o.fundName].filter(Boolean).map((n) => entityKey(n as string)) }),
})
const keys = (...names: string[]) => names.map((n) => entityKey(n))

describe('entity keys', () => {
  it('welds dotted initials so "H.I.G." meets "HIG"', () => {
    expect(entityKey('H.I.G. Capital')).toBe(entityKey('HIG Capital'))
  })
  it('prefix-matches a firm and its longer form, but not on a country or generic word', () => {
    expect(keysMatch(entityKey('Metrics'), entityKey('Metrics Credit Partners'))).toBe(true)
    expect(keysMatch(entityKey('Korea Venture Investment'), entityKey('Korea Exchange'))).toBe(false)
    expect(keysMatch('first', 'first reserve')).toBe(false)
  })
  it('only trusts an entity the story text names', () => {
    const title = 'IIT Madras, Unicorn India Ventures Announce Initial Funding'
    expect(entityMentioned('Unicorn India Ventures', title, null)).toBe(true)
    expect(entityMentioned('Morgan Stanley', title, null)).toBe(false)
  })
})

describe('sameStoryLoose — same edition', () => {
  it('fund: one first close under two extracted firm names (2026-09-27)', () => {
    const a = story({ title: 'IIT Madras, Unicorn India Ventures Mark First Close Of Fund I At ₹450 Cr', eventType: 'fund_close', firmName: 'IIT Madras', fundSizeUsdMillions: 54, closeType: 'first_close', entityKeys: keys('IIT Madras', 'Unicorn India Ventures') })
    const b = story({ title: 'IITM Unicorn Frontier Fund I hits Rs 450 Cr first close', eventType: 'fund_close', firmName: 'Indian Institute of Technology Madras', fundName: 'IITM Unicorn Frontier Fund I', fundSizeUsdMillions: 54, closeType: 'first_close', entityKeys: keys('Indian Institute of Technology Madras', 'IITM Unicorn Frontier Fund I', 'Unicorn India') })
    expect(sameStoryLoose(a, b)).toBe(true)
  })
  it('fund: a sized press release and an unsized report of the same close (Audax, 2026-10-01)', () => {
    const a = story({ title: 'Audax Private Debt Closes Largest Fund in Firm’s History, Raising $10 Billion in Investable Capital', eventType: 'fund_close', firmName: 'Audax Private Debt', fundSizeUsdMillions: 10000, closeType: 'final_close' })
    const b = story({ title: 'Audax Private Debt Raises Third Direct-Lending Fund', eventType: 'capital_raise', firmName: 'Audax Private Debt' })
    expect(sameStoryLoose(a, b)).toBe(true)
  })
  it('fund: two differently-sized vehicles from one firm stay separate', () => {
    const a = story({ title: 'Ares closes infrastructure fund at $5bn', eventType: 'fund_close', firmName: 'Ares', fundName: 'Ares Infrastructure Fund', fundSizeUsdMillions: 5000, closeType: 'final_close' })
    const b = story({ title: 'Ares closes credit fund at $2bn', eventType: 'fund_close', firmName: 'Ares', fundName: 'Ares Credit Fund', fundSizeUsdMillions: 2000, closeType: 'final_close' })
    expect(sameStoryLoose(a, b)).toBe(false)
  })
  it('regulatory: one action reported under the fund and under its trustee (Remara, 2026-09-23)', () => {
    const a = story({ title: 'ASIC halts three Remara private credit products', eventType: 'regulatory_action', firmName: 'Remara', fundName: 'Remara Cash Management Fund' })
    const b = story({ title: 'ASIC moves on Remara credit fund as it increases pressure on lenders', eventType: 'regulatory_action', firmName: 'Remara', fundName: 'Remara credit fund' })
    expect(sameStoryLoose(a, b)).toBe(true)
  })
  it('regulatory: two different SEC actions are not merged just because both name the SEC', () => {
    const a = story({ title: 'SEC Prepares To Relax Fund Cross-Trading Limits', eventType: 'regulatory_action', firmName: 'SEC' })
    const b = story({ title: 'SEC Alleges Ex-VC Assistant Took $1.3M From Funds', eventType: 'regulatory_action', firmName: 'SEC' })
    expect(sameStoryLoose(a, b)).toBe(false)
  })
  it('people: a shared full name, or the same surname at the same firm', () => {
    const a = story({ title: 'Three Weil partners join PE co-chief in defection to Paul Weiss', eventType: 'executive_change', firmName: 'Paul Weiss', personKeys: keys('Chris Machera') })
    const b = story({ title: 'Paul Weiss adds three Weil partners to private equity team', eventType: 'executive_hire', firmName: 'Paul Weiss', personKeys: keys('Timothy Burns', 'Noah Beck', 'Chris Machera') })
    expect(sameStoryLoose(a, b)).toBe(true)
    const c = story({ title: 'Blackstone Cements Shift From Star Dealmakers With Baratta Exit', eventType: 'executive_departure', firmName: 'Blackstone', personKeys: keys('Jon Baratta') })
    const d = story({ title: 'Blackstone’s Private Equity Chief Joe Baratta in Talks to Exit', eventType: 'executive_departure', firmName: 'Blackstone', personKeys: keys('Joe Baratta') })
    expect(sameStoryLoose(c, d)).toBe(true)
  })
  it('never links across families', () => {
    const a = story({ title: 'Bain Capital hires a partner', eventType: 'executive_hire', firmName: 'Bain Capital', entityKeys: keys('Bain Capital', 'Rentokil') })
    const b = story({ title: 'Bain Capital buys from Rentokil', eventType: 'acquisition', firmName: 'Bain Capital', entityKeys: keys('Bain Capital', 'Rentokil') })
    expect(sameStoryLoose(a, b)).toBe(false)
  })
})

describe('findPriorStory — across editions', () => {
  const bain = story({ title: 'Bain Capital agrees $230m purchase of SOLitude Lake Management from Rentokil', eventType: 'acquisition', firmName: 'Bain Capital', fundSizeUsdMillions: 230, entityKeys: keys('Bain Capital', 'SOLitude Lake Management', 'Rentokil') })

  it('deal: the same transaction under a punning headline four days later', () => {
    const again = story({ title: 'Bain Capital Takes SOLitude Independent', eventType: 'acquisition', firmName: 'Bain Capital', fundSizeUsdMillions: 230, entityKeys: keys('Bain Capital', 'SOLitude Lake Management', 'Rentokil Initial') })
    expect(findPriorStory(again, [bain])).toBe(bain)
  })
  it('deal: filed under the other party’s name', () => {
    const prior = story({ title: 'HIG Capital sells IT solutions provider GDT to Softcat for $1.05bn', eventType: 'acquisition', firmName: 'HIG Capital', entityKeys: keys('HIG Capital', 'GDT', 'Softcat') })
    const again = story({ title: 'Softcat Crosses the Atlantic with H.I.G.’s GDT', eventType: 'acquisition', firmName: 'Softcat', entityKeys: keys('Softcat', 'H.I.G. Capital', 'GDT') })
    expect(findPriorStory(again, [prior])).toBe(prior)
  })
  it('deal: two sponsors in common is not enough when the headlines are about different targets', () => {
    const prior = story({ title: 'Blackstone and Brookfield lead rival PE consortia in GFL takeover race', eventType: 'acquisition', firmName: 'Blackstone', entityKeys: keys('Blackstone', 'Brookfield', 'KKR', 'ECP') })
    const other = story({ title: 'DCC Energy shareholders approve £5.7bn takeover by KKR and ECP', eventType: 'acquisition', firmName: 'KKR', entityKeys: keys('DCC Energy', 'KKR', 'ECP') })
    expect(findPriorStory(other, [prior])).toBeNull()
  })
  it('deal: a rumour that becomes a signed deal runs again', () => {
    const rumour = story({ title: 'Greenbriar nears $1.8bn deal to acquire Spectrum Control from AEA Investors', eventType: 'acquisition', firmName: 'Greenbriar', entityKeys: keys('Greenbriar', 'Spectrum Control', 'AEA Investors') })
    const signed = story({ title: 'Greenbriar Agreed to Acquire Spectrum Control from AEA Investors', eventType: 'acquisition', firmName: 'Greenbriar', entityKeys: keys('Greenbriar', 'Spectrum Control', 'AEA Investors') })
    expect(dealStage(rumour.title)).toBe(0)
    expect(dealStage(signed.title)).toBe(1)
    expect(findPriorStory(signed, [rumour])).toBeNull()
    expect(findPriorStory(rumour, [signed])).toBe(signed)
  })
  it('fund: the same first close re-reported with a size the next day (Westwind)', () => {
    const prior = story({ title: 'Westwind Capital holds first close for European living fund', eventType: 'fund_close', firmName: 'Westwind Capital', fundName: 'Westwind European Living Fund', closeType: 'first_close' })
    const again = story({ title: 'Westwind Capital announces €200m first close', eventType: 'fund_close', firmName: 'Westwind Capital', fundSizeUsdMillions: 220, closeType: 'first_close' })
    expect(findPriorStory(again, [prior])).toBe(prior)
  })
  it('fund: a large firm’s unrelated launch later in the week is not a repeat', () => {
    const prior = story({ title: 'Blackstone launches first multi-asset private markets fund for non-US investors', eventType: 'fund_launch', firmName: 'Blackstone', fundName: 'Blackstone Private Markets Fund', closeType: 'launch' })
    const other = story({ title: 'Blackstone to launch investment platform for Nordics warehouses', eventType: 'fund_launch', firmName: 'Blackstone', closeType: 'launch' })
    expect(findPriorStory(other, [prior])).toBeNull()
  })
  it('fund: first close then final close of the same fund are two stories', () => {
    const first = story({ title: 'Acme holds $400m first close for Fund V', eventType: 'fund_close', firmName: 'Acme', fundName: 'Acme Fund V', fundSizeUsdMillions: 400, closeType: 'first_close' })
    const final = story({ title: 'Acme wraps Fund V at $900m hard cap', eventType: 'fund_close', firmName: 'Acme', fundName: 'Acme Fund V', fundSizeUsdMillions: 900, closeType: 'final_close' })
    expect(findPriorStory(final, [first])).toBeNull()
  })
})

describe('roundups and digests', () => {
  it('recognises a multi-story wire by a later clause that opens with another party', () => {
    expect(isRoundup('Riverside backs French medical device CDMO Medical Group; Mutares to acquire Steinmüller Engineering', ['Riverside', 'Medical Group', 'Mutares'])).toBe(true)
    expect(isRoundup('Deal Roundup: AAR strikes $4bn-EV deal for Bain-backed MRO; GTCR buys Tactacam')).toBe(true)
  })
  it('does not mistake a single story with a semicolon for a wire', () => {
    expect(isRoundup('TPG Gets $10 Billion for Climate PE Fund; to Close for New Cash', ['TPG'])).toBe(false)
    expect(isRoundup('IIT-M & Unicorn India hit ₹450 cr first close for its fund; Backs 4 deep-tech startups', ['IIT Madras', 'Unicorn India'])).toBe(false)
  })
  it('drops recurring columns', () => {
    expect(isDigest('The Secondary Brief / Friday, 18 September 2026: ECP files its third continuation fund')).toBe(true)
    expect(isDigest('On the Move: September 2026 Hires, Promotions, and New ACG Members')).toBe(true)
    expect(isDigest('Healthcare & Life Sciences Private Equity Deal Tracker: Providence Equity to Acquire CheckedUp')).toBe(true)
    expect(isDigest('KKR closes $6.6bn fund')).toBe(false)
  })
})

describe('clusterBy', () => {
  it('is transitive: A~B and B~C puts all three together', () => {
    const groups = clusterBy([1, 2, 3, 10], (a, b) => Math.abs(a - b) === 1)
    expect(groups.map((g) => g.sort())).toEqual([[1, 2, 3], [10]])
  })
})
