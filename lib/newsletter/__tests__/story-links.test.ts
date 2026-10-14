import { describe, it, expect } from 'vitest'
import {
  clusterBy, dealStage, entityKey, entityMentioned, findPriorStory, fundStrategiesConflict, isDigest, isRoundup,
  keysMatch, sameStoryLoose, tellsAnItemOf, type StoryLike,
} from '../story-links'
import { isSameStory } from '@/lib/news/story-dedup'

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
  it('people: a report that names nobody and the one that names the hire (Barings, 2026-10-05)', () => {
    const nameless = story({ title: 'Barings expands private credit naming global head of asset-based finance', eventType: 'executive_hire', firmName: 'Barings', personTitle: 'Global Head of Asset-Based Finance', publishedDate: '2026-10-05' })
    const named = story({ title: 'Barings hires global head of ABF', eventType: 'executive_hire', firmName: 'Barings', personName: 'Sloan Sutta', personKeys: keys('Sloan Sutta'), personTitle: 'Global Head of Asset-Based Finance', publishedDate: '2026-10-05' })
    expect(sameStoryLoose(nameless, named)).toBe(true)
    expect(sameStoryLoose(nameless, named, { crossEdition: true })).toBe(true)
    // A week on, the same job filled again is another story.
    expect(sameStoryLoose(nameless, { ...named, publishedDate: '2026-10-12' }, { crossEdition: true })).toBe(false)
    // Another firm's head of ABF is another hire.
    expect(sameStoryLoose(nameless, { ...named, firmName: 'Ares', entityKeys: keys('Ares') })).toBe(false)
  })
  it('people: two hires at one firm on one day stay two (Blackstone, Millennium)', () => {
    const infra = story({ title: 'Blackstone poaches ex-InfraBridge co-head for London infra MD role', eventType: 'executive_hire', firmName: 'Blackstone', personTitle: 'Managing Director', publishedDate: '2026-09-28' })
    const baratta = story({ title: 'Blackstone’s private equity head Joseph Baratta to retire at end of year', eventType: 'executive_departure', firmName: 'Blackstone', personName: 'Joseph Baratta', personKeys: keys('Joseph Baratta'), personTitle: 'Head of Private Equity', publishedDate: '2026-09-28' })
    expect(sameStoryLoose(infra, baratta)).toBe(false)
    const adviser = story({ title: 'Millennium adds veteran fixed-income exec as senior adviser', eventType: 'executive_hire', firmName: 'Millennium', personTitle: 'Senior Adviser', publishedDate: '2026-10-05' })
    const trader = story({ title: 'Millennium taps Jera power trader', eventType: 'executive_hire', firmName: 'Millennium Management', personName: 'Matthias Soreau', personKeys: keys('Matthias Soreau'), personTitle: 'power trader', publishedDate: '2026-10-05' })
    expect(sameStoryLoose(adviser, trader)).toBe(false)
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
  it('people: the nameless report of a hire that ran yesterday with the name (VSS, 2026-10-01 and 10-02)', () => {
    const ran = story({ title: 'VSS Capital Partners hires ex-World Bank adviser Otilia Ciotau for AI role', eventType: 'executive_hire', firmName: 'VSS Capital Partners', personName: 'Otilia Ciotau', personKeys: keys('Otilia Ciotau'), personTitle: 'Managing Director, AI and Value Creation', publishedDate: '2026-10-01' })
    const again = story({ title: 'VSS hires for AI value creation', eventType: 'executive_hire', firmName: 'VSS', publishedDate: '2026-10-02' })
    expect(findPriorStory(again, [ran])).toBe(ran)
  })
  it('people: a bare surname yesterday, the full name today (Octagon, 2026-10-07 and 10-08)', () => {
    const ran = story({ title: 'Octagon Credit hires Antares exec Zilko to lead business development', eventType: 'executive_hire', firmName: 'Octagon Credit', personName: 'Zilko', personTitle: 'Head of Business Development', publishedDate: '2026-10-07' })
    const again = story({ title: 'Octagon hires Antares Capital’s John Zilko to lead investor relations and business development', eventType: 'executive_hire', firmName: 'Octagon Credit Investors', personName: 'John Zilko', personKeys: keys('John Zilko'), publishedDate: '2026-10-08' })
    expect(findPriorStory(again, [ran])).toBe(ran)
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

describe('deals with one party in common (2026-10-02…08 audit)', () => {
  const deal = (title: string, firmName: string, ks: string[], o: Partial<Omit<StoryLike, 'title' | 'eventType'>> = {}) =>
    story({ title, eventType: 'acquisition', firmName, entityKeys: keys(...ks), publishedDate: '2026-10-06', ...o })

  it('the same transaction told by the buyer’s name and by the target’s (Option Care, $5.8B)', () => {
    const a = deal('CD&R and McKesson ink $5.8bn take-private deal for Option Care Health', 'Clayton Dubilier & Rice', ['Clayton Dubilier & Rice', 'McKesson', 'Option Care Health'], { fundSizeUsdMillions: 5800 })
    const b = deal('4 Firms Advise On $5.8B Option Care Health Take-Private Deal', 'Option Care Health', ['Option Care Health'], { fundSizeUsdMillions: 5800 })
    expect(sameStoryLoose(a, b)).toBe(true)
    expect(sameStoryLoose(b, a, { crossEdition: true })).toBe(true)
  })
  it('the same transaction under rephrased headlines (UBS fund administration to Northern Trust)', () => {
    const a = deal('UBS to shed fund administration business acquired through Credit Suisse merger', 'UBS', ['UBS', 'Credit Suisse'])
    const b = deal('UBS to transfer Credit Suisse fund administration businesses to Northern Trust', 'Northern Trust', ['Northern Trust', 'UBS'])
    expect(sameStoryLoose(a, b)).toBe(true)
  })
  it('a headline that names only the buyer and describes the target (KKR / Gen II, 10-06 and 10-08)', () => {
    const named = deal('KKR Strikes Deal to Buy Private-Capital Fund Administrator Gen II', 'KKR', ['KKR', 'Gen II'], { publishedDate: '2026-10-06' })
    const sparse = deal('KKR (KKR) Acquires Fund Administrator To Add More Recurring Fee Income', 'KKR', ['KKR'], { publishedDate: '2026-10-07' })
    expect(sameStoryLoose(named, sparse, { crossEdition: true })).toBe(true)
    // …but not two days later than that, and not a different target.
    expect(sameStoryLoose(named, { ...sparse, publishedDate: '2026-10-12' }, { crossEdition: true })).toBe(false)
    const other = deal('KKR Acquires Infrastructure Services Platform Cisternina', 'KKR', ['KKR'], { publishedDate: '2026-10-07' })
    expect(sameStoryLoose(named, other, { crossEdition: true })).toBe(false)
  })
  it('does not join two of one sponsor’s deals, nor a wire that happens to carry the same figure', () => {
    const clarion = deal('Blackstone agrees $3.0bn sale of events business Clarion to Informa', 'Blackstone', ['Blackstone', 'Clarion', 'Informa'], { fundSizeUsdMillions: 3000 })
    const falcata = deal('Blackstone inks deal for TSC and ASEI to form defense platform Falcata', 'Blackstone', ['Blackstone', 'TSC', 'ASEI'], { fundSizeUsdMillions: 1000 })
    expect(sameStoryLoose(clarion, falcata)).toBe(false)
    // 10-02: "€2bn" Robin Radar and a wire whose first item, Blackstone's Eurowind, also came to $2.2bn.
    const robin = deal('CVC, Blackstone, Advent and EQT eye €2bn Robin Radar deal', 'Parcom', ['Parcom', 'CVC', 'Blackstone', 'Advent', 'EQT', 'Robin Radar Systems'], { fundSizeUsdMillions: 2200 })
    const wire = deal('Blackstone completes Eurowind deal, Searchlight backs $1.6bn Priority Technology take-private', 'Blackstone', ['Blackstone', 'Eurowind Energy', 'Searchlight', 'Priority Technology'], { fundSizeUsdMillions: 2200 })
    expect(sameStoryLoose(robin, wire, { crossEdition: true })).toBe(false)
    expect(sameStoryLoose(wire, robin, { crossEdition: true })).toBe(false)
  })
  it('counts the parties the same whichever story is asked about (HP Helicopters)', () => {
    const short = deal('Antin acquires majority stake in aerial firefighting firm HP Helicopters', 'Antin', ['Antin', 'HP Helicopters'], { publishedDate: '2026-10-01' })
    const long = deal('Antin NextGen Fund Acquired a Majority Stake in HP Helicopters', 'Antin Infrastructure Partners', ['Antin Infrastructure Partners', 'Antin NextGen Infrastructure Fund I', 'High Performance Helicopters'], { fundSizeUsdMillions: 1320, publishedDate: '2026-10-02' })
    expect(sameStoryLoose(short, long, { crossEdition: true })).toBe(true)
    expect(sameStoryLoose(long, short, { crossEdition: true })).toBe(true)
    expect(findPriorStory(long, [short])).toBe(short)
  })
})

describe('dealStage — rumours', () => {
  it('reads the words a rumour is told in', () => {
    for (const t of [
      'KKR, Blackstone among PE firms eyeing windscreen repair group Cary',
      'Sycamore nears $9bn sale of Boots to Weston family',
      'Elliott, Siris weigh $2bn-plus sale of Gigamon',
      'CVC, Blackstone, Advent and EQT eye €2bn Robin Radar deal',
      'Bain Capital explores potential investment in Hong Kong’s New World',
    ]) expect(dealStage(t), t).toBe(0)
    expect(dealStage('Sycamore Partners agrees $8.9bn Boots exit to Wittington Investments')).toBe(1)
  })
})

describe('a deal that has moved on is new', () => {
  it('a signed deal after the rumour: Sycamore / Boots (10-04, then 10-07 and 10-08)', () => {
    const nears = story({ title: 'Sycamore nears $9bn sale of Boots to Weston family', eventType: 'acquisition', firmName: 'Sycamore Partners', fundSizeUsdMillions: 9000, entityKeys: keys('Sycamore Partners', 'Boots', 'Weston family') })
    const agrees = story({ title: 'Sycamore Partners agrees $8.9bn Boots exit to Wittington Investments', eventType: 'acquisition', firmName: 'Sycamore Partners', fundSizeUsdMillions: 8900, entityKeys: keys('Sycamore Partners', 'Boots', 'Wittington Investments') })
    expect(sameStoryLoose(nears, agrees, { crossEdition: true })).toBe(true)
    expect(findPriorStory(agrees, [nears])).toBeNull()
    expect(findPriorStory(nears, [agrees])).toBe(agrees)
  })
})

describe('tellsAnItemOf — a wire’s items, not only its first', () => {
  const wire = story({ title: 'Deal Roundup: Warburg buys into Ares, LightBay-backed Awayday, Antin Infra invest in HP Helicopters', eventType: 'acquisition', firmName: 'Warburg Pincus', entityKeys: keys('Warburg Pincus', 'Ares', 'LightBay', 'Awayday') })
  it('a row about the last item silences the wire', () => {
    const hp = story({ title: 'Antin acquires majority stake in aerial firefighting firm HP Helicopters', eventType: 'acquisition', firmName: 'Antin', entityKeys: keys('Antin', 'HP Helicopters') })
    expect(sameStoryLoose(hp, wire)).toBe(false)
    expect(tellsAnItemOf(hp, wire)).toBe(true)
  })
  it('a row about another deal by a firm the wire names does not', () => {
    const other = story({ title: 'Warburg Pincus raises Ingenia bid again', eventType: 'acquisition', firmName: 'Warburg Pincus', entityKeys: keys('Warburg Pincus', 'Ingenia') })
    expect(tellsAnItemOf(other, wire)).toBe(false)
  })
  it('the Sojourner / LPNA wire (10-07) after the merger’s own story (10-06)', () => {
    const own = story({ title: 'Sojourner unveils $279m Lornamead-AMG Brands merger to form LPNA Group', eventType: 'acquisition', firmName: 'Sojourner Capital', fundSizeUsdMillions: 279, entityKeys: keys('Sojourner Capital', 'Lornamead', 'AMG Brands') })
    const w = story({ title: 'Sojourner aims to broaden personal care capabilities with LPNA merger; Main Capital, Gemspring, One Equity bet on cybersecurity', eventType: 'acquisition', firmName: 'Sojourner', entityKeys: keys('Sojourner', 'LPNA') })
    expect(tellsAnItemOf(own, w)).toBe(true)
  })
})

// The real rows behind each case, as rowToArticle reads them (2026-10-14 audit:
// a different story filed under another one never runs on its own).
describe('different stories by one firm stay apart (2026-10-14 audit)', () => {
  const tpgGpLed = story({ title: "LA pension among backers of TPG's second GP-led fund", eventType: 'capital_raise', firmName: 'TPG', entityKeys: ['tpg'], publishedDate: '2026-09-30' })
  const tpgClimate = story({ title: 'TPG Gets $10 Billion for Climate PE Fund; to Close for New Cash', eventType: 'capital_raise', firmName: 'TPG', fundName: 'TPG Climate PE Fund', fundSizeUsdMillions: 10000, closeType: 'hard_cap', entityKeys: ['tpg', 'tpg climate pe'], publishedDate: '2026-09-30' })
  const tpgHardCap = story({ title: 'TPG reportedly hits hard-cap for largest-ever PE climate fund', eventType: 'capital_raise', firmName: 'TPG', closeType: 'hard_cap', entityKeys: ['tpg'], publishedDate: '2026-10-01' })
  const tpgRise = story({ title: 'TPG raises $10bn for second climate private equity fund', eventType: 'fund_close', firmName: 'TPG', fundName: 'TPG Rise Climate II', fundSizeUsdMillions: 10000, closeType: 'final_close', entityKeys: ['tpg', 'tpg rise climate ii', 'new york city employees retirement system'], publishedDate: '2026-10-01' })

  it("TPG's GP-led fund is not its climate fund, on the same day", () => {
    expect(fundStrategiesConflict(tpgGpLed, tpgClimate)).toBe(true)
    expect(sameStoryLoose(tpgGpLed, tpgClimate)).toBe(false)
    expect(sameStoryLoose(tpgGpLed, tpgHardCap)).toBe(false)
  })
  it('the climate fund\'s own reports still cluster, and none of them pulls the GP-led fund in', () => {
    const same = (a: StoryLike, b: StoryLike) => isSameStory(a, b) || sameStoryLoose(a, b)
    const groups = clusterBy([tpgGpLed, tpgClimate, tpgHardCap, tpgRise], same, fundStrategiesConflict)
    expect(groups.map((g) => g.length).sort()).toEqual([1, 3])
    expect(groups.find((g) => g.length === 1)![0]).toBe(tpgGpLed)
  })
  it('clusterBy does not let a report that conflicts with nobody bridge two that conflict', () => {
    const vague = story({ title: 'TPG raises new fund', eventType: 'capital_raise', firmName: 'TPG', entityKeys: ['tpg'] })
    const same = () => true
    const groups = clusterBy([tpgGpLed, vague, tpgClimate], same, fundStrategiesConflict)
    expect(groups).toHaveLength(2)
  })
  it('a hard-cap report the next day is still a repeat of the climate close', () => {
    expect(findPriorStory(tpgHardCap, [tpgClimate])).toBe(tpgClimate)
  })

  it("Hamilton Lane's GP-led fund is not its telMAX financing two days earlier", () => {
    const telmax = story({ title: 'telMAX Secures $215 Million in Growth Financing from Hamilton Lane and PSIC', eventType: 'capital_raise', firmName: 'Hamilton Lane', entityKeys: ['hamilton lane', 'power sustainable infrastructure credit', 'palistar', 'midstar', 'telmax'] })
    const gpLed = story({ title: 'Hamilton Lane surpasses $430 million for debut GP-led fund', eventType: 'capital_raise', firmName: 'Hamilton Lane', fundSizeUsdMillions: 430, entityKeys: ['hamilton lane'] })
    expect(findPriorStory(gpLed, [telmax])).toBeNull()
  })
  it("Partners Group's new credit income fund is not its evergreen restructuring a week earlier", () => {
    const restructure = story({ title: 'Partners Group restructures €6.6bn evergreen fund after redemption cap', eventType: 'fund_close', firmName: 'Partners Group', fundName: 'Partners Group Global Value SICAV', fundSizeUsdMillions: 7260, entityKeys: ['partners group', 'value sicav'] })
    const launch = story({ title: 'Partners Group launches private credit income fund', eventType: 'fund_launch', firmName: 'Partners Group', closeType: 'launch', entityKeys: ['partners group'] })
    expect(findPriorStory(launch, [restructure])).toBeNull()
  })
  it('a launch and a commitment that share only the firm are two stories on one day', () => {
    const ohioFund = story({ title: 'The O.H.I.O. Fund is just two years old. It’s already raising a new fund.', eventType: 'fund_launch', firmName: 'The O.H.I.O. Fund', closeType: 'launch', entityKeys: ['ohio'] })
    const ohioPension = story({ title: 'Ohio Police & Fire Pension Fund allocates $100 million to open-end real estate fund', eventType: 'capital_raise', firmName: 'Ohio Police & Fire Pension Fund', fundSizeUsdMillions: 100, entityKeys: ['ohio police fire pension'] })
    expect(sameStoryLoose(ohioFund, ohioPension)).toBe(false)
    const natural = story({ title: 'Nuveen Natural Capital raises $100m for nature-based solutions fund', eventType: 'fund_launch', firmName: 'Nuveen Natural Capital', fundSizeUsdMillions: 100, entityKeys: ['nuveen natural'] })
    const debt = story({ title: 'CPPIB and Temasek re-invest with Nuveen for second Australian debt fund', eventType: 'capital_raise', firmName: 'Nuveen', entityKeys: ['nuveen', 'cppib', 'temasek'] })
    expect(sameStoryLoose(natural, debt)).toBe(false)
    const housing = story({ title: 'LGPS Central to launch social housing fund as part of enhanced strategy', eventType: 'fund_launch', firmName: 'LGPS Central', fundName: 'LGPS Central Social Housing Fund', closeType: 'launch', entityKeys: ['lgps central', 'lgps central social housing'] })
    const pool = story({ title: 'LGPS Central partner funds commit an additional £2bn to private markets', eventType: 'capital_raise', firmName: 'LGPS Central', fundSizeUsdMillions: 2475, entityKeys: ['lgps central'] })
    expect(sameStoryLoose(housing, pool)).toBe(false)
  })
  it('two Ares secondaries funds of different sizes are not one story for sharing "Ares raises … secondaries fund"', () => {
    const fundI = story({ title: 'Ares raises $1.15bn for PE secondaries Fund I', eventType: 'fund_close', firmName: 'Ares', fundName: 'PE secondaries Fund I', fundSizeUsdMillions: 1150, closeType: 'final_close' })
    const structured = story({ title: 'Ares raises $4.2bn for first structured solutions secondaries fund', eventType: 'fund_close', firmName: 'Ares', fundName: 'Ares Global Structured Solutions Fund', fundSizeUsdMillions: 4200, closeType: 'final_close' })
    expect(isSameStory(fundI, structured)).toBe(false)
  })
})

describe('one story told several ways still clusters (2026-10-14 audit)', () => {
  it('StepStone: "GP-led fund" and "PE secondaries fundraise" are one raise', () => {
    const a = story({ title: 'StepStone reaches over half of combined target for sixth flagship and GP-led fund', eventType: 'capital_raise', firmName: 'StepStone', entityKeys: ['stepstone'] })
    const b = story({ title: 'StepStone’s sixth PE secondaries fundraise passes halfway mark, as manager pursues $6bn target', eventType: 'capital_raise', firmName: 'StepStone Group', fundName: 'StepStone PE Secondaries Fund VI', fundSizeUsdMillions: 6000, closeType: 'target', entityKeys: ['stepstone', 'stepstone pe secondaries vi'] })
    expect(sameStoryLoose(a, b)).toBe(true)
  })
  it('Ares/Sabey: a company called "…Properties" is not a property fund', () => {
    const a = story({ title: 'Sabey Data Center Properties secures additional investment from Ares to support continued growth', eventType: 'capital_raise', firmName: 'Ares', entityKeys: ['ares', 'sabey data center properties'] })
    const b = story({ title: 'Ares secondaries arm boosts investment in Sabey Data Center Properties', eventType: 'capital_raise', firmName: 'Ares', fundName: 'Sabey Data Center Properties', entityKeys: ['ares', 'sabey data center properties'] })
    expect(fundStrategiesConflict(a, b)).toBe(false)
    expect(sameStoryLoose(a, b)).toBe(true)
  })
  it('CIP Fund VI: "renewable-energy" and "infrastructure" describe one fund', () => {
    const a = story({ title: 'Norges Bank Investment Management slates €1.2b for CIP’s sixth flagship renewable-energy fund', eventType: 'capital_raise', firmName: 'Copenhagen Infrastructure Partners', fundName: 'CI VI', fundSizeUsdMillions: 1300, entityKeys: ['copenhagen infrastructure', 'ci vi', 'norges bank'] })
    const b = story({ title: 'Norway wealth fund raises CIP commitment level by a third with €1.2bn Fund VI pledge', eventType: 'capital_raise', firmName: 'Norges Bank Investment Management', fundName: 'Copenhagen Infrastructure Partners Fund VI', fundSizeUsdMillions: 1320, entityKeys: ['norges bank', 'copenhagen infrastructure vi', 'copenhagen infrastructure'] })
    expect(fundStrategiesConflict(a, b)).toBe(false)
    expect(findPriorStory(b, [a])).toBe(a)
  })
  it('NVM and Naveli launches: the same kind of event on one day, however vaguely told', () => {
    const a = story({ title: 'NVM Ventures, a new multi-fund venture capital fund', eventType: 'fund_launch', firmName: 'NVM Ventures', entityKeys: ['nvm'] })
    const b = story({ title: 'NVM Ventures launches with €23.6M first close for dual-use startups', eventType: 'fund_launch', firmName: 'NVM Ventures', fundSizeUsdMillions: 26, closeType: 'first_close', entityKeys: ['nvm'] })
    expect(sameStoryLoose(a, b)).toBe(true)
    const c = story({ title: 'Navya Naveli Nanda Introduces Naveli Ventures To Invest In Deep-Tech, AI And Clean Energy', eventType: 'fund_launch', firmName: 'Naveli Ventures', closeType: 'launch', entityKeys: ['naveli'] })
    const d = story({ title: 'Navya Naveli Nanda’s venture to back deeptech, frontier tech ambitions', eventType: 'fund_launch', firmName: 'Naveli Ventures', closeType: 'launch', entityKeys: ['naveli'] })
    expect(sameStoryLoose(c, d)).toBe(true)
  })
})
