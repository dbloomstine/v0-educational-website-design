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
 * owner. A removal request hides the profile AT ONCE (hidden_by request),
 * pending review; the desk then removes it or shows it again.
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

  let hid = false
  if (r.kind === 'removal' && person.status === 'published') {
    const { error: hideError } = await db.from('directory_people').update({ status: 'hidden', hidden_by: 'request' }).eq('id', person.id).eq('status', 'published')
    if (hideError) console.error('[directory] could not hide after a removal request:', hideError.message)
    else {
      hid = true
      refreshDirectory()
    }
  }

  const alerted = await sendOwnerAlert({
    fromName: 'FundOpsHQ Directory',
    subject: `[Directory] ${r.kind === 'removal' ? 'Removal' : 'Correction'} request: ${person.full_name} (${person.firm_name})`,
    text: [
      `${r.kind === 'removal' ? 'Removal' : 'Correction'} request for ${person.full_name} (${person.firm_name}).`,
      r.kind === 'removal' ? (hid ? 'The profile is HIDDEN now, pending your review.' : `The profile was not hidden (status ${person.status}).`) : '',
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
