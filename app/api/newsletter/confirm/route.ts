import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return new NextResponse('Missing confirmation token', { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: subscriber } = await supabase
    .from('newsletter_subscribers')
    .select('id, status')
    .eq('confirmation_token', token)
    .single()

  if (!subscriber) {
    return new NextResponse('Invalid or expired confirmation link', { status: 404 })
  }

  if (subscriber.status === 'confirmed') {
    return NextResponse.redirect('https://fundopshq.com/news?subscribed=already')
  }

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
    return new NextResponse('Something went wrong. Please try again.', { status: 500 })
  }

  return NextResponse.redirect('https://fundopshq.com/news?subscribed=1')
}
