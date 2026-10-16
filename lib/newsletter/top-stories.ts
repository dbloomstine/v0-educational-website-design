/**
 * The top of the edition.
 *
 * Until 2026-10-02 an edition opened under the words "this morning's top
 * stories" and then listed everything, section by section: the day's biggest
 * deal sat thirty headlines down under DEALS, and the most widely reported
 * story of the morning was last, under REGULATORY. The site's front page had
 * already solved this — a lead and top stories first, then the sections — so
 * the email now does the same, with the same judgement: lib/news/stories.ts
 * storyWeight() (size, how many desks reported it, which desks, how final),
 * and the same two brakes so the top is a front page and not the five largest
 * closes: each further story of a kind already shown counts for less, and one
 * firm appears once. Weight decides which stories lead; among the raises that
 * do (and among the deals) the larger runs first, as in the subject line.
 *
 * A story appears once in an edition: what is picked for the top is taken out
 * of its section.
 *
 * Pure: no I/O.
 */
import type { ArticleGroup, NewsletterArticle } from './query-articles'
import { isLikelyAumLeak, isRoundupArticle } from './query-articles'
import { storyWeight, type StoryKind } from '@/lib/news/stories'
import { normalizeSourceName } from '@/lib/news/constants'
import { dealStage } from './story-links'

export interface TopPick {
  article: NewsletterArticle
  /** The section it came from: its category key and its label. */
  category: string
  label: string
}

/** Sections that are a story type; every other section is fund activity under an asset class. */
const KIND_OF_CATEGORY: Record<string, StoryKind> = {
  deals: 'deals',
  people_moves: 'people',
  lp_commitments: 'lps',
  regulatory: 'regulation',
  service_providers: 'providers',
}

/** How many stories lead an edition of `total`: none on a thin morning, when the sections are the whole brief. */
export function topCount(total: number): number {
  if (total >= 25) return 5
  if (total >= 16) return 4
  if (total >= 12) return 3
  return 0
}

/** The story's own figure: a raise or a deal's size, never a firm's assets under management. */
function sizeOf(article: NewsletterArticle): number | null {
  return article.fundSizeUsdMillions && !isLikelyAumLeak(article.fundSizeUsdMillions, article.fundName) ? article.fundSizeUsdMillions : null
}

/**
 * What a thin morning may lead with. With fewer than five places to fill, the
 * block takes whatever weighs most, and on 2026-10-05 that was a rumour
 * ("KKR, Blackstone among PE firms eyeing windscreen repair group"), a $38M
 * launch and an $11M launch. On such a morning:
 *   - a rumour does not lead;
 *   - a raise, a deal or an allocation leads on a stated size of at least
 *     THIN_DAY_FLOOR_USD_M; without a size, a deal needs two more outlets than
 *     the first, and a raise cannot lead at all;
 *   - a hire or a service-provider story leads only when two other outlets
 *     carried it too;
 *   - and if fewer than two stories qualify there is no top block: the
 *     sections are the whole brief, as on the thinnest mornings.
 */
export const THIN_DAY_FLOOR_USD_M = 250
const MIN_TOP_ON_A_THIN_DAY = 2

/**
 * A North American regulator, named in the headline. On a thin morning a
 * regulation story leads on this or on being widely reported: 2026-10-11, a
 * Sunday, led with ASIC (Australia), the FCA (UK) and the SEC, three regulators
 * in a row, and ASIC stop orders led on 10-08 and 10-09 as well.
 */
const NA_REGULATOR = /\b(SEC|FINRA|CFTC|FTC|DOJ|OCC|FDIC|IRS|Fed|Federal Reserve|Treasury|Department of Labor|DOL|Congress|Senate|OSC|CSA|AMF|Ontario Securities)\b/
/** At most this many regulation stories lead an edition, however many there are. */
const MAX_REGULATION_AT_TOP = 1

function worthLeadingOnAThinDay(p: { article: NewsletterArticle; kind: StoryKind }): boolean {
  const widely = p.article.alsoCoveredBy.length >= 2
  if (p.kind === 'regulation') return widely || NA_REGULATOR.test(p.article.title)
  if (p.kind === 'people' || p.kind === 'providers') return widely
  if (p.kind === 'deals' && dealStage(p.article.title) === 0) return false
  const size = sizeOf(p.article)
  if (size === null) return p.kind === 'deals' && widely
  return size >= THIN_DAY_FLOOR_USD_M
}

export { HOME_FACTOR, homeFactor } from '@/lib/news/home-factor'
import { homeFactor } from '@/lib/news/home-factor'

function weightOf(article: NewsletterArticle, kind: StoryKind): number {
  const size = sizeOf(article)
  return homeFactor(article) * storyWeight(
    {
      kind,
      sizeUsdM: size,
      coverage: article.alsoCoveredBy.map((source) => ({ source, url: '', headline: '' })),
      source: normalizeSourceName(article.sourceName),
      closeType: article.closeType,
      leadEligible: article.leadEligible,
      roundup: false,
      summary: article.tldr,
    },
    article.isHighSignal,
    article.relevanceScore ?? 0,
  )
}

export function pickTopStories(groups: ArticleGroup[], total: number): TopPick[] {
  const want = topCount(total)
  if (want === 0) return []
  const pool = groups
    .flatMap((g) => g.articles.map((article) => ({ article, category: g.category, label: g.label, kind: KIND_OF_CATEGORY[g.category] ?? ('fundraising' as StoryKind) })))
    // A multi-story wire is filler, never a lead; so is an allocator's commitment
    // (10-04 led with New Mexico's two real estate commitments).
    .filter((p) => !isRoundupArticle(p.article) && p.category !== 'lp_commitments')
    .filter((p) => want >= 5 || worthLeadingOnAThinDay(p))
    .map((p) => ({ ...p, weight: weightOf(p.article, p.kind) }))
  if (want < 5 && pool.length < MIN_TOP_ON_A_THIN_DAY) return []

  const picked: (typeof pool)[number][] = []
  const kinds = new Map<StoryKind, number>()
  const firms = new Set<string>()
  while (picked.length < want && pool.length > 0) {
    let best = -1
    let bestScore = -Infinity
    pool.forEach((p, i) => {
      const firm = (p.article.firmName ?? '').toLowerCase()
      if (firm && firms.has(firm)) return
      // The brake above (each further story of a kind counts for less) was not
      // enough to stop three regulators leading 2026-10-11: one is the limit.
      if (p.kind === 'regulation' && (kinds.get('regulation') ?? 0) >= MAX_REGULATION_AT_TOP) return
      const score = p.weight * Math.pow(0.8, kinds.get(p.kind) ?? 0)
      if (score > bestScore) { bestScore = score; best = i }
    })
    if (best < 0) break
    const [p] = pool.splice(best, 1)
    picked.push(p)
    kinds.set(p.kind, (kinds.get(p.kind) ?? 0) + 1)
    if (p.article.firmName) firms.add(p.article.firmName.toLowerCase())
  }

  // Which stories lead is a matter of weight; among the raises that do, and
  // among the deals, the larger is named first — the order the subject line
  // names them in, and the order a reader of league tables expects. Weight
  // alone put a $1.3bn close that five desks reported above a $10bn one that
  // two did. Each kind keeps the places it won. The figure is read from where
  // the reader is (HOME_FACTOR), as the weight was.
  for (const kind of ['fundraising', 'deals'] as StoryKind[]) {
    const places = picked.map((p, i) => (p.kind === kind ? i : -1)).filter((i) => i >= 0)
    const bySize = places.map((i) => picked[i]).sort((a, b) => raiseSize(b) - raiseSize(a))
    places.forEach((place, n) => { picked[place] = bySize[n] })
  }
  return picked.map((p) => ({ article: p.article, category: p.category, label: p.label }))
}

/** A story's figure for ordering: nothing for a story that is not "Firm raises $X" (a wind-down, a CLO pricing). */
function raiseSize(p: { article: NewsletterArticle }): number {
  return p.article.leadEligible ? (sizeOf(p.article) ?? 0) * homeFactor(p.article) : 0
}

/** The edition in reading order: the top stories, then the sections without them. */
export function arrangeEdition(groups: ArticleGroup[], total: number): { top: TopPick[]; sections: ArticleGroup[] } {
  const top = pickTopStories(groups, total)
  const taken = new Set(top.map((t) => t.article.id))
  const sections = groups
    .map((g) => ({ ...g, articles: g.articles.filter((a) => !taken.has(a.id)) }))
    .filter((g) => g.articles.length > 0)
  return { top, sections }
}

const STAGE_WORDS: Record<string, string> = {
  final_close: 'Final close',
  hard_cap: 'Final close',
  first_close: 'First close',
  interim_close: 'Interim close',
  second_close: 'Second close',
  target: 'Target',
  launch: 'Launch',
}

/** "$4.2B", "$550M". */
export function sizeWords(usdM: number): string {
  if (usdM >= 1000) return `$${(usdM / 1000).toFixed(usdM >= 100_000 ? 0 : 1).replace(/\.0$/, '')}B`
  return `$${usdM >= 100 ? Math.round(usdM) : Number(usdM.toFixed(1))}M`
}

/**
 * The line over a top story: its section, and — for a raise or a deal — the
 * number and the stage. Only what the story states: a wind-down or a CLO
 * pricing gets its section and nothing else.
 */
export function kickerParts(pick: TopPick): string[] {
  const a = pick.article
  const parts = [pick.label]
  const sized = pick.category !== 'people_moves' && pick.category !== 'regulatory' && pick.category !== 'service_providers'
  if (sized && a.leadEligible && a.fundSizeUsdMillions && !isLikelyAumLeak(a.fundSizeUsdMillions, a.fundName)) {
    parts.push(sizeWords(a.fundSizeUsdMillions))
  }
  if (!KIND_OF_CATEGORY[pick.category] && a.leadEligible && a.closeType && STAGE_WORDS[a.closeType]) parts.push(STAGE_WORDS[a.closeType])
  return parts
}
