import type { EventQueryParams } from './api'

// Reserved slugs under /events/[slug] that render pre-filtered LANDING pages
// instead of event detail pages. The dynamic route checks this registry
// first, so an event slug can never shadow a collection (and the loader's
// slug generator must never emit one of these — event names are long enough
// that collisions are implausible, but the route order guarantees it anyway).

export interface EventCollection {
  slug: string
  title: string
  /** H1 line, board-voice. */
  heading: string
  /** One-sentence intro under the heading. */
  blurb: string
  /** Query params applied to the feed. */
  filter: EventQueryParams
  /** Params to prefill the interactive board link. */
  boardParams: Record<string, string>
}

function cityCollection(slug: string, city: string, flavor: string): EventCollection {
  return {
    slug,
    title: `${city} Private Markets Events`,
    heading: `Industry events in ${city}.`,
    blurb: `Upcoming private markets conferences, forums, networking, and training in ${city} — ${flavor} Every date verified at the source, refreshed weekly.`,
    filter: { city },
    boardParams: { city },
  }
}

function topicCollection(slug: string, topic: string, title: string, heading: string, blurb: string): EventCollection {
  return { slug, title, heading, blurb, filter: { topic }, boardParams: { topic } }
}

export const EVENT_COLLECTIONS: EventCollection[] = [
  // Cities
  cityCollection('new-york', 'New York', 'curated for GPs, LPs, and fund service providers.'),
  cityCollection('london', 'London', 'the European private capital circuit in one list.'),
  cityCollection('boston', 'Boston', 'from ACG programs to institutional forums.'),
  cityCollection('chicago', 'Chicago', 'curated for the funds industry.'),
  cityCollection('san-francisco', 'San Francisco', 'venture, growth, and the West Coast LP circuit.'),
  cityCollection('los-angeles', 'Los Angeles', 'curated for the funds industry.'),
  cityCollection('dallas', 'Dallas', 'the Texas private capital circuit.'),
  cityCollection('washington-dc', 'Washington DC', 'where the industry meets policy.'),
  cityCollection('miami', 'Miami', 'the winter capital of alternatives.'),
  cityCollection('paris', 'Paris', 'IPEM, France Invest, and the French private capital scene.'),
  cityCollection('luxembourg', 'Luxembourg', 'the fund-domicile capital of Europe.'),
  cityCollection('dublin', 'Dublin', 'the fund-servicing hub of Ireland.'),
  cityCollection('dubai', 'Dubai', 'the Gulf private capital circuit.'),
  cityCollection('singapore', 'Singapore', 'the APAC alternatives hub.'),
  // Topics
  topicCollection('compliance', 'compliance_regulatory', 'Fund Compliance & Regulatory Events',
    'Compliance and regulatory events.',
    'Conferences, forums, and webinars for CCOs, legal, and compliance teams at private fund managers — SEC developments, exam readiness, and regulatory change. Every date verified at the source.'),
  topicCollection('fund-finance', 'fund_finance', 'Fund Finance Events',
    'Fund finance events.',
    'Subscription lines, NAV lending, GP financing — symposia, training, and networking for fund CFOs, treasurers, lenders, and fund finance counsel. Every date verified at the source.'),
  topicCollection('accounting-tax', 'accounting_tax', 'Fund Accounting & Tax Events',
    'Accounting and tax events.',
    'CPE conferences, technical updates, and training for fund accounting, tax, and audit professionals across private markets. Every date verified at the source.'),
  topicCollection('tech-ai', 'technology_ai', 'Fund Technology & AI Events',
    'Fund technology and AI events.',
    'Where fund operations meets the stack — AI adoption, data, reconciliations, and ops technology events for COOs and CTOs. Every date verified at the source.'),
  topicCollection('fundraising', 'fundraising_ir', 'Fundraising & IR Events',
    'Fundraising and investor relations events.',
    'Cap-intro conferences, LP-GP forums, and emerging-manager programs for IR and capital formation teams. Every date verified at the source.'),
  // Kinds & specials
  {
    slug: 'webinars',
    title: 'Fund Industry Webinars',
    heading: 'Webinars and virtual training.',
    blurb: 'Attend from anywhere — webcasts, virtual workshops, and online training from associations, law firms, and accounting firms serving private markets. Times listed with timezones; every date verified at the source.',
    filter: { kind: 'webinar,training', format: 'virtual' },
    boardParams: { kind: 'webinar,training' },
  },
  {
    slug: 'networking',
    title: 'Private Markets Networking Events',
    heading: 'Networking and city-circuit events.',
    blurb: 'Receptions, chapter programs, and peer gatherings across the major fund hubs — the events people actually meet at. Every date verified at the source.',
    filter: { kind: 'networking,roundtable' },
    boardParams: { kind: 'networking,roundtable' },
  },
  {
    slug: 'free',
    title: 'Free Fund Industry Events',
    heading: 'Free events and webinars.',
    blurb: 'No-cost webinars, seminars, and networking across private markets — most hosted by law firms, accounting firms, and industry associations. Every date verified at the source.',
    filter: { cost: 'free' },
    boardParams: { cost: 'free' },
  },
]

export const COLLECTION_BY_SLUG = new Map(EVENT_COLLECTIONS.map((c) => [c.slug, c]))

/** The subset worth surfacing as browse links on the main board. */
export const FEATURED_COLLECTIONS = ['new-york', 'london', 'miami', 'singapore', 'webinars', 'compliance', 'fund-finance', 'free']
