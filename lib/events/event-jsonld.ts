/**
 * schema.org Event markup for an event (2026-10-22), built to Google's "Event structured data" rules
 * (developers.google.com/search/docs/appearance/structured-data/event): name, startDate and location are
 * required; endDate, eventStatus, image, offers, organizer (name and url) and description are recommended.
 *
 * Event pages bring more search visitors than the front page, but the markup had a date with no time, no end
 * date, no image, an offer with only a link, and no organizer link, so they were not eligible for Google's
 * event results. Every field here is said only when the event's row supports it:
 *
 * - Time: only when the time note states a clock time ("8:30AM-4:30PM CT"). With a zone named in the note it
 *   carries the UTC offset for that date (daylight saving included). With no zone named it is the local time
 *   with no offset, which Google reads in the time zone of the event's place, as it documents; never a zone we
 *   guessed. No stated time: the date alone, as Google asks (no made-up midnight).
 * - End: the event's end date, or the start date for a one-day event; the end time only for a one-day event
 *   whose note gives a range (a conference's "8:30-4:30" is its daily hours, not when its last day ends).
 * - Price: only what we checked on the registration page (costVerified): free, or the dollar figures in the
 *   checked price note (none from a note with a deadline, "early bird ... rises after October 1"). Currency from the note or the country, never assumed for a paid event abroad. No
 *   "availability": nothing in the row says registration is open today, and Google allows it to be left out.
 * - Image: the page's own share image (event pages use the site's card), never the organizer's picture.
 * - Organizer link: the site the event page is on, and only when that address is plainly the organizer's
 *   (lpgpconnect.com for LPGP Connect); a ticketing or another firm's site says nothing about the organizer.
 * - Street address: only when the venue line carries one ("Convene, 117 West 46th Street").
 *
 * Shared by the event page and the list pages (/events and the city and topic pages). Pure, browser-safe.
 */
import { OG_IMAGES } from '@/lib/seo'
import { compactTimeNote, isVerifiedFree, verifiedPriceNote } from './constants'
import type { IndustryEvent } from './types'

const SITE = 'https://fundopshq.com'

// ── Time ──────────────────────────────────────────────────────────

/**
 * The zone a note's abbreviation names, as an IANA zone, so the offset follows that date's daylight saving.
 * "EST" in July is read as Eastern time: organizers write EST for Eastern all year. Mountain time in Arizona
 * is Phoenix (no daylight saving). A zone not listed here (GMT, BST: read loosely for UK time) gives no time.
 */
const IANA_BY_ABBR: Record<string, string> = {
  ET: 'America/New_York', EST: 'America/New_York', EDT: 'America/New_York',
  CT: 'America/Chicago', CST: 'America/Chicago', CDT: 'America/Chicago',
  MT: 'America/Denver', MST: 'America/Denver', MDT: 'America/Denver',
  PT: 'America/Los_Angeles', PST: 'America/Los_Angeles', PDT: 'America/Los_Angeles',
  UK: 'Europe/London',
  CET: 'Europe/Paris', CEST: 'Europe/Paris',
  HKT: 'Asia/Hong_Kong', SGT: 'Asia/Singapore', JST: 'Asia/Tokyo',
  AEST: 'Australia/Sydney', AEDT: 'Australia/Sydney',
  UTC: 'UTC',
}

export function ianaZone(abbr: string, stateRegion: string | null): string | null {
  const a = abbr.toUpperCase()
  if (['MT', 'MST', 'MDT'].includes(a) && (stateRegion ?? '').trim().toUpperCase() === 'AZ') return 'America/Phoenix'
  return IANA_BY_ABBR[a] ?? null
}

/** Minutes east of UTC that a zone is at an instant. */
function offsetAt(zone: string, instant: number): number {
  const part = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' })
    .formatToParts(new Date(instant))
    .find((p) => p.type === 'timeZoneName')?.value
  const m = part?.match(/GMT([+-])(\d{2}):(\d{2})/)
  if (!m) return 0 // "GMT" alone: UTC
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]))
}

/** "-05:00": a zone's UTC offset at a local date and time there, daylight saving included. */
export function utcOffset(zone: string, date: string, hour: number, minute: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const asUtc = Date.UTC(y, m - 1, d, hour, minute)
  // The offset at the guessed instant, then again at the instant it implies (right either side of a change).
  let off = offsetAt(zone, asUtc)
  const second = offsetAt(zone, asUtc - off * 60_000)
  if (second !== off) off = second
  const sign = off < 0 ? '-' : '+'
  const abs = Math.abs(off)
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
}

interface ClockTimes {
  start: { h: number; m: number }
  end: { h: number; m: number } | null
  zone: string | null
}

/**
 * The clock times a note states, read from its compact form (compactTimeNote: "8:30am–4:30pm CT", "5–8pm ET",
 * "12:30pm"), which already settles the earliest time, a range's shared am/pm and 24-hour times. Null when
 * the note states no clock time.
 */
export function noteClockTimes(timeNote: string | null): ClockTimes | null {
  const compact = compactTimeNote(timeNote)
  if (!compact) return null
  const m = /^(\d{1,2})(?::(\d{2}))?(am|pm)?(?:–(\d{1,2})(?::(\d{2}))?(am|pm))?(?: ([A-Z]+))?$/.exec(compact)
  if (!m) return null
  const to24 = (h: string, ap: string) => (Number(h) % 12) + (ap === 'pm' ? 12 : 0)
  const endAp = m[6]
  const startAp = m[3] ?? endAp
  if (!startAp) return null
  return {
    start: { h: to24(m[1], startAp), m: Number(m[2] ?? 0) },
    end: m[4] ? { h: to24(m[4], endAp), m: Number(m[5] ?? 0) } : null,
    zone: m[7] ?? null,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * startDate and endDate as Google reads them: "2026-10-22T08:30:00-05:00" when the note states a time and
 * names its zone; "2026-10-22T08:30:00" (read in the place's zone) when it names none and the event has a
 * place; the date alone otherwise. See the header for the end.
 */
export function eventDates(e: Pick<IndustryEvent, 'startDate' | 'endDate' | 'timeNote' | 'stateRegion' | 'eventFormat'>): { startDate: string; endDate: string } {
  const lastDay = e.endDate && e.endDate > e.startDate ? e.endDate : e.startDate
  const oneDay = lastDay === e.startDate
  const times = noteClockTimes(e.timeNote)
  if (!times) return { startDate: e.startDate, endDate: lastDay }

  let suffix: (h: number, m: number) => string
  if (times.zone) {
    const zone = ianaZone(times.zone, e.stateRegion)
    if (!zone) return { startDate: e.startDate, endDate: lastDay }
    suffix = (h, m) => utcOffset(zone, e.startDate, h, m)
  } else if (e.eventFormat !== 'virtual') {
    suffix = () => ''
  } else {
    // Online with no zone named: there is no place for Google to take a zone from.
    return { startDate: e.startDate, endDate: lastDay }
  }
  const at = (t: { h: number; m: number }) => `${e.startDate}T${pad(t.h)}:${pad(t.m)}:00${suffix(t.h, t.m)}`
  const startDate = at(times.start)
  const endsLater = times.end && times.end.h * 60 + times.end.m > times.start.h * 60 + times.start.m
  return { startDate, endDate: oneDay && endsLater && times.end ? at(times.end) : lastDay }
}

// ── Price ─────────────────────────────────────────────────────────

/** Dollar amounts in a price note: "$1,025 member, $1,800 non-member" → [1025, 1800]. */
export function priceAmounts(note: string | null | undefined): number[] {
  if (!note) return []
  return Array.from(note.matchAll(/\$\s?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{2}))?/g))
    .map((m) => Number(m[1].replace(/,/g, '')) + (m[2] ? Number(m[2]) / 100 : 0))
    .filter((n) => Number.isFinite(n) && n > 0)
}

const US = new Set(['usa', 'us', 'united states', 'united states of america'])
const CANADA = new Set(['canada', 'ca'])

/** The currency a "$" means: as the note says ("CAD", "C$", "US$"), else by the country; null when neither says. */
export function priceCurrency(note: string | null, country: string | null): 'USD' | 'CAD' | null {
  if (note && /\bCAD\b|\bC\$|\bCA\$/.test(note)) return 'CAD'
  if (note && /\bUSD\b|\bUS\$/.test(note)) return 'USD'
  const c = (country ?? '').trim().toLowerCase().replace(/\./g, '')
  if (US.has(c)) return 'USD'
  if (CANADA.has(c)) return 'CAD'
  return null
}

/**
 * The offer, only where we checked the cost: free (price 0), or the dollar figures in the checked price note
 * when it names no free places ("Free for members; $795 non-members" has no one price). Null otherwise: an
 * offer with no price told Google nothing.
 */
export function eventOffers(e: IndustryEvent): Record<string, unknown> | null {
  const url = e.registrationUrl || e.eventUrl
  if (!url) return null
  if (isVerifiedFree(e)) return { '@type': 'Offer', url, price: 0, priceCurrency: priceCurrency(e.priceNote, e.country) ?? 'USD' }
  const note = verifiedPriceNote(e)
  if (!note || /\b(free|complimentary|no cost|no charge)\b/i.test(note)) return null
  // A price with a deadline ("$930 early bird, rises to $1,130 after October 1") may no longer be on offer, and
  // the note does not say which figure is current today: no offer rather than a stale price (2026-10-22).
  if (/\bearly[\s-]?(bird|registration|rate|pricing)\b|\b(rises|increases|goes up)\b|\b(until|through|before|after)\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(note)) return null
  const amounts = priceAmounts(note)
  const currency = priceCurrency(note, e.country)
  if (amounts.length === 0 || !currency) return null
  if (amounts.length === 1) return { '@type': 'Offer', url, price: amounts[0], priceCurrency: currency }
  return { '@type': 'AggregateOffer', url, lowPrice: Math.min(...amounts), highPrice: Math.max(...amounts), priceCurrency: currency }
}

// ── Organizer ─────────────────────────────────────────────────────

const NAME_FILLER = new Set(['the', 'of', 'and', 'for', 'a', 'an', 'in', 'llp', 'llc', 'inc'])
const TWO_PART_SUFFIX = new Set(['co', 'com', 'org', 'net', 'ac', 'gov'])
/** Domains made of a common word ("events.com"): an organizer's name holding the word says nothing. */
const GENERIC_LABELS = new Set(['events', 'event', 'conference', 'conferences', 'summit', 'forum', 'capital', 'partners', 'group', 'global', 'fund', 'funds', 'finance', 'invest', 'network', 'association', 'institute', 'online', 'register', 'tickets', 'live', 'virtual'])

/**
 * The organizer's own site, from the event page's address, when that address is plainly the organizer's: the
 * domain is the organizer's name, holds it ("peievents" for PEI), sits in it ("lowenstein" for Lowenstein
 * Sandler) or is its initials ("ilpa"). Null for anything else (Eventbrite, Cvent, a venue or a co-host).
 */
export function organizerUrl(e: Pick<IndustryEvent, 'eventUrl' | 'organizerName'>): string | null {
  let host: string
  try {
    const u = new URL(e.eventUrl)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    host = u.hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
  const labels = host.split('.')
  if (labels.length < 2) return null
  const twoPart = labels.length >= 3 && labels[labels.length - 1].length === 2 && TWO_PART_SUFFIX.has(labels[labels.length - 2])
  const at = labels.length - (twoPart ? 3 : 2)
  const label = labels[at].replace(/-/g, '')
  const domain = labels.slice(at).join('.')

  const words = e.organizerName.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  const name = words.join('')
  const initials = words.filter((w) => !NAME_FILLER.has(w)).map((w) => w[0]).join('')
  const matches =
    label.length >= 3 &&
    !GENERIC_LABELS.has(label) &&
    (name.includes(label) || (name.length >= 3 && label.includes(name)) || (initials.length >= 2 && label === initials))
  return matches ? `https://${domain}` : null
}

// ── Place ─────────────────────────────────────────────────────────

const STREET = /^\d+[A-Za-z]?\s+.+\b(street|st|avenue|ave|boulevard|blvd|road|rd|drive|dr|place|pl|way|lane|ln|plaza|square|sq|broadway|parkway|pkwy|court|ct|terrace|highway|hwy)\.?$/i

/** "Convene, 117 West 46th Street" → name "Convene", street "117 West 46th Street". A venue with no street line keeps its name. */
export function splitVenue(venue: string | null): { name: string | null; street: string | null } {
  const v = venue?.trim()
  if (!v) return { name: null, street: null }
  const parts = v.split(/\s*,\s*/)
  const i = parts.findIndex((p) => STREET.test(p))
  if (i < 0) return { name: v, street: null }
  return { name: i > 0 ? parts.slice(0, i).join(', ') : v, street: parts[i] }
}

const COUNTRY_CODE: Record<string, string> = {
  usa: 'US', us: 'US', 'united states': 'US', 'united states of america': 'US', canada: 'CA',
  'united kingdom': 'GB', uk: 'GB', england: 'GB', scotland: 'GB',
}

function place(e: IndustryEvent): Record<string, unknown> {
  const { name, street } = splitVenue(e.venue)
  const country = e.country?.trim()
  return {
    '@type': 'Place',
    ...(name || e.city ? { name: name ?? e.city } : {}),
    address: {
      '@type': 'PostalAddress',
      ...(street ? { streetAddress: street } : {}),
      ...(e.city ? { addressLocality: e.city } : {}),
      ...(e.stateRegion ? { addressRegion: e.stateRegion } : {}),
      ...(country ? { addressCountry: COUNTRY_CODE[country.toLowerCase().replace(/\./g, '')] ?? country } : {}),
    },
  }
}

// ── The Event ─────────────────────────────────────────────────────

const MODE = {
  virtual: 'https://schema.org/OnlineEventAttendanceMode',
  hybrid: 'https://schema.org/MixedEventAttendanceMode',
  in_person: 'https://schema.org/OfflineEventAttendanceMode',
} as const

/** The event's page on FundOpsHQ: the Event's url, on the event page and in every list. */
export function eventPageUrl(e: Pick<IndustryEvent, 'slug'>): string {
  return `${SITE}/events/${e.slug}`
}

/** The schema.org Event, without @context (for a list); eventJsonLd adds it for a page. */
export function eventSchema(e: IndustryEvent, pageUrl = eventPageUrl(e)): Record<string, unknown> {
  const { startDate, endDate } = eventDates(e)
  const offers = eventOffers(e)
  const orgUrl = organizerUrl(e)
  const online = { '@type': 'VirtualLocation', url: e.eventUrl }
  const location = e.eventFormat === 'virtual' ? online : e.eventFormat === 'hybrid' ? [place(e), online] : place(e)
  return {
    '@type': 'Event',
    name: e.name,
    startDate,
    endDate,
    ...(e.description ? { description: e.description } : {}),
    eventStatus: e.status === 'cancelled' ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: MODE[e.eventFormat as keyof typeof MODE] ?? MODE.in_person,
    location,
    image: OG_IMAGES.map((i) => i.url),
    organizer: { '@type': 'Organization', name: e.organizerName, ...(orgUrl ? { url: orgUrl } : {}) },
    ...(offers ? { offers } : {}),
    ...(isVerifiedFree(e) ? { isAccessibleForFree: true } : {}),
    url: pageUrl,
  }
}

/** schema.org Event for an event's page. */
export function eventJsonLd(e: IndustryEvent, pageUrl = eventPageUrl(e)): Record<string, unknown> {
  return { '@context': 'https://schema.org', ...eventSchema(e, pageUrl) }
}

/** An ItemList of Events for a list page (/events, a city or topic page); each Event points to its own page. */
export function eventListJsonLd(name: string, url: string, events: IndustryEvent[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url,
    itemListElement: events.map((e, i) => ({ '@type': 'ListItem', position: i + 1, item: eventSchema(e) })),
  }
}
