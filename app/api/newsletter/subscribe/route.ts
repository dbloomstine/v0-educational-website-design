import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { renderWelcomeEmail } from '@/lib/newsletter/welcome-email'
import { insertSubscriber } from '@/lib/newsletter/insert-subscriber'
import { sanitizeSignupSource } from '@/lib/newsletter/signup-source'
import { makeTicket } from '@/lib/newsletter/ticket'
import { preferenceColumns, sanitizeInterests, sanitizeRole, sanitizeSignupForm } from '@/lib/newsletter/interests'

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

    // What the signup card asked alongside the address. Only ids on our own
    // lists survive; a form that sends none of this stores none of it.
    const preferences = {
      interests: sanitizeInterests(body.interests),
      role: sanitizeRole(body.role),
      form: sanitizeSignupForm(body.form),
    }

    const supabase = getSupabaseAdmin()

    // Check if subscriber already exists
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, status, unsubscribe_token, interests, reader_role')
      .eq('email', trimmed)
      .single()

    // A live subscription is left exactly as it is: anyone can type an address
    // here, so this route never changes a subscriber's choices. They change
    // them from the link in their own email (/preferences).
    if (existing?.status === 'confirmed') {
      // ...with one exception. A reader who has never said what they follow is still asked: they get a
      // short-lived ticket that can only fill in choices that are not there (lib/newsletter/ticket.ts).
      const never = !existing.interests?.length && !existing.reader_role
      return NextResponse.json({
        success: true,
        message: 'Already subscribed',
        hasPreferences: !never,
        ...(never ? { preferencesTicket: makeTicket(existing.id) ?? undefined } : {}),
      })
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
          // Coming back through the card, their choices come with them. The
          // form name stays as first recorded.
          ...preferenceColumns({ interests: preferences.interests, role: preferences.role }),
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Failed to update subscriber:', error.code, error.message)
        return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
      }
      unsubscribeToken = existing.unsubscribe_token
    } else {
      // New subscriber — single opt-in, confirmed immediately
      // First signup only: this is where the source is written. A returning
      // address (above) keeps the values it already has.
      const { data: inserted, error } = await insertSubscriber(
        supabase,
        trimmed,
        nowIso,
        sanitizeSignupSource(body.attribution),
        preferences,
      )

      if (error) {
        // Code and message only: an error's details can quote the address.
        console.error('Failed to insert subscriber:', error.code, error.message)
        return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
      }
      unsubscribeToken = inserted.unsubscribe_token
    }

    // Fire-and-forget welcome email
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      const from = process.env.RESEND_FROM_EMAIL || 'feedback@fundopshq.com'
      const unsubscribeUrl = `https://fundopshq.com/api/newsletter/unsubscribe?token=${unsubscribeToken}`
      const preferencesUrl = `https://fundopshq.com/preferences?token=${unsubscribeToken}`
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `FundOps Daily <${from}>`,
          to: trimmed,
          // Replies land directly in Danny's personal gmail.
          reply_to: 'dbloomstine@gmail.com',
          subject: 'Welcome to FundOps Daily — a note from Danny',
          html: renderWelcomeEmail(unsubscribeUrl, { preferencesUrl, interests: preferences.interests }),
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }),
      }).catch((err) => console.error('Failed to send welcome email:', err))
    }

    // The card asks what the reader follows straight after they sign up, and
    // saves it with this token (POST /api/newsletter/preferences). It is given
    // only for a subscription this request has just started: never for an
    // address that was already on the list (the early return above), so
    // typing someone's address here cannot be used to change their choices.
    return NextResponse.json({ success: true, preferencesToken: unsubscribeToken })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
