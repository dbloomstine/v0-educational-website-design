import type { SupabaseClient } from '@supabase/supabase-js'
import { signupColumns, type SignupSource } from '@/lib/newsletter/signup-source'

/**
 * True when an insert failed because the signup_* columns are not there yet
 * (the deploy landed before supabase/migrations/20261008_signup_source.sql was
 * applied). PostgREST says PGRST204 for a column missing from its schema
 * cache; Postgres says 42703 for one missing from the table.
 */
export function isMissingSignupColumns(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return (
    error.code === 'PGRST204' ||
    error.code === '42703' ||
    /signup_(source|medium|campaign|landing_path)/.test(error.message ?? '')
  )
}

/**
 * Inserts a new, confirmed subscriber with the source it came from. If the
 * database refuses because the signup_* columns do not exist, the same row is
 * inserted without them: a signup is never lost for want of a source.
 * Only a first signup comes through here; a returning address keeps the
 * values it already has.
 */
export async function insertSubscriber(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any>,
  email: string,
  nowIso: string,
  source: SignupSource,
) {
  const base = { email, status: 'confirmed', confirmed_at: nowIso }
  const insert = (row: Record<string, string>) =>
    supabase.from('newsletter_subscribers').insert(row).select('unsubscribe_token').single()

  const columns = signupColumns(source)
  if (Object.keys(columns).length === 0) return insert(base)

  const first = await insert({ ...base, ...columns })
  if (first.error && isMissingSignupColumns(first.error)) {
    console.warn('newsletter_subscribers has no signup_* columns yet; saved the signup without a source')
    return insert(base)
  }
  return first
}
