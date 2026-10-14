/**
 * What Resend last saw happen to each email the daily send made: `last_event` per Resend email id ("delivered",
 * "opened", "clicked", "bounced", ...). Read by the sponsor page's figures (lib/sponsor/stats.ts) and by the daily
 * count of each edition's clicks (app/api/pipeline/edition-engagement).
 *
 * Two ways in, both read-only. The list (`GET /emails`, newest first, 100 a page) covers a day of mail in two
 * pages, so it is the main road. A single email (`GET /emails/<id>`) is the fallback for an id the list did not
 * reach. Resend allows two requests a second, so every call waits 600 ms and a 429 is retried once. Resend keeps
 * about a month of mail (measured 2026-10-14: an id from Oct 1 answered, one from Sep 14 was a 404).
 */
const PAUSE_MS = 600
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface ResendRow { id: string; last_event: string | null; created_at: string }

async function get(apiKey: string, url: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` }, cache: 'no-store' })
    if (res.status !== 429 || attempt >= 1) return res
    await sleep(1500)
  }
}

/** Page Resend's email list back to `untilMs` (or `maxPages`), collecting the last event of each wanted id. */
export async function resendEvents(apiKey: string, wanted: Set<string>, untilMs: number, maxPages = 30): Promise<Map<string, string>> {
  const events = new Map<string, string>()
  let after: string | null = null
  for (let page = 0; page < maxPages; page++) {
    const res = await get(apiKey, `https://api.resend.com/emails?limit=100${after ? `&after=${after}` : ''}`)
    if (!res.ok) throw new Error(`Resend list ${res.status}`)
    const body = (await res.json()) as { data?: ResendRow[]; has_more?: boolean }
    const rows = body.data ?? []
    for (const r of rows) if (wanted.has(r.id) && r.last_event) events.set(r.id, r.last_event)
    const last = rows[rows.length - 1]
    if (!last || !body.has_more) break
    if (events.size >= wanted.size || new Date(last.created_at).getTime() < untilMs) break
    after = last.id
    await sleep(PAUSE_MS)
  }
  return events
}

/** One email's last event, or null when Resend does not know it (gone after about a month) or will not say. */
export async function resendEventById(apiKey: string, id: string): Promise<string | null> {
  const res = await get(apiKey, `https://api.resend.com/emails/${encodeURIComponent(id)}`)
  await sleep(PAUSE_MS)
  if (!res.ok) return null
  const body = (await res.json().catch(() => ({}))) as { last_event?: string | null }
  return body.last_event ?? null
}
