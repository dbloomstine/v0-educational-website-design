import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { sendOwnerAlert } from '@/lib/alerts/owner-alert'
import { SESSION_COOKIE, editAlertText, validateEdits, verifySession } from '@/lib/directory/claim'
import { profilePath } from '@/lib/directory/people'
import { personById, readPhoto, storePhoto } from '@/lib/directory/server'
import { directoryEnabled } from '@/lib/directory/taxonomy'

export const dynamic = 'force-dynamic'

/**
 * POST the claimer's edits (headline, description, photo, contact link,
 * practice tags, notable matters). Needs the edit session from confirming a
 * claim. Stored as pending_edits: NOTHING shows until the desk approves it
 * (scripts/directory/review.ts approve-edits). The owner is emailed.
 */
export async function POST(req: Request) {
  if (!directoryEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const personId = verifySession((await cookies()).get(SESSION_COOKIE)?.value)
  if (!personId) return NextResponse.json({ error: 'Your edit session has expired. Claim the profile again from its page.' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const checked = validateEdits(body)
  if (!checked.ok) return NextResponse.json({ error: checked.error, field: checked.field }, { status: 400 })
  const edits = checked.value

  const person = await personById(personId)
  if (!person || person.status === 'removed') return NextResponse.json({ error: 'We could not find that profile.' }, { status: 404 })

  const photo = readPhoto(body.photo_data)
  if (photo && 'error' in photo) return NextResponse.json({ error: photo.error, field: 'photo' }, { status: 400 })
  if (photo) {
    const url = await storePhoto(person.id, photo)
    if (!url) return NextResponse.json({ error: 'We could not save the photo. Please try again.', field: 'photo' }, { status: 502 })
    edits.photo_url = url
  }

  const { error } = await getSupabaseAdmin()
    .from('directory_people')
    .update({ pending_edits: edits, pending_edits_at: new Date().toISOString() })
    .eq('id', person.id)
  if (error) {
    console.error('[directory] edits not saved:', error.message)
    return NextResponse.json({ error: 'Something went wrong on our side. Please try again.' }, { status: 500 })
  }
  await sendOwnerAlert({
    fromName: 'FundOpsHQ Directory',
    subject: `[Directory] Edits to review: ${person.full_name} (${person.firm_name})`,
    text: editAlertText(person, edits, profilePath(person)),
  })
  return NextResponse.json({ success: true })
}
