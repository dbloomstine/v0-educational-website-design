import { describe, it, expect } from 'vitest'
import { renderNewsletterText } from '../email-text'
import { renderNewsletterEmail, storyHref, type WeekRecap } from '../email-template'
import { arrangeEdition, kickerParts } from '../top-stories'
import { renderWelcomeText } from '../welcome-email'
import type { ArticleGroup, NewsletterArticle } from '../query-articles'
import type { IndustryEvent } from '@/lib/events/types'
import type { SponsorSlate } from '../sponsors'

let seq = 0
function article(o: Partial<NewsletterArticle> & { title: string }): NewsletterArticle {
  const id = `a${++seq}`
  return {
    id, sourceUrl: `https://example.com/${id}`, sourceName: 'PE Hub', publishedDate: '2026-10-02', articleType: 'fund_close',
    eventType: 'fund_close', fundCategories: ['PE'], isHighSignal: true, relevanceScore: 0.8, tldr: null,
    firmName: null, firmDomain: null, fundName: null, fundSizeUsdMillions: null, fundStrategy: null, geography: [], personName: null,
    personTitle: null, closeType: null, coFirms: [], alsoCoveredBy: [], headlineEntities: [], entityKeys: [], personKeys: [],
    leadEligible: true, ...o,
  }
}
const group = (category: string, label: string, articles: NewsletterArticle[]): ArticleGroup => ({ category, label, articles })
const filler = (n: number, prefix: string) =>
  Array.from({ length: n }, (_, i) => article({ title: `${prefix} firm ${i + 1} hires a partner`, firmName: `${prefix} Firm ${i + 1}`, eventType: 'executive_hire', relevanceScore: 0.4, isHighSignal: false }))

function busyMorning(): { groups: ArticleGroup[]; total: number } {
  const groups = [
    group('PE', 'Private Equity', [
      article({ title: 'Apax Sets $13.5 Billion Target for Fund XII', firmName: 'Apax Partners', fundSizeUsdMillions: 13500, closeType: 'target', sourceName: 'WSJ',
        tldr: 'Apax Partners is seeking $13.5 billion for its twelfth buyout fund, its largest yet. The firm expects a first close next year.' }),
      article({ title: 'Investcorp closes second North American PE fund at $1.22bn', firmName: 'Investcorp', fundSizeUsdMillions: 1220, closeType: 'final_close' }),
      article({ title: 'Small Co closes $40m fund & more <b>', firmName: 'Small Co', fundSizeUsdMillions: 40, closeType: 'final_close', relevanceScore: 0.4, isHighSignal: false }),
    ]),
    group('credit', 'Credit', [
      article({ title: 'Ares Blows Past Target to Raise $4.2 Billion for Structured Fund', firmName: 'Ares Management', fundSizeUsdMillions: 4200, closeType: 'final_close', sourceName: 'Bloomberg', alsoCoveredBy: ['Law360', 'citybiz'], fundCategories: ['credit'] }),
    ]),
    group('deals', 'Deals', [
      article({ title: 'CPP Investments sells toll road stakes to Transurban', firmName: 'CPP Investments', eventType: 'acquisition', fundSizeUsdMillions: 3100, geography: ['North America'] }),
      ...filler(8, 'Deal').map((a) => ({ ...a, eventType: 'acquisition' })),
    ]),
    group('people_moves', 'People Moves', filler(8, 'People')),
    group('service_providers', 'Service Providers', filler(4, 'Provider')),
  ]
  return { groups, total: groups.reduce((n, g) => n + g.articles.length, 0) }
}

const ev = (o: Partial<IndustryEvent>): IndustryEvent =>
  ({
    id: 'x', slug: 'x', name: 'An event', description: null, eventUrl: 'https://example.com', registrationUrl: null, organizerName: 'ACG', organizerType: 'association',
    startDate: '2026-10-14', endDate: null, timeNote: null, city: 'New York', stateRegion: 'NY', country: 'US', venue: null, eventFormat: 'in_person', eventKind: 'conference',
    costType: 'paid', priceNote: null, costVerified: false, fundCategories: [], topics: [], opsRelevance: 'medium', region: 'north_america', isFeatured: false, expectedAttendance: null, isSubmitted: false,
    ...o,
  }) as IndustryEvent

const params = (o: Partial<Parameters<typeof renderNewsletterText>[0]> = {}) => {
  const { groups, total } = busyMorning()
  return { groups, totalArticles: total, editionDate: '2026-10-14', unsubscribeUrl: 'https://fundopshq.com/api/newsletter/unsubscribe?token=T', ...o }
}

describe('the plain-text part of the daily edition', () => {
  it('runs every story the HTML runs, each once, with its link written out', () => {
    const p = params()
    const text = renderNewsletterText(p)
    const html = renderNewsletterEmail(p)
    for (const g of p.groups) {
      for (const a of g.articles) {
        expect(text.split(a.title).length - 1).toBe(1)
        // One link per story, to its page on the site (2026-10-23), the same in both parts; never the source.
        expect(text).toContain(storyHref(a).replaceAll('&amp;', '&'))
        expect(html).toContain(`href="${storyHref(a)}" class="fops-`)
        expect(text).not.toContain(a.sourceUrl)
        expect(html).not.toContain(a.sourceUrl)
      }
    }
  })

  it('opens on the top stories in the HTML’s order, each under its kicker, with the summary line', () => {
    const p = params()
    const text = renderNewsletterText(p)
    const { top } = arrangeEdition(p.groups, p.totalArticles)
    expect(top.length).toBeGreaterThan(1)
    const positions = top.map((t) => text.indexOf(t.article.title))
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
    expect(text.indexOf('THIS MORNING’S TOP STORIES')).toBeLessThan(positions[0])
    const apax = top.find((t) => t.article.firmName === 'Apax Partners')!
    expect(text).toContain(`${kickerParts(apax).join(' · ').toUpperCase()}\n${apax.article.title}\nApax Partners is seeking $13.5 billion for its twelfth buyout fund, its largest yet.\n${storyHref(apax.article).replaceAll('&amp;', '&')}`)
    // The section rows stay headlines only.
    expect(text).not.toContain('The firm expects a first close')
  })

  it('is text: no tags, no entities, headlines as written', () => {
    const text = renderNewsletterText(params())
    expect(text).toContain('Small Co closes $40m fund & more <b>')
    expect(text).not.toMatch(/&amp;|&rsquo;|&nbsp;|<table|<a /)
  })

  it('carries the reader’s own links, the sender and the date', () => {
    const text = renderNewsletterText(params({ preferencesUrl: 'https://fundopshq.com/preferences?token=T', readerTag: 'R1', readerFirms: 120 }))
    expect(text.startsWith('FUNDOPS DAILY\nWednesday, October 14, 2026\n\n')).toBe(true)
    expect(text).not.toContain('Read at 120 firms')
    expect(text).toContain('Unsubscribe: https://fundopshq.com/api/newsletter/unsubscribe?token=T')
    expect(text).toContain('Choose what you follow: https://fundopshq.com/preferences?token=T')
    expect(text).toContain('You’re receiving this because you subscribed at fundopshq.com.')
    expect(text).toContain('FundOps Daily, by FundOpsHQ')
    expect(text).toContain('https://fundopshq.com/sponsor?ref=email&r=R1')
    expect(text).toContain('Forwarded to you? Subscribe: https://fundopshq.com/?ref=fwd')
  })

  it('lists the week’s events by day, two a day, with the rest counted', () => {
    const events = [
      ev({ slug: 'cfo', name: 'PE CFO Forum', opsRelevance: 'high', timeNote: 'Begins 8:30 AM ET', costType: 'free', costVerified: true }),
      ev({ slug: 'b', name: 'Event B' }),
      ev({ slug: 'c', name: 'Event C' }),
    ]
    const text = renderNewsletterText(params({ events }))
    expect(text).toContain('THE WEEK AHEAD')
    // No link per event since 2026-10-23: the full calendar is the way in.
    expect(text).toMatch(/- 8:30am ET: PE CFO Forum\n {2}ACG · New York, NY · Free\n/)
    expect(text).not.toContain('https://fundopshq.com/events/cfo')
    expect(text).toContain('One more on the calendar\n')
    expect(text).toContain('Full calendar: https://fundopshq.com/events?utm_source=newsletter&utm_medium=email')
    expect(text).not.toContain('Event C')
    expect(renderNewsletterText(params())).not.toContain('THE WEEK AHEAD')
  })

  it('calls an event free only when its registration page was checked, and never says paid', () => {
    const events = [
      ev({ slug: 'checked', name: 'Checked', costType: 'free', costVerified: true, startDate: '2026-10-14' }),
      ev({ slug: 'guessed', name: 'Guessed', costType: 'free', costVerified: false, startDate: '2026-10-15' }),
      ev({ slug: 'paid', name: 'Third one', costType: 'paid', costVerified: true, priceNote: '$2,500', startDate: '2026-10-16' }),
    ]
    const text = renderNewsletterText(params({ events }))
    expect(text).toMatch(/Checked\n {2}ACG · New York, NY · Free\n/)
    expect(text).toMatch(/Guessed\n {2}ACG · New York, NY\n/)
    expect(text).toMatch(/Third one\n {2}ACG · New York, NY\n/)
    expect(text).not.toMatch(/Paid\b|\$2,500/)
  })

  it('shows a sponsor’s card, or the house notice when there is none', () => {
    const slate: SponsorSlate = { label: 'Presented by', sponsors: [{ name: 'Acme Fund Admin', blurb: 'Fund administration for emerging managers.', ctaUrl: 'https://acme.example/', ctaText: 'Meet Acme' }] }
    const withSponsor = renderNewsletterText(params({ sponsorSlate: slate }))
    expect(withSponsor).toContain('PRESENTED BY\nAcme Fund Admin\nFund administration for emerging managers.\nhttps://acme.example/')
    expect(withSponsor).toContain('Meet Acme: https://acme.example/')
    expect(withSponsor).not.toContain('SPACE AVAILABLE')
    expect(renderNewsletterText(params())).toContain('SPACE AVAILABLE: Your firm here.')
  })

  it('carries Monday’s recap of the largest closes', () => {
    const recap: WeekRecap = {
      finals: 4, capitalUsdM: 9800,
      rows: [
        { id: 's1', firm: 'Apollo', fund: 'Fund XI', stage: 'Final close', sizeUsdM: 5000 },
        { id: 's2', firm: 'Ardian', fund: null, stage: 'Final close', sizeUsdM: 3000, converted: true },
        { id: 's3', firm: 'Audax', fund: 'Fund VII', stage: 'First close', sizeUsdM: 1800 },
      ],
    }
    const text = renderNewsletterText(params({ recap }))
    expect(text).toContain('1. Apollo, $5B\n   Fund XI · Final close\n   https://fundopshq.com/story/s1')
    expect(text).toContain('2. Ardian, ~$3B')
    expect(text).toContain('$9.8B in 4 final closes last week, as reported.')
  })

  it('puts a reader’s followed stories under their own heading, after the top stories', () => {
    expect(renderNewsletterText(params())).not.toContain('WHAT YOU FOLLOW')
    const followed = renderNewsletterText(params({ interests: ['PE'] }))
    expect(followed.indexOf('WHAT YOU FOLLOW')).toBeGreaterThan(followed.indexOf('THIS MORNING’S TOP STORIES'))
    expect(followed.indexOf('WHAT YOU FOLLOW')).toBeLessThan(followed.indexOf('\nDEALS\n'))
  })
})

describe('the plain-text welcome note', () => {
  it('says what the HTML says, with links written out', () => {
    const text = renderWelcomeText('https://fundopshq.com/api/newsletter/unsubscribe?token=T', { preferencesUrl: 'https://fundopshq.com/preferences?token=T', interests: ['credit'] })
    expect(text).toMatch(/Your first edition lands (this morning|tomorrow) by 7:30am ET\./)
    expect(text).toContain('https://fundopshq.com/news')
    expect(text).toContain('Unsubscribe: https://fundopshq.com/api/newsletter/unsubscribe?token=T')
    expect(text).toMatch(/You said you follow .*credit/i)
    expect(text).not.toMatch(/<|&[a-z]+;/)
    expect(renderWelcomeText('https://u')).not.toContain('Choose what you follow')
  })
})

describe('the footer asks for news (/submit, 2026-10-22)', () => {
  it('in the HTML and the text alike', () => {
    const p = params()
    const html = renderNewsletterEmail(p)
    expect(html).toContain('Got news?')
    expect(html).toContain('href="https://fundopshq.com/submit?utm_source=newsletter&amp;utm_medium=email"')
    expect(html).toMatch(/Send us your fund close or hire&nbsp;&rarr;<\/a>/)
    expect(renderNewsletterText(p)).toContain('Got news? Send us your fund close or hire: https://fundopshq.com/submit?utm_source=newsletter&utm_medium=email')
  })
})

describe('what a strict work filter reads (2026-10-23, the deliverability audit)', () => {
  const events = [
    ev({ id: 'a', slug: 'cfo', name: 'PE CFO Forum', startDate: '2026-10-15' }),
    ev({ id: 'b', slug: 'b', name: 'Event B', startDate: '2026-10-15' }),
    ev({ id: 'c', slug: 'c', name: 'Event C', startDate: '2026-10-15' }),
  ]
  it('links each story once, to its own page, and each event not at all', () => {
    const p = params({ events })
    const html = renderNewsletterEmail(p)
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1])
    const stories = p.groups.flatMap((g) => g.articles)
    // Every story's page, then a short list of the site's own pages and the reader's links.
    expect(new Set(hrefs).size).toBeLessThanOrEqual(stories.length + 20)
    // No link to the publishers (the fixture's sources are on example.com): the story page links on.
    expect(hrefs.some((h) => h.includes('example.com'))).toBe(false)
    expect(html).toContain('>PE CFO Forum<')
    expect(html).not.toContain('fundopshq.com/events/cfo')
    expect(html).not.toContain('twitter.com')
  })
  it('carries the postal address in both parts, and the welcome asks to save the sender', () => {
    const p = params()
    expect(renderNewsletterEmail(p)).toContain('76 Ensign Dr, Mystic, CT 06355')
    expect(renderNewsletterText(p)).toContain('76 Ensign Dr, Mystic, CT 06355')
    const welcome = renderWelcomeText('https://example.com/u')
    expect(welcome).toMatch(/add \S+@fundopshq\.com to your contacts/)
    expect(welcome).toContain('76 Ensign Dr, Mystic, CT 06355')
  })
})
