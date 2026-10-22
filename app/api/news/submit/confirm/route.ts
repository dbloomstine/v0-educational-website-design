import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { sendOwnerAlert } from '@/lib/alerts/owner-alert'
import { POST as subscribe } from '@/app/api/newsletter/subscribe/route'
import {
  alertSubject,
  alertText,
  confirmOutcome,
  hashToken,
  looksLikeToken,
  type AlertFields,
} from '@/lib/submit/news-submission'

export const dynamic = 'force-dynamic'

/**
 * POST { token }: the sender clicked the link we emailed (2026-10-22). The
 * link opens /submit/confirm, which posts here only when the sender presses
 * the button: mail scanners at many firms open every link in an email, and a
 * plain GET would let a scanner confirm on the sender's behalf.
 *
 * Single-use: only an `unconfirmed` row within its seven days becomes
 * `pending`, and the update itself checks the status, so two clicks at once
 * confirm it once. On that first confirmation the owner is emailed and, if
 * the sender ticked the box, they are subscribed to FundOps Daily: their
 * address is proven by now.
 */

type Newsletter = 'subscribed' | 'already' | 'failed'

/** Sign the sender up through the site's own subscribe route, so it is the same signup in every way (welcome email, source, form). */
async function subscribeSender(email: string): Promise<Newsletter> {
  try {
    const res = await subscribe(
      new Request('https://fundopshq.com/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, form: 'submit', page: '/submit' }),
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
  let token: unknown
  try {
    token = ((await req.json()) as { token?: unknown })?.token
  } catch {
    return NextResponse.json({ outcome: 'invalid' }, { status: 400 })
  }
  if (!looksLikeToken(token)) return NextResponse.json({ outcome: 'invalid' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { data: row, error } = await supabase
    .from('news_submissions')
    .select('*')
    .eq('confirm_token_hash', hashToken(token))
    .maybeSingle()
  if (error) {
    console.error('Confirm lookup failed:', error.code, error.message)
    return NextResponse.json({ outcome: 'error' }, { status: 500 })
  }

  const outcome = confirmOutcome(row)
  // A row kept as spam is told the same as a dead link.
  if (outcome === 'spam') return NextResponse.json({ outcome: 'invalid' }, { status: 404 })
  if (outcome === 'invalid') return NextResponse.json({ outcome }, { status: 404 })
  if (outcome === 'expired') return NextResponse.json({ outcome }, { status: 410 })
  if (outcome === 'already') return NextResponse.json({ outcome })

  const { data: updated, error: updateError } = await supabase
    .from('news_submissions')
    .update({ status: 'pending', confirmed_at: new Date().toISOString() })
    .eq('id', row.id)
    .eq('status', 'unconfirmed')
    .select('id')
  if (updateError) {
    console.error('Confirm update failed:', updateError.code, updateError.message)
    return NextResponse.json({ outcome: 'error' }, { status: 500 })
  }
  // Someone else's click got there first.
  if (!updated?.length) return NextResponse.json({ outcome: 'already' })

  const s = row as AlertFields
  const newsletter = s.wants_newsletter ? await subscribeSender(s.contact_email) : null
  await sendOwnerAlert({
    fromName: 'FundOpsHQ News Desk',
    subject: alertSubject(s),
    text: alertText(s, { state: 'confirmed', newsletter }),
    replyTo: s.contact_email,
  })

  return NextResponse.json({ outcome: 'confirmed', newsletter })
}
