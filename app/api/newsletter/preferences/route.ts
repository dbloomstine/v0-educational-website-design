import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { sanitizeInterests, sanitizeRole } from '@/lib/newsletter/interests'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Saves what a subscriber follows. The caller proves who they are with the
 * token from their own email (the same one the unsubscribe link carries), so
 * nobody can change a reader's choices by knowing their address.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const token = typeof body.token === 'string' ? body.token : ''
  if (!UUID.test(token)) {
    return NextResponse.json({ error: 'This link is not valid. Open it from your latest FundOps Daily.' }, { status: 400 })
  }

  const interests = sanitizeInterests(body.interests)
  const role = sanitizeRole(body.role)

  // A reader who has unsubscribed and follows the link in an old email can come back from the same page:
  // the token is theirs, so the yes is theirs to give.
  const comeBack = body.resubscribe === true
  const now = new Date().toISOString()

  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('newsletter_subscribers')
    .update({
      // An empty list is stored as null: no choices, the edition as everyone gets it.
      interests: interests.length > 0 ? interests : null,
      reader_role: role ?? null,
      updated_at: now,
      ...(comeBack ? { status: 'confirmed', confirmed_at: now, unsubscribed_at: null } : {}),
    })
    .eq('unsubscribe_token', token)
  if (!comeBack) query = query.eq('status', 'confirmed')
  const { data, error } = await query.select('id')

  if (error) {
    console.error('Failed to save preferences:', error.code, error.message)
    return NextResponse.json({ error: 'Could not save. Please try again.' }, { status: 500 })
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'We could not find a live subscription for this link.' }, { status: 404 })
  }
  return NextResponse.json({ success: true, interests, role: role ?? null })
}
