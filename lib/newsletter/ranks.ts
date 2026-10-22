/**
 * "Today's biggest": the edition's largest fund closes, largest deals and
 * most senior hires, ranked, in a compact block after the top stories.
 *
 * Danny, 2026-10-22, from a competitor's deals email he liked: ranked lists
 * with a cut-off, sorted by size, are "meaningful rankings people care about".
 * Three lists, each printed only when it has a row:
 *
 *   - Fund closes $500M+ — a final, first or interim close in this edition,
 *     admitted by the league table's own rules (lib/news/league.ts
 *     leagueRejection: a manager named, a stated size that is money closed and
 *     not a target, not a continuation vehicle, CLO, evergreen or hedge fund,
 *     not "nears a close"), and a fund named or called one. Largest first.
 *   - Deals $1B+ — a deal from the Deals section, agreed or done (no rumour,
 *     no "in talks"), whose figure the headline states (or, when the headline
 *     states none, the summary). Largest first.
 *   - Notable hires — a hire or promotion (not an exit, a retirement, a search
 *     or a round of cuts) to a senior job (chief, president, chair, founder,
 *     head, partner, lead, managing director) at a well-known firm
 *     (WELL_KNOWN), or one three or more outlets reported. Most senior first.
 *
 * It is an index of the edition, not more news: every row is a story the
 * edition already carries in its section (never one of the top stories just
 * above it, which the reader has already read), read from the
 * same groups after the same clustering, and it never removes or reorders a
 * story. Within the block a story is listed once (sameStoryLoose, the
 * edition's own same-story rule). Each row links to the story's page on
 * fundopshq.com, as the Monday recap's rows do.
 *
 * Pure: no I/O.
 */
import type { ArticleGroup, NewsletterArticle } from './query-articles'
import { FUND_SECTION_ORDER, isLikelyAumLeak, isRoundupArticle } from './query-articles'
import { dealStage, entityKey, keysMatch, sameStoryLoose } from './story-links'
import { leagueRejection, fundLabel, STAGE_LABEL, type CloseStage } from '@/lib/news/league'
import { headlineFigureFor, headlineMoney } from '@/lib/news/money'
import { cleanSummary } from '@/lib/news/summary-clean'
import { cleanEntityName } from '@/lib/news/constants'
import { storyPath } from '@/lib/news/story-path'

/** The cut-offs, in USD millions: a close of at least this much, a deal of at least this much. */
export const CLOSE_FLOOR_USD_M = 500
export const DEAL_FLOOR_USD_M = 1000
/** At most this many rows a list: it is a glance, not a second edition. Hires are not ranked by a figure, so fewer. */
export const MAX_RANK_ROWS = 5
export const MAX_HIRE_ROWS = 3

export type RankKey = 'closes' | 'deals' | 'hires'

export interface RankRow {
  article: NewsletterArticle
  /** What the row says first: the manager, the hiring firm; for a deal, the headline itself. */
  lead: string
  /** What follows it, muted: the fund and the stage; the person and the job. Null when the lead says it all. */
  detail: string | null
  /** The figure the list ranks on (closes and deals). */
  sizeUsdM: number | null
  /** True when the reports gave the figure in another currency: printed "≈". */
  converted: boolean
  /** True when `lead` is the story's headline (a deal; a hire whose person or job could not be read cleanly). */
  isHeadline: boolean
}

export interface RankList {
  key: RankKey
  label: string
  rows: RankRow[]
}

export const RANK_LABEL: Record<RankKey, string> = {
  closes: 'Fund closes $500M+',
  deals: 'Deals $1B+',
  hires: 'Notable hires',
}

/** The story's page on the site, from the email. */
export function rankHref(article: Pick<NewsletterArticle, 'id' | 'title'>): string {
  return `https://fundopshq.com${storyPath({ id: article.id, headline: article.title })}`
}

/** A figure the story states as its own (a raise or a deal), never a manager's assets. */
function sizeOf(a: NewsletterArticle): number | null {
  return a.fundSizeUsdMillions && a.fundSizeUsdMillions > 0 && !isLikelyAumLeak(a.fundSizeUsdMillions, a.fundName) ? a.fundSizeUsdMillions : null
}

function convertedFigure(sizeUsdM: number, text: string): boolean {
  const fig = headlineFigureFor(sizeUsdM, text)
  return !!fig && fig.currency !== 'USD'
}

/** The story with its duplicates (by the edition's own rule) taken out, first one kept. */
function distinct(rows: RankRow[]): RankRow[] {
  const kept: RankRow[] = []
  for (const r of rows) if (!kept.some((k) => k.article.id === r.article.id || sameStoryLoose(k.article, r.article))) kept.push(r)
  return kept
}

/** Larger first; on a tie, the one more outlets reported. */
function bySize(a: RankRow, b: RankRow): number {
  return (b.sizeUsdM ?? 0) - (a.sizeUsdM ?? 0) || b.article.alsoCoveredBy.length - a.article.alsoCoveredBy.length
}

// ─── Fund closes ───────────────────────────────────────────────────────────

const STAGE_OF: Record<string, CloseStage> = {
  final_close: 'final',
  hard_cap: 'final',
  first_close: 'first',
  interim_close: 'interim',
  second_close: 'interim',
}

/**
 * Called a fund. The league admits "Close" alone as a fund word, which let
 * "Dwight Capital … Close $624MM in September 2026" (a lender's month of loan
 * closings, 2026-10-20) read as a fund close; a ranking that leads the email
 * asks for a fund by name or by noun.
 */
const FUND_NOUN = /\b(funds?|vehicles?|flagship|programme|program|vintage)\b/i

/**
 * Continuation vehicles are transactions, not blind-pool closes. The league's
 * own test is case-sensitive ("continuation (fund|vehicle)"), so "Kirkland-Led
 * EnCap Clinches $3.5B Continuation Vehicle" (2026-10-20) passed it.
 */
const CONTINUATION = /\b(continuation|single[- ]asset|GP[- ]led)\b/i

/** "EnCap Investments LP" → "EnCap Investments", "Sosteneo SGR S.p.A" → "Sosteneo": the name, not the legal form. */
export function firmWords(name: string): string {
  const legal = /(?:,?\s+(?:L\.?P\.?|LLP|LLC|L\.L\.C\.|Inc\.?|Ltd\.?|Limited|plc|PLC|S\.?p\.?A\.?|SGR|AG|S\.A\.?|SA|GmbH|AS|AB|NV|N\.V\.|BV|B\.V\.|SE|SAS))+\.?$/
  const cleaned = cleanEntityName(name).replace(legal, '').trim()
  return cleaned || cleanEntityName(name)
}

/**
 * The fund's name without the manager's in front, when what is left still
 * says it is a fund: "Pantheon Global Secondaries Fund VIII" under Pantheon is
 * "Global Secondaries Fund VIII", "Ara Energy Fund I" under Ara Partners is
 * "Energy Fund I"; "FFL Capital Partners VI" and "Blackstone Energy Transition
 * Partners V" are names and stay whole.
 */
function fundWords(fund: string | null, firm: string): string | null {
  const label = fundLabel(fund)
  if (!label) return null
  const lower = label.toLowerCase()
  for (const prefix of [firm, firm.split(/\s+/)[0]]) {
    if (!prefix || !lower.startsWith(`${prefix.toLowerCase()} `)) continue
    const rest = label.slice(prefix.length).trim()
    if (/\b(funds?|vehicle|programme|program)\b/i.test(rest)) return rest
  }
  return label
}

export function closeRow(a: NewsletterArticle, category: string): RankRow | null {
  if (!FUND_SECTION_ORDER.includes(category)) return null
  const size = sizeOf(a)
  if (!size || size < CLOSE_FLOOR_USD_M) return null
  if (!a.closeType || !STAGE_OF[a.closeType]) return null
  const rejected = leagueRejection({
    kind: 'fundraising',
    headline: a.title,
    roundup: isRoundupArticle(a),
    leadEligible: a.leadEligible,
    firmName: a.firmName,
    closeType: a.closeType,
    eventType: a.eventType,
    sizeUsdM: size,
    summary: cleanSummary(a.tldr),
    assetClasses: [category, ...a.fundCategories],
    fundName: a.fundName,
    coverage: a.alsoCoveredBy.map((source) => ({ source, url: '', headline: '' })),
  })
  if (rejected) return null
  if (!a.fundName && !FUND_NOUN.test(a.title)) return null
  if (CONTINUATION.test(`${a.title} ${a.fundName ?? ''}`)) return null
  const firm = firmWords(a.firmName as string)
  const detail = [fundWords(a.fundName, firm), STAGE_LABEL[STAGE_OF[a.closeType]]].filter(Boolean).join(' · ')
  return { article: a, lead: firm, detail: detail || null, sizeUsdM: size, converted: convertedFigure(size, a.title), isHeadline: false }
}

// ─── Deals ─────────────────────────────────────────────────────────────────

/**
 * Not done yet, beyond what dealStage already reads as a rumour: "LSEG Is in
 * Discussions With Permira to Acquire Octus" (2026-10-14), "SoftBank Was
 * Reported to Be in Early Talks" (10-21), "CVC explores Verisure take-private"
 * (10-22). A ranking of deals is a ranking of deals that happened.
 */
const NOT_DONE = /\b(discussions?|reported(ly)?|rumou?r(ed|s)?|talks|explor(es?|ing)|weigh(s|ing)?|consider(s|ing)?|mull(s|ing)?|eye(s|ing)?|bids?|bidders?|near(s|ing)?|could|may|might|would|potential|possible|prepar(es?|ing)|plans?|seeks?|seeking|sounds? out|hires? advisers?)\b/i

export function dealRow(a: NewsletterArticle, category: string): RankRow | null {
  if (category !== 'deals') return null
  if (!a.leadEligible || isRoundupArticle(a)) return null
  const size = sizeOf(a)
  if (!size || size < DEAL_FLOOR_USD_M) return null
  if (dealStage(a.title) === 0 || NOT_DONE.test(a.title)) return null
  // The figure is the deal's own when the headline states it. A headline with
  // a different figure is about another sum ("Silgan and AIP agreed to acquire
  // Trivium … about $3.4 billion" was stored at $1B, 2026-10-21); a headline
  // with none may lean on the summary.
  const inHeadline = headlineFigureFor(size, a.title)
  if (!inHeadline) {
    if (headlineMoney(a.title).length > 0) return null
    if (!a.tldr || !headlineFigureFor(size, a.tldr)) return null
  }
  return {
    article: a,
    lead: a.title,
    detail: null,
    sizeUsdM: size,
    converted: inHeadline ? inHeadline.currency !== 'USD' : convertedFigure(size, a.tldr ?? ''),
    isHeadline: true,
  }
}

// ─── Notable hires ─────────────────────────────────────────────────────────

/**
 * Firms a reader in private markets knows by name: the largest managers,
 * allocators and multi-strategy funds, by what the site covered in the 35 days
 * to 2026-10-22 and by size. Matched on the name's key (entityKey + keysMatch),
 * so "Blackstone Credit" is Blackstone and "Apterra (Apollo-backed)" is not
 * Apollo. Editorial and short on purpose: add a firm when a move there would
 * clearly lead a trade page.
 */
export const WELL_KNOWN = [
  // Private equity and multi-asset managers
  'Blackstone', 'KKR', 'Apollo', 'Carlyle', 'Brookfield', 'Ares', 'TPG', 'EQT', 'CVC', 'Partners Group',
  'Bain Capital', 'Warburg Pincus', 'Advent International', 'Hellman & Friedman', 'Thoma Bravo',
  'Vista Equity Partners', 'Silver Lake', 'Permira', 'Cinven', 'BC Partners', 'Apax', 'Ardian',
  'General Atlantic', 'Insight Partners', 'Clayton Dubilier & Rice', 'Leonard Green', 'Hg', 'Nordic Capital',
  'Triton', 'PAI Partners', 'Bridgepoint', 'GTCR', 'Thomas H. Lee Partners', 'THL Partners', 'Veritas Capital',
  'Stone Point Capital', 'New Mountain Capital', 'Genstar Capital', 'Francisco Partners', 'Searchlight Capital',
  'Investcorp', 'Goldman Sachs', 'Morgan Stanley', 'J.P. Morgan', 'JPMorgan', 'BlackRock', 'PIMCO', 'Nuveen',
  'PGIM', 'Invesco', 'M&G', 'Legal & General', 'L&G', 'Schroders', 'Amundi', 'Neuberger Berman',
  'Franklin Templeton', 'UBS', 'Macquarie', 'Northern Trust',
  // Private credit
  'Blue Owl', 'HPS', 'Golub Capital', 'Oaktree', 'Sixth Street', 'Antares', 'Churchill', 'Barings',
  'Cerberus', 'Fortress', 'Benefit Street Partners', 'Monroe Capital', 'Hayfin', 'Intermediate Capital Group', 'ICG',
  // Secondaries, fund of funds, advisers
  'Hamilton Lane', 'StepStone', 'Pantheon', 'HarbourVest', 'Adams Street', 'Lexington Partners', 'Coller Capital',
  // Real assets
  'Global Infrastructure Partners', 'Stonepeak', 'IFM Investors', 'Starwood', 'LaSalle', 'Hines', 'Clarion Partners',
  'Tishman Speyer', 'Copenhagen Infrastructure Partners', 'Antin Infrastructure Partners',
  // Hedge funds and multi-managers
  'Citadel', 'Millennium', 'Balyasny', 'Two Sigma', 'Bridgewater', 'D. E. Shaw', 'Point72', 'Elliott', 'Man Group',
  'Coatue', 'Tiger Global',
  // Venture
  'Sequoia', 'Andreessen Horowitz', 'a16z', 'Lightspeed', 'Accel', 'General Catalyst', 'Founders Fund', 'Kleiner Perkins',
  // Allocators
  'CalPERS', 'CalSTRS', 'CPP Investments', 'OMERS', 'Ontario Teachers', 'CDPQ', 'PSP Investments', 'GIC', 'Temasek',
  'ADIA', 'Mubadala', 'NBIM', 'APG', 'PGGM',
]
const WELL_KNOWN_KEYS = WELL_KNOWN.map((n) => entityKey(n)).filter((k) => k.length >= 2)

export function isWellKnownFirm(name: string | null | undefined): boolean {
  const key = entityKey(name)
  if (!key) return false
  return WELL_KNOWN_KEYS.some((k) => key === k || (k.length >= 3 && keysMatch(key, k) && key.startsWith(k)))
}

/** Not a hire: someone leaving, retiring or being searched for, or a firm shedding people. */
const NOT_A_HIRE = /\b(exits?|exiting|to exit|depart(s|ing|ure|ures)?|leaves|leaving|retires?|retiring|retirement|steps? (down|back|aside)|stepping down|search(es|ing)?|cuts?|cutting|lays? off|layoffs?|job losses|ousted|fired|dies|death|resigns?|resignation|exodus)\b/i
/** A vice president is not the president. */
const VICE = /\b(senior |executive )?vice[- ]president\b|\b[se]?vp\b/gi
const TOP_JOB = /\b(chief|ceo|cfo|coo|cio|cto|cco|clo|cro|cmo|president|chair(man|woman|person)?|managing partner|senior partner|founding partner|co-?founder|founder)\b/i
const SENIOR_JOB = /\b(head|heads|partner|lead|leader|leads|managing director|md)\b/i

/** 2 for the top of a firm, 1 for a head or a partner, 0 for anything else. Read from the stated job, else the headline. */
export function seniority(article: Pick<NewsletterArticle, 'personTitle' | 'title'>): 0 | 1 | 2 {
  const text = (article.personTitle?.trim() || article.title).replace(VICE, ' ')
  if (TOP_JOB.test(text)) return 2
  if (SENIOR_JOB.test(text.replace(/\boperating partners?\b/gi, ' '))) return 1
  return 0
}

/** One person, named plainly: "Michael Kulper", not "Jordan Tanner, Anna Dev" or "Hertz". */
function onePerson(name: string | null): string | null {
  const n = name?.trim()
  if (!n || /[;,&]|\band\b/.test(n)) return null
  return n.split(/\s+/).length >= 2 ? n : null
}

export function hireRow(a: NewsletterArticle, category: string): RankRow | null {
  if (category !== 'people_moves') return null
  if (!a.firmName || a.eventType === 'executive_departure') return null
  if (NOT_A_HIRE.test(a.title)) return null
  if (seniority(a) === 0) return null
  if (!isWellKnownFirm(a.firmName) && a.alsoCoveredBy.length < 2) return null
  const firm = firmWords(a.firmName)
  const person = onePerson(a.personName)
  const job = a.personTitle?.trim()
  if (person && job && !/[;]/.test(job) && job.length <= 70) {
    return { article: a, lead: firm, detail: `${person}, ${job}`, sizeUsdM: null, converted: false, isHeadline: false }
  }
  return { article: a, lead: a.title, detail: null, sizeUsdM: null, converted: false, isHeadline: true }
}

// ─── The block ─────────────────────────────────────────────────────────────

/**
 * The lists for an edition, from its groups as assembled. `topStories` are the
 * stories the edition already leads with: none of them is listed again (by id,
 * or by the edition's same-story rule), so the block adds what the reader has
 * not just read (Danny, 2026-10-22: "Yes, minus the top stories"). Only lists
 * with a row.
 */
export function pickRanks(groups: ArticleGroup[], topStories: NewsletterArticle[] = []): RankList[] {
  const closes: RankRow[] = []
  const deals: RankRow[] = []
  const hires: RankRow[] = []
  const leads = (a: NewsletterArticle) => topStories.some((t) => t.id === a.id || sameStoryLoose(t, a))
  for (const g of groups) {
    for (const a of g.articles) {
      if (leads(a)) continue
      const c = closeRow(a, g.category)
      if (c) { closes.push(c); continue }
      const d = dealRow(a, g.category)
      if (d) { deals.push(d); continue }
      const h = hireRow(a, g.category)
      if (h) hires.push(h)
    }
  }

  // Hires: the top of a firm first, then a well-known firm, then the most
  // reported; one row a firm.
  const rankedHires = distinct(
    hires.sort(
      (x, y) =>
        seniority(y.article) - seniority(x.article) ||
        Number(isWellKnownFirm(y.article.firmName)) - Number(isWellKnownFirm(x.article.firmName)) ||
        y.article.alsoCoveredBy.length - x.article.alsoCoveredBy.length ||
        (y.article.relevanceScore ?? 0) - (x.article.relevanceScore ?? 0),
    ),
  )
  const firms = new Set<string>()
  const oneAFirm = rankedHires.filter((r) => {
    const key = entityKey(r.article.firmName)
    if (firms.has(key)) return false
    firms.add(key)
    return true
  })

  const lists: RankList[] = [
    { key: 'closes', label: RANK_LABEL.closes, rows: distinct(closes.sort(bySize)).slice(0, MAX_RANK_ROWS) },
    { key: 'deals', label: RANK_LABEL.deals, rows: distinct(deals.sort(bySize)).slice(0, MAX_RANK_ROWS) },
    { key: 'hires', label: RANK_LABEL.hires, rows: oneAFirm.slice(0, MAX_HIRE_ROWS) },
  ]
  return lists.filter((l) => l.rows.length > 0)
}
