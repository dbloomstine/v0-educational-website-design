import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { send } from '@/lib/sponsor/mail'
import { scorecard, scorecardMail, type MetricRow, type PostRow, type SubscriberRow } from '@/lib/scorecard/scorecard'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DAY = 86_400_000

/**
 * Monday morning: the week's scorecard, mailed to the owner (lib/scorecard/scorecard.ts). Four small reads: the
 * subscribers (a few hundred rows), two weeks of posts, their readings by primary key of the post, and the week's
 * looks at the sponsor page. `?dry=1` returns the numbers and the letter without sending it.
 */
export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const dry = new URL(req.url).searchParams.get('dry') === '1'
  const now = Date.now()
  const db = getSupabaseAdmin()
  try {
    const since = new Date(now - 15 * DAY).toISOString().slice(0, 10)
    const [subs, posts, looks] = await Promise.all([
      db.from('newsletter_subscribers').select('status, created_at, unsubscribed_at, signup_source, signup_form').limit(20000),
      db.from('social_posts').select('id, post_date, slug, format, channel, status, permalink, caption').gte('post_date', since).eq('status', 'posted').limit(2000),
      db.from('sponsor_interest').select('id', { count: 'exact', head: true }).gte('seen_at', new Date(now - 7 * DAY).toISOString()),
    ])
    if (subs.error) throw new Error(`subscribers: ${subs.error.message}`)
    if (posts.error) throw new Error(`posts: ${posts.error.message}`)
    const ids = ((posts.data ?? []) as PostRow[]).map((p) => p.id)
    const metrics: MetricRow[] = []
    for (let i = 0; i < ids.length; i += 100) {
      const { data, error } = await db.from('social_metrics').select('post_id, captured_at, metrics').in('post_id', ids.slice(i, i + 100)).order('captured_at', { ascending: false }).limit(4000)
      if (error) throw new Error(`readings: ${error.message}`)
      metrics.push(...((data ?? []) as MetricRow[]))
    }
    const card = scorecard({ subscribers: (subs.data ?? []) as SubscriberRow[], posts: (posts.data ?? []) as PostRow[], metrics, sponsorLooks: looks.count ?? 0, now })
    const mail = scorecardMail(card)
    if (dry) return NextResponse.json({ ok: true, sent: false, subject: mail.subject, card, html: mail.html })
    const sent = await send(mail)
    return NextResponse.json({ ok: true, sent, subject: mail.subject })
  } catch (err) {
    console.error('[scorecard]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'scorecard failed' }, { status: 500 })
  }
}
