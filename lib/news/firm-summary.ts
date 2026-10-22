/**
 * The answer at the top of a firm's page (2026-10-22, board item 65c): what people type into a search box or ask an AI
 * assistant about a manager — "Blackstone fund closes 2026", "how much has KKR raised" — answered in its first sentence,
 * the way the league's market pages (lib/news/league-markets.ts) answer "largest private credit fund closes 2026".
 *
 * Every figure comes from the firm's league closes (the same FundClose rows as the table under it). Totals add final
 * closes only, as the league and its charts do: a first close and the final close of the same fund are two rows, and
 * adding them would count the money twice. A firm with no close gets no sentence; the page's coverage line says the rest.
 *
 * Pure: no I/O.
 */
import { STAGE_LABEL, type CloseStage, type FundClose } from './league'
import { sizeLabel, totalLabel } from './format'
import { storyPermalink } from './story-jsonld'

const SITE = 'https://fundopshq.com'

/** The calendar year in New York, where the site's day turns. */
export function yearInNewYork(nowMs: number): number {
  return Number(new Date(nowMs).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).slice(0, 4))
}

const yearOf = (c: FundClose) => Number(c.date.slice(0, 4))
const day = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })
const about = (converted: boolean) => (converted ? 'about ' : '')
/** Largest first; between equals, the earlier report. */
const bySize = (a: FundClose, b: FundClose) => b.sizeUsdM - a.sizeUsdM || a.date.localeCompare(b.date)

/** "Ares Pathfinder III at $12.7B"; "a fund the reports did not name, at about $1B". */
function fundAt(c: FundClose): string {
  const size = `${about(c.converted)}${sizeLabel(c.sizeUsdM)}`
  return c.fund ? `${c.fund} at ${size}` : `a fund the reports did not name, at ${size}`
}

/** "$18.2B", or "about $18.2B" when any of the closes added was converted from another currency. */
function totalOf(closes: FundClose[]): string {
  return `${about(closes.some((c) => c.converted))}${totalLabel(closes.reduce((s, c) => s + c.sizeUsdM, 0))}`
}

/** "2 first closes and an interim close". */
function partialCount(closes: FundClose[]): string {
  const count = (stage: CloseStage) => closes.filter((c) => c.stage === stage).length
  const phrase = (n: number, label: string) => (n === 1 ? `${label === 'interim' ? 'an' : 'a'} ${label} close` : `${n} ${label} closes`)
  return [count('first') > 0 ? phrase(count('first'), 'first') : null, count('interim') > 0 ? phrase(count('interim'), 'interim') : null]
    .filter(Boolean)
    .join(' and ')
}

/** One year's closes, in a sentence or two. `now`: the current year ("has held"), else a past one ("held"). */
function yearSentences(name: string, closes: FundClose[], year: number, now: boolean): string {
  const held = now ? 'has held' : 'held'
  const reported = now ? 'FundOpsHQ has reported' : 'FundOpsHQ reported'
  const finals = closes.filter((c) => c.stage === 'final').sort(bySize)
  const partials = closes.filter((c) => c.stage !== 'final').sort(bySize)

  if (finals.length === 0) {
    const top = partials[0]
    const one = partials.length === 1
    return `${name} ${held} ${partialCount(partials)} in ${year} that ${reported}${one ? ': ' : '; the largest is '}${fundAt(top)} (${STAGE_LABEL[top.stage].toLowerCase()}, reported ${day(top.date)}).`
  }

  const top = finals[0]
  const lead =
    finals.length === 1
      ? `${name} ${held} one final fund close in ${year} that ${reported}: ${fundAt(top)}, first reported ${day(top.date)}.`
      : `${name} ${held} ${finals.length} final fund closes in ${year} that ${reported}, totalling ${totalOf(finals)}. The largest is ${fundAt(top)}, first reported ${day(top.date)}.`
  return partials.length > 0 ? `${lead} It ${now ? 'has also held' : 'also held'} ${partialCount(partials)}.` : lead
}

/**
 * "Ares Management has held 4 final fund closes in 2026 that FundOpsHQ has reported, totalling $18.2B. The largest is
 * Ares Pathfinder III at $12.7B, first reported August 11."
 *
 * The current year leads. A year with nothing yet falls back to the latest year that has a close, in the past tense.
 * Earlier years follow in one short sentence each (final closes only, the two most recent), when there are any.
 * Null when the firm has no close at all.
 */
export function firmSummary(name: string, closes: FundClose[], year: number): string | null {
  if (closes.length === 0) return null
  const years = Array.from(new Set(closes.map(yearOf))).sort((a, b) => b - a)
  const leadYear = years.includes(year) ? year : years.find((y) => y < year) ?? years[0]
  const sentences = [yearSentences(name, closes.filter((c) => yearOf(c) === leadYear), leadYear, leadYear === year)]
  for (const y of years.filter((y) => y < leadYear).slice(0, 2)) {
    const finals = closes.filter((c) => yearOf(c) === y && c.stage === 'final')
    if (finals.length === 0) continue
    sentences.push(
      finals.length === 1
        ? `In ${y} it held one final close, ${fundAt(finals[0])}.`
        : `In ${y} it held ${finals.length} final closes, totalling ${totalOf(finals)}.`,
    )
  }
  return sentences.join(' ')
}

/**
 * The page's title, as the search is typed: "Ares Management: 2026 fund closes, deals and news" when it has a close this
 * year. A firm with no close at all is not promised one (until 2026-10-22 every firm's title said "fund closes").
 */
export function firmTitle(name: string, closes: FundClose[], year: number): string {
  if (closes.some((c) => yearOf(c) === year)) return `${name}: ${year} fund closes, deals and news`
  if (closes.length > 0) return `${name}: fund closes, deals and news`
  return `${name}: news, deals and people moves`
}

/**
 * Structured data: the page is a collection about one organisation, and its closes are a list, each item our page for
 * that close. The Organization carries only its name: we do not hold the firm's own website (the classifier's
 * firm-domain guess was removed on 2026-08-30), so there is no `url` or `sameAs` to give it, and our page's address
 * is the CollectionPage's, not the firm's.
 */
export function firmJsonLd(slug: string, name: string, title: string, closes: FundClose[], answer: string | null) {
  const url = `${SITE}/firm/${slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    url,
    name: title,
    ...(answer ? { description: answer } : {}),
    about: { '@type': 'Organization', '@id': `${url}#firm`, name },
    ...(closes.length > 0
      ? {
          mainEntity: {
            '@type': 'ItemList',
            name: `${name} fund closes`,
            numberOfItems: closes.length,
            itemListElement: closes.slice(0, 25).map((c, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: `${c.fund ?? 'Fund not named in the reports'} — ${STAGE_LABEL[c.stage].toLowerCase()}, ${about(c.converted)}${sizeLabel(c.sizeUsdM)}`,
              url: storyPermalink(c),
            })),
          },
        }
      : {}),
  }
}
