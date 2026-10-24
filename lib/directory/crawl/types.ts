/**
 * The directory crawler's shapes (2026-10-25). One registry row per firm
 * source (table directory_sources), one crawler for all five trades.
 *
 * Pipeline: discover (sitemap, listing, json or headless) → fetch each page
 * politely → extract with Claude Haiku → validate deterministically → write
 * the crawl as JSONL in the loader's exact shape → diff against what is
 * stored → (only with --apply) load.
 */
import type { CategoryId } from '../taxonomy'
import type { Office } from '../places'
import type { Education } from '../people'
import type { CityBasis } from '../provenance'

export type SourceMethod = 'sitemap' | 'listing' | 'json' | 'headless'
export type SourceStatus = 'ok' | 'blocked' | 'empty' | 'error'

/** Where a directory row's facts came from. */
export type PersonSource = 'firm_site' | 'event_speaker' | 'press_release'

/** One page that lists people's bio URLs (a listing), optionally paginated. */
export interface ListingSpec {
  url: string
  /** Fetch with headless Chrome (local only). */
  render?: boolean
  method?: 'GET' | 'POST'
  body?: string
  headers?: Record<string, string>
  /** ?page=1..max, stopping at the first page that adds nothing. */
  pages?: { param: string; start?: number; max?: number; step?: number }
  /** A listing that returns slugs only (an Algolia index): each `"slug":"x"` becomes this URL, {slug} replaced. */
  slug_template?: string
  /** Kept from the first crawlers for the record; --dump-dom cannot scroll or click, so such a page may list fewer. */
  scroll?: number
  more?: string
}

/** A JSON listing: pull slugs out of the body, build each bio URL from a template. */
export interface JsonSpec {
  /** A regex with one capture group: the person's slug. */
  slug_regex: string
  /** The public bio URL: "https://firm.com/people/{slug}". */
  bio_url_template: string
  /** When the bio content comes from another request (an XHR), the request to make; {slug} is replaced. */
  fetch?: { url: string; method?: 'GET' | 'POST'; body?: string; headers?: Record<string, string> }
}

/** Keep only the lines around a matching line, for a firm-wide list where one group is ours (Evercore). */
export interface TextFilter {
  line: string
  before?: number
  after?: number
  /** A header line put in front, so the model knows what it reads. */
  preface?: string
}

/** The registry's `selectors` jsonb: everything a source needs beyond the columns. */
export interface SourceSelectors {
  /** Listing pages that link to bio pages (method listing / headless). */
  listings?: ListingSpec[]
  /** Pages that list many people inline, each extracted in chunks (a team page). */
  team_pages?: { url: string; render?: boolean }[]
  /** A regex: a URL from a listing or sitemap that is NOT a bio (an index page, alumni). */
  exclude_pattern?: string
  /** Sitemap URLs to start from (default: robots.txt Sitemap lines, then /sitemap.xml). */
  sitemaps?: string[]
  /** Fetch bios with headless Chrome. */
  render_bios?: boolean
  json?: JsonSpec
  text_filter?: TextFilter
  /** The trades this source can produce (an accounting firm: audit and tax). Default: [category]. */
  categories?: CategoryId[]
  /** The last part of every slug: "jane-smith-<slug_suffix>". Kept stable so a refresh lands on the same rows. */
  slug_suffix: string
  /**
   * A firm whose own contact page lists one office, all in the US: a person with no office on their
   * page is at that one. Every such row is flagged in QA. `evidence_url` is the contact page.
   */
  default_office?: Office & { evidence_url: string }
  /** Other domains a bio_url / source_url may be on (an event site, a newswire). */
  approved_domains?: string[]
  /** Never fetch more than this many bio pages for the source (a cost and politeness cap). */
  max_pages?: number
  /**
   * The firm's whole business is this trade (a placement-agent boutique, a NAV lender): every
   * client-facing professional is in scope unless the page shows a back-office role.
   */
  pure_play?: boolean
  /** The origin pages are fetched from when it differs from https://www.<firm_domain> (non-www hosts). */
  origin?: string
}

/** A row of directory_sources. */
export interface SourceRow {
  id?: string
  key: string
  firm_name: string
  firm_domain: string
  category: CategoryId
  listing_url: string | null
  method: SourceMethod
  person_url_pattern: string | null
  selectors: SourceSelectors
  robots_ok: boolean | null
  status: SourceStatus
  last_run_at?: string | null
  last_counts?: Record<string, number> | null
  notes: string | null
  source: PersonSource
}

/** A page to read for people. */
export interface PageJob {
  /** What is fetched. */
  url: string
  /** What a profile links to (the public page). */
  bio_url: string
  /** A bio is one person; a team page lists many. */
  kind: 'bio' | 'team'
  render?: boolean
  method?: 'GET' | 'POST'
  body?: string
  headers?: Record<string, string>
}

/** A person as the model returned them, before any check. */
export interface ExtractedPerson {
  full_name: string
  title: string
  offices: { city: string; state: string; country: string }[]
  /** At most 10 words of the page where the office is stated ("Office: New York", "based in Boston"). */
  office_evidence?: string
  in_scope: boolean
  /** For a source with several trades: which one (accounting firm: audit or tax). */
  trade: string
  scope_evidence: string
  practice_areas: string[]
  practice_evidence: string
  client_focus: string[]
  represents: string[]
  bar_admissions: string[]
  education: { school: string; degree: string; year: number | null }[]
}

/** One extracted person, with where they were read. */
export interface Candidate {
  source_key: string
  page: PageJob
  fetched_at: string
  person: ExtractedPerson
  /** Chunk of the page, then position in the answer: sorting by these makes a run's result independent of model timing. */
  chunk?: number
  order?: number
}

/** A directory row in the loader's exact shape (scripts/directory/load-people.ts), plus provenance. */
export interface DirectoryRow {
  category: CategoryId
  full_name: string
  title: string
  firm_name: string
  firm_domain: string
  offices: Office[]
  practice_areas: string[]
  client_focus: string[]
  represents: string[]
  bar_admissions: string[]
  education: Education[]
  bio_url: string
  fetched_at: string
  slug: string
  source: PersonSource
  /** Where the facts were read when that is not the bio itself (a speaker page, a press release); else null. */
  source_url: string | null
  /** How the office city is known (lib/directory/provenance.ts). */
  city_basis: CityBasis
  /** The page the office came from when it is not the source (the firm's contact page). */
  office_source_url: string | null
}
