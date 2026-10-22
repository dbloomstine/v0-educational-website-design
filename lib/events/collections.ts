import type { EventQueryParams } from './api'
import { brandedTitle, metaDescription } from '../seo'

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
  /**
   * The title search results show, `{years}` filled by `eventSeasonLabel` and the brand added when it fits
   * (`brandedTitle`); else "<title> | FundOpsHQ".
   */
  searchTitle?: string
  /**
   * The meta description (a search result's two lines), else the blurb cut to fit. A leading `{Upcoming}` reads
   * "14 upcoming" when the page knows how many it lists, "Upcoming" when it does not (`collectionDescription`).
   */
  description?: string
}

/** The year and month (1-12) it is in New York: the board's day turns at midnight Eastern, not UTC. */
function newYorkYearMonth(today: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'numeric' }).formatToParts(today)
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return { year: part('year'), month: part('month') }
}

/**
 * The years a city or topic page's title names, so the title never goes stale (2026-10-22). The board looks ahead
 * about six months, so from October the next year's events are on it too and people search them by that year:
 * October to December 2026 read "2026–27", January to September 2027 read "2027". Computed from the date in New
 * York at render time (the pages rebuild hourly), never written into a title. An en dash, as in the topic titles
 * that shipped this morning; a search engine reads it as the hyphen people type.
 */
export function eventSeasonLabel(today: Date = new Date()): string {
  const { year, month } = newYorkYearMonth(today)
  return month >= 10 ? `${year}–${String(year + 1).slice(-2)}` : String(year)
}

/** The page title for a collection, as search results show it. */
export function collectionTitle(collection: EventCollection, today: Date = new Date()): string {
  return collection.searchTitle
    ? brandedTitle(collection.searchTitle.replace('{years}', eventSeasonLabel(today)))
    : `${collection.title} | FundOpsHQ`
}

/**
 * The meta description for a collection (2026-10-22): its own line with the number of upcoming events in front
 * when the page has it ("14 upcoming fund compliance conferences…"), from the same read that fills the list. Under
 * two, or not known, it reads "Upcoming…": "1 upcoming conferences" is wrong and "0 upcoming" sells nothing.
 */
export function collectionDescription(collection: EventCollection, upcoming: number | null = null): string {
  if (!collection.description) return metaDescription(collection.blurb)
  const lead = upcoming != null && upcoming >= 2 ? `${upcoming} upcoming` : 'Upcoming'
  return metaDescription(collection.description.replace('{Upcoming}', lead))
}

/** A month's heading on a city or topic page, "November 2026", and the events that start in it. */
export interface EventMonth<E> {
  key: string
  label: string
  events: E[]
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/**
 * The list on a city or topic page, under a heading per month (2026-10-22: one list with no H2s until then). By
 * the start date as stored (YYYY-MM-DD, the event's own day), keeping the feed's order within a month.
 */
export function groupEventsByMonth<E extends { startDate: string }>(events: E[]): EventMonth<E>[] {
  const months = new Map<string, EventMonth<E>>()
  for (const e of events) {
    const key = e.startDate.slice(0, 7)
    let month = months.get(key)
    if (!month) {
      const [y, m] = key.split('-').map(Number)
      month = { key, label: `${MONTH_NAMES[m - 1]} ${y}`, events: [] }
      months.set(key, month)
    }
    month.events.push(e)
  }
  return [...months.values()].sort((a, b) => a.key.localeCompare(b.key))
}

function cityCollection(slug: string, city: string, flavor: string): EventCollection {
  return {
    slug,
    title: `${city} Private Markets Events`,
    heading: `Industry events in ${city}.`,
    blurb: `Upcoming private markets conferences, forums, networking, and training in ${city} — ${flavor} Every date verified at the source, refreshed weekly.`,
    filter: { city },
    boardParams: { city },
    // What people type (2026-10-22): "private equity events chicago", "private equity conferences 2026". Was
    // "Chicago Private Markets Events | FundOpsHQ", with no year.
    searchTitle: `${city} Private Equity Events & Conferences {years}`,
    description: `{Upcoming} private equity and private markets events in ${city}: conferences, forums and networking for GPs, LPs, and fund service providers.`,
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
      title: 'Fund Compliance Conferences & Events {years}',
      description: '{Upcoming} private fund compliance conferences, CCO forums and regulatory roundtables in North America: SEC rules, exams and rule changes. Dates checked.',
    }),
  topicCollection('fund-finance', 'fund_finance', 'Fund Finance Events',
    'Fund finance conferences and events.',
    'Subscription lines, NAV lending, GP financing: symposia, training and networking for fund CFOs, treasurers, lenders and fund finance counsel. Every date verified at the organizer’s own page.',
    {
      title: 'Fund Finance Conferences & Events {years}',
      description: '{Upcoming} fund finance conferences in North America: subscription lines, NAV lending, GP finance, for fund CFOs, treasurers and lenders. Dates checked.',
    }),
  topicCollection('accounting-tax', 'accounting_tax', 'Fund Accounting & Tax Events',
    'Accounting and tax events.',
    'CPE conferences, technical updates, and training for fund accounting, tax, and audit professionals across private markets. Every date verified at the source.',
    {
      title: 'Fund Accounting & Tax Conferences {years}',
      description: '{Upcoming} fund accounting and tax conferences, CPE updates and training for accounting, tax and audit teams across private markets in North America.',
    }),
  topicCollection('tech-ai', 'technology_ai', 'Fund Technology & AI Events',
    'Fund technology and AI events.',
    'Where fund operations meets the stack — AI adoption, data, reconciliations, and ops technology events for COOs and CTOs. Every date verified at the source.',
    {
      title: 'Private Equity Tech & AI Conferences {years}',
      description: '{Upcoming} fund technology and AI conferences: AI adoption, data and operations tech for COOs, CFOs and CTOs at GPs, LPs, and fund service providers.',
    }),
  topicCollection('fundraising', 'fundraising_ir', 'Fundraising & IR Events',
    'Fundraising and investor relations events.',
    'Cap-intro conferences, LP-GP forums, and emerging-manager programs for IR and capital formation teams. Every date verified at the source.',
    {
      title: 'Fundraising & Investor Relations Conferences {years}',
      description: '{Upcoming} fundraising and investor relations conferences: cap intros, LP-GP forums and emerging-manager programs for IR and capital formation teams.',
    }),
  // The people the board is for (2026-10-22): the events rated most useful to fund finance and operations
  // (ops_relevance = high). Their searches are what bring event traffic; /events links here as "CFO & ops".
  {
    slug: 'cfo-ops',
    title: 'Fund CFO & Operations Events',
    heading: 'Events for fund CFOs and operations teams.',
    blurb: 'CFO and COO forums, fund accounting and reporting, compliance and operations events across private markets — picked for finance and operations people at GPs, LPs and fund service providers. Every date verified at the source.',
    filter: { ops: '1' },
    boardParams: { ops: '1' },
    // "private equity CFO conferences 2026" (2026-10-22, the SEO audit's top event query): was "Fund CFO & Operations Events".
    searchTitle: 'Private Equity CFO & COO Conferences {years}',
    description: '{Upcoming} CFO and COO forums, fund accounting, reporting and operations conferences for finance and ops teams at GPs, LPs, and fund service providers.',
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
    searchTitle: 'LP & Allocator Conferences {years}',
    description: '{Upcoming} LP conferences in North America: institutional investor forums, family office events, endowment and pension roundtables, ILPA. Dates checked.',
  },
  // Kinds & specials
  {
    slug: 'webinars',
    title: 'Fund Industry Webinars',
    heading: 'Webinars and virtual training.',
    blurb: 'Attend from anywhere — webcasts, virtual workshops, and online training from associations, law firms, and accounting firms serving private markets. Times listed with timezones; every date verified at the source.',
    filter: { kind: 'webinar,training', format: 'virtual' },
    boardParams: { kind: 'webinar,training' },
    // No year: a webinar is weeks out, and nobody searches one by season (2026-10-22).
    searchTitle: 'Private Equity & Fund Industry Webinars',
    description: '{Upcoming} private equity and fund industry webinars and virtual training from associations, law firms and accounting firms serving private markets.',
  },
  {
    slug: 'networking',
    title: 'Private Markets Networking Events',
    heading: 'Networking and city-circuit events.',
    blurb: 'Receptions, chapter programs, and peer gatherings across the major fund hubs — the events people actually meet at. Every date verified at the source.',
    filter: { kind: 'networking,roundtable' },
    boardParams: { kind: 'networking,roundtable' },
    searchTitle: 'Private Equity Networking Events {years}',
    description: '{Upcoming} private equity networking events: receptions, chapter programs and peer roundtables in New York, Chicago, Boston and the other fund hubs.',
  },
  {
    slug: 'free',
    title: 'Free Fund Industry Events',
    heading: 'Free events and webinars.',
    blurb: 'No-cost webinars, seminars, and networking across private markets — most hosted by law firms, accounting firms, and industry associations. Every date verified at the source.',
    filter: { cost: 'free' },
    boardParams: { cost: 'free' },
    searchTitle: 'Free Private Equity Events & Webinars {years}',
    description: '{Upcoming} free private equity and fund events: webinars, seminars and networking hosted by law firms, accounting firms and industry associations.',
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
