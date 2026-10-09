import type { SupabaseClient } from '@supabase/supabase-js'
import { signupColumns, type SignupSource } from '@/lib/newsletter/signup-source'
import { preferenceColumns } from '@/lib/newsletter/interests'

/** What the signup card collected with the address; any of it may be absent. */
export interface SignupPreferences {
  interests?: string[]
  role?: string
  form?: string
}

/**
 * True when an insert failed because the signup_* or preference columns are
 * not there yet (the deploy landed before 20261008_signup_source.sql or
 * 20261008_subscriber_interests.sql was applied). PostgREST says PGRST204 for a column missing from its schema
 * cache; Postgres says 42703 for one missing from the table.
 */
export function isMissingSignupColumns(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return (
    error.code === 'PGRST204' ||
    error.code === '42703' ||
    /signup_(source|medium|campaign|landing_path|form)|interests|reader_role/.test(error.message ?? '')
  )
}

/**
 * Inserts a new, confirmed subscriber with the source it came from and what
 * they said they follow. If the database refuses because those columns do not
 * exist, the same row is inserted without them: a signup is never lost for
 * want of a source or a preference.
 * Only a first signup comes through here; a returning address keeps the
 * values it already has.
 */
export async function insertSubscriber(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any>,
  email: string,
  nowIso: string,
  source: SignupSource,
  preferences: SignupPreferences = {},
) {
  const base = { email, status: 'confirmed', confirmed_at: nowIso }
  const insert = (row: Record<string, unknown>) =>
    supabase.from('newsletter_subscribers').insert(row).select('unsubscribe_token').single()

  const columns = { ...signupColumns(source), ...preferenceColumns(preferences) }
  if (Object.keys(columns).length === 0) return insert(base)

  const first = await insert({ ...base, ...columns })
  if (first.error && isMissingSignupColumns(first.error)) {
    console.warn('newsletter_subscribers is missing signup or preference columns; saved the signup without them')
    return insert(base)
  }
  return first
}
