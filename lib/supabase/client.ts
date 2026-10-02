import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: SupabaseClient<any, any> | null = null

/**
 * No request to the database may wait longer than this.
 *
 * The database cancels a statement after eight seconds, so nothing useful
 * takes longer — but a request can QUEUE for far longer when the database is
 * busy. On 2026-10-02 they queued for up to five minutes: pages hung for five
 * minutes, and every hung page was a server held open and one more request in
 * the queue. Giving up after fifteen seconds lets a page fail (or fall back
 * to its cached copy) and lets the queue drain.
 */
const REQUEST_TIMEOUT_MS = 15_000

/** fetch, with the deadline; a caller's own signal (a shorter deadline) still applies. */
function fetchWithDeadline(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const deadline = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const signal = init?.signal ? AbortSignal.any([init.signal, deadline]) : deadline
  return fetch(input, { ...init, signal })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseAdmin(): SupabaseClient<any, any> {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { global: { fetch: fetchWithDeadline } }
    )
  }
  return _client
}
