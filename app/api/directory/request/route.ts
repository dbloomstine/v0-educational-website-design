import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { sendOwnerAlert } from '@/lib/alerts/owner-alert'
import { clientIp, hashIp } from '@/lib/submit/news-submission'
import { REQUEST_LIMITS, SITE, validateRequest } from '@/lib/directory/claim'
import { profilePath } from '@/lib/directory/people'
import { personBySlug, refreshDirectory } from '@/lib/directory/server'
import { directoryEnabled } from '@/lib/directory/taxonomy'

export const dynamic = 'force-dynamic'

/**
 * POST { slug, kind: removal|correction, message, contact_email, website }:
 * anyone, from any profile. Filed in directory_requests and emailed to the
 * owner. A removal request does NOT hide the profile by itself (2026-10-24: an
 * unchecked email let anyone take any profile down); the desk reviews it within
 * two business days and removes or keeps it. The person can always hide their
 * own profile at once by claiming it (work-email confirmed).
 */
export async function POST(req: Request) {
  if (!directoryEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  if (typeof body?.website === 'string' && body.website.trim()) return NextResponse.json({ success: true })
  const checked = validateRequest(body)
  if (!checked.ok) return NextResponse.json({ error: checked.error, field: checked.field }, { status: 400 })
  const r = checked.value

  const person = await personBySlug(r.slug).catch(() => null)
  if (!person || person.status === 'review') return NextResponse.json({ error: 'We could not find that profile.' }, { status: 404 })

  const db = getSupabaseAdmin()
  const ipHash = hashIp(clientIp(req.headers))
  if (ipHash) {
    const { count } = await db
      .from('directory_requests')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', new Date(Date.now() - 86_400_000).toISOString())
    if ((count ?? 0) >= REQUEST_LIMITS.perIpPerDay) return NextResponse.json({ error: 'We already have several requests from you today. Write to danny@fundopshq.com.' }, { status: 429 })
  }

  const { error } = await db.from('directory_requests').insert({ person_id: person.id, person_slug: person.slug, kind: r.kind, message: r.message, contact_email: r.contact_email, ip_hash: ipHash })
  if (error) console.error('[directory] request not saved:', error.code, error.message)

  // A removal is reviewed by the desk, never applied by an unverified request (2026-10-24).
  const hid = false

  const alerted = await sendOwnerAlert({
    fromName: 'FundOpsHQ Directory',
    subject: `[Directory] ${r.kind === 'removal' ? 'Removal' : 'Correction'} request: ${person.full_name} (${person.firm_name})`,
    text: [
      `${r.kind === 'removal' ? 'Removal' : 'Correction'} request for ${person.full_name} (${person.firm_name}).`,
      r.kind === 'removal' ? 'The profile is still live: review within two business days (remove, or resolve as rejected).' : '',
      error ? 'NOT SAVED: the database refused the row. This email is the only copy.' : '',
      `Profile: ${SITE}${profilePath(person)}`,
      '',
      'UNVERIFIED: typed by the sender.',
      `From: ${r.contact_email}`,
      'Message:',
      r.message ?? '(none)',
      '',
      `Then: scripts/directory/review.ts ${r.kind === 'removal' ? `remove ${person.slug} (or unhide ${person.slug})` : 'queue'}; resolve <request id> done`,
    ]
      .filter((x) => x !== '')
      .join('\n'),
    replyTo: r.contact_email,
  })
  if (error && !alerted) return NextResponse.json({ error: 'Something went wrong on our side. Please write to danny@fundopshq.com.' }, { status: 500 })
  return NextResponse.json({ success: true, hidden: hid })
}
