/**
 * Stories — the unit the website is built from.
 *
 * A story is one event (a fund close, a deal, a hire) however many outlets
 * reported it. This module turns classified `news_items` rows into ranked
 * stories using the same screening, clustering and section rules as the
 * newsletter (lib/newsletter/query-articles + story-links), so the site and
 * the email agree on what a story is and where it belongs.
 *
 * Pure: no I/O. lib/news/front-page.ts does the fetching and caching.
 */
import {
  rowToArticle, screenArticle, gateArticle, placeArticle, mergeStoryGroup, plainHeadline,
  sourceTier, isLikelyAumLeak, type NewsletterArticle, type ArticleSection,
} from '@/lib/newsletter/query-articles'
import { clusterBy, dealStage, entityKey, entityMentioned, isRoundup, keysMatch, sameStoryLoose, storyFamily } from '@/lib/newsletter/story-links'
import { isSameStory } from './story-dedup'
import { normalizeSourceName } from './constants'

export type StoryKind = 'fundraising' | 'deals' | 'people' | 'lps' | 'regulation' | 'providers'

const KIND_OF: Record<ArticleSection, StoryKind> = {
  fund: 'fundraising',
  deals: 'deals',
  people_moves: 'people',
  lp_commitments: 'lps',
  regulatory: 'regulation',
  service_providers: 'providers',
}

const ASSET_TAGS = new Set(['PE', 'VC', 'credit', 'hedge', 'real_estate', 'infrastructure', 'secondaries', 'gp_stakes'])

export interface StoryCoverage {
  source: string
  url: string
  headline: string
}

export interface Story {
  /** news_items id of the row whose headline we show. */
  id: string
  /** Every row in the story. A permalink minted from any of them still resolves. */
  memberIds: string[]
  headline: string
  url: string
  source: string | null
  /** One-sentence summary written at classification time. */
  summary: string | null
  /** Other outlets' reports of the same event, best source first. */
  coverage: StoryCoverage[]
  kind: StoryKind
  /** Asset classes the story touches; for a fund event the first is its own. */
  assetClasses: string[]
  eventType: string | null
  closeType: string | null
  /** Fund size or deal value, USD millions. Null when unknown or implausible. */
  sizeUsdM: number | null
  firmName: string | null
  fundName: string | null
  personName: string | null
  geography: string[]
  /** Firms and people to embolden in the headline. */
  entities: string[]
  /**
   * The firms the story names, subject first — firms only, never people. Each
   * has a page at /firm/<slug>; `entities` cannot be used for that because it
   * mixes in the people.
   */
  firms: string[]
  /** False for wind-downs, CLO pricings, LP commitments: never "Firm $X". */
  leadEligible: boolean
  roundup: boolean
  /** ISO timestamp the story first reached us. */
  firstSeen: string
  publishedDate: string | null
  /** Editorial weight before time decay. */
  weight: number
}

const DAY_MS = 86_400_000

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any

interface Candidate {
  article: NewsletterArticle
  row: Row
  day: number
}

/**
 * How much a story matters, before recency. Additive and deliberately simple:
 * every term is something an editor would say out loud.
 */
export function storyWeight(s: Pick<Story, 'kind' | 'sizeUsdM' | 'coverage' | 'source' | 'closeType' | 'leadEligible' | 'roundup' | 'summary'>, highSignal: boolean, relevance: number): number {
  const kindBase: Record<StoryKind, number> = {
    fundraising: 1.0, regulation: 0.9, deals: 0.8, people: 0.65, lps: 0.6, providers: 0.55,
  }
  let w = kindBase[s.kind]

  // Size: $100M ≈ +0.31, $1B ≈ +0.86, $10B ≈ +1.5. Deals count for less —
  // a $5B buyout is big news, but this is a fund-industry front page.
  if (s.sizeUsdM && s.sizeUsdM > 0) {
    const sizeTerm = Math.log10(s.sizeUsdM / 50 + 1) * 0.65
    w += s.kind === 'fundraising' ? sizeTerm : s.kind === 'deals' || s.kind === 'lps' ? sizeTerm * 0.6 : 0
  }

  // Independent confirmation: every extra outlet is a vote that it matters.
  // Trade and wire desks count in full; reprint sites and aggregators barely
  // (five crypto blogs echoing a $70M first close is not five votes).
  let votes = 0
  for (const c of s.coverage) votes += sourceTier(c.source) <= 10 ? 0.2 : 0.06
  w += Math.min(votes, 0.7)

  // A story a top-tier desk chose to cover.
  const tier = sourceTier(s.source)
  if (tier <= 2) w += 0.3
  else if (tier <= 5) w += 0.15

  if (s.closeType === 'final_close') w += 0.15
  if (highSignal) w += 0.15
  w += Math.max(0, Math.min(relevance, 1)) * 0.3

  if (!s.leadEligible) w -= 0.6
  if (s.roundup) w -= 0.5
  if (!s.summary) w -= 0.15
  return w
}

/** Weight after time decay. Half-life 28h: yesterday afternoon's big close still leads the morning. */
export function storyHeat(story: Story, nowMs: number): number {
  const ageH = Math.max(0, (nowMs - new Date(story.firstSeen).getTime()) / 3_600_000)
  return story.weight * Math.pow(0.5, ageH / 28)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isLateDealRepeat(a: any, b: any): boolean {
  if (!a.firmName || !b.firmName) return false
  if (!keysMatch(entityKey(a.firmName), entityKey(b.firmName))) return false
  if (dealStage(a.title) !== dealStage(b.title)) return false
  if (storyFamily(a.eventType) !== 'deal' || storyFamily(b.eventType) !== 'deal') return false
  return sameStoryLoose(a, b, { crossEdition: true })
}

/**
 * The firms a report names: its subject, then every entity the classifier
 * typed as a firm with confidence and that the headline or summary actually
 * mentions (the same test rowToArticle applies before trusting an entity).
 */
function namedFirms(row: Row | undefined, article: NewsletterArticle): string[] {
  const raw = (row?.entities_raw ?? []) as { name?: string; type?: string; confidence?: number }[]
  const candidates = [
    article.firmName,
    ...raw
      .filter((e) => e?.name && e.type === 'firm' && (e.confidence ?? 0) >= 0.8 && entityMentioned(e.name, article.title, article.tldr))
      .map((e) => e.name as string),
  ]
  const out: string[] = []
  const seen: string[] = []
  for (const name of candidates) {
    if (!name) continue
    // A description is not a name ("New London private equity firm").
    if (/\b[a-z]{3,}\s+[a-z]{3,}\b/.test(name)) continue
    const key = entityKey(name)
    if (!key || seen.some((k) => keysMatch(k, key))) continue
    seen.push(key)
    out.push(name)
    if (out.length >= 6) break
  }
  return out
}

export function buildStories(rows: Row[]): Story[] {
  const candidates: Candidate[] = []
  for (const row of rows) {
    const article = rowToArticle(row)
    if (screenArticle(article)) continue
    article.title = plainHeadline(article.title, article.tldr, article.sourceName)
    const day = Math.floor(new Date(`${String(row.published_date).slice(0, 10)}T12:00:00Z`).getTime() / DAY_MS)
    candidates.push({ article, row, day })
  }

  const singles = candidates.filter((c) => !isRoundup(c.article.title, c.article.headlineEntities))
  const roundups = candidates.filter((c) => isRoundup(c.article.title, c.article.headlineEntities))

  // The same clustering as an edition, stretched over several days: within a
  // day the looser same-edition rules apply; further apart, the stricter
  // cross-edition ones (a big firm really does announce two funds in a week).
  const same = (a: Candidate, b: Candidate) => {
    const gap = Math.abs(a.day - b.day)
    if (gap > 4) {
      // A deal re-reported a week on by the trade press ("73 Strings buys
      // Callisto…", then "73 Strings Acquires Callisto" six days later) is
      // still one deal: same acquirer, same two parties, same stage.
      return (
        gap <= 10 &&
        isLateDealRepeat(a.article, b.article)
      )
    }
    return isSameStory(a.article, b.article) || sameStoryLoose(a.article, b.article, { crossEdition: gap > 1 })
  }
  const groups = clusterBy(singles, same)
  for (const r of roundups) {
    if (singles.some((s) => Math.abs(s.day - r.day) <= 4 && sameStoryLoose(s.article, r.article))) continue
    groups.push([r])
  }

  const stories: Story[] = []
  for (const group of groups) {
    const rowById = new Map(group.map((c) => [c.article.id, c.row]))
    const best = mergeStoryGroup(group.map((c) => c.article))
    if (gateArticle(best)) continue
    const placement = placeArticle(best)
    if (!placement) continue

    const tags = best.fundCategories.filter((c) => ASSET_TAGS.has(c))
    const assetClasses = placement.assetClass
      ? [placement.assetClass, ...tags.filter((t) => t !== placement.assetClass)]
      : tags

    // One entry per outlet, best source first, never the primary outlet again.
    const seenSources = new Set<string>([normalizeSourceName(best.sourceName) ?? ''])
    const coverage: StoryCoverage[] = []
    for (const c of group
      .map((g) => g.article)
      .filter((a) => a.id !== best.id)
      .sort((a, b) => sourceTier(a.sourceName) - sourceTier(b.sourceName))) {
      const source = normalizeSourceName(c.sourceName)
      if (!source || seenSources.has(source)) continue
      seenSources.add(source)
      coverage.push({ source, url: c.sourceUrl, headline: c.title })
    }

    const size = best.fundSizeUsdMillions && !isLikelyAumLeak(best.fundSizeUsdMillions, best.fundName)
      ? best.fundSizeUsdMillions
      : null
    const firstSeen = group
      .map((c) => String(c.row.created_at ?? `${String(c.row.published_date).slice(0, 10)}T12:00:00Z`))
      .sort()[0]
    const bestRow = rowById.get(best.id)

    const partial = {
      kind: KIND_OF[placement.section],
      sizeUsdM: size,
      coverage,
      source: normalizeSourceName(best.sourceName),
      closeType: best.closeType,
      leadEligible: placement.leadEligible,
      roundup: isRoundup(best.title, best.headlineEntities),
      summary: best.tldr,
    }
    stories.push({
      id: best.id,
      memberIds: group.map((c) => c.article.id),
      headline: best.title,
      url: best.sourceUrl,
      ...partial,
      assetClasses,
      eventType: best.eventType,
      firmName: best.firmName,
      fundName: best.fundName,
      personName: best.personName,
      geography: best.geography,
      entities: best.headlineEntities,
      firms: namedFirms(bestRow, best),
      firstSeen,
      publishedDate: best.publishedDate ? String(best.publishedDate).slice(0, 10) : null,
      weight: storyWeight(partial, Boolean(bestRow?.is_high_signal), Number(bestRow?.relevance_score ?? 0)),
    })
  }

  return stories.sort((a, b) => b.firstSeen.localeCompare(a.firstSeen))
}

// ─── Front-page composition ─────────────────────────────────────────────────

export interface FrontPage {
  lead: Story | null
  top: Story[]
  latest: Story[]
  largestCloses: Story[]
  stats: { funds: number; capitalUsdM: number; deals: number; moves: number }
}

/**
 * Pick the lead and the top stories. Greedy by heat, with two brakes so the
 * top of the page is a front page and not a list of the six largest closes:
 * each further story of a kind already shown counts for less, and one firm
 * appears once.
 */
export function rankTop(stories: Story[], nowMs: number, count: number, exclude: Set<string> = new Set()): Story[] {
  const pool = stories.filter((s) => !exclude.has(s.id) && !s.roundup)
  const picked: Story[] = []
  const kindCount = new Map<StoryKind, number>()
  const firms = new Set<string>()
  while (picked.length < count && pool.length > 0) {
    let bestIdx = -1
    let bestScore = -Infinity
    pool.forEach((s, i) => {
      const firm = (s.firmName ?? '').toLowerCase()
      if (firm && firms.has(firm)) return
      const score = storyHeat(s, nowMs) * Math.pow(0.8, kindCount.get(s.kind) ?? 0)
      if (score > bestScore) { bestScore = score; bestIdx = i }
    })
    if (bestIdx < 0) break
    const [s] = pool.splice(bestIdx, 1)
    picked.push(s)
    kindCount.set(s.kind, (kindCount.get(s.kind) ?? 0) + 1)
    if (s.firmName) firms.add(s.firmName.toLowerCase())
  }
  return picked
}

export function composeFrontPage(stories: Story[], nowMs: number): FrontPage {
  // The lead must be a real, summarised story we would put a name and a
  // number on; fall back to anything ranked if a quiet weekend offers none.
  // …and one with something to say under the headline: a one-clause summary
  // ("Apax announces $13.5B target for Fund XII.") makes a thin lead, so a
  // story with a real deck wins a close call.
  const leadPool = stories.filter((s) => s.leadEligible && s.summary)
  const deckBonus = (s: Story) => ((s.summary?.length ?? 0) >= 80 ? 1 : 0.85)
  const lead =
    [...leadPool].filter((s) => !s.roundup).sort((a, b) => storyHeat(b, nowMs) * deckBonus(b) - storyHeat(a, nowMs) * deckBonus(a))[0] ??
    rankTop(stories, nowMs, 1)[0] ??
    null
  const used = new Set(lead ? [lead.id] : [])
  const top = rankTop(stories, nowMs, 6, used)

  const weekAgo = nowMs - 7 * DAY_MS
  const week = stories.filter((s) => new Date(s.firstSeen).getTime() >= weekAgo)
  const closes = week.filter((s) => s.kind === 'fundraising' && s.leadEligible && s.sizeUsdM && (s.eventType === 'fund_close' || s.closeType === 'final_close' || s.closeType === 'first_close'))

  return {
    lead,
    top,
    latest: stories.slice(0, 14),
    largestCloses: [...closes].sort((a, b) => (b.sizeUsdM ?? 0) - (a.sizeUsdM ?? 0)).slice(0, 6),
    stats: {
      funds: closes.length,
      capitalUsdM: closes.reduce((sum, s) => sum + (s.sizeUsdM ?? 0), 0),
      deals: week.filter((s) => s.kind === 'deals').length,
      moves: week.filter((s) => s.kind === 'people').length,
    },
  }
}

/** Section page ordering: what matters most first, by heat with a slower clock. */
export function rankSection(stories: Story[], nowMs: number): Story[] {
  const slowHeat = (s: Story) => {
    const ageH = Math.max(0, (nowMs - new Date(s.firstSeen).getTime()) / 3_600_000)
    return s.weight * Math.pow(0.5, ageH / 48)
  }
  return [...stories].sort((a, b) => slowHeat(b) - slowHeat(a))
}
