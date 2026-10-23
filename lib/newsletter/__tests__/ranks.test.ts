import { describe, it, expect } from 'vitest'
import {
  pickRanks, closeRow, dealRow, hireRow, seniority, isWellKnownFirm, firmWords, rankHref,
  CLOSE_FLOOR_USD_M, DEAL_FLOOR_USD_M, MAX_RANK_ROWS, MAX_HIRE_ROWS,
} from '../ranks'
import { renderNewsletterEmail, renderRanks, storyHref } from '../email-template'
import { renderNewsletterText, ranksText } from '../email-text'
import { arrangeEdition } from '../top-stories'
import { entityKey } from '../story-links'
import type { ArticleGroup, NewsletterArticle } from '../query-articles'

let seq = 0
function article(o: Partial<NewsletterArticle> & { title: string }): NewsletterArticle {
  seq++
  const id = `${seq.toString(16).padStart(8, '0')}-0000-4000-8000-000000000000`
  const keys = [o.firmName, o.fundName].filter(Boolean).map((n) => entityKey(n))
  return {
    id, sourceUrl: `https://example.com/${seq}`, sourceName: 'PE Hub', publishedDate: '2026-10-22', articleType: 'fund_close',
    eventType: 'fund_close', fundCategories: [], isHighSignal: true, relevanceScore: 0.7, tldr: null,
    firmName: null, firmDomain: null, fundName: null, fundSizeUsdMillions: null, fundStrategy: null, geography: [], personName: null,
    personTitle: null, closeType: null, coFirms: [], alsoCoveredBy: [], headlineEntities: [], entityKeys: keys, personKeys: [],
    leadEligible: true, ...o,
  }
}
const group = (category: string, label: string, articles: NewsletterArticle[]): ArticleGroup => ({ category, label, articles })
const close = (firm: string, fund: string | null, size: number, title: string, o: Partial<NewsletterArticle> = {}) =>
  article({ title, firmName: firm, fundName: fund, fundSizeUsdMillions: size, closeType: 'final_close', ...o })
const deal = (firm: string, size: number, title: string, o: Partial<NewsletterArticle> = {}) =>
  article({ title, firmName: firm, fundSizeUsdMillions: size, eventType: 'acquisition', articleType: 'acquisition', ...o })
const hire = (firm: string, person: string | null, job: string | null, title: string, o: Partial<NewsletterArticle> = {}) =>
  article({ title, firmName: firm, personName: person, personTitle: job, eventType: 'executive_hire', articleType: 'executive_hire', ...o })

describe('Fund closes $500M+', () => {
  it('takes a final, first or interim close at or above the floor, and nothing under it', () => {
    expect(CLOSE_FLOOR_USD_M).toBe(500)
    expect(closeRow(close('Monomoy Capital Partners', 'Monomoy Family Fund I', 500, 'Monomoy closes Family Fund I at $500m'), 'PE')).not.toBeNull()
    expect(closeRow(close('Monomoy Capital Partners', 'Monomoy Family Fund I', 499, 'Monomoy closes Family Fund I at $499m'), 'PE')).toBeNull()
    expect(closeRow(close('Hg', 'Hg Secondary Fund I', 1100, 'Hg Hits 1 Billion Euro First Close for Debut Secondary Fund', { closeType: 'first_close' }), 'secondaries')?.detail).toBe('Secondary Fund I · First close')
    expect(closeRow(close('Sosteneo SGR S.p.A', 'Sosteneo Clean Energy Infrastructure Fund II', 504, 'Sosteneo raises €450m for clean-energy fund', { closeType: 'interim_close' }), 'infrastructure')?.detail).toBe('Clean Energy Infrastructure Fund II · Interim close')
  })

  it('leaves out what the league table would not rank, and what is not called a fund', () => {
    const no = (a: NewsletterArticle, cat = 'PE') => expect(closeRow(a, cat)).toBeNull()
    no(close('Audax Private Equity', 'Audax Private Equity Fund VIII', 6250, 'Audax sets $6.25bn target for latest flagship fund', { closeType: 'target' }))
    no(close('Alpha Alternatives', 'Alpha India fund', 600, 'Alpha Alternatives’ India-focused fund approaches $600m final close'), 'infrastructure')
    no(close('EnCap Investments LP', null, 3500, 'Kirkland-Led EnCap Clinches $3.5B Continuation Vehicle'), 'secondaries')
    no(close('Partners Group', null, 510, 'Partners Group closes $510m rated feeder for evergreen credit strategy'), 'credit')
    no(close('Sequoia', null, 1000, 'Sequoia alumnus closes $1 billion tech hedge fund'), 'hedge')
    no(close('Dwight Capital', null, 624, 'Dwight Capital and Dwight Investment Management Close $624MM in September 2026'), 'credit')
    // A manager's assets, not the fund (no fund named, over the sanity ceiling).
    no(close('Big Manager', null, 45_000, 'Big Manager closes flagship fund'))
    // A deal is never a close, whatever its stage field says.
    no(close('KKR', 'KKR Fund', 2000, 'KKR closes $2bn fund'), 'deals')
  })

  it('ranks by size, largest first, and names the fund without the manager in front of it', () => {
    const lists = pickRanks([
      group('PE', 'Private Equity', [
        close('FFL Partners', 'FFL Capital Partners VI', 1350, 'FFL Partners scores $1.35bn for its sixth Capital Partners fund'),
        close('Ara Partners', 'Ara Energy Fund I', 2500, 'Ara Partners closes inaugural energy fund at $2.5bn hard cap', { closeType: 'hard_cap' }),
      ]),
      group('secondaries', 'Secondaries & GP Stakes', [
        close('Pantheon', 'Pantheon Global Secondaries Fund VIII', 6000, 'Pantheon has closed its eighth secondaries fund on $6bn'),
      ]),
    ])
    expect(lists.map((l) => l.key)).toEqual(['closes'])
    expect(lists[0].rows.map((r) => [r.lead, r.detail, r.sizeUsdM])).toEqual([
      ['Pantheon', 'Global Secondaries Fund VIII · Final close', 6000],
      ['Ara Partners', 'Energy Fund I · Final close', 2500],
      ['FFL Partners', 'FFL Capital Partners VI · Final close', 1350],
    ])
  })

  it('marks a figure the reports gave in another currency', () => {
    expect(closeRow(close('Sprints', null, 797, 'Sprints closes €725m fifth fund at hard cap', { closeType: 'hard_cap' }), 'PE')?.converted).toBe(true)
    expect(closeRow(close('Northwind Group', 'Northwind Debt Fund III', 1000, 'Northwind Group Closes $1B Debt Fund'), 'credit')?.converted).toBe(false)
  })
})

describe('Deals $1B+', () => {
  it('takes a deal from the Deals section at or above the floor whose figure the headline states', () => {
    expect(DEAL_FLOOR_USD_M).toBe(1000)
    expect(dealRow(deal('Stonepeak', 1000, 'Stonepeak completes $1bn acquisition of Chicago Parking Meters'), 'deals')).not.toBeNull()
    expect(dealRow(deal('Stonepeak', 999, 'Stonepeak completes $999m acquisition of Chicago Parking Meters'), 'deals')).toBeNull()
    expect(dealRow(deal('Stonepeak', 2500, 'Stonepeak completes $2.5bn acquisition of Chicago Parking Meters'), 'PE')).toBeNull()
  })

  it('leaves out rumours, talks and explorations', () => {
    for (const title of [
      'LSEG Is in Discussions With Permira to Acquire Octus for About $3.5 Billion',
      'SoftBank Was Reported to Be in Early Talks to Acquire Allied Universal for $18 billion',
      'CVC explores Verisure take-private one year after €13.7bn IPO',
      'Centerbridge and Mubadala near £1bn Canaccord Wealth deal',
      'Elliott, Siris weigh $2bn-plus sale of Gigamon',
    ]) {
      expect(dealRow(deal('X', 3500, title), 'deals')).toBeNull()
    }
  })

  it('leaves out a deal whose stored size is not the figure its headline states', () => {
    // 2026-10-21: stored at $1B, headline says about $3.4 billion.
    expect(dealRow(deal('American Industrial Partners', 1000, 'Silgan and American Industrial Partners Agreed to Acquire Trivium Packaging at an About $3.4 Billion Enterprise Value'), 'deals')).toBeNull()
  })

  it('reads the figure from the summary only when the headline states none', () => {
    const fromSummary = deal('IFM Investors', 13000, 'IFM Investors snaps up majority stake in U.K.’s largest ports group', { tldr: 'IFM Investors agreed to buy a majority stake in Associated British Ports in a deal valuing it at about $13 billion.' })
    expect(dealRow(fromSummary, 'deals')?.sizeUsdM).toBe(13000)
    expect(dealRow({ ...fromSummary, tldr: 'IFM Investors agreed to buy a majority stake in Associated British Ports.' }, 'deals')).toBeNull()
  })

  it('never ranks a multi-story wire', () => {
    expect(dealRow(deal('One Equity Partners', 1725, 'Deal Roundup: One Equity Partners strikes $1.725bn Nexora deal, TA exits Rocscience', { leadEligible: false }), 'deals')).toBeNull()
  })

  it('ranks by size and stops at the cap', () => {
    const deals = [1500, 9600, 2500, 7700, 3500, 6200, 1200].map((m, i) => deal(`Buyer ${i}`, m, `Buyer ${i} completes $${m}m acquisition of Target ${i}`))
    const [list] = pickRanks([group('deals', 'Deals', deals)])
    expect(list.key).toBe('deals')
    expect(list.rows.map((r) => r.sizeUsdM)).toEqual([9600, 7700, 6200, 3500, 2500])
    expect(list.rows).toHaveLength(MAX_RANK_ROWS)
    expect(list.rows[0].isHeadline).toBe(true)
  })
})

describe('Notable hires', () => {
  it('reads seniority from the job, else the headline; a vice president is not the president', () => {
    expect(seniority({ personTitle: 'co-CEO', title: '' })).toBe(2)
    expect(seniority({ personTitle: 'Chief Investment Officer', title: '' })).toBe(2)
    expect(seniority({ personTitle: 'Head of Credit Fundraising', title: '' })).toBe(1)
    expect(seniority({ personTitle: 'Partner', title: '' })).toBe(1)
    expect(seniority({ personTitle: 'Senior Vice President of Consultant Relations', title: '' })).toBe(0)
    expect(seniority({ personTitle: 'Senior Portfolio Manager', title: '' })).toBe(0)
    expect(seniority({ personTitle: 'Operating Partner', title: '' })).toBe(0)
    expect(seniority({ personTitle: null, title: 'LaSalle names Brookfield exec to lead $10bn indirect platform' })).toBe(1)
  })

  it('knows the well-known firms by their key, and no firm that only starts like one', () => {
    expect(isWellKnownFirm('Blackstone')).toBe(true)
    expect(isWellKnownFirm('Blackstone Credit')).toBe(true)
    expect(isWellKnownFirm('M&G Investments')).toBe(true)
    expect(isWellKnownFirm('Balyasny Asset Management')).toBe(true)
    expect(isWellKnownFirm('Apterra Infrastructure Capital')).toBe(false)
    expect(isWellKnownFirm('Manning & Napier')).toBe(false)
    expect(isWellKnownFirm(null)).toBe(false)
  })

  it('takes a senior hire at a well-known firm, or one three outlets reported', () => {
    expect(hireRow(hire('Macquarie', 'Linso Pals', 'Head of Credit Fundraising', 'Macquarie hires Linso Pals from Blackstone to lead credit fundraising'), 'people_moves')?.detail).toBe('Linso Pals, Head of Credit Fundraising')
    const small = hire('Njord Partners', 'Kirsty Acton', 'Head of Capital Formation', 'Njord Partners hires fundraising head')
    expect(hireRow(small, 'people_moves')).toBeNull()
    expect(hireRow({ ...small, alsoCoveredBy: ['Private Equity International'] }, 'people_moves')).toBeNull()
    expect(hireRow({ ...small, alsoCoveredBy: ['Private Equity International', 'PE Hub'] }, 'people_moves')).not.toBeNull()
  })

  it('leaves out exits, retirements, searches, cuts and junior jobs', () => {
    const no = (a: NewsletterArticle) => expect(hireRow(a, 'people_moves')).toBeNull()
    no(hire('Two Sigma Investments', 'Seth Platt', 'Chief Investment Officer', 'Two Sigma executive to exit amid ongoing founders’ dispute'))
    no(hire('Texas Teachers', null, 'Chief Investment Officer', 'Texas Teachers launches search to replace retiring CIO Jase Auby'))
    no(hire('Partners Group', 'Wolf-Henning Scheider', 'Head of Private Equity', 'Partners Group cuts and reassigns dozens of private equity roles'))
    no(hire('Millennium Management', 'Ravi Vinda', 'portfolio manager', 'Millennium recruits Citadel rates trader Ravi Vinda'))
    no(hire('Blackstone', 'Jane Doe', 'Chief Operating Officer', 'Blackstone COO departs', { eventType: 'executive_departure' }))
  })

  it('falls back to the headline when the person or the job cannot be read cleanly', () => {
    const row = hireRow(hire('Walleye Capital', 'Jordan Tanner, Anna Dev', 'Chief Equities Strategist; Recruitment Lead', 'Walleye Capital expands equities team with hires from Balyasny, Millennium', { alsoCoveredBy: ['a', 'b'] }), 'people_moves')
    expect(row?.isHeadline).toBe(true)
    expect(row?.lead).toBe('Walleye Capital expands equities team with hires from Balyasny, Millennium')
  })

  it('puts the top of a firm first, one row a firm, at most three', () => {
    const [list] = pickRanks([
      group('people_moves', 'People Moves', [
        hire('Balyasny Asset Management', 'Peter Anderson', 'Head of Autonomous Strategies', 'Balyasny moves research head into trading'),
        hire('Balyasny Asset Management', 'Limin Yang', 'Chief Investment Officer', 'Balyasny hires former Nebula CIO Limin Yang'),
        hire('Macquarie', 'Linso Pals', 'Head of Credit Fundraising', 'Macquarie hires Linso Pals to lead credit fundraising'),
        hire('Hamilton Lane', 'Hartley Rogers', 'co-CEO', 'Hamilton Lane names Hartley Rogers co-CEO'),
        hire('IFM Investors', 'Michael Kulper', 'Head of North America Infrastructure', 'IFM Investors names Michael Kulper head of North America infrastructure'),
      ]),
    ])
    expect(list.key).toBe('hires')
    expect(list.rows).toHaveLength(MAX_HIRE_ROWS)
    expect(list.rows.map((r) => r.lead)).toEqual(['Balyasny Asset Management', 'Hamilton Lane', 'Macquarie'])
    expect(list.rows[0].detail).toBe('Limin Yang, Chief Investment Officer')
  })
})

describe('the block as a whole', () => {
  it('lists a story once, by the edition’s own same-story rule', () => {
    const a = close('Pantheon', 'Pantheon Global Secondaries Fund VIII', 6000, 'Pantheon has closed its eighth secondaries fund on $6bn')
    const b = close('Pantheon', 'Pantheon Global Secondaries Fund VIII', 6000, 'Pantheon closes Global Secondaries Fund VIII at $6 billion')
    const [list] = pickRanks([group('secondaries', 'Secondaries & GP Stakes', [a]), group('PE', 'Private Equity', [b])])
    expect(list.rows).toHaveLength(1)
    expect(list.rows[0].article.id).toBe(a.id)
  })

  it('never lists a story the edition already leads with, by id or as the same story', () => {
    const lead = close('Pantheon', 'Pantheon Global Secondaries Fund VIII', 6000, 'Pantheon has closed its eighth secondaries fund on $6bn')
    const sameAgain = { ...close('Pantheon', 'Pantheon Global Secondaries Fund VIII', 6000, 'Pantheon closes $6bn secondaries fund'), id: 'pantheon-again' }
    const other = close('Ara Partners', 'Ara Energy Fund I', 2500, 'Ara Partners closes inaugural energy fund at $2.5bn hard cap', { closeType: 'hard_cap' })
    const lists = pickRanks([group('secondaries', 'Secondaries & GP Stakes', [lead, sameAgain]), group('PE', 'Private Equity', [other])], [lead])
    expect(lists.flatMap((l) => l.rows.map((r) => r.lead))).toEqual(['Ara Partners'])
    // A list left empty by it is not printed.
    expect(pickRanks([group('secondaries', 'Secondaries & GP Stakes', [lead])], [lead])).toEqual([])
  })

  it('prints only the lists that have a row, in a fixed order', () => {
    const lists = pickRanks([
      group('people_moves', 'People Moves', [hire('Macquarie', 'Linso Pals', 'Head of Credit Fundraising', 'Macquarie hires Linso Pals')]),
      group('deals', 'Deals', [deal('EQT', 10560, 'EQT agrees €9.6bn takeover of Qiagen')]),
    ])
    expect(lists.map((l) => l.label)).toEqual(['Deals $1B+', 'Notable hires'])
  })

  it('is nothing at all on a day without a qualifying story', () => {
    const groups = [
      group('PE', 'Private Equity', [close('Small Co', 'Small Fund I', 40, 'Small Co closes $40m Fund I')]),
      group('deals', 'Deals', [deal('Mid Co', 300, 'Mid Co completes $300m acquisition of Target')]),
      group('people_moves', 'People Moves', [hire('Tiny Advisers', 'Jo Bloggs', 'Analyst', 'Tiny Advisers hires analyst')]),
    ]
    expect(pickRanks(groups)).toEqual([])
    expect(pickRanks([])).toEqual([])
    expect(renderRanks([])).toBe('')
    expect(ranksText([])).toBe('')
    const p = { groups, totalArticles: 3, editionDate: '2026-10-22', unsubscribeUrl: 'https://fundopshq.com/u?token=T' }
    expect(renderNewsletterEmail(p)).not.toContain('biggest.')
    expect(renderNewsletterText(p)).not.toContain('TODAY’S BIGGEST')
  })

  it('links each row to the story’s page on fundopshq.com', () => {
    const a = close('Pantheon', 'Pantheon Global Secondaries Fund VIII', 6000, 'Pantheon has closed its eighth secondaries fund on $6bn')
    expect(rankHref(a)).toBe(`https://fundopshq.com/story/pantheon-has-closed-its-eighth-secondaries-fund-on-6bn-${a.id.slice(0, 8)}`)
  })

  it('cleans the legal form off a firm’s name', () => {
    expect(firmWords('EnCap Investments LP')).toBe('EnCap Investments')
    expect(firmWords('Sosteneo SGR S.p.A')).toBe('Sosteneo')
    expect(firmWords('Blackstone Inc.')).toBe('Blackstone')
    expect(firmWords('Ares Management (NYSE: ARES)')).toBe('Ares Management')
  })
})

describe('in the email', () => {
  function edition() {
    const filler = (n: number, cat: string, label: string) =>
      group(cat, label, Array.from({ length: n }, (_, i) => article({ title: `${label} filler story ${i + 1} about something`, firmName: `${label} Filler ${i + 1}`, relevanceScore: 0.3, isHighSignal: false, eventType: cat === 'people_moves' ? 'executive_hire' : 'fund_launch' })))
    const groups = [
      group('PE', 'Private Equity', [
        close('Ara Partners', 'Ara Energy Fund I', 2500, 'Ara Partners closes inaugural energy fund at $2.5bn hard cap', { closeType: 'hard_cap' }),
        close('FFL Partners', 'FFL Capital Partners VI', 1350, 'FFL Partners scores $1.35bn for its sixth Capital Partners fund', { relevanceScore: 0.4, isHighSignal: false }),
        close('Trinity Hunt', 'Trinity Hunt Partners VIII', 900, 'Trinity Hunt closes eighth fund on $900m', { relevanceScore: 0.35, isHighSignal: false }),
        ...filler(6, 'PE', 'Private Equity').articles,
      ]),
      group('credit', 'Credit', [close('Arini', 'Arini Direct Lending Fund I', 4000, 'Arini closes debut direct lending fund with $4bn to invest')]),
      group('deals', 'Deals', [
        deal('EQT', 10560, 'EQT agrees €9.6bn takeover of Qiagen'),
        deal('Stonepeak', 2500, 'Stonepeak completes $2.5bn acquisition of Chicago Parking Meters'),
        deal('Brookfield', 1200, 'Brookfield completes $1.2bn purchase of Midwest data centre portfolio', { relevanceScore: 0.35, isHighSignal: false }),
      ]),
      group('people_moves', 'People Moves', [
        hire('IFM Investors', 'Michael Kulper', 'Head of North America Infrastructure', 'IFM Investors names Michael Kulper head of North America infrastructure'),
        ...filler(6, 'people_moves', 'People Moves').articles,
      ]),
      filler(5, 'service_providers', 'Service Providers'),
    ]
    const total = groups.reduce((n, g) => n + g.articles.length, 0)
    return { groups, totalArticles: total, editionDate: '2026-10-22', unsubscribeUrl: 'https://fundopshq.com/u?token=T' }
  }

  it('sits after the top stories and before the first section, and moves no story', () => {
    const p = edition()
    const html = renderNewsletterEmail(p)
    const { top, sections } = arrangeEdition(p.groups, p.totalArticles)
    expect(top.length).toBeGreaterThan(0)
    const block = html.indexOf('biggest.')
    expect(block).toBeGreaterThan(html.indexOf(`href="${storyHref(top[top.length - 1].article)}" class="fops-`))
    expect(block).toBeLessThan(html.indexOf(`>${sections[0].label}<`))
    // Every story still runs once where it ran, linked to its page; the sections keep their order.
    for (const g of p.groups) for (const a of g.articles) expect(html.split(`href="${storyHref(a)}" class="fops-`).length - 1).toBe(1)
    const positions = sections.map((s) => html.indexOf(`>${s.label}<`))
    expect([...positions].sort((x, y) => x - y)).toEqual(positions)
  })

  it('shows each list under its label, ranked, with the figure and a link to the story page', () => {
    const html = renderNewsletterEmail(edition())
    expect(html).toContain('Fund closes $500M+')
    expect(html).toContain('Deals $1B+')
    expect(html).toContain('Notable hires')
    // Arini, Ara, Stonepeak, FFL and Brookfield lead the edition, so the lists leave them out.
    const block = html.slice(html.indexOf('biggest.'), html.indexOf('>Private Equity<'))
    expect(block).toContain('<b>Trinity Hunt</b>')
    for (const firm of ['Arini', 'Ara Partners', 'FFL Partners']) expect(block).not.toContain(`<b>${firm}</b>`)
    expect(block).not.toContain('fundopshq.com/story/stonepeak-completes')
    expect(html).toContain('&asymp;$10.6B')
    expect(html).toMatch(/href="https:\/\/fundopshq\.com\/story\/eqt-agrees-9-6bn-takeover-of-qiagen-[0-9a-f]{8}\?utm_source=newsletter&amp;utm_medium=email" style="color:#1E3A5F;text-decoration:none;"/)
    expect(html).toContain('Michael Kulper, Head of North America Infrastructure')
  })

  it('carries the same lists in the text part, under the top stories', () => {
    const p = edition()
    const text = renderNewsletterText(p)
    const at = text.indexOf('TODAY’S BIGGEST')
    expect(at).toBeGreaterThan(text.indexOf('THIS MORNING’S TOP STORIES'))
    expect(at).toBeLessThan(text.indexOf('\nPRIVATE EQUITY\n'))
    expect(text).toContain('FUND CLOSES $500M+\n1. Trinity Hunt · Trinity Hunt Partners VIII · Final close · $900M\n   https://fundopshq.com/story/trinity-hunt-closes-eighth-fund-on-900m-')
    expect(text).not.toContain('1. Arini')
    expect(text).toContain('DEALS $1B+\n1. EQT agrees €9.6bn takeover of Qiagen · ~$10.6B\n')
    expect(text).toContain('NOTABLE HIRES\n1. IFM Investors · Michael Kulper, Head of North America Infrastructure')
    expect(text).toMatch(/\?utm_source=newsletter&utm_medium=email\n/)
  })
})
