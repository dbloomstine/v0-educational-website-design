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
  it('regulatory: two write-ups of one announcement merge; two different proposals do not', () => {
    const a = story({ title: 'SEC proposes widening retail access to private markets', eventType: 'regulatory_action', firmName: 'U.S. Securities and Exchange Commission' })
    const b = story({ title: 'SEC opens door further to retail private credit push', eventType: 'regulatory_action' })
    const c = story({ title: 'SEC Prepares To Relax Fund Cross-Trading Limits', eventType: 'regulatory_action' })
    expect(sameStoryLoose(a, b)).toBe(true)
    expect(sameStoryLoose(a, c)).toBe(false)
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
    // One-story headlines with a semicolon from the hundred days to 2026-10-05.
    expect(isRoundup('InfraRed-Managed Funds Agreed to Acquire Hector Rail; HICL to Invest About £68 Million', ['InfraRed Capital Partners', 'Hector Rail AB', 'Ancala'], 'HedgeCo Insights')).toBe(false)
    expect(isRoundup('Sofia-based LAUNCHub Ventures secures €65 million first close of Fund III; targets €75 million+', ['LAUNCHub Ventures'], 'EU-Startups')).toBe(false)
    expect(isRoundup('Korea Growth Fund Selects 7 GPs Including STIC, Dominus, and Korea Investment Partners for Second Round; Targets $1.1 Billion Fundraising', ['Korea Growth Fund', 'STIC', 'Dominus', 'Korea Investment Partners'], 'finance.biggo.com')).toBe(false)
    expect(isRoundup('Korea Venture Investment Corp. Wins First Fund Management License in Singapore; K-Global Venture Fund to Launch in H2', ['Korea Venture Investment Corp.'], 'finance.biggo.com')).toBe(false)
    expect(isRoundup('StepStone raises $1.7 billion; its infrastructure fund is deployed across 26 deals', ['StepStone'], 'Stock Titan')).toBe(false)
    expect(isRoundup('CFTC Proposal Would Restore CPO and CTA Registration Exemptions for SEC-Registered Advisers; Comments Due October 5', ['CFTC', 'SEC'], 'JD Supra Securities Law')).toBe(false)
  })
  it('knows the columns that run several items under their own name (Field Notes, 2026-10-05)', () => {
    // The row that led the front page as a $707M fund launch: its second item opens with no party's name.
    expect(isRoundup('Field Notes: Farm Credit Canada eyes private capital partnerships for C$1bn fund; Permanent crops ‘abyss has a floor,’ says AgIS Capital', ['Farm Credit Canada', 'Mondelez Canada'], 'Agri Investor')).toBe(true)
    expect(isRoundup('Field Notes: Homestead holds first close on $350m debut credit fund; US farmland returns to positive territory in Q2', ['Homestead Capital'], 'Agri Investor')).toBe(true)
    // Items in lower case, items joined by commas, an item after "while": the label is the tell.
    expect(isRoundup('Loan Note: Fundraising data reveals strong institutional support; senior hire for Silver Point', ['Silver Point Capital'], 'pei-privatecredit.com')).toBe(true)
    expect(isRoundup('Term Sheet: Mubadala’s credit expansion; Deloitte’s debt predictions; Miami’s construction charge', ['Mubadala'], 'pei-privaterealestate.com')).toBe(true)
    expect(isRoundup('Blueprint: GPIF appoints real estate chief; our first-ever capital advisory ranking; REITs’ private funds push and more', ['GPIF'], 'PERE')).toBe(true)
    expect(isRoundup('Blueprint: BGO’s APAC ambition, UK build-to-rent momentum and more', ['BGO'], 'pei-privaterealestate.com')).toBe(true)
    expect(isRoundup('ABF Deal Digest: Bci closes US$65m NAV facility, while Blacktree launches SBA platform', ['Bci'], 'Structured Credit Investor')).toBe(true)
    expect(isRoundup('Deals in brief: Buddy Bites raises Series A funding, KCP reaches first close for two investment vehicles, Chandra Asri to acquire Cycle & Carriage businesses, and more', ['KCP'], 'KrASIA')).toBe(true)
  })
  it('does not take a lead-in, or a closing "and more", for a column', () => {
    expect(isRoundup('Investor Intentions: NYSTRS sets private equity pacing for 2027', ['NYSTRS'], 'Private Equity International')).toBe(false)
    expect(isRoundup('Real assets briefs: Ares, PSP Investments launch $2.4bn logistics JV', ['Ares', 'PSP Investments'], 'Alternatives Watch')).toBe(false)
    expect(isRoundup('A new era of data center infrastructure: The market has been attracting extraordinary investment; new research shows the momentum is durable', [], 'Institutional Real Estate, Inc.')).toBe(false)
    expect(isRoundup('Bain Capital Ventures closes on $1.6bn for Fund XI, targeting AI infrastructure and more', ['Bain Capital Ventures', 'Adams Street Partners'], 'Venture Capital Journal')).toBe(false)
    expect(isRoundup('Blueprint Equity Hires Nine Across Investing, Value Creation and AI', ['Blueprint Equity'], 'Private Equity Professional')).toBe(false)
  })
  it('reads every PE Hub headline with a semicolon as its wire, whatever names the classifier listed', () => {
    // Stored with a third firm's acquisition (Main Capital buying Qbees) as its summary: neither clause names it.
    const wire = 'Hg to debut in Greece with ERP and business software provider ES1; Elvaston makes first deal in Poland with warehouse management systems company'
    expect(isRoundup(wire, ['Main Capital Partners', 'Qbees'], 'PE Hub')).toBe(true)
    expect(isRoundup(wire, ['Main Capital Partners', 'Qbees'])).toBe(false) // …which is why the outlet is asked
    // A second item that names no party at all.
    expect(isRoundup('Alpine backs ‘large and growing’ UK hard facilities management market with Eight Group launch; Take-private deals in focus', ['Alpine Investors'], 'PE Hub')).toBe(true)
    expect(isRoundup('Music deals in focus after Pophouse acquires stake in Sia’s master music rights; Forward Consumer Partners featured in They Said It', ['Pophouse'], 'pehub.com')).toBe(true)
    // PE Hub's ordinary headlines are one story.
    expect(isRoundup('Frazier Healthcare to acquire health tech firm MatrixCare', ['Frazier Healthcare', 'MatrixCare'], 'PE Hub')).toBe(false)
    expect(isRoundup('Fusion Capital-backed Relevant Solutions acquires Conrad Kacsik Instrument Systems', ['Fusion Capital'], 'PE Hub')).toBe(false)
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

describe('same size, different fund', () => {
  it('does not merge two funds because both convert to about $55M and both "raise" a "first close"', () => {
    const connect = story({
      title: 'Connect Ventures raises $55 mn first close for $80 mn Fund V', eventType: 'fund_close',
      firmName: 'Connect Ventures', fundName: 'Connect Ventures Fund V', fundSizeUsdMillions: 55, closeType: 'first_close',
      entityKeys: keys('Connect Ventures', 'Connect Ventures Fund V'),
    })
    const iitm = story({
      title: 'IITM-backed deeptech fund raises Rs 453 cr in first close', eventType: 'fund_close',
      firmName: 'Unicorn India Ventures', fundName: 'IITM Unicorn Frontier Fund-I', fundSizeUsdMillions: 54, closeType: 'first_close',
      entityKeys: keys('Unicorn India Ventures', 'IITM Unicorn Frontier Fund-I'),
    })
    expect(sameStoryLoose(connect, iitm)).toBe(false)
    expect(sameStoryLoose(connect, iitm, { crossEdition: true })).toBe(false)
  })
  it('still merges one announcement reported under two differently-extracted firms', () => {
    const a = story({
      title: 'NYC pension chief proposes $5bn private markets climate investment expansion', eventType: 'fund_launch',
      firmName: 'NYC Retirement Systems', fundSizeUsdMillions: 5000, entityKeys: keys('NYC Retirement Systems'),
    })
    const b = story({
      title: 'NYC comptroller proposes $5bn private markets climate push', eventType: 'fund_launch',
      firmName: 'New York City Comptroller', fundSizeUsdMillions: 5000, entityKeys: keys('New York City Comptroller'),
    })
    expect(sameStoryLoose(a, b)).toBe(true)
  })
})
