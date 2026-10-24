import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { sendOwnerAlert } from '@/lib/alerts/owner-alert'
import { SESSION_COOKIE, SITE, verifySession } from '@/lib/directory/claim'
import { profilePath } from '@/lib/directory/people'
import { personById, refreshDirectory } from '@/lib/directory/server'
import { directoryEnabled } from '@/lib/directory/taxonomy'

export const dynamic = 'force-dynamic'

/**
 * POST { hidden: true|false }: "Hide my profile", one click, at once (the
 * cached pages are cleared). Showing it again works only for a profile the
 * person hid themselves: one hidden by a removal request or by the desk stays
 * hidden until the desk decides.
 */
export async function POST(req: Request) {
  if (!directoryEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const personId = verifySession((await cookies()).get(SESSION_COOKIE)?.value)
  if (!personId) return NextResponse.json({ error: 'Your edit session has expired. Claim the profile again from its page.' }, { status: 401 })
  const hidden = ((await req.json().catch(() => ({}))) as { hidden?: unknown }).hidden
  if (typeof hidden !== 'boolean') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const person = await personById(personId)
  if (!person || person.status === 'removed' || person.status === 'review') return NextResponse.json({ error: 'We could not find that profile.' }, { status: 404 })
  const db = getSupabaseAdmin()
  if (hidden) {
    if (person.status !== 'hidden') {
      const { error } = await db.from('directory_people').update({ status: 'hidden', hidden_by: 'owner' }).eq('id', person.id)
      if (error) return NextResponse.json({ error: 'Something went wrong on our side. Please try again.' }, { status: 500 })
    }
  } else {
    if (person.status === 'hidden' && person.hidden_by !== 'owner') {
      return NextResponse.json({ error: 'This profile is hidden while we review a request about it. Write to danny@fundopshq.com.' }, { status: 409 })
    }
    const { error } = await db.from('directory_people').update({ status: 'published', hidden_by: null }).eq('id', person.id).eq('status', 'hidden')
    if (error) return NextResponse.json({ error: 'Something went wrong on our side. Please try again.' }, { status: 500 })
  }
  refreshDirectory()
  await sendOwnerAlert({
    fromName: 'FundOpsHQ Directory',
    subject: `[Directory] ${hidden ? 'Hidden' : 'Shown again'} by its owner: ${person.full_name} (${person.firm_name})`,
    text: `${person.full_name} (${person.firm_name}) ${hidden ? 'hid' : 'showed again'} their profile.\n${SITE}${profilePath(person)}`,
  })
  return NextResponse.json({ success: true, hidden })
}
