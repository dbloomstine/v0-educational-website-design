import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { sendConfirmEmail } from '@/lib/submit/confirm-mail'
import { clientIp, hashIp } from '@/lib/submit/news-submission'
import {
  CLAIMS_PER_EMAIL_PER_DAY,
  CLAIMS_PER_IP_PER_DAY,
  CLAIMS_PER_PERSON_PER_DAY,
  claimDomainMatches,
  claimEmail,
  newConfirmToken,
} from '@/lib/directory/claim'
import { displayDomain } from '@/lib/directory/people'
import { personBySlug } from '@/lib/directory/server'
import { directoryEnabled } from '@/lib/directory/taxonomy'

export const dynamic = 'force-dynamic'

/**
 * POST { slug, email, website }: "Is this you? Claim this profile" (2026-10-24).
 * The address must be at the firm's own domain; we email a one-time link
 * (lib/directory/claim.ts). Nothing about the profile changes here.
 */
export async function POST(req: Request) {
  if (!directoryEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  let body: Record<string, unknown>
  try {
    const parsed: unknown = await req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object')
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  // Honeypot: the bot is told it worked.
  if (typeof body.website === 'string' && body.website.trim()) return NextResponse.json({ success: true })

  const person = await personBySlug(typeof body.slug === 'string' ? body.slug : '').catch(() => null)
  if (!person || !['published', 'hidden'].includes(person.status)) return NextResponse.json({ error: 'We could not find that profile.' }, { status: 404 })

  const check = claimDomainMatches(body.email, person.firm_domain)
  if (!check.ok) {
    const domain = displayDomain(person.firm_domain)
    const error = {
      invalid: 'Enter your work email address.',
      free_mail: `Use your work address at ${domain}: that is how we know the profile is yours.`,
      wrong_domain: `That address is not at ${domain}. Use your work address there, or ask us to correct the profile.`,
    }[check.reason]
    return NextResponse.json({ error, field: 'email' }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  const ipHash = hashIp(clientIp(req.headers))
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString()
  const count = () => db.from('directory_claims').select('id', { count: 'exact', head: true }).gte('created_at', dayAgo)
  const [byEmail, byPerson, byIp] = await Promise.all([
    count().eq('email', check.email),
    count().eq('person_id', person.id),
    ipHash ? count().eq('ip_hash', ipHash) : Promise.resolve({ count: 0 }),
  ])
  if ((byEmail.count ?? 0) >= CLAIMS_PER_EMAIL_PER_DAY || (byPerson.count ?? 0) >= CLAIMS_PER_PERSON_PER_DAY || (byIp.count ?? 0) >= CLAIMS_PER_IP_PER_DAY) {
    return NextResponse.json({ error: 'We have already sent several links today. Check your inbox, or try again tomorrow.' }, { status: 429 })
  }

  const { token, hash, expiresAt } = newConfirmToken()
  const { error } = await db.from('directory_claims').insert({ person_id: person.id, email: check.email, token_hash: hash, expires_at: expiresAt, ip_hash: ipHash })
  if (error) {
    console.error('[directory] claim not saved:', error.code, error.message)
    return NextResponse.json({ error: 'Something went wrong on our side. Please try again.' }, { status: 500 })
  }
  const sent = await sendConfirmEmail(check.email, claimEmail(person, token))
  if (!sent) return NextResponse.json({ error: 'We could not send the email. Please try again in a minute.' }, { status: 502 })
  return NextResponse.json({ success: true })
}
