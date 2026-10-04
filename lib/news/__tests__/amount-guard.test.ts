import { describe, it, expect } from 'vitest'
import { figuresIn, foreignAmounts, isClean, stated, withOwnAmounts, type MoneyClaims } from '../amount-guard'

const read = (text: string) => figuresIn(text).map((f) => `${f.currency ?? '?'} ${+f.amountM.toFixed(4)}${f.unitless ? ' (no unit)' : ''}`)

describe('reading sums of money out of an article', () => {
  it('reads every way the trade press abbreviates a unit', () => {
    expect(read('Tanmia, FIM Partners Muscat launch $249mln Omani real estate fund')).toEqual(['USD 249'])
    expect(read('Arada to launch Arada Capital targeting $5bln in AUM')).toEqual(['USD 5000'])
    expect(read('GIC to plough US$30 bil more into hedge funds')).toEqual(['USD 30000'])
    expect(read('US firms eye $2.5tr fund finance opportunity')).toEqual(['USD 2500000'])
    expect(read('Investor coalition representing $100T in assets')).toEqual(['USD 100000000'])
    expect(read('~KRW 10T assets at exit')).toEqual(['KRW 10000000'])
    expect(read('salaries up to $225k')).toEqual(['USD 0.225'])
  })

  it('reads Indian units, in the singular and the plural', () => {
    expect(read('final close of performing credit fund at Rs. 1,200 crores')).toEqual(['INR 12000'])
    expect(read('Inflexor Ventures raises Rs 400 Cr as first close of Fund III')).toEqual(['INR 4000'])
    expect(read('first close of ₹1,250 Cr target')).toEqual(['INR 12500'])
  })

  it('reads a sum written out in full, and one whose unit the desk left off', () => {
    expect(read('SA-0730 Fund I discloses $261,344 venture capital raise')).toEqual(['USD 0.2613'])
    expect(read('average compensation of £503,000 in 2025')).toEqual(['GBP 0.503'])
    expect(read('raised $950,000,000 from pensions')).toEqual(['USD 950'])
    expect(read('Arlington Capital to take Gooch & Housego private in £345.6 deal')).toEqual(['GBP 345.6 (no unit)'])
  })

  it('reads a currency by its code, its sign, its name, or both a code and a sign', () => {
    expect(read('completes first close at CAD $100M (~USD $74M)')).toEqual(['CAD 100', 'USD 74'])
    expect(read('Blackbird raises AUD $1.05 billion for record venture fund')).toEqual(['AUD 1050'])
    expect(read('completed NT$270 million capital raise')).toEqual(['TWD 270'])
    expect(read('launch 1 trillion-won secondary fund')).toEqual(['KRW 1000000'])
    expect(read('CFM raises over USD 180m at first close')).toEqual(['USD 180'])
  })

  it('keeps a sum in a currency it cannot name, without guessing which', () => {
    expect(read("Kenyan pension funds back Kuramo's Sh64.5bn fundraising")).toEqual(['? 64500'])
    expect(read('raised 500 million from investors')).toEqual(['? 500'])
  })

  it('reads sums written in words', () => {
    expect(read('Hedge Fund Trader Kassam Readies a Billion-Dollar Millennium Cub')).toEqual(['USD 1000'])
    expect(read('Four trillion reasons your admin had a good year')).toEqual(['? 4000000'])
    expect(read('a sale that could value the business at several billion dollars')).toEqual([])
  })

  it('reads both ends of a range, whichever way it is written', () => {
    expect(read('PAG Lines Up A $4-5 Billion Asia Buyout Fund')).toEqual(['USD 4000', 'USD 5000'])
    expect(read('the $100–200bn climate funding gap')).toEqual(['USD 100000', 'USD 200000'])
    expect(read('reducing costs from ~$5M to $30-40K')).toEqual(['USD 5', 'USD 0.03', 'USD 0.04'])
    expect(read('With Room for $2 Billion to $3 Billion')).toEqual(['USD 2000', 'USD 3000'])
    const [lo, hi] = figuresIn('targets $200m–$300m')
    expect([lo.to, hi.to]).toEqual([300, 200])
  })

  it('does not take for money what is not', () => {
    expect(read('Techshop closes first close for AI B2B venture fund')).toEqual([])
    expect(read('Hedge fund assets surged in Q2 to $5.6tn')).toEqual(['USD 5600000'])
    expect(read('a 500m sprint to the 2026 close, Fund 3 of 4')).toEqual([])
    expect(read('Bending Spoons surges 40% on first day of trading')).toEqual([])
  })
})

describe('is this sum one the article gives?', () => {
  const own = (text: string) => figuresIn(text)

  it('the same sum, however each side rounds or writes it', () => {
    expect(stated(own('raises $2.92 billion'), { currency: 'USD', amountM: 2900 })).toBe(true)
    expect(stated(own('raises $2.92 billion'), { currency: 'USD', amountM: 3200 })).toBe(false)
    expect(stated(own('in £345.6 deal'), { currency: 'GBP', amountM: 345.6 })).toBe(true)
    expect(stated(own('Completes $84,510 Venture Capital Fundraising'), { currency: 'USD', amountM: 0.08 })).toBe(true)
  })

  it('a plausible conversion, and not an implausible one', () => {
    expect(stated(own('Charterhouse raises €1bn first close'), { currency: 'USD', amountM: 1100 })).toBe(true)
    expect(stated(own('Charterhouse raises €1bn first close'), { currency: 'USD', amountM: 1640 })).toBe(false)
    expect(stated(own('raises Rs 400 Cr'), { currency: 'USD', amountM: 48 })).toBe(true)
  })

  it('"$" in a local outlet is the local dollar', () => {
    expect(stated(own('Blackbird closes record $1.05bn VC fund'), { currency: 'AUD', amountM: 1050 })).toBe(true)
    expect(stated(own('Blackbird closes record €1.05bn VC fund'), { currency: 'AUD', amountM: 1050 })).toBe(false)
  })

  it('anything inside a range the article gives', () => {
    expect(stated(own('Lines Up A $4-5 Billion Asia Buyout Fund'), { currency: 'USD', amountM: 4500 })).toBe(true)
    expect(stated(own('targets $200m–$300m'), { currency: 'USD', amountM: 250 })).toBe(true)
    expect(stated(own('targets $200m–$300m'), { currency: 'USD', amountM: 400 })).toBe(false)
  })
})

describe('sums a classification states that its article does not give', () => {
  // The row that showed the bug, as it was stored on 2026-10-01.
  const acuon = {
    title: 'EQT Agreed to Sell Korea’s Acuon Group to a Hanwha Life-Led Consortium:',
    description: 'EQT has agreed to sell Acuon Group, with about KRW 10 trillion of assets, to a consortium led by Hanwha Life. Financial terms were not disclosed.',
  }
  it('a size and a summary figure from the article classified beside it', () => {
    const f = foreignAmounts(acuon, {
      summary_ai: "EQT BPEA Fund VII exits Korea's Acuon Group to Hanwha Life-led consortium; deal valued at $2.92B enterprise value, ~KRW 10T assets at exit.",
      fund_size_usd_millions: 2920, original_currency: null, original_amount_millions: null,
    })
    expect(f.size).toBe(true)
    expect(f.summary.map((m) => `${m.currency} ${m.amountM}`)).toEqual(['USD 2920']) // KRW 10T is the article's own
  })
  it('a figure from a different deal in an otherwise sound summary', () => {
    const f = foreignAmounts(
      { title: 'KKR to acquire A1 Garage Door Service for around $2bn', description: 'KKR has agreed to acquire A1 Garage Door Service in a transaction valued at around $2bn. It operates across approximately 20 states.' },
      { summary_ai: 'KKR agreed to acquire A1 Garage Door Service (~$2bn valuation); company operates across ~20 US states, ~$100m+ EBITDA.', fund_size_usd_millions: 2000 },
    )
    expect(f.size).toBe(false)
    expect(f.summary.map((m) => m.amountM)).toEqual([100])
  })

  const clean = (article: { title: string; description?: string }, claims: Parameters<typeof foreignAmounts>[1]) => expect(isClean(foreignAmounts(article, claims))).toBe(true)
  it('nothing, when the classification only restates, converts or rounds what the article says', () => {
    clean({ title: 'Ares Blows Past Target to Raise $4.2 Billion for Structured Fund' }, { summary_ai: 'Ares closed its fund at $4.2B.', fund_size_usd_millions: 4200 })
    clean({ title: 'Azora closes largest-ever Southern Europe fund on €2.1bn' }, { summary_ai: 'Azora closed at €2.1bn (~$2.3bn).', fund_size_usd_millions: 2310, original_currency: 'EUR', original_amount_millions: 2100 })
    clean({ title: 'FORUM STUDENT LIVING FUND I COMPLETES FIRST CLOSE AT C$100M IN ASSETS' }, { summary_ai: 'Forum Student Living Fund I completes first close at CAD $100M (~USD $74M).', fund_size_usd_millions: 74, original_currency: 'CAD', original_amount_millions: 100 })
    clean({ title: 'Blackbird closes record $1.05bn VC fund with super fund backing' }, { summary_ai: 'Blackbird closed record A$1.05B VC fund.', fund_size_usd_millions: 700, original_currency: 'AUD', original_amount_millions: 1050 })
    clean({ title: 'Sundaram Alternates announces final close of performing credit fund at Rs. 1,200 crores' }, { summary_ai: 'Final close at Rs. 1,200 crores (~$145M).', fund_size_usd_millions: 145, original_currency: 'INR', original_amount_millions: 1200 })
    clean({ title: 'GO-0616 Fund I Completes $84,510 Venture Capital Fundraising' }, { summary_ai: 'GO-0616 Fund I closes $85K venture capital fundraising.', fund_size_usd_millions: 0.08 })
  })
  it('nothing, when the currency cannot be named or the classifier got its unit wrong', () => {
    clean({ title: "Kenyan pension funds back Kuramo's Sh64.5bn fundraising" }, { summary_ai: "Kenyan pension funds commit Sh64.5bn (~$500M USD) to Kuramo's fundraising.", fund_size_usd_millions: 500, original_currency: 'KES', original_amount_millions: 64.5 })
    // The rupee sign lost in the feed ("?11,000 Crore"), and crores given as millions.
    clean({ title: 'Permira Filed to Buy a 25.71% Stake in Cloudnine’s Parent at About ?11,000 Crore:' }, { summary_ai: 'Permira filed to acquire a 25.71% stake at approximately ₹11,000 crore valuation.', fund_size_usd_millions: 1320, original_currency: 'INR', original_amount_millions: 11000 })
  })
  it('a dollar value for a sum in a currency it cannot convert is not called foreign; one for a sum with no currency at all still is', () => {
    // Ringgit: the classifier converted and left the original currency out.
    clean({ title: 'Malaysian manager closes RM1.2bn buyout fund' }, { summary_ai: 'The manager closed its fund at RM1.2bn (about $270M).', fund_size_usd_millions: 270 })
    // No currency in the article at all: the number itself must match.
    expect(foreignAmounts({ title: 'Manager raised 500 million for its fund' }, { summary_ai: 'The manager raised 500 million.', fund_size_usd_millions: 500 }).size).toBe(false)
    expect(foreignAmounts({ title: 'Manager raised 500 million for its fund' }, { summary_ai: 'The manager raised 500 million.', fund_size_usd_millions: 270 }).size).toBe(true)
  })
  it('nothing, for plain arithmetic on what the article says', () => {
    clean({ title: 'Sagard reaches half its $2bn target in first close on third vintage' }, { summary_ai: 'Sagard Credit Partners III hits $1bn at first close, 50% of its $2bn target.', fund_size_usd_millions: 1000 })
    clean({ title: 'This firm just raised one of the largest AI funds at $49 billion, topping its target', description: 'MGX closed at $49 billion against a $45 billion target.' }, { summary_ai: 'MGX closed MGX Fund 1 at $49B, $4B above its $45B target.', fund_size_usd_millions: 49000 })
    clean({ title: 'Capula Opened a Quant Commodities Book With Room for $2 Billion to $3 Billion:' }, { summary_ai: 'Capula launched a quant commodities book with capacity for $2–3 billion.', fund_size_usd_millions: 2500 })
  })
  it('a size the article does not give, worked out or added up by the model', () => {
    expect(foreignAmounts({ title: 'Blue Sea Capital launches a fourth fund, eyeing a smaller target', description: 'The target is about 8% smaller than the third fund’s $600m initial target.' }, { summary_ai: 'Fund IV target of approximately $552M.', fund_size_usd_millions: 552 }).size).toBe(true)
    expect(foreignAmounts({ title: 'Azalea Raised More Than US$1 Billion Across Three PE Vehicles', description: 'Fund III closed at $526M, Co-Invest Fund II at $210M, and All Access launched with $350M.' }, { summary_ai: 'Total commitments exceeded $1B.', fund_size_usd_millions: 1076 }).size).toBe(true)
  })
  it('a target from another outlet’s report of the same fund, even when it is close to the size in dollars', () => {
    // €65M is about $71.5M; €75M is not "the size again", it is a figure this article does not give.
    const f = foreignAmounts(
      { title: 'LAUNCHub lands €65M first close for CEE-focused Fund III', description: 'LAUNCHub lands €65M first close for CEE-focused Fund III Dealroom' },
      { summary_ai: 'LAUNCHub lands €65M first close for CEE-focused Fund III, targeting €75M+.', fund_size_usd_millions: 71.5, original_currency: 'EUR', original_amount_millions: 65 },
    )
    expect(f.summary.map((m) => `${m.currency} ${m.amountM}`)).toEqual(['EUR 75'])
    // …while the size given again in dollars is not foreign.
    clean({ title: 'LAUNCHub lands €65M first close for CEE-focused Fund III' }, { summary_ai: 'LAUNCHub held a €65M (~$71M) first close.', fund_size_usd_millions: 71.5, original_currency: 'EUR', original_amount_millions: 65 })
  })
  it('a classification with no money in it at all', () => {
    clean({ title: 'Hines promotes Adam Hines to co-CEO' }, { summary_ai: 'Hines promoted Adam Hines to co-CEO.', fund_size_usd_millions: null })
  })
})

describe('in the pipeline: a foreign sum sends the article back to be classified alone', () => {
  const article = { title: 'EQT Agreed to Sell Korea’s Acuon Group to a Hanwha Life-Led Consortium:', description: 'Financial terms were not disclosed.' }
  type Answer = MoneyClaims & { firm_name: string; article_type: string; relevance_score: number }
  const kind = { firm_name: 'EQT', article_type: 'acquisition', relevance_score: 0.8 }
  const borrowed: Answer = { ...kind, summary_ai: 'EQT exits Acuon Group; deal valued at $2.92B enterprise value.', fund_size_usd_millions: 2920, original_currency: null, original_amount_millions: null }
  const alone: Answer = { ...kind, summary_ai: 'EQT agreed to sell Acuon Group to a Hanwha Life-led consortium; terms not disclosed.', fund_size_usd_millions: null, original_currency: null, original_amount_millions: null }

  it('a clean answer is stored as it is, and nothing more is asked', async () => {
    let asks = 0
    const r = await withOwnAmounts(article, alone, async () => { asks++; return alone })
    expect([r.result, r.asked, asks]).toEqual([alone, false, 0])
  })
  it('a neighbour’s figure: the summary written alone replaces the batch’s, and the size goes', async () => {
    const r = await withOwnAmounts(article, borrowed, async () => alone)
    expect(r).toMatchObject({ asked: true, sizeDropped: true, why: 'size 2920, USD 2.92bn' })
    expect(r.result).toEqual({ ...borrowed, summary_ai: alone.summary_ai, fund_size_usd_millions: null, original_currency: null, original_amount_millions: null })
  })
  it('only what was wrong is replaced: the batch’s type, relevance and names stay, even if the article read alone looks like nothing', async () => {
    // Replayed 2026-10-04: a fund launch four outlets reported came back alone as "other, relevance 0".
    const tether = { title: 'Tether and Fasanara Capital Launch $400 Million Private Credit Fund to Expand Stablecoin-Enabled Real-Economy Lending' }
    const batch: Answer = { firm_name: 'Fasanara Capital', article_type: 'fund_launch', relevance_score: 0.75, summary_ai: 'Tether and Fasanara Capital launch $400M stablecoin-enabled private credit fund targeting $3B.', fund_size_usd_millions: 400 }
    const solo: Answer = { firm_name: 'Tether', article_type: 'other', relevance_score: 0, summary_ai: 'Tether and Fasanara Capital announce a $400M private credit fund using stablecoin-enabled lending.', fund_size_usd_millions: null }
    const r = await withOwnAmounts(tether, batch, async () => solo)
    expect(r.result).toEqual({ ...batch, summary_ai: solo.summary_ai }) // the $3B target was another outlet's; the $400M size is its own and stays
    expect(r).toMatchObject({ asked: true, sizeDropped: false, why: 'USD 3bn' })
  })
  it('a size the article does give replaces a foreign one', async () => {
    const aum = { title: 'Aum Ventures raises Rs 225 Cr first close for new deeptech fund' }
    const batch: Answer = { ...kind, summary_ai: 'Aum Ventures achieves first close of Rs 225 Cr.', fund_size_usd_millions: 90, original_currency: 'INR', original_amount_millions: 7500 } // the sibling article's Rs 750 Cr target
    const solo: Answer = { ...kind, summary_ai: 'Aum Ventures holds a Rs 225 Cr first close.', fund_size_usd_millions: 27, original_currency: 'INR', original_amount_millions: 2250 }
    const r = await withOwnAmounts(aum, batch, async () => solo)
    expect(r.result).toMatchObject({ summary_ai: batch.summary_ai, fund_size_usd_millions: 27, original_currency: 'INR', original_amount_millions: 2250 })
    expect(r.sizeDropped).toBe(false)
  })
  it('a size the article still does not give, even alone, is dropped', async () => {
    const guess: Answer = { ...alone, summary_ai: 'EQT exits Acuon at an estimated $300M.', fund_size_usd_millions: 300 }
    const r = await withOwnAmounts(article, borrowed, async () => guess)
    expect(r.sizeDropped).toBe(true)
    expect(r.result).toMatchObject({ fund_size_usd_millions: null, summary_ai: guess.summary_ai }) // the summary written alone is the model's reading of its own article
  })
  it('no answer alone: nothing is stored this time', async () => {
    expect(await withOwnAmounts(article, borrowed, async () => null)).toMatchObject({ result: null, asked: true })
    expect(await withOwnAmounts(article, borrowed, async () => ({ ...alone, summary_ai: '' }))).toMatchObject({ result: null, asked: true })
  })
  it('if the check itself cannot be made, the answer stands as it came and nothing is asked', async () => {
    const broken = { get title(): string { throw new Error('unreadable') }, description: null }
    let asks = 0
    const r = await withOwnAmounts(broken, borrowed, async () => { asks++; return alone })
    expect([r.result, r.asked, asks]).toEqual([borrowed, false, 0])
  })
  it('an API failure while asking alone is the caller’s to handle', async () => {
    await expect(withOwnAmounts(article, borrowed, async () => { throw new Error('Claude API 529') })).rejects.toThrow('529')
  })
})
