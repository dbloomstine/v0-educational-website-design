import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { resendEventById, resendEvents } from '@/lib/newsletter/resend-events'
import { LOOKBACK_MS, countEngagement, editionsToCount, type EditionRow } from '@/lib/scorecard/engagement'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/** Ids the list missed that are looked up one at a time, at most, per run (600 ms each). */
const SINGLE_LOOKUPS = 60

/**
 * Once a day (12:00 UTC, half an hour after the send): each edition's opens and clicks, counted from Resend and saved
 * in `newsletter_editions.engagement` for the Monday scorecard (see lib/scorecard/engagement.ts for why they are
 * stored). Counts the editions sent one to three days earlier, and on its first run the last fortnight. Reads Resend's
 * email list back to the oldest of them (about two pages a day of mail), then asks for any id the list did not reach
 * one by one. Sends nothing. `?dry=1` returns the counts without saving them.
 */
export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const dry = new URL(req.url).searchParams.get('dry') === '1'
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY missing' }, { status: 500 })
  const now = Date.now()
  const db = getSupabaseAdmin()
  try {
    const { data, error } = await db
      .from('newsletter_editions')
      .select('id, edition_date, sent_at, status, resend_email_ids, engagement')
      .eq('status', 'sent')
      .gte('sent_at', new Date(now - LOOKBACK_MS).toISOString())
      .order('sent_at', { ascending: false })
      .limit(30)
    if (error) throw new Error(`editions: ${error.message}`)
    const due = editionsToCount((data ?? []) as EditionRow[], now)
    if (!due.length) return NextResponse.json({ ok: true, counted: [] })

    const wanted = new Set(due.flatMap((e) => Object.values(e.resend_email_ids ?? {})))
    const oldest = Math.min(...due.map((e) => Date.parse(e.sent_at as string)))
    const events = await resendEvents(apiKey, wanted, oldest - 3_600_000, 60)
    let single = 0
    for (const id of wanted) {
      if (events.has(id) || single >= SINGLE_LOOKUPS) continue
      single++
      const e = await resendEventById(apiKey, id)
      if (e) events.set(id, e)
    }

    const counted = []
    for (const e of due) {
      const engagement = countEngagement(e.resend_email_ids, events, e.sent_at as string, now)
      counted.push({ edition_date: e.edition_date, ...engagement })
      if (dry) continue
      const { error: upErr } = await db.from('newsletter_editions').update({ engagement }).eq('id', e.id)
      if (upErr) throw new Error(`save ${e.edition_date}: ${upErr.message}`)
    }
    return NextResponse.json({ ok: true, dry, single, counted })
  } catch (err) {
    console.error('[edition-engagement]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'count failed' }, { status: 500 })
  }
}
