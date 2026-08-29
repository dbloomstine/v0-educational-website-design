import type { IndustryEvent } from './types'
import { formatEventLocation } from './constants'

// iCalendar (RFC 5545) generation for the events board. Events are emitted as
// all-day entries (we store dates, not structured times — time_note is
// display-only and goes into the description). DTEND is exclusive, so a
// single-day event ends the following day.

function icsEscape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function icsDate(date: string): string {
  return date.replace(/-/g, '')
}

function nextDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + 1))
  return dt.toISOString().split('T')[0]
}

// Fold long content lines at 74 octets per RFC 5545 (approximate — we fold
// on character count, which is safe for our mostly-ASCII content).
function fold(line: string): string {
  if (line.length <= 74) return line
  const parts: string[] = []
  let rest = line
  parts.push(rest.slice(0, 74))
  rest = rest.slice(74)
  while (rest.length > 0) {
    parts.push(' ' + rest.slice(0, 73))
    rest = rest.slice(73)
  }
  return parts.join('\r\n')
}

function eventToVevent(event: IndustryEvent): string[] {
  const descParts = [
    event.description ?? '',
    event.timeNote ? `Time: ${event.timeNote}` : '',
    event.costType === 'free' ? 'Cost: Free' : event.priceNote ? `Cost: ${event.priceNote}` : '',
    `Details: ${event.eventUrl}`,
    'Via fundopshq.com/events',
  ].filter(Boolean)

  return [
    'BEGIN:VEVENT',
    `UID:${event.id}@fundopshq.com`,
    `DTSTAMP:${icsDate(event.startDate)}T000000Z`,
    `DTSTART;VALUE=DATE:${icsDate(event.startDate)}`,
    `DTEND;VALUE=DATE:${icsDate(nextDay(event.endDate ?? event.startDate))}`,
    fold(`SUMMARY:${icsEscape(event.name)}`),
    fold(`DESCRIPTION:${icsEscape(descParts.join('\n'))}`),
    fold(`LOCATION:${icsEscape(event.venue ? `${event.venue}, ${formatEventLocation(event)}` : formatEventLocation(event))}`),
    fold(`URL:${event.eventUrl}`),
    `ORGANIZER;CN=${icsEscape(event.organizerName)}:MAILTO:events@fundopshq.com`,
    'END:VEVENT',
  ]
}

export function buildIcsCalendar(events: IndustryEvent[], calendarName: string): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FundOpsHQ//Events Board//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    fold(`X-WR-CALNAME:${icsEscape(calendarName)}`),
    'X-PUBLISHED-TTL:PT12H',
    ...events.flatMap(eventToVevent),
    'END:VCALENDAR',
  ]
  return lines.join('\r\n') + '\r\n'
}

/** Google Calendar "add event" prefill URL for a single event. */
export function googleCalendarUrl(event: IndustryEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates: `${icsDate(event.startDate)}/${icsDate(nextDay(event.endDate ?? event.startDate))}`,
    details: [event.description ?? '', event.timeNote ? `Time: ${event.timeNote}` : '', event.eventUrl, 'Via fundopshq.com/events']
      .filter(Boolean)
      .join('\n'),
    location: event.venue ? `${event.venue}, ${formatEventLocation(event)}` : formatEventLocation(event),
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
