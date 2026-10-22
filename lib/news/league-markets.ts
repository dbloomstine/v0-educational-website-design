/**
 * The league table's market pages (2026-10-22): /league-tables/<slug>, one indexable page per market for the year to
 * date, so a search for "largest private credit fund closes 2026" (or an AI assistant asked it) finds a page that
 * answers it in its title and first sentence. The filtered views of /league-tables stay noindex.
 *
 * Pure: no I/O.
 */
import { LEAGUE_ASSET_LABEL, type FundClose } from './league'
import { sizeLabel, totalLabel } from './format'

export interface LeagueMarket {
  slug: string
  /** The league's asset-class tag (lib/news/league.ts LEAGUE_ASSET_LABEL). */
  asset: string
  /** As it reads mid-sentence: "the largest private credit fund close". */
  name: string
}

/** Every market the league ranks (hedge funds are never in it). Order: as the league's tabs. */
export const LEAGUE_MARKETS: LeagueMarket[] = [
  { slug: 'private-equity', asset: 'PE', name: 'private equity' },
  { slug: 'venture-capital', asset: 'VC', name: 'venture capital and growth' },
  { slug: 'private-credit', asset: 'credit', name: 'private credit' },
  { slug: 'real-estate', asset: 'real_estate', name: 'real estate' },
  { slug: 'infrastructure', asset: 'infrastructure', name: 'infrastructure' },
  { slug: 'secondaries', asset: 'secondaries', name: 'secondaries' },
  { slug: 'gp-stakes', asset: 'gp_stakes', name: 'GP stakes' },
].filter((m) => m.asset in LEAGUE_ASSET_LABEL)

export function marketBySlug(slug: string): LeagueMarket | null {
  return LEAGUE_MARKETS.find((m) => m.slug === slug) ?? null
}

export function marketForAsset(asset: string | null | undefined): LeagueMarket | null {
  return LEAGUE_MARKETS.find((m) => m.asset === asset) ?? null
}

/** "Largest private credit fund closes of 2026". */
export function marketTitle(m: LeagueMarket, year: number): string {
  return `Largest ${m.name} fund closes of ${year}`
}

const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })

/**
 * The answer, in two sentences, from the rows as ranked (largest first; the year's final closes in this market):
 * "The largest private credit fund close reported in 2026 so far is Arini's Direct Lending Fund I at $4B, first reported
 * October 20. FundOpsHQ has ranked 41 final closes in private credit this year, totalling $96.2B."
 */
export function marketSummary(m: LeagueMarket, rows: FundClose[], year: number): string {
  if (rows.length === 0) return `No final close in ${m.name} has been reported with a size in ${year} so far.`
  const top = rows[0]
  const total = rows.reduce((s, c) => s + c.sizeUsdM, 0)
  // A fund named after its manager ("Arini Direct Lending Fund I") is not given the manager's name twice.
  const firstWord = top.firm.split(/\s+/)[0].toLowerCase()
  const fund = !top.fund ? `a fund from ${top.firm}` : top.fund.toLowerCase().includes(firstWord) ? top.fund : `${top.firm}’s ${top.fund}`
  const size = `${top.converted ? 'about ' : ''}${sizeLabel(top.sizeUsdM)}`
  const count = rows.length === 1 ? 'one final close' : `${rows.length.toLocaleString('en-US')} final closes`
  return `The largest ${m.name} fund close reported in ${year} so far is ${fund} at ${size}, first reported ${day(top.date)}. FundOpsHQ has ranked ${count} in ${m.name} this year, totalling ${totalLabel(total)}.`
}

export interface MarketAnswer {
  q: string
  a: string
}

/**
 * Three plain questions and their answers, from the same rows (2026-10-22 SEO audit: make the market pages quotable by
 * search and by AI assistants). Shown as text, not FAQ markup (Google gives FAQ results to few sites now). Nothing when
 * the market has no close this year.
 */
export function marketQuestions(m: LeagueMarket, rows: FundClose[], year: number): MarketAnswer[] {
  if (rows.length === 0) return []
  const size = (c: FundClose) => `${c.converted ? 'about ' : ''}${sizeLabel(c.sizeUsdM)}`
  const firstWord = (c: FundClose) => c.firm.split(/\s+/)[0].toLowerCase()
  const fund = (c: FundClose) => (!c.fund ? `an unnamed ${c.firm} fund` : c.fund.toLowerCase().includes(firstWord(c)) ? c.fund : `${c.firm}’s ${c.fund}`)
  const top = rows[0]
  const latest = [...rows].sort((a, b) => b.date.localeCompare(a.date))[0]
  const total = rows.reduce((s, c) => s + c.sizeUsdM, 0)
  const count = rows.length === 1 ? 'one final close' : `${rows.length.toLocaleString('en-US')} final closes`
  return [
    { q: `What is the largest ${m.name} fund close of ${year}?`, a: `${fund(top)} at ${size(top)}, first reported ${day(top.date)}.` },
    { q: `How much have ${m.name} funds raised in ${year}?`, a: `${totalLabel(total)} across ${count} that FundOpsHQ has reported so far this year.` },
    { q: `What was the latest ${m.name} fund close?`, a: `${fund(latest)} at ${size(latest)}, reported ${day(latest.date)}.` },
  ]
}
