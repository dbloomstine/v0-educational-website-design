/**
 * The Monday events email (2026-10-22): what it lists, in what order, and how it reads. Pure: the send
 * (lib/events/weekly-send.ts) hands in the board's upcoming events and the reader's city tags.
 *
 * Who gets it: confirmed subscribers whose `interests` carry the `events` tag (the events offer on event and
 * city pages, and the signup box on an events page, add it with `city:<slug>`). Behind its own switch,
 * EVENTS_WEEKLY_MODE (lib/events/weekly-mode.ts), off by default.
 *
 * What it lists: this week's events in the US and Canada (today to Sunday; the board's own scope, minus the
 * hand-flagged exceptions elsewhere), every one of them, and next week's most notable few. A reader with a city
 * gets that city's events first, this week and next, then the rest of North America.
 *
 * How it reads: the Circuit's idiom, the owner's rules for an events email (2026-08-29): Gary's Guide density
 * (date | access | linked name over one detail line), small clean sans-serif type, no serif hero, no cards,
 * no background colours, US and Canada only. Every <a> carries an inline colour (the daily template's Gmail
 * rule). The Circuit itself (lib/events/circuit-email.ts) was retired on 2026-08-30 when the events folded
 * into the daily; this is its template brought back for the readers who ask for a Monday list.
 */
import type { IndustryEvent } from './types'
import { costLabel, eventTimeLabel, formatEventDates, formatEventLocation } from './constants'
import { notability, pickNotableEvents, weekBounds } from './highlights'
import { COLLECTION_BY_SLUG } from './collections'
import { citySlug } from '@/lib/newsletter/interests'

// ── What it lists ────────────────────────────────────────────────────

/** Next week's list, beyond the reader's own city: the most notable few (at most two a day). */
export const NEXT_WEEK_NOTABLE = 8

/** A ceiling on this week's list so a crowded week cannot make an unbounded email; the rest are one link away. */
export const THIS_WEEK_MAX = 80

const US_CANADA = new Set(['united states', 'usa', 'us', 'u.s.', 'u.s.a.', 'canada', 'ca'])

/** In the US or Canada: the board's North America region, with a country that says so (or none, as virtual rows have). */
export function isUsOrCanada(e: Pick<IndustryEvent, 'region' | 'country'>): boolean {
  if (e.region !== 'north_america') return false
  const c = (e.country ?? '').trim().toLowerCase()
  return c === '' || US_CANADA.has(c)
}

/** Date, then the more notable first within a day, then name. */
function byDayThenNotability(a: IndustryEvent, b: IndustryEvent): number {
  return a.startDate.localeCompare(b.startDate) || notability(b) - notability(a) || a.name.localeCompare(b.name)
}

export interface WeeklyEvents {
  /** New York date the email is for (normally the Monday). */
  todayIso: string
  /** Today to Sunday, US and Canada, by day. */
  thisWeek: IndustryEvent[]
  /** Next Monday to Sunday, US and Canada, by day. */
  nextWeek: IndustryEvent[]
}

/** The two weeks the email draws from, out of the board's upcoming events. */
export function selectWeeklyEvents(events: IndustryEvent[], todayIso: string): WeeklyEvents {
  const { thisWeekEnd, nextWeekStart, nextWeekEnd } = weekBounds(todayIso)
  const seen = new Set<string>()
  const pool = events.filter((e) => {
    if (seen.has(e.id) || !isUsOrCanada(e)) return false
    seen.add(e.id)
    return true
  })
  return {
    todayIso,
    thisWeek: pool.filter((e) => e.startDate >= todayIso && e.startDate <= thisWeekEnd).sort(byDayThenNotability),
    nextWeek: pool.filter((e) => e.startDate >= nextWeekStart && e.startDate <= nextWeekEnd).sort(byDayThenNotability),
  }
}

// ── For one reader ───────────────────────────────────────────────────

export interface EmailSection {
  title: string
  events: IndustryEvent[]
  /** Said when the section has no events (the reader's city this week). */
  emptyNote?: string
  /** How many more of this kind are on the board, beyond the list. */
  more?: number
  /** A link under the list: the city's own events page. */
  link?: { label: string; url: string }
}

export interface ReaderPlan {
  /** The reader's cities as words ("Chicago", "Chicago and Boston", "your cities"); null for none. */
  cityLabel: string | null
  cityThisWeek: number
  restThisWeek: number
  nextWeekTotal: number
  sections: EmailSection[]
}

const ABBREVIATIONS = new Set(['dc', 'nyc', 'la', 'sf'])

/** The words for a city slug: the city page's own name, else an event's, else the slug in title case. */
export function cityName(slug: string, events: IndustryEvent[] = []): string {
  const fromPage = COLLECTION_BY_SLUG.get(slug)?.filter.city
  if (fromPage) return fromPage
  const fromEvent = events.find((e) => e.city && citySlug(e.city) === slug)?.city
  if (fromEvent) return fromEvent
  return slug
    .split('-')
    .map((w) => (ABBREVIATIONS.has(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(' ')
}

function cityWords(names: string[]): string | null {
  if (names.length === 0) return null
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return 'your cities'
}

/** The reader's city page on the site, when they follow one city that has a page. */
function cityPageLink(slugs: string[], label: string | null): EmailSection['link'] | undefined {
  if (slugs.length !== 1 || !label || !COLLECTION_BY_SLUG.has(slugs[0])) return undefined
  return { label: `All ${label} events`, url: siteUrl(`/events/${slugs[0]}`) }
}

/**
 * The sections one reader gets. With no city: this week, then next week's notable few. With cities: this week
 * in them (or a line saying there is nothing), this week everywhere else, next week in them, then next week's
 * notable few everywhere else. Nothing is listed twice; a virtual event is never "in" a city.
 */
export function planForReader(week: WeeklyEvents, citySlugs: string[]): ReaderPlan {
  const slugs = [...new Set(citySlugs.filter(Boolean))]
  const all = [...week.thisWeek, ...week.nextWeek]
  const label = cityWords(slugs.map((s) => cityName(s, all)))
  const inCity = (e: IndustryEvent) => slugs.length > 0 && e.eventFormat !== 'virtual' && !!e.city && slugs.includes(citySlug(e.city))

  const thisCity = week.thisWeek.filter(inCity)
  const thisRest = week.thisWeek.filter((e) => !inCity(e))
  const nextCity = week.nextWeek.filter(inCity)
  const nextRest = week.nextWeek.filter((e) => !inCity(e))
  const nextPicks = pickNotableEvents(nextRest, NEXT_WEEK_NOTABLE)

  const sections: EmailSection[] = []
  const link = cityPageLink(slugs, label)
  if (label) {
    sections.push({
      title: `This week in ${label}`,
      events: thisCity,
      emptyNote: thisCity.length === 0 ? `Nothing on the board in ${label} this week.` : undefined,
      link: nextCity.length === 0 ? link : undefined,
    })
  }
  const thisShown = thisRest.slice(0, THIS_WEEK_MAX)
  sections.push({
    title: label ? 'This week across North America' : 'This week',
    events: thisShown,
    emptyNote: thisShown.length === 0 ? 'Nothing else on the board this week.' : undefined,
    more: thisRest.length - thisShown.length || undefined,
  })
  if (label && nextCity.length > 0) sections.push({ title: `Next week in ${label}`, events: nextCity, link })
  if (nextPicks.length > 0) {
    sections.push({
      title: label ? 'Next week elsewhere: worth planning for' : 'Next week: worth planning for',
      events: nextPicks,
      more: nextRest.length - nextPicks.length || undefined,
    })
  }

  return {
    cityLabel: label,
    cityThisWeek: thisCity.length,
    restThisWeek: thisRest.length,
    nextWeekTotal: week.nextWeek.length,
    sections,
  }
}

/** A stable key for the readers who get the same email (their city slugs, sorted). */
export function cityKey(citySlugs: string[]): string {
  return [...new Set(citySlugs.filter(Boolean))].sort().join(',')
}

// ── Words ────────────────────────────────────────────────────────────

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** The subject: what is on this week, the reader's city first. */
export function weeklySubject(plan: ReaderPlan): string {
  const total = plan.cityThisWeek + plan.restThisWeek
  if (plan.cityLabel && plan.cityThisWeek > 0) {
    const head = `${plan.cityLabel} this week: ${plural(plan.cityThisWeek, 'fund event', 'fund events')}`
    return plan.restThisWeek > 0 ? `${head}, plus ${plan.restThisWeek} across North America` : head
  }
  if (total > 0) return `This week: ${plural(total, 'fund event', 'fund events')} across North America`
  return `Next week: ${plural(plan.nextWeekTotal, 'fund event', 'fund events')} across North America`
}

/** The preview line: the first few names the email opens on. */
export function weeklyPreheader(plan: ReaderPlan): string {
  const names = plan.sections.flatMap((s) => s.events).slice(0, 3).map((e) => e.name)
  return names.join(' · ')
}

// ── Links ────────────────────────────────────────────────────────────

/**
 * On every link to our own pages. `utm_source=newsletter&utm_medium=email` is what the site reads as a reader of
 * their own copy (lib/newsletter/prompt-rules.ts), so the signup box leaves them alone; the campaign says which email.
 */
export const WEEKLY_UTM = 'utm_source=newsletter&utm_medium=email&utm_campaign=events-monday'

export function siteUrl(path: string): string {
  return `https://fundopshq.com${path}${path.includes('?') ? '&' : '?'}${WEEKLY_UTM}`
}

export function eventUrl(slug: string): string {
  return siteUrl(`/events/${encodeURIComponent(slug)}`)
}

// ── Rendering ────────────────────────────────────────────────────────

export interface RenderParams {
  plan: ReaderPlan
  todayIso: string
  /** Stops this email only (the events tag comes off); a sentinel at send time. */
  eventsUnsubscribeUrl: string
  /** Stops every FundOpsHQ email (the daily's unsubscribe); a sentinel at send time. */
  unsubscribeAllUrl: string
  /** Preview mode only: a line above the masthead for the owner. */
  previewNote?: string
}

const TEXT = '#222222'
const MUTED = '#666666'
const LINK = '#2b6cb0'
const RULE = '#dddddd'
const FONT = 'Arial,Helvetica,sans-serif'

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function weekdayOf(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return WEEKDAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
}

/** "Tue Oct 27" · "Tue Oct 27–29". */
export function rowDate(e: Pick<IndustryEvent, 'startDate' | 'endDate'>): string {
  return `${weekdayOf(e.startDate)} ${formatEventDates(e.startDate, e.endDate)}`
}

function where(e: IndustryEvent): string {
  return e.eventFormat === 'virtual' ? 'Virtual' : formatEventLocation(e)
}

/** "Monday, October 26". */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** A URL inside an attribute: only & needs escaping in ours (and quotes, to be safe). */
function attr(url: string): string {
  return url.replace(/&/g, '&amp;').replace(/"/g, '%22')
}

function eventRow(e: IndustryEvent): string {
  const time = eventTimeLabel(e)
  const access = costLabel(e) ?? ''
  return `<tr>
<td style="padding:6px 8px 6px 0;border-bottom:1px solid ${RULE};vertical-align:top;white-space:nowrap;font-size:11px;color:${MUTED};width:92px;">${esc(rowDate(e))}${time ? `<br><span style="font-size:10px;">${esc(time)}</span>` : ''}</td>
<td style="padding:6px 8px 6px 0;border-bottom:1px solid ${RULE};vertical-align:top;font-size:11px;color:${MUTED};width:52px;">${esc(access)}</td>
<td style="padding:6px 0;border-bottom:1px solid ${RULE};vertical-align:top;font-size:13px;line-height:1.3;"><a href="${attr(eventUrl(e.slug))}" style="color:${LINK};text-decoration:none;font-weight:bold;">${esc(e.name)}</a><br><span style="font-size:11px;color:${MUTED};"><b style="font-weight:600;color:${TEXT};">${esc(e.organizerName)}</b> · ${esc(where(e))}</span></td>
</tr>`
}

function sectionHtml(s: EmailSection): string {
  const head = `<tr><td style="padding:16px 0 3px 0;font-size:12px;font-weight:bold;letter-spacing:0.04em;text-transform:uppercase;color:${TEXT};border-bottom:1px solid #999999;">${esc(s.title)}</td></tr>`
  const body =
    s.events.length > 0
      ? `<tr><td style="padding:0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${s.events.map(eventRow).join('')}</table></td></tr>`
      : s.emptyNote
        ? `<tr><td style="padding:6px 0;font-size:12px;color:${MUTED};">${esc(s.emptyNote)}</td></tr>`
        : ''
  const tail: string[] = []
  if (s.more) tail.push(`<a href="${attr(siteUrl('/events'))}" style="color:${LINK};text-decoration:none;">${s.more} more on the calendar</a>`)
  if (s.link) tail.push(`<a href="${attr(s.link.url)}" style="color:${LINK};text-decoration:none;">${esc(s.link.label)} &rarr;</a>`)
  const foot = tail.length ? `<tr><td style="padding:5px 0 0 0;font-size:11px;color:${MUTED};">${tail.join(' &middot; ')}</td></tr>` : ''
  return head + body + foot
}

export function renderWeeklyEmail(p: RenderParams): string {
  const preheader = weeklyPreheader(p.plan)
  const note = p.previewNote
    ? `<div style="margin:0 0 8px 0;padding:6px 8px;border:1px dashed #999999;font-size:11px;color:${MUTED};">${esc(p.previewNote)}</div>`
    : ''
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FundOpsHQ Events</title>
</head>
<body style="margin:0;padding:0;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td align="center" style="padding:8px 6px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">
<tr><td style="font-family:${FONT};color:${TEXT};">
${note}<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="font-size:13px;font-weight:bold;color:${TEXT};padding-bottom:2px;">FundOpsHQ Events</td>
<td align="right" style="font-size:12px;color:${MUTED};">${esc(longDate(p.todayIso))}</td>
</tr>
</table>
<div style="font-size:12px;line-height:1.45;color:${MUTED};border-bottom:2px solid #999999;padding-bottom:5px;">
Private-markets events in the US and Canada this week and next. Every date checked at the organizer.
<a href="${attr(siteUrl('/events'))}" style="color:${LINK};text-decoration:none;font-weight:bold;">The full calendar</a>
</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
${p.plan.sections.map(sectionHtml).join('\n')}
</table>
<div style="margin-top:16px;padding:8px 10px;border:1px solid #999999;font-size:12px;line-height:1.45;color:${TEXT};">
<b>Hosting an event?</b> Listing is free; we check the date at the organizer before it goes up.
<a href="${attr(siteUrl('/events/submit'))}" style="color:${LINK};text-decoration:none;font-weight:bold;">Submit it here</a>.
</div>
<div style="margin-top:12px;border-top:1px solid #999999;padding-top:8px;font-size:11px;line-height:1.5;color:${MUTED};">
You get this on Mondays because you asked for the week's events at fundopshq.com. FundOps Daily still comes every morning.<br>
<a href="${attr(p.eventsUnsubscribeUrl)}" style="color:${MUTED};text-decoration:underline;">Stop the Monday events email</a>
&middot; <a href="${attr(p.unsubscribeAllUrl)}" style="color:${MUTED};text-decoration:underline;">Unsubscribe from all FundOpsHQ email</a>
&middot; FundOpsHQ
</div>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

/** The plain-text twin: the same sections, links written out. */
export function renderWeeklyText(p: RenderParams): string {
  const lines: string[] = []
  if (p.previewNote) lines.push(`[${p.previewNote}]`, '')
  lines.push(`FUNDOPSHQ EVENTS · ${longDate(p.todayIso)}`)
  lines.push('Private-markets events in the US and Canada this week and next. Every date checked at the organizer.')
  lines.push(`The full calendar: ${siteUrl('/events')}`)
  for (const s of p.plan.sections) {
    lines.push('', s.title.toUpperCase(), '-'.repeat(Math.min(s.title.length, 60)))
    if (s.events.length === 0 && s.emptyNote) lines.push(s.emptyNote)
    for (const e of s.events) {
      const time = eventTimeLabel(e)
      const access = costLabel(e)
      lines.push('')
      lines.push(e.name)
      lines.push([rowDate(e) + (time ? `, ${time}` : ''), e.organizerName, where(e), access].filter(Boolean).join(' · '))
      lines.push(eventUrl(e.slug))
    }
    if (s.more) lines.push('', `${s.more} more on the calendar: ${siteUrl('/events')}`)
    if (s.link) lines.push('', `${s.link.label}: ${s.link.url}`)
  }
  lines.push('', '---', `Hosting an event? Listing is free; we check the date at the organizer before it goes up: ${siteUrl('/events/submit')}`)
  lines.push('', "You get this on Mondays because you asked for the week's events at fundopshq.com. FundOps Daily still comes every morning.")
  lines.push(`Stop the Monday events email: ${p.eventsUnsubscribeUrl}`)
  lines.push(`Unsubscribe from all FundOpsHQ email: ${p.unsubscribeAllUrl}`)
  return lines.join('\n') + '\n'
}

// ── When it goes out: 6:45 New York time on Mondays ───────────────────
//
// Before the daily (7:30 ET), so the two do not land together. Vercel's crons are UTC, so vercel.json fires
// twice on Mondays, at 10:45 and 11:45 UTC, the daily's pattern (lib/newsletter/send-time.ts):
//
//   EDT (UTC-4): 10:45 UTC is 6:45 and sends; 11:45 UTC is 7:45, outside the window, and does nothing.
//   EST (UTC-5): 10:45 UTC is 5:45, before the window, and does nothing; 11:45 UTC is 6:45 and sends.
//
// The window is 6:15 to 7:15 so exactly one of the two fires is inside it on any Monday, and a fire a few
// seconds early or a few minutes late still sends. The week's row in events_weekly_sends turns away a second
// run (a manual one, `?anyTime=1`) after a good send.

export const WEEKLY_WINDOW_ET = { opens: 6 * 60 + 15, closes: 7 * 60 + 15 } as const

/** Weekday ("Mon") and minutes after midnight in New York. */
export function newYorkClock(now: Date): { weekday: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return { weekday: get('weekday'), minutes: Number(get('hour')) * 60 + Number(get('minute')) }
}

/** True when a scheduled fire at `now` should send: a Monday in New York, between 6:15 and 7:15. */
export function weeklySendWindowOpen(now: Date): boolean {
  const { weekday, minutes } = newYorkClock(now)
  return weekday === 'Mon' && minutes >= WEEKLY_WINDOW_ET.opens && minutes < WEEKLY_WINDOW_ET.closes
}

/** The Monday of the New York week a date is in: the key a week's send is recorded under. */
export function mondayOf(todayIso: string): string {
  const [y, m, d] = todayIso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() - ((dt.getUTCDay() + 6) % 7))
  return dt.toISOString().slice(0, 10)
}
