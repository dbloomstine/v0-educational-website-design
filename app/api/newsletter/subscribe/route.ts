import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { renderConfirmationEmail } from '@/lib/newsletter/confirmation-email'

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
      .select('id, status, confirmation_token')
      .eq('email', trimmed)
      .single()

    if (existing?.status === 'confirmed') {
      return NextResponse.json({ success: true, message: 'Already subscribed' })
    }

    let confirmationToken: string

    if (existing) {
      // Re-subscribe or resend confirmation
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({
          status: 'pending_confirmation',
          unsubscribed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Failed to update subscriber:', error)
        return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
      }
      confirmationToken = existing.confirmation_token
    } else {
      // New subscriber
      const { data: inserted, error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: trimmed })
        .select('confirmation_token')
        .single()

      if (error) {
        console.error('Failed to insert subscriber:', error)
        return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
      }
      confirmationToken = inserted.confirmation_token
    }

    // Send confirmation email
    const confirmUrl = `https://fundopshq.com/api/newsletter/confirm?token=${confirmationToken}`
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      const from = process.env.RESEND_FROM_EMAIL || 'feedback@fundopshq.com'
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `FundOps Daily <${from}>`,
          to: trimmed,
          subject: 'Confirm your FundOps Daily subscription',
          html: renderConfirmationEmail(confirmUrl),
        }),
      }).catch((err) => console.error('Failed to send confirmation email:', err))
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
