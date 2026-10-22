/**
 * What a subscriber says they follow (2026-10-08).
 *
 * The signup card and the preferences page offer the same short list: the
 * asset classes the site's tabs already use, and where the reader sits. The
 * choices are kept on the subscriber's row and the daily email groups the
 * matching stories for that reader (lib/newsletter/personalize.ts).
 *
 * Browser-safe: no server imports. Whatever a request carries goes through
 * `sanitizeInterests` / `sanitizeRole`, so only ids on these lists are stored.
 */

export interface InterestDef {
  id: string
  label: string
  /** The classifier's fund_categories values this choice covers. */
  categories: string[]
  /** Newsletter sections (ArticleGroup.category) this choice pulls whole. */
  sections?: string[]
}

/** In the order of the site's asset-class tabs. */
export const INTERESTS: InterestDef[] = [
  { id: 'PE', label: 'Private equity', categories: ['PE'] },
  { id: 'VC', label: 'Venture', categories: ['VC'] },
  { id: 'credit', label: 'Private credit', categories: ['credit'] },
  { id: 'real_estate', label: 'Real estate', categories: ['real_estate'] },
  { id: 'infrastructure', label: 'Infrastructure', categories: ['infrastructure'] },
  { id: 'secondaries', label: 'Secondaries & GP stakes', categories: ['secondaries', 'gp_stakes'] },
  { id: 'hedge', label: 'Hedge funds', categories: ['hedge'] },
]

/**
 * What the email's one-click row offers beyond the asset classes (2026-10-16):
 * the sections a reader may work in rather than invest in. A choice here pulls
 * the whole section (lib/newsletter/personalize.ts), not a fund category. The
 * forms keep offering INTERESTS only; these are saved all the same.
 */
export const SECTION_INTERESTS: InterestDef[] = [
  { id: 'lps', label: 'LPs', categories: [], sections: ['lp_commitments'] },
  { id: 'people', label: 'People moves', categories: [], sections: ['people_moves'] },
  { id: 'regulation', label: 'Regulation', categories: [], sections: ['regulatory'] },
]

export const ALL_INTERESTS: InterestDef[] = [...INTERESTS, ...SECTION_INTERESTS]

/** The one-click row at the foot of the daily email, in reading order, with the short labels it uses. */
export const EMAIL_FOLLOW_ROW: { id: string; label: string }[] = [
  { id: 'PE', label: 'PE' },
  { id: 'credit', label: 'Credit' },
  { id: 'VC', label: 'VC' },
  { id: 'real_estate', label: 'Real estate' },
  { id: 'infrastructure', label: 'Infra' },
  { id: 'secondaries', label: 'Secondaries' },
  { id: 'lps', label: 'LPs' },
  { id: 'people', label: 'People' },
  { id: 'regulation', label: 'Regulation' },
]

export const ROLES = [
  { id: 'gp', label: 'GP' },
  { id: 'lp', label: 'LP' },
  { id: 'service_provider', label: 'Service provider' },
] as const

/**
 * Which form a signup came through. Kept on the row so each form's yield can be counted.
 * `events` is the inline "Get <City>'s events every Monday" block on event and city pages (2026-10-22);
 * `firstvisit` is the signup box shown on a first visit, as against `popup`, the box the reading clock opens.
 * `hero` was the homepage's one-line band, removed 2026-10-12; the value stays for the rows that carry it.
 * `submit` is the "Send me FundOps Daily" tick on /submit, where a firm sends in its news (2026-10-22).
 */
export const SIGNUP_FORMS = ['popup', 'hero', 'feed', 'widget', 'rail', 'events', 'firstvisit', 'submit'] as const

/** The known ids among whatever was sent, once each, in list order. */
export function sanitizeInterests(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const sent = new Set(raw.filter((v): v is string => typeof v === 'string'))
  return ALL_INTERESTS.filter((i) => sent.has(i.id)).map((i) => i.id)
}

/** The newsletter sections a set of choices pulls whole. */
export function interestSections(ids: string[]): Set<string> {
  const chosen = new Set(ids)
  return new Set(ALL_INTERESTS.filter((i) => chosen.has(i.id)).flatMap((i) => i.sections ?? []))
}

export function sanitizeRole(raw: unknown): string | undefined {
  return ROLES.find((r) => r.id === raw)?.id
}

export function sanitizeSignupForm(raw: unknown): string | undefined {
  return SIGNUP_FORMS.find((f) => f === raw)
}

/** One string per distinct set of choices: the daily send renders the email once for each. */
export function interestKey(ids: string[]): string {
  return sanitizeInterests(ids).join(',')
}

/** The fund_categories values a set of choices covers. */
export function interestCategories(ids: string[]): Set<string> {
  const chosen = new Set(ids)
  return new Set(ALL_INTERESTS.filter((i) => chosen.has(i.id)).flatMap((i) => i.categories))
}

/** "private credit", "private credit and real estate", "private credit, real estate and venture". */
export function interestWords(ids: string[]): string {
  const names = ALL_INTERESTS.filter((i) => ids.includes(i.id)).map((i) =>
    i.id === 'secondaries' ? 'secondaries and GP stakes' : i.id === 'lps' ? 'LPs' : i.label.toLowerCase(),
  )
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** The subscriber-row columns for a signup's choices. Only what was given, so an empty one adds nothing. */
export function preferenceColumns(p: { interests?: string[]; role?: string; form?: string }): Record<string, unknown> {
  const cols: Record<string, unknown> = {}
  if (p.interests && p.interests.length > 0) cols.interests = p.interests
  if (p.role) cols.reader_role = p.role
  if (p.form) cols.signup_form = p.form
  return cols
}

// ── Event opt-ins (2026-10-22) ──────────────────────────────────────
//
// The events signup block on event and city pages records that a reader wants the week's events, and for
// which city, so a Monday events email can be sent to them later. The tags live in the same `interests`
// column as the asset classes ("events", "city:chicago") but are not story interests: sanitizeInterests
// drops them, so the daily email's grouping (personalize.ts, interestKey) never sees them, and the routes
// that rewrite a reader's story choices keep them (withEventTags).

/** The reader asked for the week's events. */
export const EVENTS_TAG = 'events'
const CITY_PREFIX = 'city:'
const CITY_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** "Washington DC" → "washington-dc", the same slug the /events/<city> pages use. Empty for nothing usable. */
export function citySlug(city: string | null | undefined): string {
  return (city ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '')
}

/** The tag for a city ("city:chicago"), or null when the city gives no usable slug. */
export function cityTag(city: string | null | undefined): string | null {
  const slug = citySlug(city)
  return slug && CITY_SLUG.test(slug) ? `${CITY_PREFIX}${slug}` : null
}

/** What an events signup asks to record: always "events", and the city when there is one. */
export function eventSignupTags(city: string | null | undefined): string[] {
  const tag = cityTag(city)
  return tag ? [EVENTS_TAG, tag] : [EVENTS_TAG]
}

function isCityTag(v: string): boolean {
  return v.startsWith(CITY_PREFIX) && v.length <= CITY_PREFIX.length + 40 && CITY_SLUG.test(v.slice(CITY_PREFIX.length))
}

/**
 * The event tags among whatever was sent: "events" and well-formed city tags, once each.
 * `maxCities` caps the city tags (a request may add one; a stored row keeps what it has).
 */
export function sanitizeEventTags(raw: unknown, maxCities = 1): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  let cities = 0
  for (const v of raw) {
    if (typeof v !== 'string' || out.includes(v)) continue
    if (v === EVENTS_TAG) out.push(v)
    else if (isCityTag(v) && cities < maxCities) {
      out.push(v)
      cities++
    }
  }
  // A city with no "events" is still an events opt-in: say so.
  if (out.length > 0 && !out.includes(EVENTS_TAG)) out.unshift(EVENTS_TAG)
  return out.sort((a, b) => (a === EVENTS_TAG ? -1 : b === EVENTS_TAG ? 1 : a.localeCompare(b)))
}

/** What a signup request may store in `interests`: story interests in list order, then its event tags. */
export function sanitizeSignupInterests(raw: unknown): string[] {
  return [...sanitizeInterests(raw), ...sanitizeEventTags(raw)]
}

/** Story interests (only ids on the lists) with the event tags already on the reader's row kept beside them. */
export function withEventTags(storyInterests: string[], onFile: unknown): string[] {
  return [...sanitizeInterests(storyInterests), ...sanitizeEventTags(onFile, 50)]
}

/**
 * The interests to store when an address comes back through a signup form: the story interests it sent, or the
 * ones on file when it sent none (an events block sends none), plus every event tag from both.
 */
export function mergeSignupInterests(sent: string[], onFile: unknown): string[] {
  const story = sanitizeInterests(sent)
  const events = sanitizeEventTags([...(Array.isArray(onFile) ? onFile : []), ...sent], 50)
  return [...(story.length ? story : sanitizeInterests(onFile)), ...events]
}

// ── The Monday events email (2026-10-22, lib/events/weekly-email.ts) ──

/** True when a reader's stored interests ask for the Monday events email ("events", or a city tag, which implies it). */
export function wantsEventsEmail(onFile: unknown): boolean {
  return sanitizeEventTags(onFile, 50).length > 0
}

/** The city slugs a reader asked for ("city:chicago" → "chicago"), in stored order, once each. */
export function readerCitySlugs(onFile: unknown): string[] {
  return sanitizeEventTags(onFile, 50)
    .filter((t) => t !== EVENTS_TAG)
    .map((t) => t.slice(CITY_PREFIX.length))
}

/**
 * Stored interests with every event tag taken out: what "stop the Monday events email" writes. The city tags
 * go too, because a city tag on its own still counts as an events opt-in (sanitizeEventTags). Everything
 * else on the row is kept as it is.
 */
export function withoutEventTags(onFile: unknown): string[] {
  if (!Array.isArray(onFile)) return []
  return onFile.filter((v): v is string => typeof v === 'string' && v !== EVENTS_TAG && !v.startsWith(CITY_PREFIX))
}
