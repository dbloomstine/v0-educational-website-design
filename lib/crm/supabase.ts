import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _crm: SupabaseClient<any, any> | null = null

/**
 * Client for the `danny-lead-crm` Supabase project.
 *
 * This is a DIFFERENT project from the one behind the public site
 * (`getSupabaseAdmin()` in lib/supabase/client.ts). They are deliberately
 * separate so the public site's service-role key can never reach lead data.
 * Never point this at the site's project, or the site's client at this one.
 *
 * Server-only. Never import from a client component.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCrmAdmin(): SupabaseClient<any, any> {
  if (!_crm) {
    const url = process.env.CRM_SUPABASE_URL
    const key = process.env.CRM_SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error(
        'CRM_SUPABASE_URL and CRM_SUPABASE_SERVICE_ROLE_KEY must be set. ' +
        'See docs/LEAD-DESK.md.'
      )
    }
    _crm = createClient(url, key, { auth: { persistSession: false } })
  }
  return _crm
}
