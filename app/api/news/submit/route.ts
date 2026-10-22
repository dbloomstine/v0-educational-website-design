import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { sendOwnerAlert } from '@/lib/alerts/owner-alert'
import { sendConfirmEmail } from '@/lib/submit/confirm-mail'
import {
  PER_CONTACT_PER_DAY,
  PER_CONTACT_WAITING,
  PER_IP_PER_DAY,
  QUEUE_CAP,
  UNCONFIRMED_PER_DAY,
  alertSubject,
  alertText,
  clientIp,
  confirmEmail,
  hashIp,
  looksLikeSpam,
  newConfirmToken,
  validateNewsSubmission,
} from '@/lib/submit/news-submission'

export const dynamic = 'force-dynamic'

/**
 * Public "Send us your news" intake (/submit), modelled on /api/events/submit.
 *
 * Version 2 (2026-10-22, Danny's approved plan): a row lands in
 * news_submissions as `unconfirmed` and we email a one-time link to the work
 * address given (POST /api/news/submit/confirm makes it `pending`). The owner
 * hears about it only once it is confirmed. NOTHING is published from here.
 * Every field is untrusted.
 *
 * Abuse control: a hidden field bots fill (`website`); free mail refused; three
 * confirmation emails a day to one address, five submissions a day from one
 * IP address (kept only as a keyed hash), five waiting from one address, two
 * hundred in review, a hundred unconfirmed a day in all; a row with a fistful
 * of links in it is kept as `spam` and nothing is emailed.
 *
 * The answer's `confirm` says what the form should tell the sender:
 * 'sent' (check your inbox), 'failed' (we have it, the email did not go) or
 * 'none' (we have it by email only; the database refused it).
 */
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
    return NextResponse.json({ success: true, confirm: 'sent' })
  }

  const checked = validateNewsSubmission(body)
  if (!checked.ok) {
    return NextResponse.json({ error: checked.error, field: checked.field }, { status: 400 })
  }
  const s = checked.value
  const ipHash = hashIp(clientIp(req.headers))

  const supabase = getSupabaseAdmin()
  const count = () => supabase.from('news_submissions').select('id', { count: 'exact', head: true })
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString()

  // A failed count lets the submission through (a lead is worth more than a perfect limit); the honeypot still stands.
  const [fromIp, toContactToday, contactWaiting, inReview, unconfirmedToday] = await Promise.all([
    ipHash ? count().eq('ip_hash', ipHash).gte('created_at', dayAgo) : Promise.resolve({ count: 0 }),
    count().eq('contact_email', s.contact_email).gte('created_at', dayAgo),
    count().eq('contact_email', s.contact_email).in('status', ['unconfirmed', 'pending']),
    count().eq('status', 'pending'),
    count().eq('status', 'unconfirmed').gte('created_at', dayAgo),
  ])
  if (
    (fromIp.count ?? 0) >= PER_IP_PER_DAY ||
    (toContactToday.count ?? 0) >= PER_CONTACT_PER_DAY ||
    (contactWaiting.count ?? 0) >= PER_CONTACT_WAITING
  ) {
    return NextResponse.json(
      { error: 'We already have several submissions from you. Please check your inbox for our confirmation email, or write to danny@fundopshq.com.' },
      { status: 429 },
    )
  }
  if ((inReview.count ?? 0) >= QUEUE_CAP || (unconfirmedToday.count ?? 0) >= UNCONFIRMED_PER_DAY) {
    return NextResponse.json({ error: 'The submission queue is full. Please try again tomorrow.' }, { status: 429 })
  }

  // Link spam is kept for the record and nobody is emailed. The sender is told it worked.
  if (looksLikeSpam(s)) {
    const { error } = await supabase.from('news_submissions').insert({ ...s, status: 'spam', ip_hash: ipHash })
    if (error) console.error('Failed to insert news submission (spam):', error.code, error.message)
    return NextResponse.json({ success: true, confirm: 'sent' })
  }

  const { token, hash, expiresAt } = newConfirmToken()
  const { error } = await supabase.from('news_submissions').insert({
    ...s,
    status: 'unconfirmed',
    confirm_token_hash: hash,
    confirm_expires_at: expiresAt,
    ip_hash: ipHash,
  })

  if (error) {
    // Not saved, so a confirm link would lead nowhere. The owner gets the whole submission by email instead.
    console.error('Failed to insert news submission:', error.code, error.message)
    const alerted = await sendOwnerAlert({
      fromName: 'FundOpsHQ News Desk',
      subject: alertSubject(s),
      text: alertText(s, { state: 'not_saved' }),
      replyTo: s.contact_email,
    })
    if (!alerted) return NextResponse.json({ error: 'Failed to submit. Please try again.' }, { status: 500 })
    return NextResponse.json({ success: true, confirm: 'none' })
  }

  const sent = await sendConfirmEmail(s.contact_email, confirmEmail(s, token))
  if (!sent) {
    await sendOwnerAlert({
      fromName: 'FundOpsHQ News Desk',
      subject: alertSubject(s),
      text: alertText(s, { state: 'confirm_email_failed' }),
      replyTo: s.contact_email,
    })
    return NextResponse.json({ success: true, confirm: 'failed' })
  }

  return NextResponse.json({ success: true, confirm: 'sent' })
}
