/**
 * Query high-value articles for the daily newsletter.
 *
 * Pipeline:
 *   1. Pull last 26h of classified articles
 *   2. Drop govt/NGO program announcements and blocked sources
 *   3. Same-day story dedup (shared helpers in lib/news/story-dedup)
 *   4. Cross-edition firm+fund fingerprint dedup (last 3 editions)
 *   5. Quality gate — drop articles with no firm/fund identity or
 *      placeholder "not disclosed" tldrs
 *   6. Minimum fund size filter for fund activity
 *   7. Split into sections, including dedicated LP Commitments
 *   8. Rank, cap, order
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  isSameStory,
  normalizeFirmName,
  fundSizesMatch,
  titleJaccard,
  titlesShareSignificantNumber,
} from '@/lib/news/story-dedup'
import { cleanHeadline } from '@/lib/news/constants'
import {
  clusterBy,
  entityKey,
  entityMentioned,
  isDigest,
  isRoundup,
  findPriorStory,
  sameStoryLoose,
  storyFamily,
  type StoryLike,
} from './story-links'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any>

const FUND_ACTIVITY_TYPES = [
  'fund_launch', 'fund_close', 'capital_raise',
]

const PEOPLE_TYPES = [
  'executive_hire', 'executive_change', 'executive_departure',
]

const DEALS_TYPES = [
  'acquisition', 'merger',
]

const REGULATORY_TYPES = [
  'regulatory_action',
]

export const ALL_NEWSLETTER_TYPES = [
  ...FUND_ACTIVITY_TYPES,
  ...PEOPLE_TYPES,
  ...DEALS_TYPES,
  ...REGULATORY_TYPES,
]

const CATEGORY_ORDER = [
  'PE', 'VC', 'credit', 'hedge', 'real_estate',
  'infrastructure', 'secondaries', 'gp_stakes',
]

const ASSET_CLASSES = new Set(CATEGORY_ORDER)

const CATEGORY_LABELS: Record<string, string> = {
  PE: 'Private Equity',
  VC: 'Venture Capital',
  credit: 'Credit',
  hedge: 'Hedge Funds',
  real_estate: 'Real Estate',
  infrastructure: 'Infrastructure',
  secondaries: 'Secondaries',
  gp_stakes: 'GP Stakes',
  lp_commitments: 'LP Commitments',
  service_providers: 'Service Providers',
  people_moves: 'People Moves',
  deals: 'Deals',
  regulatory: 'Regulation',
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  fund_launch: 'Launch',
  fund_close: 'Close',
  capital_raise: 'Raise',
  executive_hire: 'Hire',
  executive_change: 'Exec Move',
  executive_departure: 'Departure',
  acquisition: 'M&A',
  merger: 'M&A',
  regulatory_action: 'Reg',
}

/**
 * Minimum fund size in USD millions to include in newsletter (filters noise).
 *
 * Lowered from 25 to 10 in 2026-08. Debut and emerging-manager vehicles
 * routinely land in the $10–25M band and the old floor silently deleted every
 * one of them — a 30-day audit found 7 qualifying fund events dropped here and
 * zero sub-$25M stories ever published.
 */
const MIN_FUND_SIZE_MILLIONS = 10

/**
 * The Emerging Managers section was removed 2026-08-15 on reader feedback.
 * It was a pure size split (any fund event ≤ $250M), which routinely filed
 * multi-billion-AUM firms' smaller vehicles — Mirae Asset's $135M first
 * close, an LP's RFP — under "Emerging Managers". Small fund events now
 * stay in their asset-class section, sorted by size like everything else.
 */

/**
 * Cap on stories from a single firm per edition. Without it one firm's news
 * cycle can occupy several slots — KKR appeared 15 times across 10 editions in
 * the 30-day audit — crowding out the smaller managers above.
 */
const MAX_ARTICLES_PER_FIRM = 2

/**
 * Look back this many recent editions for cross-day dedup (fingerprints,
 * titles, people, and the entity memory in story-links).
 *
 * Was 3. The 2026-10 audit found the same story returning four and five
 * editions later — a verbatim Lowenstein Sandler headline on 9/23 and 9/27,
 * "HIG sells GDT to Softcat" on 9/18 and 9/22 — because trade outlets and the
 * Google News mirror keep re-publishing for most of a week. One week of
 * memory covers that tail.
 */
const CROSS_EDITION_LOOKBACK = 7

/**
 * Extended lookback for fund-activity events, which are one-time happenings
 * that should never reappear. A 2026-06 review caught Conifer Infrastructure's
 * $900M close running on 6/18 and again 9 editions later as the 6/27 subject
 * line — well beyond the 3-edition window.
 */
const EXTENDED_CLOSE_LOOKBACK = 14

/**
 * Event types treated as one underlying "a fund raised money" event for
 * extended-window suppression.
 *
 * capital_raise is included deliberately. Outlets describe a single raise
 * inconsistently — one writes "closes $4.75B fund" (fund_close), another
 * "raises $4.75B" (capital_raise) — and the classifier faithfully mirrors
 * whichever verb it sees. Keying on the raw event type therefore let the same
 * raise through twice. Real case, 2026-07: HarbourVest's $4.75B co-investment
 * vehicle ran on 7/11 as a fund_close and again on 7/16 as a capital_raise.
 */
const EXTENDED_FINGERPRINT_TYPES = new Set(['fund_close', 'fund_launch', 'capital_raise'])

/**
 * Relative tolerance for matching a candidate against a fund event already
 * published in the extended window.
 *
 * This replaced a $500M-bucketed hash key, which failed on exactly the case it
 * existed to catch. Bucket edges are absolute, so the same HarbourVest vehicle
 * reported as "$4.75 billion" (→ $5,000M band) and later as "tops $4B" (→
 * $4,000M band) hashed to different keys and evaded suppression, even though
 * the figures are 16% apart and obviously the same raise.
 *
 * A relative comparison has no edges. 25% is wide enough to absorb rounding,
 * currency drift and vague restatement, and still narrow enough to preserve
 * the distinction the buckets were protecting: a $400M first close and a $900M
 * final close of the same fund are 55% apart and stay separate stories.
 */
const EXTENDED_SIZE_TOLERANCE = 0.25

/**
 * Source tier ranking for picking the best article per story.
 * Lower number = higher priority. Matched case-insensitively.
 */
const SOURCE_TIER_RAW: Record<string, number> = {
  'Bloomberg.com': 1, WSJ: 1, Reuters: 2,
  'Financial Times': 2, 'Pensions & Investments': 3,
  PitchBook: 3, Buyouts: 3, 'Buyouts Insider': 3,
  'PE Hub': 4, 'Institutional Investor': 4,
  TechCrunch: 5, 'TechCrunch VC': 5, 'Venture Capital Journal': 5,
  'Private Equity International': 5, 'Private Equity International | PEI': 5,
  'Secondaries Investor': 5, 'Infrastructure Investor': 5,
  'Private Debt Investor': 5, PERE: 5, 'Private Equity Wire': 5,
  'Hedge Week': 6, Hedgeweek: 6, 'Alternative Credit Investor': 6,
  // Middle Market Growth-style punning headlines ("Butterfly Orders Takeout",
  // "C.H. Guenther Brings Home the Hushpuppies") tell a scanning reader
  // nothing. When another outlet covers the same deal, its headline wins.
  'Private Equity Professional': 18,
  AltAssets: 7, 'AltAssets Private Equity News': 7,
  'Commercial Observer': 8, 'ESG Today': 8,
  'Business Wire': 10, 'PR Newswire': 10, 'PR Newswire Financial': 10,
  'Alternatives Watch': 10, "Crain's Chicago Business": 10,
  'The Business Journals': 12,
  'Yahoo Finance': 15, MSN: 15,
  'Digital Journal': 20, citybiz: 20, 'Pulse 2.0': 20,
  'The Tech Buzz': 25, 'HedgeCo.Net': 25,
  'news.google.com': 30,
  'mexc.co': 40, 'The Manila Times': 40, 'National Today': 40, 'USA Today': 30,
}

const SOURCE_TIER: Record<string, number> = Object.fromEntries(
  Object.entries(SOURCE_TIER_RAW).map(([k, v]) => [k.toLowerCase(), v])
)

export function sourceTier(name: string | null | undefined): number {
  if (!name) return 50
  return SOURCE_TIER[name.toLowerCase()] ?? 50
}

/** Sources dropped outright — social platforms, low-quality aggregators. */
const BLOCKED_SOURCES = new Set<string>([
  'facebook.com',
  'twitter.com',
  'x.com',
  'reddit.com',
  'youtube.com',
  't.me',
])

/** Title patterns that indicate government / NGO / municipal programs. */
const GOVT_PROGRAM_PATTERNS = [
  /\bkementerian\b/i,
  /\bministry of\b/i,
  /\bfederation of (canadian|american|european) municipalit/i,
  /\bwelcomes launch of\b/i,
  /\bmunicipal fund\b/i,
  /\bpublic[- ]private partnership fund\b/i,
  /\bbuild communities strong\b/i,
  /\beuropean investment bank\b.*\bprogramme\b/i,
]

/**
 * Startup funding-round patterns. Classifier rule 2 says Series A/B/C and
 * venture rounds are portfolio-company news, not fund activity — but Haiku
 * misses the big ones ("Databricks Closes $5 Billion Round at $190 Billion"
 * ran as a Venture Capital move on 2026-08-16). Belt-and-suspenders filter:
 * a fund-activity story with no extracted fund name whose title reads like a
 * company round is dropped. Real fund events name a fund or say "fund".
 */
const STARTUP_ROUND_PATTERNS = [
  /\bseries [a-k]\b/i,
  /\b(seed|pre-seed) (round|funding)\b/i,
  /\bfundraising round\b/i,
  /\bfunding round\b/i,
  /\bround (at|led by|values)\b/i,
  /\b(closes?|raises?|secures?|lands) \$[\d.,]+\s?(billion|million|bn|mn|[bm])?\s?(round|in funding)\b/i,
]

export function isStartupRound(article: NewsletterArticle): boolean {
  if (!FUND_ACTIVITY_TYPES.includes(article.eventType ?? '')) return false
  if (article.fundName) return false
  if (/\bfund\b/i.test(article.title)) return false
  return STARTUP_ROUND_PATTERNS.some((p) => p.test(article.title))
}

/** Placeholder tldr markers — stories with no real information. */
const PLACEHOLDER_TLDR_PATTERNS = [
  /not (detailed|disclosed|specified|publicly|available)/i,
  /not provided/i,
  /amounts? not disclosed/i,
  /no (fund )?size .* specified/i,
]

/** LP name patterns for pension/institutional allocators. */
const LP_NAME_PATTERNS = [
  /\bteachers?\b/i,
  /\bemployees?\b/i,
  /\bpension\b/i,
  /\bretirement\b/i,
  /\bendowment\b/i,
  /\bsovereign wealth\b/i,
  /\bfire\s*(and|&)?\s*police\b/i,
  /\buniversity of\b/i,
  /\bfoundation\b/i,
  /\b(county|city|state) of [a-z]/i,
  /\bSERS\b/,
  /\bPERS\b/,
  /\bCERS\b/,
  /\bSTRS\b/,
  /\bSJCERA\b/i,
  /\bCalPERS\b/i,
  /\bCalSTRS\b/i,
  /\bTRS\b/,
  /\bLGPS\b/i,
  // Compound pension acronyms, where the system code is welded onto a state or
  // city prefix: NYSTRS, OPERS, MOSERS, LACERS. Every bare pattern above misses
  // these — there is no word boundary inside "NYSTRS" — so they were read as GP
  // fund activity instead of LP allocations. Observed 2026-08-08: "NYSTRS sets
  // private debt pacing for 2027" landed in Private Equity carrying a $1.3B
  // pill and ran as the subject line, presenting an LP pacing plan as a close.
  //
  // Case-sensitive on purpose: a case-insensitive version would match ordinary
  // words ending in these letters ("developers", "helpers"), and every real
  // pension acronym is upper-case.
  /\b[A-Z]{1,8}(?:STRS|SERS|PERS|CERS)\b/,
  // …and the mixed-case ones: "PennSERS", "LACERA", "SBCERA".
  /\b[A-Z][a-z]*[A-Z]{0,8}(?:SERS|PERS|STRS|CERS|CERA)\b/,
  /\bMass ?PRIM\b/i,
  // Named allocators the generic words above never reach. In the 2026-10
  // audit "La Caisse invests $75M in AlphaFixe", "British Business Bank backs
  // Advent funds with £135m" and "NZ Super adds $50m to Domain" all ran in
  // GP fund sections as though the manager had closed a fund.
  /\b(la )?caisse\b|\bCDPQ\b/i,
  /\bCPP Investments\b|\bCPPIB\b|\bOTPP\b|\bOMERS\b|\bPSP Investments\b|\bAIMCo\b|\bBCI\b/,
  /\bNZ Super\b|\bFuture Fund\b|\bAustralianSuper\b|\bsuperannuation\b/i,
  /\bGIC\b(?! trader)|\bTemasek\b|\bADIA\b|\bMubadala\b|\bPIF\b|\bQIA\b|\bQatar Investment Authority\b/,
  /\bKorea Investment Corp\b|\bKIC\b|\bNational Pension Service\b|\bGPIF\b|\bNorges\b|\bNBIM\b|\bPGGM\b|\bAPG\b/,
  /\bBritish Business Bank\b|\bEuropean Investment Fund\b|\bEIF\b|\bBritish International Investment\b/,
  /\bsovereign\b|\bcomptroller\b|\bborough\b|\bpensions?\b|\bfamily office\b/i,
  // 2026-10-08 audit of 10-01…10-08: "Norwegian wealth fund" (the pattern above
  // wants "sovereign"), "New Mexico State Investment Council", "N.Y. State
  // Common", "Texas County & District", HFRRF, KVIC and IFC all ran as GP fund
  // news, and three of them as top stories.
  /\bwealth funds?\b|\bstate (investment (council|board)|common|treasur\w+)\b/i,
  /\bCounty\b|\bcount(y|ies)\b.*\b(district|retirement|employees)\b/i,
  /\bKVIC\b|\bKorea Venture Investment\b|\bHFRRF\b/,
  // Development-finance institutions allocate to funds like any LP.
  /\b(IFC|EBRD|EIB|DFC|FMO|Proparco|IDB Invest)\b/,
]

/**
 * A firm_name that is only a US state ("New Mexico adds over $1bn across
 * bustling private markets"): a state is an allocator, never a GP.
 */
const US_STATE_ONLY =
  /^(?:the )?(?:state of )?(?:alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming)$/i

/** PEI's "Investor Intentions:" column is always one allocator's plan, whatever acronym its firm_name carries. */
const LP_COLUMN = /^Investor Intentions:/i

/**
 * Service-provider detection for the dedicated Service Providers section
 * (added 2026-08-15 on reader feedback — law firms, fund admins, auditors,
 * valuation shops, fund finance and prime brokerage are core audience but
 * had no home; a King & Spalding fund-finance team hire ran with no
 * category at all).
 *
 * Two signals, either is enough:
 *   1. The classifier tagged fund_categories: ['service_provider']
 *      (added to the prompt the same day — only future articles carry it).
 *   2. Title or firm name matches provider patterns / a known-provider list
 *      (covers the existing backlog until reclassification).
 */
const SERVICE_PROVIDER_TITLE_PATTERNS = [
  /\blaw firms?\b/i,
  /\b(fund formation|funds? (counsel|lawyers?|attorneys?))\b/i,
  /\bfund (administration|administrators?|admin)\b/i,
  /\bfund financ(e|ing)\b/i,
  /\b(subscription (line|credit)|NAV (loan|lending|facility))\b/i,
  /\bprime broker(age|s)?\b/i,
  /\b(custodian|custody|depositary|transfer agent)\b/i,
  /\b(fund )?(audit(or|ors)?|assurance) (firm|practice|team)\b/i,
  /\bvaluation (firm|services|practice|advisory)\b/i,
  /\bplacement agent\b/i,
  /\bfund tech(nology)?\b/i,
]

const KNOWN_SERVICE_PROVIDERS = [
  // Law
  'kirkland & ellis', 'latham & watkins', 'proskauer', 'ropes & gray',
  'debevoise', 'simpson thacher', 'skadden', 'paul weiss', 'paul hastings',
  'goodwin', 'dechert', 'willkie', 'akin gump', 'schulte roth',
  'morgan lewis', 'gibson dunn', 'cleary gottlieb', 'king & spalding',
  'fried frank', 'sidley austin', 'clifford chance', 'linklaters',
  'travers smith', 'macfarlanes', 'maples group', 'walkers', 'ogier',
  'carey olsen', 'mourant', 'appleby',
  // Fund admin / services
  'citco', 'ss&c', 'apex group', 'alter domus', 'gen ii', 'iq-eq',
  'jtc group', 'csc global', 'ocorian', 'waystone', 'aztec group',
  'northern trust', 'state street', 'bny mellon', 'sei investments',
  'standish management', 'ultimus', 'juniper square', 'carta',
  // Valuation / accounting / consulting
  'kroll', 'houlihan lokey', 'lincoln international', 'stout',
  'eisneramper', 'rsm us', 'grant thornton', 'bdo', 'cohen & company',
  'deloitte', 'kpmg', 'ernst & young', 'pwc', 'pricewaterhousecoopers',
  'aca group', 'accelex', 'mercer', 'cambridge associates', 'albourne',
  // Law, second tranche (every one of these ran in the 2026-10 audit window)
  'weil', 'sullivan & cromwell', 'lowenstein sandler', 'mayer brown',
  'a&o shearman', 'allen & overy', 'troutman', 'winston', 'davis polk',
  'k&l gates', 'mcdermott', 'reed smith', 'seward & kissel', 'katten',
  'stradley', 'vedder', 'haynes boone', 'cooley', 'gunderson', 'orrick',
  'wilson sonsini', 'fenwick', 'hogan lovells', 'freshfields', 'white & case',
  'jones day', 'dla piper', 'norton rose', 'ashurst', 'herbert smith',
  'stephenson harwood', 'vinson & elkins', 'latham', 'kirkland',
  // Administration / fund tech / placement
  'vistra', 'tmf group', 'intertrust', 'sanne', 'formidium', 'nav fund',
  'petra funds', 'standish', '73 strings', 'allvue', 'dynamo software',
  'canoe intelligence', 'chronograph', 'arcesium', 'clearwater analytics',
  'campbell lutyens', 'monument group', 'eaton partners', 'park hill',
  'alvarez & marsal',
]

/** A name shaped like a provider even when it is not on the list. */
const PROVIDER_SHAPED = /\b(llp|law|legal|solicitors|attorneys|fund (services|solutions|administration)|fund admin\w*|trust company|corporate services)\b/i
function isProviderFirm(firmName: string | null): boolean {
  const firm = (firmName ?? '').toLowerCase()
  if (!firm) return false
  if (KNOWN_SERVICE_PROVIDERS.some((p) => firm.includes(p))) return true
  return PROVIDER_SHAPED.test(firm)
}

/**
 * Service Providers holds people and firm news AT a provider. Called only for
 * non-fund, non-regulatory rows — a fund close is fund news and a regulator's
 * action is regulatory news, whoever's name the headline leads with.
 *
 * The classifier's `service_provider` tag alone is not trusted: it marks any
 * story with a fund-services angle, including managers' own hires.
 */
function isServiceProvider(article: NewsletterArticle): boolean {
  if (isProviderFirm(article.firmName)) return true
  return SERVICE_PROVIDER_TITLE_PATTERNS.some((p) => p.test(article.title))
}

export interface NewsletterArticle {
  id: string
  title: string
  sourceUrl: string
  sourceName: string | null
  publishedDate: string | null
  articleType: string | null
  eventType: string | null
  fundCategories: string[]
  isHighSignal: boolean
  relevanceScore: number | null
  tldr: string | null
  firmName: string | null
  firmDomain: string | null
  fundName: string | null
  fundSizeUsdMillions: number | null
  fundStrategy: string | null
  geography: string[]
  personName: string | null
  personTitle: string | null
  closeType: string | null
  /**
   * Other firms involved in the story (co-managers, acquirer/target,
   * JV partners) from entity extraction — high-confidence firm entities
   * distinct from firmName. Drives the multi-favicon rendering.
   */
  coFirms: string[]
  /** Other sources that also covered this story (populated by story dedup) */
  alsoCoveredBy: string[]
  /** Every firm and person the story names, for bolding in the headline. */
  headlineEntities: string[]
  /** Comparison keys for every firm/fund named (see story-links). */
  entityKeys: string[]
  /** Comparison keys for every person named. */
  personKeys: string[]
  /**
   * False when the row sits in a fund section but is not a fundraise a reader
   * would expect behind "Firm $X": a wind-down, a CLO pricing, a company
   * financing. Such rows still run; they never lead the subject or preheader.
   */
  leadEligible: boolean
}

export interface ArticleGroup {
  category: string
  label: string
  articles: NewsletterArticle[]
}

export interface NewsletterContent {
  groups: ArticleGroup[]
  totalArticles: number
  articleIds: string[]
  /** Why each candidate that did not run was dropped. Audit/replay only. */
  dropped?: Array<{ id: string; title: string; reason: string }>
}

const LP_VERB_PATTERN = /\b(commits?|allocates?|makes? [^,;]{0,24}(investment|commitment|allocation)|adds? [$€£]?[\d.]+\s?(m|bn|million|billion)?)\b[^,;]*\b(in|to|into)\b[^,;]*\b(funds?|strategy|account|mandate|vehicle)\b/i

/**
 * The allocator is named: by the row's firm_name, or by the "Investor
 * Intentions:" column label. This is the strong test; a title that merely
 * mentions a pension is the weak one (isLpCommitment).
 */
export function isLpByName(article: Pick<NewsletterArticle, 'eventType' | 'firmName' | 'title'>): boolean {
  if (article.eventType !== 'capital_raise') return false
  if (LP_COLUMN.test(article.title)) return true
  const firm = article.firmName
  return Boolean(firm && (US_STATE_ONLY.test(firm.trim()) || LP_NAME_PATTERNS.some((p) => p.test(firm))))
}

/**
 * The part of a headline that is about its subject. "Tishman Speyer Hits $395M
 * Second Close of Korea Living Fund With German Pension Backing" is a fund
 * raise that names a backer; what follows with/from/via/by is not the subject.
 */
function headlineSubject(title: string): string {
  const cut = title.search(/\b(with|from|via|by|alongside|amid|backed|backing)\b/i)
  return cut > 0 ? title.slice(0, cut) : title
}

export function isLpCommitment(article: NewsletterArticle): boolean {
  if (article.eventType !== 'capital_raise') return false
  // Primary path: firm_name is the LP (e.g. "Arkansas Teacher Retirement System")
  if (isLpByName(article)) return true
  // A row with a close stage is a fund event whatever its headline says (as in
  // isDealShaped): the second close of Tishman Speyer's Korea fund is a GP's
  // raise even with a German pension named in the headline.
  if (article.closeType && article.closeType !== 'launch') return false
  // Fallback: Claude sometimes extracts the underlying GP as firm_name on
  // stories like "Arkansas Teacher commits $200M to Ares Credit Fund". If
  // an LP pattern leads the title, treat it as an LP commitment.
  if (LP_NAME_PATTERNS.some((p) => p.test(headlineSubject(article.title)))) {
    return true
  }
  // An allocator's verb pointed at someone else's vehicle: "Skandia makes
  // GBP19m investment in Liontrust absolute return fund". "To fund" is a
  // verb, not a vehicle: "BC Partners Credit commits up to $300m to fund LIV
  // Golf restructuring" is a financing.
  if (LP_VERB_PATTERN.test(article.title.replace(/\bto fund\b/gi, 'to finance'))) return true
  return false
}

function isGovtProgram(article: NewsletterArticle): boolean {
  const src = article.sourceName?.toLowerCase() ?? ''
  if (BLOCKED_SOURCES.has(src)) return true
  return GOVT_PROGRAM_PATTERNS.some((p) => p.test(article.title))
}

/**
 * Quality gate: drop articles with no identifiable entity or real info.
 * - No firm AND no fund → unknown issuer
 * - Placeholder tldr AND no fund size → no real information
 */
function passesQualityGate(article: NewsletterArticle): boolean {
  // A regulator's own action often has no "firm" at all ("SEC Risk Alert
  // Highlights…"); the headline is the identity.
  if (storyFamily(article.eventType) === 'regulatory') return true
  if (!article.firmName && !article.fundName) return false
  if (!article.fundSizeUsdMillions && article.tldr) {
    if (PLACEHOLDER_TLDR_PATTERNS.some((p) => p.test(article.tldr!))) {
      return false
    }
  }
  return true
}

export async function queryNewsletterArticles(
  supabase: DbClient,
  hoursBack: number = 26,
  opts: { excludePriorEdition?: boolean } = {}
): Promise<NewsletterContent> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()

  // ─── Fetch prior editions' article IDs + firm/fund fingerprints ────────
  const priorExclusions = opts.excludePriorEdition === false
    ? {
        ids: new Set<string>(),
        fingerprints: new Set<string>(),
        priorEvents: [] as PriorFundEvent[],
        priorTitles: [] as PriorTitle[],
        priorPeople: new Set<string>(),
        priorStories: [] as StoryLike[],
      }
    : await getPriorEditionExclusions(supabase)

  const { data: rows, error } = await supabase
    .from('news_items')
    .select('id, title, source_url, source_name, published_date, article_type, fund_categories, is_high_signal, relevance_score, tldr, entities_raw, extracted_data, event_type')
    .eq('classification_status', 'complete')
    .eq('is_duplicate', false)
    .gte('published_date', since)
    .or('is_high_signal.eq.true,relevance_score.gte.0.3')
    .in('article_type', ALL_NEWSLETTER_TYPES)
    .order('published_date', { ascending: false })
    .limit(500)

  if (error) {
    throw new Error(`Failed to query articles: ${error.message}`)
  }

  return assembleNewsletter(rows ?? [], priorExclusions)
}

// ─── Row → article ──────────────────────────────────────────────────────────

const TITLE_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'into', 'over', 'after', 'amid', 'its', 'new', 'first',
  'fund', 'funds', 'capital', 'partners', 'group', 'management', 'private', 'equity', 'credit',
  'million', 'billion', 'raises', 'closes', 'launches', 'says', 'year', 'firm', 'deal',
])
function contentTokens(text: string | null | undefined): Set<string> {
  return new Set(
    (text ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !TITLE_STOPWORDS.has(w))
      // crude stem so "standards"/"standard", "launches"/"launched" meet
      .map((w) => (w.length > 5 ? w.replace(/(ies|es|ed|ing|s)$/, '') : w))
  )
}

/** "Financial Services Council" → "fsc": headlines often use the initials. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Z0-9]/.test(w))
    .map((w) => w[0])
    .join('')
    .toLowerCase()
}

/**
 * True when the extracted details belong to a different article. Until
 * 2026-10 the classifier mapped its batch output back by array position, so
 * one skipped item shifted every later result by one. Real cases, 9/30: the
 * headline "Audax Agrees to Sell GCG to Rexel for $1.4 Billion" carried
 * HighPost Capital's hire (and ran under People Moves) while "HighPost Capital
 * Forms Aerospace… Vertical" carried the Audax sale (and ran under Deals).
 *
 * The classifier now echoes ids, but rows written before the fix remain, and
 * any future slip should fail closed: a headline that names neither the
 * extracted firm nor a single word of its own summary is not trusted.
 */
export function extractionMisaligned(
  title: string,
  firmName: string | null,
  tldr: string | null,
): boolean {
  if (!tldr) return false
  if (firmName && entityMentioned(firmName, title, null)) return false
  if (firmName) {
    const abbr = initials(firmName)
    if (abbr.length >= 3 && new RegExp(`\\b${abbr}\\b`, 'i').test(title)) return false
  }
  const t = contentTokens(title)
  for (const w of contentTokens(tldr)) if (t.has(w)) return false
  return true
}

function splitPeople(names: string | null): string[] {
  if (!names) return []
  return names.split(/\s*(?:;|,| and | & )\s*/).map((n) => n.trim()).filter(Boolean)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToArticle(row: any): NewsletterArticle {
  const extractedData = row.extracted_data as Record<string, unknown> | null
  const entitiesRaw = (row.entities_raw ?? []) as Array<{ name: string; type: string; role: string | null; confidence?: number }>
  const title = cleanHeadline(row.title as string, row.source_name as string | null)
  const tldr = (row.tldr as string | null) ?? null

  // Only entities the story's own text names. The classifier has attached
  // another article's entities before (an IIT Madras fund story carrying
  // "Morgan Stanley" and "Schroders"), and a 0.6-confidence "related entity"
  // once put "Siri" on a story as the firm.
  const named = entitiesRaw.filter(
    (e) => e?.name && (e.confidence ?? 0) >= 0.8 && entityMentioned(e.name, title, tldr)
  )
  const firmEntity = named.find((e) => e.type === 'firm')
  const firmName = (extractedData?.firm_name as string) ?? firmEntity?.name ?? null
  const fundName = (extractedData?.fund_name as string) ?? null
  const personName = (extractedData?.person_name as string) ?? null
  const fundSizeMillions = extractedData?.fund_size_usd_millions as number | null

  // Additional firms beyond the primary — co-managers, acquirer/target pairs,
  // JV partners. Cap at 2 extras. Any token overlap with the primary firm
  // means it's almost certainly the same org under a variant name ("Korea's
  // National Pension Service" vs "Korea's NPS") — skip those.
  const primaryNorm = normalizeFirmName(firmName)
  const primaryTokens = new Set(primaryNorm.split(' '))
  const coFirms: string[] = []
  for (const e of named) {
    if (e.type !== 'firm') continue
    const norm = normalizeFirmName(e.name)
    if (!norm || norm === primaryNorm) continue
    if (norm.split(' ').some((t) => primaryTokens.has(t))) continue
    if (coFirms.some((c) => normalizeFirmName(c) === norm)) continue
    coFirms.push(e.name)
    if (coFirms.length >= 2) break
  }

  const uniq = (xs: string[]) => Array.from(new Set(xs.filter(Boolean)))
  const entityKeys = uniq(
    [firmName, fundName, ...named.filter((e) => e.type === 'firm' || e.type === 'fund').map((e) => e.name)]
      .map((n) => entityKey(n))
  )
  // Full names only — a bare surname ("Allan") would link unrelated stories.
  const personKeys = uniq(
    [...splitPeople(personName), ...named.filter((e) => e.type === 'person').map((e) => e.name)]
      .map((n) => entityKey(n))
      .filter((k) => k.includes(' '))
  )
  // The classifier sometimes returns a description as a name ("New London
  // private equity firm"); two lowercase words in a row is the tell.
  const isDescription = (n: string) => /\b[a-z]{3,}\s+[a-z]{3,}\b/.test(n)
  const headlineEntities = uniq([
    firmName ?? '',
    ...named.filter((e) => e.type === 'firm' || e.type === 'person').map((e) => e.name),
    ...splitPeople(personName),
  ]).filter((n) => !isDescription(n)).slice(0, 10)

  return {
    id: row.id,
    title,
    sourceUrl: row.source_url,
    sourceName: row.source_name,
    publishedDate: row.published_date,
    articleType: row.article_type,
    eventType: row.event_type ?? row.article_type,
    fundCategories: row.fund_categories ?? [],
    isHighSignal: row.is_high_signal,
    relevanceScore: row.relevance_score,
    tldr,
    firmName,
    firmDomain: (extractedData?.firm_domain as string) ?? null,
    fundName,
    fundSizeUsdMillions: fundSizeMillions,
    fundStrategy: (extractedData?.fund_strategy as string) ?? null,
    geography: (extractedData?.geography as string[]) ?? [],
    personName,
    personTitle: (extractedData?.person_title as string) ?? null,
    closeType: (extractedData?.close_type as string) ?? null,
    coFirms,
    alsoCoveredBy: [],
    headlineEntities,
    entityKeys,
    personKeys,
    leadEligible: true,
  }
}

/**
 * Outlets whose house style is a pun. "Butterfly Orders Takeout", "Pfingsten
 * Rolls Into Precision Bearings", "C.H. Guenther Brings Home the Hushpuppies"
 * all ran in the audited fortnight; none tells a scanning reader who bought
 * what. For these sources only, and only when the headline carries no plain
 * deal verb, the row shows the first clause of the story's summary instead
 * ("Butterfly Equity acquires Sabert, a manufacturer of … food containers").
 * The link still goes to the original article.
 */
const WORDPLAY_HEADLINE_SOURCES = new Set(['private equity professional'])
const PLAIN_VERB =
  /\b(acquires?|acquired|to acquire|buys?|sells?|sold|invests?|backs?|closes?|raises?|hires?|names?|appoints?|launch(es)?|merges?|adds?|completes?|agrees?|forms?|promotes?|exits?|partners with|recapitali[sz]es?|secures?|joins?|announces?)\b/i

export function plainHeadline(title: string, tldr: string | null, sourceName: string | null): string {
  if (!tldr || !WORDPLAY_HEADLINE_SOURCES.has((sourceName ?? '').toLowerCase())) return title
  if (PLAIN_VERB.test(title)) return title
  let clause = tldr.split(/;|\.\s+(?=[A-Z])/)[0].trim().replace(/\.$/, '')
  if (clause.length > 130) {
    const cut = clause.lastIndexOf(',', 130)
    if (cut < 40) return title
    clause = clause.slice(0, cut)
  }
  return clause.length >= 25 ? clause : title
}

// ─── What kind of row is this, really ───────────────────────────────────────

/**
 * A fund-activity row that is actually a transaction. The classifier files
 * "LLR Partners takes stake in EnergyCAP", "Apollo provides $585m financing
 * package", "Bain-backed EcoCeres targets $1bn Hong Kong IPO" as capital_raise
 * — money moved, but no fund was raised — and they ran in the Private Equity
 * and Credit fund lists beside real closes. They belong in Deals.
 */
const DEAL_SHAPED_HARD =
  /\b(takes? (a |an )?(\d+(\.\d+)?% |majority |minority |strategic |controlling )?stake|acquires?|to acquire|agrees? to (buy|sell)|ipo\b|take-private|financing package|credit facility|structured investment|growth financing)/i
/**
 * Verbs that mean a deal from a GP and an allocation from an LP: "Penn SERS
 * backs new PE manager" is a pension's commitment, "Apax backs a software
 * company" is a deal. An allocator's soft verb is a commitment only when the
 * headline is about a manager or a strategy: "CPP Investments backs Prestige's
 * hospitality platform" is still a direct investment.
 */
const DEAL_SHAPED_SOFT =
  /\b(growth investment in|invests? in|backs\b(?!.*\bfunds?\b)|provides? [$€£]?[\d.]+|leads? [$€£]?[\d.,]+\s?(m|bn|million|billion)?\s?(raise|round))/i
const MANAGER_WORDS = /\b(managers?|GPs?|sponsors?|strateg(y|ies)|mandates?|commitments?|allocations?)\b/i
/** "BC Partners Credit commits up to $300m to fund LIV Golf restructuring": money to a named company, not a vehicle. */
const FINANCES_A_COMPANY = /\b(commits?|pledges?|puts up)\b[^,;]{0,40}\bto fund (the |a |an )?[A-Z0-9]/

export function isDealShaped(a: NewsletterArticle): boolean {
  if (storyFamily(a.eventType) !== 'fund') return false
  // A row with a close stage is a fund event whatever its headline says.
  if (a.closeType && a.closeType !== 'launch') return false
  if (DEAL_SHAPED_HARD.test(a.title)) return true
  if (isLpByName(a) && MANAGER_WORDS.test(a.title)) return false
  return DEAL_SHAPED_SOFT.test(a.title) || FINANCES_A_COMPANY.test(a.title)
}

/**
 * "Close" has two meanings and the classifier reads both as fund_close.
 * 2026-09-21: "Magellan to close Vinva global equity fund" (a termination)
 * led the preheader as "Magellan Asset Management $101M"; 9/23: "$2 billion
 * hedge fund SoMa Equity Partners is closing down" led as "SoMa Equity
 * Partners $2B". Both read as successful raises. Wind-downs still run — a
 * $2B fund shutting is news — but never as a size-led headline.
 */
const WIND_DOWN_TITLE =
  /\b(closing down|clos(es|ing|e) (its )?doors|shut(s|ting)? down|shutting|shutter(s|ing)?|wind(s|ing)? (down|up)|liquidat\w+|to return (outside |investor |client )?(capital|money)|returning (outside |investor |client )?(capital|money))\b/i
/**
 * "X to close fund" is a shutdown; "exceeds target to close third fund" and
 * "takes 90 days to close $1.3bn Fund VI" are the opposite. A figure, or any
 * word that belongs to a raise, anywhere in the headline means it is a raise.
 * (Until 2026-10-01 only words AFTER "to close" were checked, so those two —
 * and Investcorp's $1.25bn GP-stakes close — were filed as wind-downs.)
 */
const TO_CLOSE_FUND = /\bto close\b.*\bfund\b/i
const RAISE_CONTEXT = /[$€£¥₹]\s?\d|\d\s?(bn|billion|m|mn|million)\b|\b(at|on|above|round|first|final|oversubscribed|hard cap|target|exceed\w*|rais\w+|secur\w+|debut|flagship|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\b/i
const WIND_DOWN_TLDR = /\b(shutting down|closing down|wind(ing)? down|termination scheduled|liquidat\w+|ceas(e|ing) operations)\b/i

export function isWindDown(a: NewsletterArticle): boolean {
  if (storyFamily(a.eventType) !== 'fund') return false
  if (WIND_DOWN_TITLE.test(a.title) || WIND_DOWN_TLDR.test(a.tldr ?? '')) return true
  return TO_CLOSE_FUND.test(a.title) && !RAISE_CONTEXT.test(a.title)
}

/**
 * A `capital_raise` whose headline has no fundraising word in it is usually
 * something else carrying a big number: "Musk's long-time backer is giving
 * SpaceX stock to its investors" was typed capital_raise with $8.5B and would
 * have led the 2026-09-17 subject line as "Valor Equity".
 */
const FUNDRAISE_WORDS = /\b(funds?|raises?|raised|raising|fundrais\w+|clos(e|es|ed|ing)|targets?|launch(es|ed)?|vehicle|strategy|hard cap|commitments?|oversubscribed|vintage)\b/i
/**
 * A fund-typed row whose headline is a transaction and says nothing of a
 * raise: "Apposite Capital seals first Healthcare III exit with CrestOptics
 * sale to Evident" (typed fund_close), "Monzo turns to PE after Nubank ends
 * takeover talks" (capital_raise), "AGR backs New Zealand goat dairy producer"
 * (fund_launch, closeType 'target'), "Partners Group restructures €6.6bn
 * evergreen fund after redemption cap". The type and the stray fund name or
 * stage the classifier attached are not enough to make them fund news; they
 * belong in Deals. A raise verb anywhere keeps the row a raise: "ECP closes
 * third continuation vehicle at $834m after exiting first two".
 */
const RAISE_VERBS = /\b(raises?|raised|raising|fundrais\w+|clos(e|es|ed|ing)|launch(es|ed|ing)?|targets?|hard cap|oversubscribed|commitments?|secures?|secured|upsiz\w+|eyes|seeks?|aims?|plans?|nears?|readies|approaches|holds|hits|tops|doubles)\b/i
const TRANSACTION_TITLE = /\b(exits?|exited|sale of|sells?|sold|divest\w*|stake|takeover|take-private|restructur\w+|buys?|bought|bid|in talks|backs(?!.*\bfunds?\b))\b/i
export function isTransactionNotRaise(a: NewsletterArticle): boolean {
  return storyFamily(a.eventType) === 'fund' && !RAISE_VERBS.test(a.title) && TRANSACTION_TITLE.test(a.title)
}

function readsAsFundraise(a: NewsletterArticle): boolean {
  if (a.eventType !== 'capital_raise') return true
  if (a.fundName || a.closeType) return true
  return FUNDRAISE_WORDS.test(a.title)
}

/** Structured-credit pricings: credit news, but not a fund close. */
const STRUCTURED_CREDIT = /\bCLOs?\b|collaterali[sz]ed (loan|fund) obligation|\bCFO financing\b/
/** Capital-markets plumbing with no fund in it at all. Dropped. */
const NOT_FUND_NEWS = /\b(securiti[sz]ation|RMBS|CMBS|green bond|bond (issuance|issue|offering)|share offer)\b/i

/**
 * Fund relevance for the Service Providers section. A law firm's fund-finance
 * hire is core; its new disputes partner in Paris, or its next London
 * managing partner, is not (both ran in the audited fortnight).
 */
const FUND_RELEVANT =
  /private (equity|credit|capital|markets?|funds?|debt)|\bPE\b|\bVC\b|funds? (formation|finance|administration|administrators?|services|solutions|practice|group|team|launch|lawyers?|partners?)|\b(investment|private|venture|hedge|credit|secondar(y|ies)) funds?\b|asset management|investment management|secondar(y|ies)|buyouts?|venture capital|hedge funds?|alternative (assets?|investments?|asset)|real estate|infrastructure|financial sponsors?|\bM&A\b|fund (admin|tech)\w*/i

function assetClassFor(a: NewsletterArticle): string {
  for (const cat of a.fundCategories) if (ASSET_CLASSES.has(cat)) return cat
  const t = `${a.title} ${a.fundStrategy ?? ''} ${a.tldr ?? ''}`.toLowerCase()
  if (/\bsecondar(y|ies)\b|continuation (fund|vehicle)|gp-led/.test(t)) return 'secondaries'
  if (/\b(private credit|direct lending|lending|debt|loans?|clo)\b/.test(t)) return 'credit'
  if (/\b(real estate|property|logistics|housing|reit)\b/.test(t)) return 'real_estate'
  if (/\b(infrastructure|energy transition|renewables?|wind|solar)\b/.test(t)) return 'infrastructure'
  if (/\b(venture|startups?|seed)\b/.test(t)) return 'VC'
  if (/\bhedge\b/.test(t)) return 'hedge'
  return 'PE'
}

// ─── Shared with the site's front page (lib/news/front-page.ts) ─────────────
// One definition of "is this a story" and "which section is it", so the email
// and the website can never disagree about either.

/** Why a mapped row is not a story we publish, or null if it is. */
export function screenArticle(a: NewsletterArticle): string | null {
  if (isGovtProgram(a)) return 'govt/blocked source'
  if (isStartupRound(a)) return 'startup round'
  if (isDigest(a.title)) return 'digest column'
  if (NOT_FUND_NEWS.test(a.title)) return 'not fund news'
  if (extractionMisaligned(a.title, a.firmName, a.tldr)) return 'extraction belongs to another article'
  return null
}

/** Quality gate + minimum fund size, applied after dedup has merged fields. */
export function gateArticle(a: NewsletterArticle): string | null {
  if (!passesQualityGate(a)) return 'quality gate: no firm/fund or placeholder summary'
  if (FUND_ACTIVITY_TYPES.includes(a.eventType ?? '') && a.fundSizeUsdMillions != null && a.fundSizeUsdMillions < MIN_FUND_SIZE_MILLIONS) {
    return 'fund under $10M'
  }
  return null
}

/**
 * Several items under one headline (story-links isRoundup): the headline, the
 * names in it and the outlet it came from decide. Such a row runs last in its
 * section, never leads, and is never "Firm $X": its size is one item's.
 */
export function isRoundupArticle(a: Pick<NewsletterArticle, 'title' | 'headlineEntities' | 'sourceName'>): boolean {
  return isRoundup(a.title, a.headlineEntities, a.sourceName)
}

export type ArticleSection = 'fund' | 'lp_commitments' | 'service_providers' | 'people_moves' | 'deals' | 'regulatory'

export interface ArticlePlacement {
  section: ArticleSection
  /** Asset class for fund events; null elsewhere. */
  assetClass: string | null
  /** May this row lead a subject line / front page as "Firm $X"? */
  leadEligible: boolean
}

/**
 * Which section a story belongs in, decided by what the story IS rather than
 * only by the classifier's tags:
 *   regulatory action   → Regulatory, always (an SEC risk alert tagged
 *                         service_provider used to land in Service Providers)
 *   transaction         → Deals, including fund-typed rows that are deals
 *   fund event          → LP Commitments or its asset class — never Service
 *                         Providers, even when Law360 leads the headline with
 *                         the law firm ("Latham-Led Stride Wraps $550M
 *                         Sophomore Fund")
 *   people / firm news  → Service Providers when the firm is one, otherwise
 *                         People Moves
 * Returns null for a service-provider story with no fund angle (dropped).
 */
export function placeArticle(a: NewsletterArticle): ArticlePlacement | null {
  const family = storyFamily(a.eventType)
  if (family === 'regulatory') return { section: 'regulatory', assetClass: null, leadEligible: true }
  if (family === 'fund') {
    if (isDealShaped(a)) return { section: 'deals', assetClass: null, leadEligible: false }
    if (isLpCommitment(a)) return { section: 'lp_commitments', assetClass: null, leadEligible: false }
    if (isTransactionNotRaise(a)) return { section: 'deals', assetClass: null, leadEligible: false }
    const notARaise = isWindDown(a) || STRUCTURED_CREDIT.test(a.title) || !readsAsFundraise(a)
    return { section: 'fund', assetClass: assetClassFor(a), leadEligible: !notARaise }
  }
  if (isServiceProvider(a)) {
    return FUND_RELEVANT.test(`${a.firmName ?? ''} ${a.title} ${a.tldr ?? ''}`)
      ? { section: 'service_providers', assetClass: null, leadEligible: true }
      : null
  }
  if (family === 'people') return { section: 'people_moves', assetClass: null, leadEligible: true }
  if (family === 'deal') return { section: 'deals', assetClass: null, leadEligible: true }
  return null
}

/**
 * Pure assembly: classified rows + prior-edition memory in, edition out. No
 * I/O, so `scripts/replay-editions.ts` can re-run past days against a saved
 * pool and show exactly what a rule change would have done to real editions.
 */
export function assembleNewsletter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[],
  priorExclusions: PriorExclusions,
): NewsletterContent {
  const dropped: Array<{ id: string; title: string; reason: string }> = []
  const keep = (list: NewsletterArticle[], test: (a: NewsletterArticle) => string | null) =>
    list.filter((a) => {
      const reason = test(a)
      if (reason) dropped.push({ id: a.id, title: a.title, reason })
      return !reason
    })

  const articles: NewsletterArticle[] = rows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((row: any) => !priorExclusions.ids.has(row.id))
    .map(rowToArticle)

  // ─── Drop what is not a story we can stand behind ──────────────────────
  const afterGovtFilter = keep(articles, screenArticle)

  for (const a of afterGovtFilter) a.title = plainHeadline(a.title, a.tldr, a.sourceName)

  // ─── Same-day story dedup ──────────────────────────────────────────────
  const deduped = deduplicateByStory(afterGovtFilter)
  const dedupedIds = new Set(deduped.map((a) => a.id))
  for (const a of afterGovtFilter) {
    if (dedupedIds.has(a.id)) continue
    const kept = deduped.find((b) => isSameStory(a, b) || sameStoryLoose(a, b))
    dropped.push({ id: a.id, title: a.title, reason: `same story as "${(kept?.title ?? 'another row in its cluster').slice(0, 70)}"` })
  }

  // ─── Cross-edition dedup ───────────────────────────────────────────────
  const afterCrossDay = keep(deduped, (a) => {
    // Extended window: same firm, same-sized fund event within ~25%.
    if (
      matchesPriorFundEvent(
        priorFundEvent(a.firmName, a.eventType, a.fundSizeUsdMillions),
        priorExclusions.priorEvents
      )
    ) {
      return 'ran before: same firm, same-size fund event'
    }
    // Title memory: catches re-reports that carry no size or fund name and
    // therefore evade every fingerprint. Real case, 2026-07-31→08-01: "CVC
    // aims for Q3 close for 6th secondaries fund" ran twice on consecutive
    // days because the second copy had null size and null fund name.
    if (matchesPriorTitle(a.title, a.firmName, priorExclusions.priorTitles)) {
      return 'ran before: similar headline'
    }
    // Person memory: an exec move re-reported next day with a different firm
    // extraction ("Blackstone" vs "BCRED") shares no firm fingerprint, but
    // the person is the same. 2026-07-27→28: Jonathan Bock ran twice.
    if (a.personName && PEOPLE_TYPES.includes(a.eventType ?? '')) {
      const person = normalizeFirmName(a.personName)
      if (person && priorExclusions.priorPeople.has(person)) return 'ran before: same person'
    }
    // Entity memory: the same names in the same kind of story (story-links).
    const prior = findPriorStory(a, priorExclusions.priorStories)
    if (prior) return `ran before: "${prior.title.slice(0, 70)}"`
    // Exact fingerprint keys.
    const fps = storyFingerprints(a.firmName, a.fundName, a.eventType, a.fundSizeUsdMillions)
    if (fps.some((fp) => priorExclusions.fingerprints.has(fp))) return 'ran before: fingerprint'
    return null
  })

  // ─── Quality gate + minimum fund size ──────────────────────────────────
  const sizeFiltered = keep(afterCrossDay, gateArticle)

  // ─── Per-firm cap ──────────────────────────────────────────────────────
  // Applied before sectioning so a single firm's news cycle can't consume
  // slots across several sections at once.
  const firmCapped = capPerFirm(sizeFiltered)
  { const k = new Set(firmCapped.map((a) => a.id)); for (const a of sizeFiltered) if (!k.has(a.id)) dropped.push({ id: a.id, title: a.title, reason: 'per-firm cap' }) }

  // ─── Split into sections (see placeArticle) ────────────────────────────
  const serviceProviders: NewsletterArticle[] = []
  const lpCommitments: NewsletterArticle[] = []
  const fundActivity: NewsletterArticle[] = []
  const peopleMoves: NewsletterArticle[] = []
  const deals: NewsletterArticle[] = []
  const regulatory: NewsletterArticle[] = []
  const bins: Record<ArticleSection, NewsletterArticle[]> = {
    fund: fundActivity,
    lp_commitments: lpCommitments,
    service_providers: serviceProviders,
    people_moves: peopleMoves,
    deals,
    regulatory,
  }

  for (const a of firmCapped) {
    const placement = placeArticle(a)
    if (!placement) {
      if (isServiceProvider(a)) dropped.push({ id: a.id, title: a.title, reason: 'service-provider story with no fund relevance' })
      continue
    }
    // A wire's size is one of its items': it never leads a subject line, and
    // in a fund section it runs after the raises, not among them by size.
    a.leadEligible = placement.leadEligible && !isRoundupArticle(a)
    bins[placement.section].push(a)
  }

  // Multi-story wires rank last in their section: they fill space on a quiet
  // day and are the first thing cut on a busy one.
  // …and a better-sourced story edges out a weaker one at the same score.
  const rank = (a: NewsletterArticle) =>
    articlePriorityScore(a) -
    (isRoundupArticle(a) ? 1 : 0) -
    Math.min(sourceTier(a.sourceName), 50) / 250
  const sortByPriority = (arr: NewsletterArticle[]) => [...arr].sort((a, b) => rank(b) - rank(a))

  const cappedFundActivity = sortByPriority(fundActivity).slice(0, 36)
  const cappedLp = sortByPriority(lpCommitments).slice(0, 6)
  const cappedSp = sortByPriority(serviceProviders).slice(0, 6)
  const cappedPeople = sortByPriority(peopleMoves).slice(0, 8)
  const cappedDeals = sortByPriority(deals).slice(0, 10)
  const cappedRegulatory = sortByPriority(regulatory).slice(0, 3)

  // Group fund activity by asset class
  const grouped: Record<string, NewsletterArticle[]> = {}
  for (const article of cappedFundActivity) {
    const cat = assetClassFor(article)
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(article)
  }

  // Raises first by size; wind-downs and structured-credit rows after them.
  for (const cat of Object.keys(grouped)) {
    grouped[cat].sort(
      (a, b) =>
        Number(b.leadEligible) - Number(a.leadEligible) ||
        (b.fundSizeUsdMillions ?? 0) - (a.fundSizeUsdMillions ?? 0)
    )
  }

  const groups: ArticleGroup[] = CATEGORY_ORDER
    .filter((cat) => grouped[cat]?.length > 0)
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      articles: grouped[cat],
    }))

  const pushGroup = (category: string, list: NewsletterArticle[]) => {
    if (list.length > 0) groups.push({ category, label: CATEGORY_LABELS[category], articles: list })
  }
  // After the fund sections, the order the site's tabs and front page use:
  // deals, people, LPs, regulation, service providers. A reader who knows one
  // knows the other. (Until 2026-10-02 the email ran LPs and service providers
  // first and regulation last, under 36 other headlines.)
  pushGroup('deals', cappedDeals)
  pushGroup('people_moves', cappedPeople)
  pushGroup('lp_commitments', cappedLp)
  pushGroup('regulatory', cappedRegulatory)
  pushGroup('service_providers', cappedSp)

  deduplicateAcrossSections(groups)

  const includedIds = new Set<string>()
  for (const g of groups) {
    for (const a of g.articles) includedIds.add(a.id)
  }

  for (const a of firmCapped) {
    if (!includedIds.has(a.id) && !dropped.some((d) => d.id === a.id)) {
      dropped.push({ id: a.id, title: a.title, reason: 'section cap or cross-section duplicate' })
    }
  }

  return {
    groups,
    totalArticles: includedIds.size,
    articleIds: Array.from(includedIds),
    dropped,
  }
}

// ─── Per-firm cap ───────────────────────────────────────────────────────────

/**
 * Keep at most MAX_ARTICLES_PER_FIRM stories per firm, highest priority first.
 *
 * These are distinct stories that survived dedup, so this is an editorial
 * choice rather than a correctness fix: on a day when one firm does four
 * newsworthy things, the brief covers its two biggest and gives the rest of
 * the space to other managers. Articles with no extractable firm are never
 * capped — they'd all collide on the empty key.
 */
export function capPerFirm(articles: NewsletterArticle[]): NewsletterArticle[] {
  const ranked = [...articles].sort(
    (a, b) => articlePriorityScore(b) - articlePriorityScore(a)
  )
  const seen = new Map<string, number>()
  const kept: NewsletterArticle[] = []

  for (const article of ranked) {
    const firm = normalizeFirmName(article.firmName)
    if (!firm) {
      kept.push(article)
      continue
    }
    const count = seen.get(firm) ?? 0
    if (count >= MAX_ARTICLES_PER_FIRM) continue
    seen.set(firm, count + 1)
    kept.push(article)
  }

  return kept
}

// ─── Cross-section dedup ────────────────────────────────────────────────────

/**
 * Cross-section dedup pass. Runs AFTER sectioning to catch the rare
 * case where classifier variance put the same story into two different
 * section groups. Example: 2026-04-18 sovereign-funds consortium
 * ("Sovereign funds from China, Indonesia, Azerbaijan team up to
 * launch $1B PE fund" classified as Private Equity with firm "China
 * Sovereign Fund", and "Wealth funds of China, Indonesia, Azerbaijan
 * launch $1b PE platform" classified as LP Commitments with firm
 * "China State Pension Fund" — completely different firm extractions
 * so isSameStory correctly refused to merge them within the same-day
 * pre-section dedup).
 *
 * Uses a deliberately looser matcher than isSameStory: fund sizes
 * within 10% AND title Jaccard >= 0.4. Cross-section collisions are
 * rare in practice (most classifier noise clusters within one section),
 * so the broader matcher's false-positive blast radius is small.
 *
 * Keeps the article in the earlier group (fund_activity > lp_commitments
 * > people_moves > deals > regulatory, matching the order of pushes
 * above) and drops the later. alsoCoveredBy is carried over so the
 * reader still sees the duplicate source attribution.
 */
export function deduplicateAcrossSections(groups: ArticleGroup[]): void {
  for (let i = 0; i < groups.length; i++) {
    const keepers = groups[i].articles
    for (let j = i + 1; j < groups.length; j++) {
      const droppers = groups[j].articles
      const toRemove = new Set<string>()

      for (const k of keepers) {
        for (const d of droppers) {
          if (k.id === d.id) continue
          if (toRemove.has(d.id)) continue
          if (!fundSizesMatch(k.fundSizeUsdMillions, d.fundSizeUsdMillions)) continue
          if (titleJaccard(k.title, d.title) < 0.4) continue

          const merged = new Set(k.alsoCoveredBy)
          if (d.sourceName && d.sourceName !== k.sourceName) merged.add(d.sourceName)
          for (const src of d.alsoCoveredBy) {
            if (src !== k.sourceName) merged.add(src)
          }
          k.alsoCoveredBy = Array.from(merged)
          toRemove.add(d.id)
        }
      }

      if (toRemove.size > 0) {
        groups[j].articles = droppers.filter((d) => !toRemove.has(d.id))
      }
    }
  }
}

// ─── Story-level dedup (same day) ───────────────────────────────────────────

const LEGAL_CREDIT_HEADLINE = /\b\d+ firms? (steer|build|guide|advise|handle|shape)|\b(advises|advised|represents?|counsels?|steers?|guides?)\b|-led\b/i

function deduplicateByStory(articles: NewsletterArticle[]): NewsletterArticle[] {
  // Multi-story wires ("A backs X; B to acquire Y; C hires Z") are kept out of
  // the clustering: one would bridge two unrelated deals into a single
  // "story" and lose one of them. A wire runs only if none of its items
  // already has a row of its own.
  const singles = articles.filter((a) => !isRoundupArticle(a))
  const roundups = articles.filter((a) => isRoundupArticle(a))

  // Union-find rather than first-match: story identity is not transitive
  // through one representative. 2026-08-15, nine outlets covered one Mirae
  // first close and a variant escaped as a "distinct" story; 2026-09-27, four
  // rows of one IIT Madras first close ran in a single edition because each
  // had been extracted under a different firm name.
  const stories = clusterBy(singles, (a, b) => isSameStory(a, b) || sameStoryLoose(a, b))

  for (const r of roundups) {
    if (singles.some((s) => sameStoryLoose(s, r))) continue
    if (roundups.some((o) => o !== r && stories.some((g) => g[0] === o) && sameStoryLoose(o, r))) continue
    stories.push([r])
  }

  return stories.map(mergeStoryGroup)
}

/**
 * Collapse one story's rows into the row that represents it: best source's
 * headline, the largest size and longest summary any version carried, and
 * every other outlet listed in `alsoCoveredBy`.
 */
export function mergeStoryGroup(group: NewsletterArticle[]): NewsletterArticle {
  group.sort((a, b) => {
    // Law360-style headlines credit the lawyers, not the principals ("4 Firms
    // Steer $1.6B Priority Technology Take-Private", "Linklaters advises
    // LBBW AM on…"). Any other outlet's version of the story reads better.
    const legal = (x: NewsletterArticle) => (LEGAL_CREDIT_HEADLINE.test(x.title) ? 100 : 0)
    const tierA = sourceTier(a.sourceName) + legal(a)
    const tierB = sourceTier(b.sourceName) + legal(b)
    if (tierA !== tierB) return tierA - tierB
    return (b.tldr?.length ?? 0) - (a.tldr?.length ?? 0)
  })

  const best = group[0]
  const otherSources = Array.from(new Set(
    group.slice(1)
      .map((a) => a.sourceName)
      .filter((name): name is string => !!name && name !== best.sourceName)
  ))
  best.alsoCoveredBy = otherSources

  const maxSize = Math.max(...group.map((a) => a.fundSizeUsdMillions ?? 0))
  if (maxSize > 0 && (best.fundSizeUsdMillions ?? 0) === 0) {
    best.fundSizeUsdMillions = maxSize
  }

  const bestTldr = group
    .map((a) => a.tldr)
    .filter((t): t is string => !!t)
    .sort((a, b) => b.length - a.length)[0]
  if (bestTldr && bestTldr.length > (best.tldr?.length ?? 0)) {
    best.tldr = bestTldr
  }

  // Promote a non-null firm name from other versions if the best one is missing it.
  if (!best.firmName) {
    const alt = group.find((a) => a.firmName)
    if (alt) best.firmName = alt.firmName
  }

  // …and the person, for a move: the best outlet's report may be the one that
  // names nobody ("Barings expands private credit naming global head of
  // asset-based finance", beside a report that names Sloan Sutta).
  if (!best.personName && storyFamily(best.eventType) === 'people') {
    const alt = group.find((a) => a.personName && storyFamily(a.eventType) === 'people')
    if (alt) {
      best.personName = alt.personName
      best.personTitle = best.personTitle ?? alt.personTitle
    }
  }

  return best
}

// ─── Cross-edition fingerprint dedup ────────────────────────────────────────

/**
 * Fingerprints used to suppress cross-day repeats. Returns 1-2 keys per
 * article — the dedup filter rejects the new article if ANY key matches
 * any article from the CROSS_EDITION_LOOKBACK window.
 *
 * Emitted keys, by what the article carries:
 *   - fund name + size  →  [`firm|fund`, `firm|event|size-bucket`]
 *   - fund name only    →  [`firm|fund`]
 *   - size only         →  [`firm|event|size-bucket`]
 *   - neither           →  [`firm|event`]  (exec moves, regulatory)
 *
 * Size is bucketed into $500M bands so currency drift and rounding
 * don't break the match. The old single-key version lost Adams Street
 * on 4/14→4/15 because one edition's fingerprint was
 * `adams street|private credit iii` and the other was
 * `adams street|fund_close`; the size-bucketed key gives both sides a
 * common `adams street|fund_close|7500` to collide on.
 */
export function storyFingerprints(
  firmName: string | null,
  fundName: string | null,
  eventType: string | null,
  fundSizeUsdMillions: number | null
): string[] {
  const firm = normalizeFirmName(firmName)
  if (!firm) return []
  const fund = normalizeFirmName(fundName)
  const evt = eventType ?? ''
  const out: string[] = []
  if (fund) out.push(`${firm}|${fund}`)
  if (fundSizeUsdMillions && fundSizeUsdMillions > 0) {
    const bucket = Math.round(fundSizeUsdMillions / 500) * 500
    out.push(`${firm}|${evt}|${bucket}`)
  } else if (!fund && storyFamily(evt) === 'fund') {
    // Fund events only. For deals and people this key suppressed every later
    // story from the same firm — a sponsor's second acquisition of the week
    // vanished because its first one was in memory — while doing nothing for
    // real repeats filed under the other party's name. The entity memory in
    // story-links replaces it for those families.
    out.push(`${firm}|${evt}`)
  }
  return out
}

/** A fund-activity event already published in the extended lookback window. */
export interface PriorFundEvent {
  firm: string
  sizeMillions: number
}

/**
 * Build the extended-window record for one article, or null if it can't
 * participate (no firm, no usable size, or not a fund-activity event).
 */
export function priorFundEvent(
  firmName: string | null,
  eventType: string | null,
  fundSizeUsdMillions: number | null
): PriorFundEvent | null {
  if (!EXTENDED_FINGERPRINT_TYPES.has(eventType ?? '')) return null
  const firm = normalizeFirmName(firmName)
  if (!firm) return null
  if (!fundSizeUsdMillions || fundSizeUsdMillions <= 0) return null
  return { firm, sizeMillions: fundSizeUsdMillions }
}

/**
 * True when a candidate repeats a fund event already published in the extended
 * window — same firm, and a size within EXTENDED_SIZE_TOLERANCE.
 *
 * Event type is intentionally not compared: close/launch/raise are the same
 * underlying event wearing different verbs (see EXTENDED_FINGERPRINT_TYPES).
 */
export function matchesPriorFundEvent(
  candidate: PriorFundEvent | null,
  priorEvents: PriorFundEvent[]
): boolean {
  if (!candidate) return false
  return priorEvents.some(
    (prior) =>
      prior.firm === candidate.firm &&
      fundSizesMatch(prior.sizeMillions, candidate.sizeMillions, EXTENDED_SIZE_TOLERANCE)
  )
}

/** A title published in the recent-edition window, with its normalized firm. */
export interface PriorTitle {
  firm: string
  title: string
}

/**
 * True when a candidate headline repeats a story already published in the
 * recent-edition window. Three tiers:
 *   1. Near-verbatim title (Jaccard ≥ 0.85), any firm.
 *   2. Same firm + similar title (Jaccard ≥ 0.55) — null-size re-reports.
 *   3. Shared significant headline figure + moderate similarity (≥ 0.3) +
 *      a firm-name link: either the same normalized firm (Mirae's first
 *      close ran three straight days, 8/14-8/16, while size drift beat
 *      every tolerance but every headline cited ₹1,800 crore), or the
 *      candidate's firm named in the prior headline ("EMERGING, Promethean
 *      eye $300m…" re-ran as "Promethean, Emerging Launch $300M…" under a
 *      different extracted firm).
 */
export function matchesPriorTitle(
  candidateTitle: string,
  candidateFirmName: string | null,
  priorTitles: PriorTitle[]
): boolean {
  const candFirm = normalizeFirmName(candidateFirmName)
  const candFirmTokens = candFirm.split(' ').filter((t) => t.length > 2)
  for (const prior of priorTitles) {
    const sim = titleJaccard(candidateTitle, prior.title)
    if (sim >= 0.85) return true
    if (candFirm && prior.firm === candFirm && sim >= 0.55) return true
    if (sim >= 0.3 && titlesShareSignificantNumber(candidateTitle, prior.title)) {
      if (candFirm && prior.firm === candFirm) return true
      const priorTitleLower = prior.title.toLowerCase()
      if (candFirmTokens.some((t) => priorTitleLower.includes(t))) return true
    }
  }
  return false
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractFingerprintFields(row: any): {
  firmName: string | null
  fundName: string | null
  fundSize: number | null
  eventType: string | null
  personName: string | null
} {
  const extractedData = row.extracted_data as Record<string, unknown> | null
  const entitiesRaw = row.entities_raw as Array<{ name: string; type: string }> | null
  const firmEntity = entitiesRaw?.find((e) => e.type === 'firm')
  const firmName = (extractedData?.firm_name as string) ?? firmEntity?.name ?? null
  const fundName = (extractedData?.fund_name as string) ?? null
  const fundSize = (extractedData?.fund_size_usd_millions as number | null) ?? null
  const eventType = row.event_type ?? row.article_type ?? null
  const personName = (extractedData?.person_name as string) ?? null
  return { firmName, fundName, fundSize, eventType, personName }
}

export interface PriorExclusions {
  ids: Set<string>
  fingerprints: Set<string>
  priorEvents: PriorFundEvent[]
  priorTitles: PriorTitle[]
  priorPeople: Set<string>
  /** Every story from the recent window, for entity-based repeat detection. */
  priorStories: StoryLike[]
}

async function getPriorEditionExclusions(
  supabase: DbClient
): Promise<PriorExclusions> {
  // Pull the extended window once (newest first).
  const { data: editions } = await supabase
    .from('newsletter_editions')
    .select('article_ids')
    .eq('status', 'sent')
    .order('edition_date', { ascending: false })
    .limit(EXTENDED_CLOSE_LOOKBACK)

  const editionIds = (editions ?? []).map(
    (ed) => (ed as { article_ids: string[] | null }).article_ids ?? []
  )
  const allIds = Array.from(new Set(editionIds.flat()))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rowsById = new Map<string, any>()
  for (let i = 0; i < allIds.length; i += 200) {
    const chunk = allIds.slice(i, i + 200)
    const { data: rowsData } = await supabase
      .from('news_items')
      // published_date: a nameless report of a hire is tied to the named one
      // that already ran only within a couple of days of it (sameMove).
      .select('id, title, source_name, published_date, tldr, article_type, event_type, extracted_data, entities_raw')
      .in('id', chunk)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (rowsData ?? []) as any[]) rowsById.set(row.id, row)
  }
  return buildPriorExclusions(editionIds, rowsById)
}

/**
 * Pure: turn the last N editions (newest first) into the memory the
 * cross-edition filter consults. The most recent CROSS_EDITION_LOOKBACK
 * editions contribute full fingerprints, titles and people; every edition in
 * the window contributes its fund events for the relative-size comparison
 * (see EXTENDED_CLOSE_LOOKBACK / EXTENDED_SIZE_TOLERANCE).
 */
export function buildPriorExclusions(
  editionIdsNewestFirst: string[][],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rowsById: Map<string, any>,
): PriorExclusions {
  const recentIds = new Set<string>()
  const extendedIds = new Set<string>()
  editionIdsNewestFirst.slice(0, EXTENDED_CLOSE_LOOKBACK).forEach((arr, idx) => {
    const target = idx < CROSS_EDITION_LOOKBACK ? recentIds : extendedIds
    for (const id of arr) target.add(id)
  })

  // An article that already ran never runs again, anywhere in the window
  // (the weekend rescue and the outage catch-up both widen the query well
  // past 26h, so "it won't re-enter anyway" does not hold).
  const ids = new Set([...recentIds, ...extendedIds])
  const fingerprints = new Set<string>()
  const priorTitles: PriorTitle[] = []
  const priorPeople = new Set<string>()
  const priorStories: StoryLike[] = []
  for (const id of recentIds) {
    const row = rowsById.get(id)
    if (!row) continue
    if (row.title) priorStories.push(rowToArticle(row))
    const { firmName, fundName, fundSize, eventType, personName } = extractFingerprintFields(row)
    for (const fp of storyFingerprints(firmName, fundName, eventType, fundSize)) {
      fingerprints.add(fp)
    }
    if (row.title) {
      priorTitles.push({ firm: normalizeFirmName(firmName), title: row.title as string })
    }
    if (personName && PEOPLE_TYPES.includes(eventType ?? '')) {
      const person = normalizeFirmName(personName)
      if (person) priorPeople.add(person)
    }
  }

  const priorEvents: PriorFundEvent[] = []
  for (const id of new Set([...recentIds, ...extendedIds])) {
    const row = rowsById.get(id)
    if (!row) continue
    const { firmName, fundSize, eventType } = extractFingerprintFields(row)
    if (!EXTENDED_FINGERPRINT_TYPES.has(row.article_type ?? '')) continue
    const evt = priorFundEvent(firmName, eventType, fundSize)
    if (evt) priorEvents.push(evt)
  }

  return { ids, fingerprints, priorEvents, priorTitles, priorPeople, priorStories }
}

// ─── Article priority scoring for cap ───────────────────────────────────────

function articlePriorityScore(a: NewsletterArticle): number {
  let score = a.relevanceScore ?? 0
  if (FUND_ACTIVITY_TYPES.includes(a.eventType ?? '')) {
    score += 0.3
    if (a.fundSizeUsdMillions) {
      score += Math.min(0.3, Math.log10(a.fundSizeUsdMillions / 100 + 1) * 0.15)
    }
  }
  if (a.isHighSignal) score += 0.2
  return score
}

export function getEventTypeLabel(type: string | null): string {
  if (!type) return ''
  return EVENT_TYPE_LABELS[type] ?? type.replace(/_/g, ' ')
}

export function formatFundSize(millions: number | null): string {
  if (!millions) return ''
  if (millions >= 1000) return `$${(millions / 1000).toFixed(1).replace(/\.0$/, '')}B`
  return `$${millions}M`
}

/**
 * Single-fund sizes above $30B are extremely rare and always named.
 * Any candidate above this without a fund_name is almost certainly firm
 * AUM leaking into fund_size_usd_millions from the classifier — real
 * incidents: 4/10 "Ares Management Corp $623B" exec-hire leak,
 * 4/9 "Lemssouguer Fund $20B" career-profile leak, 4/18 "Nest
 * $81B" private-credit-mandate leak (£60bn AUM misattributed).
 *
 * Used as a sanity rail in both buildSubject (kills AUM-leak headlines)
 * and the row-pill renderer (kills AUM-leak pills in story rows).
 */
export const FUND_SIZE_SANITY_CEILING_MILLIONS = 30000

export function isLikelyAumLeak(
  sizeMillions: number | null | undefined,
  fundName: string | null | undefined
): boolean {
  if (!sizeMillions) return false
  return sizeMillions > FUND_SIZE_SANITY_CEILING_MILLIONS && !fundName
}
