import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { sendOwnerAlert } from '@/lib/alerts/owner-alert'
import { SESSION_COOKIE, SESSION_HOURS, SITE, claimOutcome, hashToken, looksLikeToken, signSession } from '@/lib/directory/claim'
import { emailDomain } from '@/lib/submit/validate'
import { profilePath } from '@/lib/directory/people'
import { personById, refreshDirectory } from '@/lib/directory/server'
import { directoryEnabled } from '@/lib/directory/taxonomy'

export const dynamic = 'force-dynamic'

/**
 * POST { token }: the claimer pressed "Confirm" on the page the email linked
 * to (a button, so a mail scanner opening the link confirms nothing). Single
 * use: the update itself checks confirmed_at is still empty. Marks the profile
 * claimed and opens a one-day edit session (a signed, http-only cookie).
 */
export async function POST(req: Request) {
  if (!directoryEnabled()) return NextResponse.json({ outcome: 'invalid' }, { status: 404 })
  let token: unknown
  try {
    token = ((await req.json()) as { token?: unknown })?.token
  } catch {
    return NextResponse.json({ outcome: 'invalid' }, { status: 400 })
  }
  if (!looksLikeToken(token)) return NextResponse.json({ outcome: 'invalid' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { data: claim, error } = await db.from('directory_claims').select('id, person_id, email, expires_at, confirmed_at').eq('token_hash', hashToken(token)).maybeSingle()
  if (error) {
    console.error('[directory] claim lookup failed:', error.code, error.message)
    return NextResponse.json({ outcome: 'error' }, { status: 500 })
  }
  const outcome = claimOutcome(claim)
  if (outcome === 'invalid') return NextResponse.json({ outcome }, { status: 404 })
  if (outcome === 'expired') return NextResponse.json({ outcome }, { status: 410 })
  if (outcome === 'already') return NextResponse.json({ outcome })

  const now = new Date().toISOString()
  const { data: won, error: updateError } = await db.from('directory_claims').update({ confirmed_at: now }).eq('id', claim!.id).is('confirmed_at', null).select('id')
  if (updateError) return NextResponse.json({ outcome: 'error' }, { status: 500 })
  if (!won?.length) return NextResponse.json({ outcome: 'already' })

  const person = await personById(claim!.person_id)
  if (!person || person.status === 'removed') return NextResponse.json({ outcome: 'invalid' }, { status: 404 })
  const first = !person.claimed_at
  const { error: personError } = await db
    .from('directory_people')
    .update({ claimed_at: person.claimed_at ?? now, claimed_email_domain: emailDomain(claim!.email) })
    .eq('id', person.id)
  if (personError) {
    console.error('[directory] claim not recorded on the profile:', personError.message)
    return NextResponse.json({ outcome: 'error' }, { status: 500 })
  }
  refreshDirectory()
  if (first) {
    await sendOwnerAlert({
      fromName: 'FundOpsHQ Directory',
      subject: `[Directory] Claimed: ${person.full_name} (${person.firm_name})`,
      text: `${person.full_name} (${person.firm_name}) claimed their profile from ${claim!.email}.\n${SITE}${profilePath(person)}`,
      replyTo: claim!.email,
    })
  }

  const session = signSession(person.id)
  const res = NextResponse.json({ outcome: 'confirmed' })
  if (session) {
    res.cookies.set(SESSION_COOKIE, session, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: SESSION_HOURS * 3600 })
  }
  return res
}
