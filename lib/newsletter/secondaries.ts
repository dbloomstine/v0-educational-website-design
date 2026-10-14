/**
 * Secondaries, GP stakes and continuation vehicles (Danny, 2026-10-14: "their
 * own section: a 'Secondaries' tab on the site, a section in the email").
 *
 * The classifier's `secondaries` / `gp_stakes` tags catch the dedicated
 * managers' funds, but a continuation vehicle usually comes back tagged by
 * what it holds: "GenNx360 closes $285m Churchill-led continuation fund"
 * (PE), "Meridiam raises $4.5bn for multi-asset CV" (infrastructure),
 * "WhiteHorse Finance BDC pursues $680M continuation vehicle deal" (credit).
 * And a fund tagged both ("PE, secondaries") used to file under its first
 * tag. Measured over the four weeks to 2026-10-14, eight such fund stories
 * sat under Private Equity, Credit or Infrastructure.
 *
 * The rule, from fields the classifier already writes (its prompt is not
 * touched here):
 *   a fund event  → tagged secondaries / gp_stakes, or its headline or the
 *                   first item of its strategy says so;
 *   anything else → only its headline or strategy's first item (the tag alone put
 *                   "Amundi completes €620m stake purchase in ICG" here).
 *
 * Browser-safe: no server imports.
 */
import { storyFamily } from './story-links'

/**
 * Headline words. "Secondary" but not a secondary buyout (one sponsor selling
 * a company to another), a share offering or a listing. "CV" only in
 * capitals: in these trade headlines it is a continuation vehicle.
 */
const HEADLINE =
  /\bsecondar(?:y|ies)\b(?!\s+(?:buy-?outs?|(?:share\s+)?offerings?|listings?|placements?|schools?))|\bcontinuation[- ](?:funds?|vehicles?|deals?)\b|\b[GL]P[- ]led\b|\bGP[- ]stakes?\b|\bsingle[- ]asset\s+(?:funds?|vehicles?)\b/i
const CV = /\bCVs?\b/
const GP_STAKES = /\bGP[- _]?stakes?\b/i

/** The classifier's free-text strategy ("secondaries", "continuation vehicle", "GP-led secondaries", "gp_stakes"). */
const STRATEGY = /secondar|continuation|\bgp[- _]?stakes?\b|\b[gl]p[- ]led\b/i

export const SECONDARIES_TAGS = ['secondaries', 'gp_stakes'] as const

export interface SecondariesFields {
  title: string
  fundStrategy: string | null
  fundCategories: string[]
  eventType: string | null
}

function headlineSaysSo(title: string): boolean {
  return HEADLINE.test(title) || CV.test(title)
}

/**
 * The strategy's first item only: "secondaries, venture secondary purchases"
 * and "continuation vehicle, private credit" count; Apogem's real assets fund
 * ("natural resources, energy, infrastructure, secondaries, …") does not.
 */
function strategySaysSo(strategy: string | null): boolean {
  const first = strategy?.split(/[,;/]/)[0] ?? ''
  return STRATEGY.test(first)
}

function saysSo(a: SecondariesFields): boolean {
  return headlineSaysSo(a.title) || strategySaysSo(a.fundStrategy)
}

/**
 * Which of the two asset tags the story belongs under, or null when it is not
 * a secondaries story. GP stakes only when the story says GP stakes and not
 * secondaries; everything else here is "secondaries".
 */
export function secondariesClass(a: SecondariesFields): 'secondaries' | 'gp_stakes' | null {
  const tagged = a.fundCategories.some((c) => c === 'secondaries' || c === 'gp_stakes')
  const fund = storyFamily(a.eventType) === 'fund'
  if (!saysSo(a) && !(fund && tagged)) return null
  const gpStakes =
    (a.fundCategories.includes('gp_stakes') && !a.fundCategories.includes('secondaries')) ||
    (GP_STAKES.test(a.title) && !/\bsecondar/i.test(a.title)) ||
    (!tagged && GP_STAKES.test(a.fundStrategy?.split(/[,;/]/)[0] ?? '') && !/secondar/i.test(a.title))
  return gpStakes ? 'gp_stakes' : 'secondaries'
}

export function isSecondariesStory(a: SecondariesFields): boolean {
  return secondariesClass(a) !== null
}

/**
 * One outlet's report of a fund event can say "secondaries fund" when the
 * better-sourced report of it does not ("Ares raises $4.2bn for first
 * structured solutions secondaries fund" beside "…Global Structured Solutions
 * Fund"). The story takes the tag from such a report only when it is the same
 * fund (the caller checks the size) and the report says so in its headline or
 * its tag, never a strategy list. Clusters are not perfect: "LA pension among
 * backers of TPG's second GP-led fund" once sat in the same cluster as TPG's
 * $10bn climate fund.
 */
export function reportMarksSecondaries(a: SecondariesFields): 'secondaries' | 'gp_stakes' | null {
  if (storyFamily(a.eventType) !== 'fund') return null
  const tagged = a.fundCategories.some((c) => c === 'secondaries' || c === 'gp_stakes')
  if (!tagged && !headlineSaysSo(a.title)) return null
  return secondariesClass(a)
}
