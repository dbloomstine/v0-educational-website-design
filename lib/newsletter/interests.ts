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

export const ROLES = [
  { id: 'gp', label: 'GP' },
  { id: 'lp', label: 'LP' },
  { id: 'service_provider', label: 'Service provider' },
] as const

/** Which form a signup came through. Kept on the row so each form's yield can be counted. */
export const SIGNUP_FORMS = ['popup', 'hero', 'feed', 'widget', 'rail'] as const

/** The known ids among whatever was sent, once each, in list order. */
export function sanitizeInterests(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const sent = new Set(raw.filter((v): v is string => typeof v === 'string'))
  return INTERESTS.filter((i) => sent.has(i.id)).map((i) => i.id)
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
  return new Set(INTERESTS.filter((i) => chosen.has(i.id)).flatMap((i) => i.categories))
}

/** "private credit", "private credit and real estate", "private credit, real estate and venture". */
export function interestWords(ids: string[]): string {
  const names = INTERESTS.filter((i) => ids.includes(i.id)).map((i) =>
    i.id === 'secondaries' ? 'secondaries and GP stakes' : i.label.toLowerCase(),
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
