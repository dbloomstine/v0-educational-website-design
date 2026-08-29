// Events-board display constants. Deliberately named event_kind / event_format
// (not event_type) — the news domain already uses eventType to mean "kind of
// news story", and the two vocabularies must not blur together.

export const EVENT_KIND_LABELS: Record<string, { label: string; color: string }> = {
  conference: { label: 'Conference', color: 'bg-indigo-900/50 text-indigo-300 border-indigo-800' },
  summit: { label: 'Summit', color: 'bg-red-900/50 text-red-300 border-red-800' },
  forum: { label: 'Forum', color: 'bg-blue-900/50 text-blue-300 border-blue-800' },
  webinar: { label: 'Webinar', color: 'bg-emerald-900/50 text-emerald-300 border-emerald-800' },
  training: { label: 'Training', color: 'bg-violet-900/50 text-violet-300 border-violet-800' },
  networking: { label: 'Networking', color: 'bg-sky-900/50 text-sky-300 border-sky-800' },
  awards: { label: 'Awards', color: 'bg-rose-900/50 text-rose-300 border-rose-800' },
  roundtable: { label: 'Roundtable', color: 'bg-teal-900/50 text-teal-300 border-teal-800' },
  other: { label: 'Other', color: 'bg-muted text-muted-foreground border-border' },
}

export const EVENT_FORMAT_LABELS: Record<string, string> = {
  in_person: 'In-Person',
  virtual: 'Virtual',
  hybrid: 'Hybrid',
}

export const COST_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: 'text-emerald-400' },
  paid: { label: 'Paid', color: 'text-muted-foreground' },
  member_only: { label: 'Members', color: 'text-muted-foreground' },
  invite_only: { label: 'Invite', color: 'text-muted-foreground' },
  mixed: { label: 'Mixed', color: 'text-muted-foreground' },
}

export const EVENT_REGION_LABELS: Record<string, { label: string; short: string }> = {
  north_america: { label: 'North America', short: 'N. America' },
  europe: { label: 'Europe', short: 'Europe' },
  asia_pacific: { label: 'Asia-Pacific', short: 'APAC' },
  middle_east: { label: 'Middle East', short: 'Mid East' },
  latam: { label: 'Latin America', short: 'LatAm' },
  global: { label: 'Global', short: 'Global' },
}

// Same values as the news feed's asset-class taxonomy (minus service_provider,
// which is a news-source category, not an event audience).
export const EVENT_ASSET_CLASSES = [
  { label: 'PE', value: 'PE' },
  { label: 'VC', value: 'VC' },
  { label: 'Credit', value: 'credit' },
  { label: 'Hedge', value: 'hedge' },
  { label: 'Real Estate', value: 'real_estate' },
  { label: 'Infra', value: 'infrastructure' },
  { label: 'Secondaries', value: 'secondaries' },
  { label: 'GP-Stakes', value: 'gp_stakes' },
] as const

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Parse YYYY-MM-DD without a Date object — avoids the UTC-midnight timezone
// shift that moves date-only strings back a day in western zones.
function parseDateParts(date: string): { y: number; m: number; d: number } {
  const [y, m, d] = date.split('-').map(Number)
  return { y, m, d }
}

/** "Sep 15" · "Sep 15–16" · "Sep 30 – Oct 2" · appends ", 2027" when not the current year. */
export function formatEventDates(startDate: string, endDate: string | null): string {
  const s = parseDateParts(startDate)
  const currentYear = new Date().getFullYear()
  const yearSuffix = s.y !== currentYear ? `, ${s.y}` : ''

  if (!endDate || endDate === startDate) {
    return `${MONTH_SHORT[s.m - 1]} ${s.d}${yearSuffix}`
  }
  const e = parseDateParts(endDate)
  if (s.m === e.m && s.y === e.y) {
    return `${MONTH_SHORT[s.m - 1]} ${s.d}–${e.d}${yearSuffix}`
  }
  return `${MONTH_SHORT[s.m - 1]} ${s.d} – ${MONTH_SHORT[e.m - 1]} ${e.d}${yearSuffix}`
}

/** Month-group header key, e.g. "September 2026". */
export function formatMonthHeader(startDate: string): string {
  const { y, m } = parseDateParts(startDate)
  return `${MONTH_LONG[m - 1]} ${y}`
}

/** "New York, NY" · "London, UK" · falls back to "Virtual" for online events. */
export function formatEventLocation(event: {
  city: string | null
  stateRegion: string | null
  country: string | null
  eventFormat: string
}): string {
  if (event.city) {
    const suffix = event.stateRegion || (event.country && event.country !== 'USA' && event.country !== 'United States' ? event.country : null)
    return suffix ? `${event.city}, ${suffix}` : event.city
  }
  if (event.eventFormat === 'virtual') return 'Virtual'
  return event.country ?? 'TBA'
}
