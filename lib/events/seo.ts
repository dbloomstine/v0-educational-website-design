/**
 * What an event's page says to a search engine (2026-10-22).
 *
 * Event pages bring more search visitors than the front page: fund CFOs,
 * controllers and ops people typing an event's name, often with "2026", the
 * city, or "date", "venue", "cost". So the page's title answers in those words,
 * from the event's own fields and only for what the page can answer (no
 * "venue" without a venue, no "cost" without a cost we checked), and the
 * structured data (schema.org Event, ./event-jsonld.ts) carries the same facts.
 *
 * Pure, browser-safe.
 */
import { metaDescription } from '@/lib/seo'
import { costDetail, formatEventLocation } from './constants'
import type { IndustryEvent } from './types'

/** A search result shows about this much of a title. */
export const EVENT_TITLE_TARGET = 65
/** A title is allowed this far past the target to keep what the searcher asked ("date, venue, cost"), never further. */
export const EVENT_TITLE_MAX = 70
const BRAND = ' | FundOpsHQ'

type TitleFields = Pick<IndustryEvent, 'name' | 'startDate' | 'endDate' | 'city' | 'eventFormat' | 'venue' | 'costType' | 'priceNote' | 'costVerified'>

/** "8th Annual LPGP Connect CFO/COO Forum Chicago 2026": the name, with the city and the year when it does not say them. */
export function eventTitleBase(e: Pick<IndustryEvent, 'name' | 'startDate' | 'city' | 'eventFormat'>): string {
  let base = e.name.trim().replace(/\s+/g, ' ')
  const year = e.startDate.slice(0, 4)
  const city = e.city?.trim()
  if (city && e.eventFormat !== 'virtual' && !base.toLowerCase().includes(city.toLowerCase())) base += `, ${city}`
  if (/^\d{4}$/.test(year) && !base.includes(year)) base += ` ${year}`
  return base
}

function listWords(words: string[]): string {
  if (words.length <= 1) return words[0] ?? ''
  if (words.length === 2) return `${words[0]} and ${words[1]}`
  return `${words.slice(0, -1).join(', ')}, ${words[words.length - 1]}`
}

/**
 * The page title: "8th Annual LPGP Connect CFO/COO Forum Chicago 2026: date, venue, cost", with the brand when
 * it fits. Parts drop from the end (cost, then venue), then the brand, until it fits; a name too long for any of
 * that is the title alone.
 */
export function buildEventTitle(e: TitleFields): string {
  const base = eventTitleBase(e)
  const dateWord = e.endDate && e.endDate !== e.startDate ? 'dates' : 'date'
  const parts = [dateWord, e.venue?.trim() ? 'venue' : null, costDetail(e) ? 'cost' : null].filter((p): p is string => !!p)

  // A name with its own colon ("ACG Richmond October Breakfast: Transaction Panel") takes a comma, not a second colon.
  const joiner = base.includes(':') ? ', ' : ': '
  const suffixes: string[] = []
  for (let k = parts.length; k >= 1; k--) suffixes.push(`${joiner}${listWords(parts.slice(0, k))}`)
  const candidates: { text: string; max: number }[] = [
    { text: `${base}${suffixes[0]}${BRAND}`, max: EVENT_TITLE_TARGET },
    ...suffixes.map((s) => ({ text: `${base}${s}`, max: EVENT_TITLE_MAX })),
    { text: `${base}${BRAND}`, max: EVENT_TITLE_TARGET },
  ]
  return candidates.find((c) => c.text.length <= c.max)?.text ?? base
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** "October 22, 2026" · "October 22–23, 2026" · "September 30 – October 2, 2026". Always with the year. */
export function longEventDates(startDate: string, endDate: string | null): string {
  const [y, m, d] = startDate.split('-').map(Number)
  if (!endDate || endDate === startDate) return `${MONTHS[m - 1]} ${d}, ${y}`
  const [y2, m2, d2] = endDate.split('-').map(Number)
  if (y === y2 && m === m2) return `${MONTHS[m - 1]} ${d}–${d2}, ${y}`
  if (y === y2) return `${MONTHS[m - 1]} ${d} – ${MONTHS[m2 - 1]} ${d2}, ${y}`
  return `${MONTHS[m - 1]} ${d}, ${y} – ${MONTHS[m2 - 1]} ${d2}, ${y2}`
}

/** The meta description: when, where, what it costs (when we checked), then the organiser's own words, cut to a result's length. */
export function eventMetaDescription(e: IndustryEvent): string {
  const where = e.eventFormat === 'virtual' ? 'online' : [e.venue?.trim(), formatEventLocation(e)].filter(Boolean).join(', ')
  const cost = costDetail(e)
  const lead = `${longEventDates(e.startDate, e.endDate)}${where ? `, ${where}` : ''}.${cost ? ` Cost: ${cost.replace(/\.$/, '')}.` : ''}`
  const rest = e.description?.trim() || `${e.name} by ${e.organizerName}. Date verified by FundOpsHQ.`
  return metaDescription(`${lead} ${rest}`)
}
