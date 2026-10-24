import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, readSession } from '@/lib/directory/claim'
import { subscribeOwner } from '@/lib/directory/newsletter'
import { ownerEmail } from '@/lib/directory/server'
import { directoryEnabled } from '@/lib/directory/taxonomy'

export const dynamic = 'force-dynamic'

/**
 * POST: "Send me FundOps Daily" on the edit page (plan B4). Only with an edit session, and only to the
 * address that session was confirmed from: nobody can sign up an address here by typing it.
 */
export async function POST() {
  if (!directoryEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const session = readSession((await cookies()).get(SESSION_COOKIE)?.value)
  if (!session) return NextResponse.json({ error: 'Your edit session has expired. Choose “Sign in to edit” on your profile for a fresh link.' }, { status: 401 })
  const email = await ownerEmail(session.personId, session.claimId)
  if (!email) return NextResponse.json({ error: 'We could not find your address.' }, { status: 404 })
  const result = await subscribeOwner(email, 'directory-edit', '/directory/edit')
  if (result === 'failed') return NextResponse.json({ error: 'Something went wrong on our side. Please try again.' }, { status: 502 })
  return NextResponse.json({ success: true, newsletter: result })
}
