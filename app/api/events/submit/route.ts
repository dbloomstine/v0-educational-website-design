import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

// Public "Submit your event" intake. Rows land in event_submissions with
// status=pending — NOTHING goes straight to the board. The weekly
// scout-events run verifies dates at the source before promoting.

const FORMATS = ['in_person', 'virtual', 'hybrid']
const KINDS = ['conference', 'summit', 'forum', 'webinar', 'training', 'networking', 'awards', 'roundtable', 'other']
const COSTS = ['free', 'paid', 'member_only', 'invite_only', 'mixed']

function clean(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const t = value.trim()
  return t ? t.slice(0, max) : null
}

async function notifyDanny(name: string, eventUrl: string, submitterEmail: string | null) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return
  const from = process.env.RESEND_FROM_EMAIL || 'feedback@fundopshq.com'
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `FundOpsHQ Events <${from}>`,
      to: 'dbloomstine@gmail.com',
      subject: `[Event submission] ${name.slice(0, 80)}`,
      text: [
        `New event submitted to fundopshq.com/events/submit:`,
        '',
        `Event: ${name}`,
        `URL: ${eventUrl}`,
        submitterEmail ? `Submitter: ${submitterEmail}` : 'Submitter: anonymous',
        '',
        'It is in the pending queue — the weekly scout run will verify and publish, or review it sooner with: select * from event_submissions where status = \'pending\';',
      ].join('\n'),
    }),
  }).catch((err) => console.error('Failed to send submission notification:', err))
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Honeypot: real users never fill the hidden "website" field
    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      return NextResponse.json({ success: true })
    }

    const name = clean(body.name, 200)
    const eventUrl = clean(body.event_url, 500)
    if (!name || name.length < 5) {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 })
    }
    if (!eventUrl || !/^https?:\/\/[^\s]+\.[^\s]+/.test(eventUrl)) {
      return NextResponse.json({ error: 'A valid event URL is required' }, { status: 400 })
    }

    const startDate = clean(body.start_date, 10)
    if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return NextResponse.json({ error: 'Invalid start date' }, { status: 400 })
    }
    const endDate = clean(body.end_date, 10)
    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return NextResponse.json({ error: 'Invalid end date' }, { status: 400 })
    }

    const submitterEmail = clean(body.submitter_email, 200)
    if (submitterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const format = clean(body.event_format, 20)
    const kind = clean(body.event_kind, 20)
    const cost = clean(body.cost_type, 20)

    const supabase = getSupabaseAdmin()

    // Soft rate limit: cap pending submissions to keep the queue reviewable
    const { count } = await supabase
      .from('event_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
    if ((count ?? 0) >= 200) {
      return NextResponse.json({ error: 'Submission queue is full — please try again next week' }, { status: 429 })
    }

    const { error } = await supabase.from('event_submissions').insert({
      name,
      organizer_name: clean(body.organizer_name, 200),
      event_url: eventUrl,
      start_date: startDate,
      end_date: endDate,
      city: clean(body.city, 100),
      country: clean(body.country, 100),
      event_format: format && FORMATS.includes(format) ? format : null,
      event_kind: kind && KINDS.includes(kind) ? kind : null,
      cost_type: cost && COSTS.includes(cost) ? cost : null,
      description: clean(body.description, 1000),
      submitter_name: clean(body.submitter_name, 200),
      submitter_email: submitterEmail,
    })

    if (error) {
      console.error('Failed to insert event submission:', error)
      return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
    }

    await notifyDanny(name, eventUrl, submitterEmail)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
