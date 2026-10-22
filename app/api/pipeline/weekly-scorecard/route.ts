import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { send } from '@/lib/sponsor/mail'
import { scorecard, scorecardMail, type MetricRow, type OutreachEventRow, type OutreachMessageRow, type PostRow, type SubscriberRow } from '@/lib/scorecard/scorecard'
import type { EditionRow } from '@/lib/scorecard/engagement'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DAY = 86_400_000

/**
 * Monday morning: the week's scorecard, mailed to the owner (lib/scorecard/scorecard.ts). Five small reads: the
 * subscribers (a few hundred rows), two weeks of posts, their readings by primary key of the post, the week's
 * looks at the sponsor page, and two weeks of editions with the click counts stored on them each day. `?dry=1` returns the numbers and the letter without sending it.
 */
export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const dry = new URL(req.url).searchParams.get('dry') === '1'
  const now = Date.now()
  const db = getSupabaseAdmin()
  try {
    const since = new Date(now - 15 * DAY).toISOString().slice(0, 10)
    const [subs, posts, looks, editions, requests, outreach] = await Promise.all([
      db.from('newsletter_subscribers').select('status, created_at, unsubscribed_at, signup_source, signup_form, signup_campaign, signup_page').limit(20000),
      db.from('social_posts').select('id, post_date, slug, format, channel, status, permalink, caption').gte('post_date', since).eq('status', 'posted').limit(2000),
      db.from('sponsor_interest').select('id', { count: 'exact', head: true }).gte('seen_at', new Date(now - 7 * DAY).toISOString()),
      // The email's clicks, as counted each day by /api/pipeline/edition-engagement (never asked of Resend here).
      db.from('newsletter_editions').select('edition_date, status, engagement').gte('edition_date', since).eq('status', 'sent').limit(40),
      db.from('sponsor_requests').select('id', { count: 'exact', head: true }).gte('created_at', new Date(now - 7 * DAY).toISOString()),
      // Outreach v2: two weeks of sends and the webhook's events on them (lib/outreach-v2, outreach_v2_events).
      db.from('outreach_v2_messages').select('id, program, kind, status, sent_at, replied_at').gte('sent_at', new Date(now - 15 * DAY).toISOString()).limit(2000),
    ])
    if (subs.error) throw new Error(`subscribers: ${subs.error.message}`)
    if (posts.error) throw new Error(`posts: ${posts.error.message}`)
    if (editions.error) throw new Error(`editions: ${editions.error.message}`)
    if (outreach.error) throw new Error(`outreach: ${outreach.error.message}`)
    const outreachMessages = (outreach.data ?? []) as OutreachMessageRow[]
    const outreachEvents: OutreachEventRow[] = []
    for (let i = 0; i < outreachMessages.length; i += 100) {
      const { data, error } = await db.from('outreach_v2_events').select('message_id, type').in('message_id', outreachMessages.slice(i, i + 100).map((m) => m.id)).limit(5000)
      if (error) throw new Error(`outreach events: ${error.message}`)
      outreachEvents.push(...((data ?? []) as OutreachEventRow[]))
    }
    const ids = ((posts.data ?? []) as PostRow[]).map((p) => p.id)
    const metrics: MetricRow[] = []
    for (let i = 0; i < ids.length; i += 100) {
      const { data, error } = await db.from('social_metrics').select('post_id, captured_at, metrics').in('post_id', ids.slice(i, i + 100)).order('captured_at', { ascending: false }).limit(4000)
      if (error) throw new Error(`readings: ${error.message}`)
      metrics.push(...((data ?? []) as MetricRow[]))
    }
    const card = scorecard({ subscribers: (subs.data ?? []) as SubscriberRow[], posts: (posts.data ?? []) as PostRow[], metrics, editions: (editions.data ?? []) as EditionRow[], sponsorLooks: looks.count ?? 0, sponsorRequests: requests.count ?? 0, outreachMessages, outreachEvents, now })
    const mail = scorecardMail(card)
    if (dry) return NextResponse.json({ ok: true, sent: false, subject: mail.subject, card, html: mail.html })
    const sent = await send(mail)
    return NextResponse.json({ ok: true, sent, subject: mail.subject })
  } catch (err) {
    console.error('[scorecard]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'scorecard failed' }, { status: 500 })
  }
}
