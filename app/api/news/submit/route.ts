import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { sendOwnerAlert } from '@/lib/alerts/owner-alert'
import { POST as subscribe } from '@/app/api/newsletter/subscribe/route'
import {
  PER_CONTACT_PENDING,
  PER_IP_PER_DAY,
  QUEUE_CAP,
  alertSubject,
  alertText,
  clientIp,
  hashIp,
  looksLikeSpam,
  validateNewsSubmission,
  type NewsSubmission,
} from '@/lib/submit/news-submission'

export const dynamic = 'force-dynamic'

/**
 * Public "Submit your news" intake (/submit), modelled on /api/events/submit.
 *
 * Rows land in news_submissions as `pending`. NOTHING is published from here:
 * a submission is a lead for the news desk, which checks it against the
 * firm's own announcement (the required link) or a credible outlet first.
 * Every field is untrusted.
 *
 * Abuse control: a hidden field bots fill (`website`), five a day from one IP
 * address (kept only as a keyed hash), five waiting from one contact address,
 * two hundred waiting in all, and a row with a fistful of links in it is kept
 * as `spam` without an email to the owner.
 */

type Newsletter = 'subscribed' | 'already' | 'failed'

/** Sign the sender up through the site's own subscribe route, so it is the same signup in every way (welcome email, source, form). */
async function subscribeSender(s: NewsSubmission, attribution: unknown): Promise<Newsletter> {
  try {
    const res = await subscribe(
      new Request('https://fundopshq.com/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: s.contact_email, form: 'submit', page: '/submit', attribution }),
      }),
    )
    if (!res.ok) return 'failed'
    const data = (await res.json().catch(() => ({}))) as { message?: string }
    return data.message === 'Already subscribed' ? 'already' : 'subscribed'
  } catch {
    return 'failed'
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    const parsed: unknown = await req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object')
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Honeypot: real people never fill the hidden "website" field. The bot is told it worked.
  if (typeof body.website === 'string' && body.website.trim().length > 0) {
    return NextResponse.json({ success: true })
  }

  const checked = validateNewsSubmission(body)
  if (!checked.ok) {
    return NextResponse.json({ error: checked.error, field: checked.field }, { status: 400 })
  }
  const s = checked.value
  const ipHash = hashIp(clientIp(req.headers))

  const supabase = getSupabaseAdmin()
  const pendingCount = () =>
    supabase.from('news_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString()

  // A failed count lets the submission through (a lead is worth more than a perfect limit); the honeypot still stands.
  const [fromIp, fromContact, queue] = await Promise.all([
    ipHash
      ? supabase.from('news_submissions').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', dayAgo)
      : Promise.resolve({ count: 0 }),
    pendingCount().eq('contact_email', s.contact_email),
    pendingCount(),
  ])
  if ((fromIp.count ?? 0) >= PER_IP_PER_DAY || (fromContact.count ?? 0) >= PER_CONTACT_PENDING) {
    return NextResponse.json(
      { error: 'We already have several submissions from you waiting. Please write to danny@fundopshq.com instead.' },
      { status: 429 },
    )
  }
  if ((queue.count ?? 0) >= QUEUE_CAP) {
    return NextResponse.json({ error: 'The submission queue is full. Please try again tomorrow.' }, { status: 429 })
  }

  const spam = looksLikeSpam(s)
  const { error } = await supabase.from('news_submissions').insert({ ...s, status: spam ? 'spam' : 'pending', ip_hash: ipHash })
  if (error) console.error('Failed to insert news submission:', error.code, error.message)
  const stored = !error

  // Kept for the record; the owner is not emailed and nobody is subscribed. The sender is told it worked.
  if (spam) return NextResponse.json({ success: true })

  const newsletter = s.wants_newsletter ? await subscribeSender(s, body.attribution) : null

  const alerted = await sendOwnerAlert({
    fromName: 'FundOpsHQ News Desk',
    subject: alertSubject(s),
    text: alertText(s, { stored, newsletter }),
    replyTo: s.contact_email,
  })

  // Not saved and not emailed: nobody has it, so the sender is told to try again.
  if (!stored && !alerted) {
    return NextResponse.json({ error: 'Failed to submit. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, newsletter })
}
