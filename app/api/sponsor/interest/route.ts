import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { interestMail, send } from '@/lib/sponsor/mail'
import { isUuid } from '@/lib/sponsor/requests'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/**
 * A subscriber has opened /sponsor from the link in their own copy of the
 * email (the link carries their subscriber id; components/sponsor/ReaderBeacon.tsx
 * posts it here from the page). The visit is recorded, and the owner is told
 * which reader is looking, at most once a week per reader.
 *
 * It takes a real browser running the page to get here, which keeps out the
 * mail scanners that follow every link in an email. An id that is not a
 * confirmed subscriber's is ignored, and the answer is the same either way.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }
  if (!isUuid(body.r)) return NextResponse.json({ ok: true })

  try {
    const db = getSupabaseAdmin()
    const { data: reader } = await db.from('newsletter_subscribers').select('id, email, reader_role, created_at').eq('id', body.r).eq('status', 'confirmed').maybeSingle()
    if (!reader) return NextResponse.json({ ok: true })

    const { data: earlier } = await db.from('sponsor_interest').select('seen_at, notified').eq('subscriber_id', reader.id).order('seen_at', { ascending: false }).limit(50)
    const visits = earlier ?? []
    // Two looks within ten minutes are one visit: a reload, a second tab.
    if (visits[0] && Date.now() - new Date(visits[0].seen_at).getTime() < 10 * 60 * 1000) return NextResponse.json({ ok: true })
    const toldLately = visits.some((v) => v.notified && Date.now() - new Date(v.seen_at).getTime() < WEEK_MS)

    await db.from('sponsor_interest').insert({ subscriber_id: reader.id, notified: !toldLately })
    if (!toldLately) await send(interestMail({ email: String(reader.email), role: reader.reader_role ?? null, since: reader.created_at ?? null }, visits.length + 1))
  } catch (err) {
    console.error('[sponsor interest]', err instanceof Error ? err.message : err)
  }
  return NextResponse.json({ ok: true })
}
