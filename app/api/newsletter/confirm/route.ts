import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

/**
 * Legacy double-opt-in confirmation endpoint.
 *
 * FundOps Daily switched to single opt-in on 2026-04-10. New signups
 * are confirmed immediately by /api/newsletter/subscribe. This route
 * is kept alive so old confirmation emails already in inboxes still
 * land on a working page instead of a 404.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect('https://fundopshq.com/')
  }

  const supabase = getSupabaseAdmin()

  const { data: subscriber } = await supabase
    .from('newsletter_subscribers')
    .select('id, status')
    .eq('confirmation_token', token)
    .single()

  // Unknown token — just send them home.
  if (!subscriber) {
    return NextResponse.redirect('https://fundopshq.com/')
  }

  // Already confirmed (the common case now) — send them to the feed.
  if (subscriber.status === 'confirmed') {
    return NextResponse.redirect('https://fundopshq.com/#news')
  }

  // Legacy path: a stale pending row from before the flip. Confirm it.
  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriber.id)

  if (error) {
    console.error('Failed to confirm subscriber:', error)
    return NextResponse.redirect('https://fundopshq.com/')
  }

  return NextResponse.redirect('https://fundopshq.com/#news')
}
