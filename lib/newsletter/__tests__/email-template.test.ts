import { describe, it, expect } from 'vitest'
import { buildPreheader, renderNewsletterEmail, type WeekRecap } from '../email-template'
import { arrangeEdition, kickerParts, pickTopStories, topCount } from '../top-stories'
import type { ArticleGroup, NewsletterArticle } from '../query-articles'
import type { SponsorSlate } from '../sponsors'

let seq = 0
function article(o: Partial<NewsletterArticle> & { title: string }): NewsletterArticle {
  const id = `a${++seq}`
  return {
    id, sourceUrl: `https://example.com/${id}`, sourceName: 'PE Hub', publishedDate: '2026-10-02', articleType: 'fund_close',
    eventType: 'fund_close', fundCategories: ['PE'], isHighSignal: true, relevanceScore: 0.8, tldr: 'A one-line summary of the story.',
    firmName: null, firmDomain: null, fundName: null, fundSizeUsdMillions: null, fundStrategy: null, geography: [], personName: null,
    personTitle: null, closeType: null, coFirms: [], alsoCoveredBy: [], headlineEntities: [], entityKeys: [], personKeys: [],
    leadEligible: true, ...o,
  }
}
const group = (category: string, label: string, articles: NewsletterArticle[]): ArticleGroup => ({ category, label, articles })
const filler = (n: number, prefix: string) =>
  Array.from({ length: n }, (_, i) => article({ title: `${prefix} firm ${i + 1} hires a partner`, firmName: `${prefix} Firm ${i + 1}`, eventType: 'executive_hire', relevanceScore: 0.4, isHighSignal: false }))

/** A busy morning: 26 stories. */
function busyMorning(): { groups: ArticleGroup[]; total: number } {
  const groups = [
    group('PE', 'Private Equity', [
      article({ title: 'Apax Sets $13.5 Billion Target for Fund XII', firmName: 'Apax Partners', fundSizeUsdMillions: 13500, closeType: 'target', sourceName: 'WSJ', headlineEntities: ['Apax'] }),
      article({ title: 'Investcorp closes second North American PE fund at $1.22bn', firmName: 'Investcorp', fundSizeUsdMillions: 1220, closeType: 'final_close' }),
      article({ title: 'Small Co closes $40m fund', firmName: 'Small Co', fundSizeUsdMillions: 40, closeType: 'final_close', relevanceScore: 0.4, isHighSignal: false }),
    ]),
    group('credit', 'Credit', [
      article({ title: 'Ares Blows Past Target to Raise $4.2 Billion for Structured Fund', firmName: 'Ares Management', fundSizeUsdMillions: 4200, closeType: 'final_close', sourceName: 'Bloomberg', alsoCoveredBy: ['Law360', 'citybiz'] }),
      article({ title: 'Monroe prices second new-issue CLO at $399m', firmName: 'Monroe Capital', fundSizeUsdMillions: 399, leadEligible: false }),
    ]),
    group('deals', 'Deals', [
      article({ title: 'CPP Investments sells A$4.5bn Australian toll road stakes to Transurban', firmName: 'CPP Investments', eventType: 'acquisition', fundSizeUsdMillions: 3100, alsoCoveredBy: ['IPE Real Assets'] }),
      ...filler(8, 'Deal').map((a) => ({ ...a, eventType: 'acquisition' })),
    ]),
    group('people_moves', 'People Moves', filler(8, 'People')),
    group('regulatory', 'Regulation', [
      article({ title: 'SEC proposes performance fees, interval fund overhaul', firmName: 'SEC', eventType: 'regulatory_action', sourceName: 'Pensions & Investments', alsoCoveredBy: ['Private Equity Wire', 'Alternatives Watch', 'HedgeCo Insights'] }),
    ]),
    group('service_providers', 'Service Providers', filler(3, 'Provider')),
  ]
  return { groups, total: groups.reduce((n, g) => n + g.articles.length, 0) }
}

const render = (o: Partial<Parameters<typeof renderNewsletterEmail>[0]> = {}) => {
  const { groups, total } = busyMorning()
  return renderNewsletterEmail({ groups, totalArticles: total, editionDate: '2026-10-02', unsubscribeUrl: 'https://example.com/u', ...o })
}
const count = (html: string, needle: string) => html.split(needle).length - 1

describe('the top of the edition', () => {
  it('leads with the biggest stories across sections, not the first section', () => {
    const { groups, total } = busyMorning()
    const top = pickTopStories(groups, total)
    expect(top).toHaveLength(5)
    expect(top[0].article.firmName).toBe('Apax Partners')
    // A front page, not the five largest closes: a deal and the day's regulation story make it.
    expect(top.map((t) => t.category)).toEqual(expect.arrayContaining(['PE', 'credit', 'deals', 'regulatory']))
    // A CLO pricing is not a lead, whatever its number.
    expect(top.map((t) => t.article.firmName)).not.toContain('Monroe Capital')
  })
  it('never names one firm twice at the top', () => {
    const groups = [group('PE', 'Private Equity', [
      article({ title: 'Blackstone closes $10bn fund', firmName: 'Blackstone', fundSizeUsdMillions: 10000, closeType: 'final_close' }),
      article({ title: 'Blackstone closes $6bn fund', firmName: 'Blackstone', fundSizeUsdMillions: 6000, closeType: 'final_close' }),
      ...filler(12, 'X'),
    ])]
    const top = pickTopStories(groups, 14)
    expect(top.filter((t) => t.article.firmName === 'Blackstone')).toHaveLength(1)
  })
  it('scales with the morning, and stands down on a thin one', () => {
    expect([40, 25, 24, 16, 15, 12, 11, 3].map(topCount)).toEqual([5, 5, 4, 4, 3, 3, 0, 0])
    const groups = [group('PE', 'Private Equity', filler(6, 'Thin'))]
    expect(arrangeEdition(groups, 6)).toEqual({ top: [], sections: groups })
  })
  it('runs every story once: what leads is taken out of its section', () => {
    const { groups, total } = busyMorning()
    const { top, sections } = arrangeEdition(groups, total)
    const ids = [...top.map((t) => t.article.id), ...sections.flatMap((g) => g.articles.map((a) => a.id))]
    expect(ids).toHaveLength(total)
    expect(new Set(ids).size).toBe(total)
    const html = render({ groups, totalArticles: total })
    for (const g of groups) for (const a of g.articles) expect(count(html, `href="${a.sourceUrl}"`)).toBe(1)
    // The lead is above the first section band.
    expect(html.indexOf('>Apax<')).toBeLessThan(html.indexOf('class="fops-cat-head'))
  })
  it('puts the number and the stage over a raise, and only the section over anything else', () => {
    const { groups, total } = busyMorning()
    const top = pickTopStories(groups, total)
    const by = (firm: string) => kickerParts(top.find((t) => t.article.firmName === firm)!)
    expect(by('Apax Partners')).toEqual(['Private Equity', '$13.5B', 'Target'])
    expect(by('Ares Management')).toEqual(['Credit', '$4.2B', 'Final close'])
    expect(by('CPP Investments')).toEqual(['Deals', '$3.1B'])
    expect(by('SEC')).toEqual(['Regulation'])
  })
})

describe('the preview text', () => {
  it('says what happened, where the subject line says who', () => {
    const { groups, total } = busyMorning()
    const text = buildPreheader(pickTopStories(groups, total), groups, total)
    expect(text.startsWith('Apax Sets $13.5 Billion Target for Fund XII · ')).toBe(true)
    expect(text.endsWith(`· and ${total - 2} more this morning.`)).toBe(true)
  })
  it('works on a thin morning and on an empty one', () => {
    const groups = [group('PE', 'Private Equity', [article({ title: 'Only story today' })])]
    expect(buildPreheader([], groups, 1)).toBe('Only story today')
    expect(buildPreheader([], [], 0)).toBe('0 moves across private markets this morning.')
  })
})

describe('the sponsor slot', () => {
  it('shows the house notice, top and bottom, while nobody is booked', () => {
    const html = render({ readerFirms: 76 })
    expect(count(html, 'Your firm here')).toBe(2)
    expect(count(html, 'Space available')).toBe(2)
    expect(html).toContain('read each morning at 76 firms')
    expect(html).toContain('https://fundopshq.com/sponsor?ref=email-top')
    expect(html).toContain('This announcement appears as a matter of record only.')
    // The top notice is one slim line, above the first headline.
    expect(html.indexOf('Sponsor this brief')).toBeLessThan(html.indexOf('top stories.'))
    expect(html).not.toContain('PRESENTED BY')
  })
  it('never states a reader figure it was not given, or one too small to be the point', () => {
    expect(render()).toContain('the morning brief for GPs, LPs, and fund service providers')
    expect(render({ readerFirms: 9 })).not.toMatch(/at 9 firms/)
  })
  const slate: SponsorSlate = {
    label: 'PRESENTED BY',
    sponsors: [{ name: 'Northwind Fund Services', blurb: 'Fund administration for emerging managers.', ctaUrl: 'https://example.com/northwind', ctaText: 'See how it works' }],
  }
  it('gives a booked sponsor the top and the bottom, and drops the house notice', () => {
    const html = render({ sponsorSlate: slate, readerFirms: 76 })
    expect(count(html, 'PRESENTED BY')).toBe(2)
    expect(count(html, 'Fund administration for emerging managers.')).toBe(2)
    expect(count(html, 'href="https://example.com/northwind"')).toBe(4) // the mark and the link, twice
    expect(html).not.toContain('Space available')
    expect(html).not.toContain('matter of record')
    expect(html).toContain('Your firm here next.')
    expect(html.indexOf('PRESENTED BY')).toBeLessThan(html.indexOf('top stories.'))
  })
  it('escapes a sponsor’s copy: it is text, never markup', () => {
    const html = render({ sponsorSlate: { label: 'PRESENTED BY', sponsors: [{ name: 'A & B <Co>', blurb: 'We <script>alert(1)</script> "quote"', ctaUrl: 'https://example.com/?a=1&b=2', ctaText: 'Go' }] } })
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('We &lt;script&gt;alert(1)&lt;/script&gt; &quot;quote&quot;')
    expect(html).toContain('A &amp; B &lt;Co&gt;')
    expect(html).toContain('href="https://example.com/?a=1&amp;b=2"')
  })
  it('says so in the footer when the sponsor is in the day’s news', () => {
    const inNews: SponsorSlate = { label: 'PRESENTED BY', sponsors: [{ name: 'Ares', blurb: 'A message from Ares.', ctaUrl: 'https://example.com/ares' }] }
    expect(render({ sponsorSlate: inNews })).toContain('Ares sponsors this edition and is in today&rsquo;s news. Coverage is not traded for sponsorship.')
    expect(render({ sponsorSlate: slate })).not.toContain('sponsors this edition')
  })
})

describe('Monday’s recap', () => {
  const recap: WeekRecap = {
    rows: [
      { id: 'c1', firm: 'Bessemer Venture Partners', fund: 'Growth fund', stage: 'Final close', sizeUsdM: 5750 },
      { id: 'c2', firm: 'Audax Private Debt', fund: 'Fund III', stage: 'Final close', sizeUsdM: 5400 },
      { id: 'c3', firm: 'Azora', fund: 'Azora Southern Europe Fund', stage: 'Final close', sizeUsdM: 2310, converted: true },
    ],
    finals: 24, capitalUsdM: 27025,
  }
  it('lists the week’s largest closes, each linked to its page on the site', () => {
    const html = render({ recap })
    expect(html).toContain('Last week&rsquo;s largest closes')
    expect(html).toContain('href="https://fundopshq.com/story/c1"')
    expect(html).toContain('$5.8B')
    expect(html).toContain('&asymp;$2.3B')
    expect(html).toContain('<b style="color:#1E3A5F;">$27B</b> in 24 final closes last week')
    expect(html.indexOf('largest closes')).toBeLessThan(html.indexOf('matter of record'))
  })
  it('is left out on other days, and when the week was too thin to rank', () => {
    expect(render()).not.toContain('largest closes')
    expect(render({ recap: null })).not.toContain('largest closes')
    expect(render({ recap: { ...recap, rows: recap.rows.slice(0, 2) } })).not.toContain('largest closes')
  })
})

describe('the furniture', () => {
  it('has no "Section A / Section B" labels, and links the site’s pages from the footer', () => {
    const html = render()
    expect(html).not.toMatch(/Section [AB]/)
    for (const path of ['/news', '/league-tables', '/firms', '/events', '/sponsor', '/about']) expect(html).toContain(`href="https://fundopshq.com${path}"`)
  })
  it('sends none of this file’s notes to the reader, and keeps Outlook’s conditional block', () => {
    const html = render()
    expect(count(html, '<!--')).toBe(1)
    expect(html).toContain('<!--[if mso]><style>table{border-collapse:collapse;}td{font-family:Georgia,serif;}</style><![endif]-->')
    expect(html).not.toContain('/*')
  })
  it('pins the framed card in all three dark-mode layers', () => {
    // An unpinned pale box is what Gmail on a phone inverts in dark mode.
    const html = render()
    expect(html).toContain('class="fops-bg-card" bgcolor="#FFFDF8"')
    expect(html).toMatch(/prefers-color-scheme: dark\)[^@]*\.fops-bg-card \{ background-color: #FFFDF8 !important; \}/)
    expect(html).toContain('u + .body .fops-bg-card { background-color: #FFFDF8 !important; }')
    expect(html).toContain('[data-ogsc] .fops-bg-card { background-color: #FFFDF8 !important; }')
  })
  it('stays well under the size at which Gmail clips a message', () => {
    expect(render({ readerFirms: 76 }).length).toBeLessThan(60_000)
  })
})
