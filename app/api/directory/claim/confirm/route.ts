import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { sendOwnerAlert } from '@/lib/alerts/owner-alert'
import { SESSION_COOKIE, SESSION_HOURS, SITE, canClaim, claimKind, claimOutcome, emailLooksLikeName, hashToken, looksLikeToken, signSession } from '@/lib/directory/claim'
import { emailDomain } from '@/lib/submit/validate'
import { profilePath } from '@/lib/directory/people'
import { carryOver } from '@/lib/directory/moves'
import { claimConfirmedEmail, otherClaimEmail, sendDirectoryMail } from '@/lib/directory/owner-mail'
import { subscribeOwner, type OwnerSignup } from '@/lib/directory/newsletter'
import { confirmedClaims, personById, refreshDirectory, type AdminPerson } from '@/lib/directory/server'
import { directoryEnabled } from '@/lib/directory/taxonomy'

export const dynamic = 'force-dynamic'

/**
 * POST { token, newsletter }: the claimer pressed "Confirm" on the page the
 * email linked to (a button, so a mail scanner opening the link confirms
 * nothing). Single use: the update itself checks confirmed_at is still empty.
 * Opens a one-day edit session (a signed, http-only cookie).
 *
 * Two kinds of link land here (lib/directory/claim.ts claimKind):
 *   - a sign-in, from an address that confirmed a claim on this profile
 *     before: the session opens, nothing else happens;
 *   - a claim: the profile is marked claimed, Danny is alerted (every claim,
 *     not only the first), the claimer gets "your profile is claimed", anyone
 *     who claimed it before from another address is told, and a move the desk
 *     linked to this profile is completed (lib/directory/moves.ts).
 * With `newsletter: true` the (now proven) address is signed up to FundOps Daily.
 */
export async function POST(req: Request) {
  if (!directoryEnabled()) return NextResponse.json({ outcome: 'invalid' }, { status: 404 })
  let token: unknown
  let wantsNewsletter = false
  try {
    const body = (await req.json()) as { token?: unknown; newsletter?: unknown }
    token = body?.token
    wantsNewsletter = body?.newsletter === true
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

  const person = await personById(claim!.person_id)
  if (!person || !canClaim(person)) return NextResponse.json({ outcome: 'invalid' }, { status: 404 })

  // Earlier confirmed claims, read before this one is marked, to tell a sign-in from a claim.
  const earlier = (await confirmedClaims(person.id).catch(() => [])).filter((c) => c.id !== claim!.id)
  const kind = claimKind(claim!.email, earlier)

  const now = new Date().toISOString()
  const { data: won, error: updateError } = await db.from('directory_claims').update({ confirmed_at: now }).eq('id', claim!.id).is('confirmed_at', null).select('id')
  if (updateError) return NextResponse.json({ outcome: 'error' }, { status: 500 })
  if (!won?.length) return NextResponse.json({ outcome: 'already' })

  let newsletter: OwnerSignup | null = null
  if (kind === 'claim') {
    const first = !person.claimed_at
    const { error: personError } = await db
      .from('directory_people')
      .update({ claimed_at: person.claimed_at ?? now, claimed_email_domain: emailDomain(claim!.email) })
      .eq('id', person.id)
    if (personError) {
      console.error('[directory] claim not recorded on the profile:', personError.message)
      return NextResponse.json({ outcome: 'error' }, { status: 500 })
    }
    if (first) refreshDirectory()

    const moved = await completeMove(person, claim!.id, now)
    const others = [...new Set(earlier.map((c) => c.email.toLowerCase()).filter((e) => e !== claim!.email.toLowerCase()))]
    const path = profilePath(person)
    const domain = emailDomain(claim!.email) ?? ''
    if (wantsNewsletter) newsletter = await subscribeOwner(claim!.email, 'directory-claim', '/directory/claim/confirm')

    await Promise.all([
      sendOwnerAlert({
        fromName: 'FundOpsHQ Directory',
        subject: `[Directory] ${first ? 'Claimed' : 'Claimed again'}: ${person.full_name} (${person.firm_name})`,
        text: [
          `${person.full_name} (${person.firm_name}) ${first ? 'claimed their profile' : 'was claimed again'} from ${claim!.email}.`,
          emailLooksLikeName(claim!.email, person.full_name) ? '' : 'CHECK: the address does not look like the person’s name (a colleague or assistant, or someone else).',
          others.length ? `Claimed before by: ${others.join(', ')} (each has been told).` : '',
          moved ? `Move completed from ${moved}: their earlier headline, description, photo and matters are waiting as pending edits.` : '',
          newsletter ? `FundOps Daily: ${newsletter}.` : '',
          `${SITE}${path}`,
        ]
          .filter(Boolean)
          .join('\n'),
        replyTo: claim!.email,
      }),
      sendDirectoryMail(claim!.email, claimConfirmedEmail(person, path)),
      ...others.map((e) => sendDirectoryMail(e, otherClaimEmail(person, domain, path))),
    ])
  } else if (wantsNewsletter) {
    newsletter = await subscribeOwner(claim!.email, 'directory-claim', '/directory/claim/confirm')
  }

  const session = signSession(person.id, Date.now(), undefined, claim!.id)
  const res = NextResponse.json({ outcome: 'confirmed', kind, newsletter })
  if (session) {
    res.cookies.set(SESSION_COOKIE, session, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: SESSION_HOURS * 3600 })
  }
  return res
}

/**
 * A move the desk linked to this profile (directory_moves, awaiting): the person has now confirmed from the
 * new firm's domain. Their earlier owner fields become pending edits here (unless edits are already waiting),
 * the move is marked verified and the old profile is hidden by the desk, never deleted. Returns the old
 * profile's slug, or null. Never fails the claim: the table may not exist yet.
 */
async function completeMove(person: AdminPerson, claimId: string, now: string): Promise<string | null> {
  const db = getSupabaseAdmin()
  try {
    const { data: move, error } = await db.from('directory_moves').select('id, from_person_id').eq('to_person_id', person.id).eq('status', 'awaiting').maybeSingle()
    if (error || !move) return null
    const from = await personById(move.from_person_id)
    if (!from) return null
    const edits = carryOver(from)
    if (edits && !person.pending_edits) {
      await db
        .from('directory_people')
        .update({ pending_edits: { ...edits, submitted_by_claim: claimId, carried_from: from.slug }, pending_edits_at: now })
        .eq('id', person.id)
    }
    await db.from('directory_moves').update({ status: 'verified', verified_at: now, verified_claim_id: claimId }).eq('id', move.id).eq('status', 'awaiting')
    if (from.status === 'published') await db.from('directory_people').update({ status: 'hidden', hidden_by: 'desk' }).eq('id', from.id).eq('status', 'published')
    refreshDirectory()
    return from.slug
  } catch (err) {
    console.error('[directory] move not completed:', err)
    return null
  }
}
