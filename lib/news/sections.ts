/**
 * The site's sections — the tabs across the top of every page.
 *
 * Two kinds, one strip. "Story type" tabs cut across asset classes
 * (Fundraising, Deals, People…); "asset class" tabs cut across story types
 * (everything about private credit: its closes, its deals, its hires). A
 * reader either follows a function or follows a market, and both are one
 * click from anywhere.
 *
 * Section membership comes from the same placeArticle() the newsletter uses,
 * so a story sits under the same heading in the email and on the site.
 */
import type { Story, StoryKind } from './stories'

export interface SectionDef {
  slug: string
  /** Tab label. */
  label: string
  /** Page title: "Private equity news". */
  title: string
  /** Link text under the section's block on the front page. */
  more: string
  /** One line under the page title, and the meta description. */
  description: string
  group: 'type' | 'asset'
  kind?: StoryKind
  assetClasses?: string[]
  /** Lower-case noun for running text: "All LP stories", "Latest deal news". Defaults to the title, lower-cased. */
  noun?: string
  /** Event-board topics that belong on a story-type page's rail (asset-class pages use their asset class). */
  eventTopics?: string[]
}

/** The section's name as it reads mid-sentence. */
export function sectionNoun(section: SectionDef): string {
  return section.noun ?? section.title.toLowerCase()
}

export const SECTIONS: SectionDef[] = [
  {
    slug: 'fundraising', more: 'More fundraising', label: 'Fundraising', title: 'Fundraising', group: 'type', kind: 'fundraising', eventTopics: ['fundraising_ir'],
    description: 'Fund closes, launches and targets across private markets — who is raising, how much, and how it compares with the last one.',
  },
  {
    slug: 'deals', more: 'More deals', label: 'Deals', title: 'Deals', group: 'type', kind: 'deals', noun: 'deal',
    description: 'Buyouts, take-privates, exits and manager-level M&A, from first rumour to signed and closed.',
  },
  {
    slug: 'people', more: 'More people moves', label: 'People', title: 'People moves', group: 'type', kind: 'people', noun: 'people', eventTopics: ['talent'],
    description: 'Hires, promotions and departures at fund managers — partners, C-suite, and the heads of IR, operations and strategy.',
  },
  {
    slug: 'private-equity', more: 'More private equity', label: 'Private Equity', title: 'Private equity', group: 'asset', assetClasses: ['PE'],
    description: 'Buyout and growth: fund closes, deals and moves across private equity.',
  },
  {
    slug: 'venture-capital', more: 'More venture', label: 'Venture', title: 'Venture capital', group: 'asset', assetClasses: ['VC'],
    description: 'New venture funds, first closes and the people behind them.',
  },
  {
    slug: 'private-credit', more: 'More private credit', label: 'Credit', title: 'Private credit', group: 'asset', assetClasses: ['credit'],
    description: 'Direct lending, asset-based finance, CLOs and the managers raising for them.',
  },
  {
    slug: 'real-estate', more: 'More real estate', label: 'Real Estate', title: 'Real estate', group: 'asset', assetClasses: ['real_estate'],
    description: 'Private real estate funds — equity and debt — and the firms behind them.',
  },
  {
    slug: 'infrastructure', more: 'More infrastructure', label: 'Infrastructure', title: 'Infrastructure', group: 'asset', assetClasses: ['infrastructure'],
    description: 'Infrastructure equity and debt funds, energy transition vehicles and their backers.',
  },
  {
    slug: 'secondaries', more: 'More secondaries', label: 'Secondaries', title: 'Secondaries & GP stakes', group: 'asset', assetClasses: ['secondaries', 'gp_stakes'], noun: 'secondaries and GP stakes',
    description: 'Secondaries funds, continuation vehicles and GP-stake deals.',
  },
  {
    slug: 'hedge-funds', more: 'More hedge funds', label: 'Hedge Funds', title: 'Hedge funds', group: 'asset', assetClasses: ['hedge'],
    description: 'Launches, closures, capital raises and portfolio-manager moves at hedge funds.',
  },
  {
    slug: 'lps', more: 'More LP news', label: 'LPs', title: 'LPs', group: 'type', kind: 'lps', noun: 'LP',
    description: 'Commitments, pacing plans and allocation shifts from pensions, sovereign funds, endowments and family offices.',
  },
  {
    slug: 'regulation', more: 'More regulation', label: 'Regulation', title: 'Regulation', group: 'type', kind: 'regulation', eventTopics: ['compliance_regulatory', 'legal'],
    description: 'Rules, risk alerts and enforcement that touch private fund managers — SEC, FCA, ESMA, ASIC and beyond.',
  },
  {
    slug: 'service-providers', more: 'More service-provider news', label: 'Providers', title: 'Service providers', group: 'type', kind: 'providers', noun: 'service provider', eventTopics: ['technology_ai', 'accounting_tax', 'fund_finance'],
    description: 'Law firms, fund administrators, auditors, lenders and fund technology: who is hiring, merging and moving.',
  },
]

export const SECTION_BY_SLUG = new Map(SECTIONS.map((s) => [s.slug, s]))

export function sectionHref(slug: string): string {
  return `/news/${slug}`
}

export function storyInSection(story: Story, section: SectionDef): boolean {
  if (section.kind) return story.kind === section.kind
  if (section.assetClasses) return story.assetClasses.some((c) => section.assetClasses!.includes(c))
  return false
}

/** The section a story's kicker links to: its asset class for a fund event, its type otherwise. */
export function homeSectionFor(story: Story): SectionDef | undefined {
  if (story.kind === 'fundraising' && story.assetClasses[0]) {
    const byAsset = SECTIONS.find((s) => s.assetClasses?.includes(story.assetClasses[0]))
    if (byAsset) return byAsset
  }
  return SECTIONS.find((s) => s.kind === story.kind)
}

export const ASSET_LABEL: Record<string, string> = {
  PE: 'Private equity',
  VC: 'Venture',
  credit: 'Credit',
  hedge: 'Hedge funds',
  real_estate: 'Real estate',
  infrastructure: 'Infrastructure',
  secondaries: 'Secondaries',
  gp_stakes: 'GP stakes',
}

export const KIND_LABEL: Record<StoryKind, string> = {
  fundraising: 'Fundraising',
  deals: 'Deals',
  people: 'People',
  lps: 'LPs',
  regulation: 'Regulation',
  providers: 'Service providers',
}
