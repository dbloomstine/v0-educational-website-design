import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

const VALID_CATEGORIES = ['missing_source', 'feature_request', 'bug_report', 'general'] as const

const CATEGORY_LABELS: Record<string, string> = {
  missing_source: 'Missing Source',
  feature_request: 'Feature Request',
  bug_report: 'Bug Report',
  general: 'General Feedback',
}

async function sendNotification(category: string, message: string, email: string | null, page: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const from = process.env.RESEND_FROM_EMAIL || 'feedback@fundopshq.com'
  const label = CATEGORY_LABELS[category] || category

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `FundOpsHQ Feedback <${from}>`,
      to: 'danny.bloomstine@iqeq.com',
      subject: `[${label}] New feedback on ${page}`,
      text: [
        `Category: ${label}`,
        `Page: ${page}`,
        email ? `From: ${email}` : 'From: anonymous',
        '',
        message,
      ].join('\n'),
    }),
  }).catch((err) => console.error('Failed to send feedback notification:', err))
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { category, message, email, page } = body

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }
    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return NextResponse.json({ error: 'Message must be at least 5 characters' }, { status: 400 })
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }
    if (email && typeof email === 'string' && email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
      }
    }

    const supabase = getSupabaseAdmin()
    const trimmedMessage = message.trim()
    const trimmedEmail = email?.trim() || null
    const feedbackPage = page || '/'

    const { error } = await supabase.from('feedback').insert({
      category,
      message: trimmedMessage,
      email: trimmedEmail,
      page: feedbackPage,
    })

    if (error) {
      console.error('Failed to insert feedback:', error)
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
    }

    // Await so Vercel doesn't kill the function before the email sends
    await sendNotification(category, trimmedMessage, trimmedEmail, feedbackPage)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
