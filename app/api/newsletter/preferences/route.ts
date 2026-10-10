import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { sanitizeInterests, sanitizeRole } from '@/lib/newsletter/interests'
import { readTicket } from '@/lib/newsletter/ticket'

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

  // Two keys open this route. The token from the reader's own email does everything. A ticket
  // (lib/newsletter/ticket.ts) is what a subscribe form hands a reader who is already on the list and has
  // never said what they follow: it can fill in choices that are not there, and nothing else.
  const ticketFor = body.ticket ? readTicket(body.ticket) : null
  if (body.ticket && !ticketFor) return NextResponse.json({ error: 'That took too long. Use the link at the foot of any edition to choose what you follow.' }, { status: 400 })
  const token = typeof body.token === 'string' ? body.token : ''
  if (!ticketFor && !UUID.test(token)) {
    return NextResponse.json({ error: 'This link is not valid. Open it from your latest FundOps Daily.' }, { status: 400 })
  }

  const interests = sanitizeInterests(body.interests)
  const role = sanitizeRole(body.role)

  // A reader who has unsubscribed and follows the link in an old email can come back from the same page:
  // the token is theirs, so the yes is theirs to give.
  const comeBack = body.resubscribe === true && !ticketFor
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
  if (ticketFor) {
    const { data: onFile, error: readError } = await supabase.from('newsletter_subscribers').select('interests, reader_role, status, updated_at').eq('id', ticketFor.id).maybeSingle()
    if (readError || !onFile || onFile.status !== 'confirmed') return NextResponse.json({ error: 'We could not find a live subscription.' }, { status: 404 })
    // A ticket fills in choices that are not there. It may save again as boxes are ticked (choices written since it
    // was issued are its own), but it never changes choices that were on file before it was made.
    const has = Boolean(onFile.interests?.length || onFile.reader_role)
    const sinceIssued = onFile.updated_at && new Date(onFile.updated_at).getTime() >= ticketFor.issuedAt - 1000
    if (has && !sinceIssued) {
      return NextResponse.json({ error: 'Your choices are already on file. Change them from the link at the foot of any edition.' }, { status: 409 })
    }
    query = query.eq('id', ticketFor.id).eq('status', 'confirmed')
  } else {
    query = query.eq('unsubscribe_token', token)
    if (!comeBack) query = query.eq('status', 'confirmed')
  }
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
