import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { renderWelcomeEmail } from '@/lib/newsletter/welcome-email'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const trimmed = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Check if subscriber already exists
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, status, unsubscribe_token')
      .eq('email', trimmed)
      .single()

    if (existing?.status === 'confirmed') {
      return NextResponse.json({ success: true, message: 'Already subscribed' })
    }

    let unsubscribeToken: string

    const nowIso = new Date().toISOString()

    if (existing) {
      // Re-subscribe: flip straight to confirmed
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({
          status: 'confirmed',
          confirmed_at: nowIso,
          unsubscribed_at: null,
          updated_at: nowIso,
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Failed to update subscriber:', error)
        return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
      }
      unsubscribeToken = existing.unsubscribe_token
    } else {
      // New subscriber — single opt-in, confirmed immediately
      const { data: inserted, error } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: trimmed,
          status: 'confirmed',
          confirmed_at: nowIso,
        })
        .select('unsubscribe_token')
        .single()

      if (error) {
        console.error('Failed to insert subscriber:', error)
        return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
      }
      unsubscribeToken = inserted.unsubscribe_token
    }

    // Fire-and-forget welcome email
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      const from = process.env.RESEND_FROM_EMAIL || 'feedback@fundopshq.com'
      const unsubscribeUrl = `https://fundopshq.com/api/newsletter/unsubscribe?token=${unsubscribeToken}`
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `FundOps Daily <${from}>`,
          to: trimmed,
          // Replies land in Danny's personal gmail. fundopshq.com has
          // no MX records, so @fundopshq.com addresses can't receive
          // mail — reply_to is the zero-infrastructure workaround.
          reply_to: 'dbloomstine@gmail.com',
          subject: 'Welcome to FundOps Daily — a note from Danny',
          html: renderWelcomeEmail(unsubscribeUrl),
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }),
      }).catch((err) => console.error('Failed to send welcome email:', err))
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
