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
  /** The title search results show, `{years}` filled by `eventSeasonLabel`; else "<title> | FundOpsHQ". */
  searchTitle?: string
  /** The meta description (a search result's two lines); else the blurb. */
  description?: string
}

/**
 * The years a topic page's title names (2026-10-22): the board looks ahead about six months, so from October the
 * next year's events are on it too and people search them by that year: "2026–27" from October, else "2026".
 */
export function eventSeasonLabel(today: Date = new Date()): string {
  const year = today.getUTCFullYear()
  return today.getUTCMonth() >= 9 ? `${year}–${String(year + 1).slice(-2)}` : String(year)
}

/** The page title for a collection, as search results show it. */
export function collectionTitle(collection: EventCollection, today: Date = new Date()): string {
  return collection.searchTitle
    ? collection.searchTitle.replace('{years}', eventSeasonLabel(today))
    : `${collection.title} | FundOpsHQ`
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

function topicCollection(
  slug: string,
  topic: string,
  title: string,
  heading: string,
  blurb: string,
  search?: { title: string; description: string },
): EventCollection {
  return {
    slug,
    title,
    heading,
    blurb,
    filter: { topic },
    boardParams: { topic },
    ...(search ? { searchTitle: search.title, description: search.description } : {}),
  }
}

export const EVENT_COLLECTIONS: EventCollection[] = [
  // Cities — North America only while the board is NA-scoped (non-NA
  // collections removed 2026-08-29; their slugs stay reserved in the loader)
  cityCollection('new-york', 'New York', 'curated for GPs, LPs, and fund service providers.'),
  cityCollection('boston', 'Boston', 'from ACG programs to institutional forums.'),
  cityCollection('chicago', 'Chicago', 'curated for the funds industry.'),
  cityCollection('san-francisco', 'San Francisco', 'venture, growth, and the West Coast LP circuit.'),
  cityCollection('los-angeles', 'Los Angeles', 'curated for the funds industry.'),
  cityCollection('dallas', 'Dallas', 'the Texas private capital circuit.'),
  cityCollection('washington-dc', 'Washington DC', 'where the industry meets policy.'),
  cityCollection('miami', 'Miami', 'the winter capital of alternatives.'),
  // Topics
  // Compliance and fund finance: titles and lines for what people search (2026-10-22), "fund compliance
  // conferences 2026". "Conferences and events", not "webinars": the board lists webinars only when submitted.
  topicCollection('compliance', 'compliance_regulatory', 'Fund Compliance & Regulatory Events',
    'Fund compliance and regulatory events.',
    'Conferences, forums and roundtables for CCOs, general counsel and compliance teams at private fund managers: SEC rule changes, exam readiness and the regulatory calendar. Every date verified at the organizer’s own page.',
    {
      title: 'Fund Compliance Conferences & Events {years} | FundOpsHQ',
      description: 'Upcoming private fund compliance conferences, CCO forums and regulatory roundtables in North America: SEC rules, exams, regulatory change. Dates checked.',
    }),
  topicCollection('fund-finance', 'fund_finance', 'Fund Finance Events',
    'Fund finance conferences and events.',
    'Subscription lines, NAV lending, GP financing: symposia, training and networking for fund CFOs, treasurers, lenders and fund finance counsel. Every date verified at the organizer’s own page.',
    {
      title: 'Fund Finance Conferences & Events {years} | FundOpsHQ',
      description: 'Upcoming fund finance conferences in North America: subscription lines, NAV lending, GP financing, for fund CFOs, treasurers and lenders. Dates checked.',
    }),
  topicCollection('accounting-tax', 'accounting_tax', 'Fund Accounting & Tax Events',
    'Accounting and tax events.',
    'CPE conferences, technical updates, and training for fund accounting, tax, and audit professionals across private markets. Every date verified at the source.'),
  topicCollection('tech-ai', 'technology_ai', 'Fund Technology & AI Events',
    'Fund technology and AI events.',
    'Where fund operations meets the stack — AI adoption, data, reconciliations, and ops technology events for COOs and CTOs. Every date verified at the source.'),
  topicCollection('fundraising', 'fundraising_ir', 'Fundraising & IR Events',
    'Fundraising and investor relations events.',
    'Cap-intro conferences, LP-GP forums, and emerging-manager programs for IR and capital formation teams. Every date verified at the source.'),
  // The people the board is for (2026-10-22): the events rated most useful to fund finance and operations
  // (ops_relevance = high). Their searches are what bring event traffic; /events links here as "CFO & ops".
  {
    slug: 'cfo-ops',
    title: 'Fund CFO & Operations Events',
    heading: 'Events for fund CFOs and operations teams.',
    blurb: 'CFO and COO forums, fund accounting and reporting, compliance and operations events across private markets — picked for finance and operations people at GPs, LPs and fund service providers. Every date verified at the source.',
    filter: { ops: '1' },
    boardParams: { ops: '1' },
  },
  // LPs (2026-10-22): the events whose audience is the allocators themselves (lib/events/audience.ts reads the
  // event's name and organizer), not /events/fundraising, which is the GP side of the room.
  {
    slug: 'lps',
    title: 'Events for LPs and Allocators',
    heading: 'Events for LPs and allocators.',
    blurb: 'Institutional investor forums, family office meetings, endowment, foundation and pension roundtables, and ILPA programs: where pensions, endowments, insurers and family offices meet. Every date verified at the organizer’s own page.',
    filter: { audience: 'lp' },
    boardParams: { audience: 'lp' },
    searchTitle: 'LP & Allocator Conferences {years} | FundOpsHQ',
    description: 'Upcoming conferences for LPs in North America: institutional investor forums, family office meetings, endowment and pension roundtables, ILPA. Dates checked.',
  },
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
export const FEATURED_COLLECTIONS = ['new-york', 'boston', 'chicago', 'miami', 'webinars', 'compliance', 'fund-finance', 'free']

/** /events' shortcut chips (2026-10-22): the five cities with the most events, then the topics this audience searches. */
export const CITY_SHORTCUTS = [
  { label: 'New York', slug: 'new-york' },
  { label: 'Chicago', slug: 'chicago' },
  { label: 'Miami', slug: 'miami' },
  { label: 'Washington DC', slug: 'washington-dc' },
  { label: 'Boston', slug: 'boston' },
]
export const TOPIC_SHORTCUTS = [
  { label: 'CFO & ops', slug: 'cfo-ops' },
  { label: 'Compliance', slug: 'compliance' },
  { label: 'Fund finance', slug: 'fund-finance' },
  { label: 'LPs', slug: 'lps' },
  { label: 'Fundraising & IR', slug: 'fundraising' },
]
