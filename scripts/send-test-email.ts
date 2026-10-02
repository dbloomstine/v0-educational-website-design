#!/usr/bin/env npx tsx
/**
 * Send a one-off test email of the FundOps Daily preview to a
 * specific recipient so the design can be validated inside a real
 * email client (Gmail, Apple Mail, Outlook) before pitching to a
 * sponsor. By default it renders what the next send would: the sponsor
 * booked for today (lib/sponsor/bookings.ts), or the house "Your firm
 * here" notice when nobody is. Set MOCK_SPONSORS=1 for the one-sponsor
 * placeholder a prospect sees at /newsletter/sample.
 *
 * Usage:
 *   TO=dbloomstine@gmail.com npx tsx --env-file=.env.local scripts/send-test-email.ts
 *   MOCK_SPONSORS=1 TO=… npx tsx … scripts/send-test-email.ts
 */

import { createClient } from '@supabase/supabase-js'
import { queryNewsletterArticles } from '../lib/newsletter/query-articles'
import { renderNewsletterEmail } from '../lib/newsletter/email-template'
import { queryEventFeed } from '../lib/events/api'
import { SAMPLE_SPONSOR_SLATE } from '../lib/newsletter/sponsors'
import { slateFor, sponsorForEdition } from '../lib/sponsor/bookings'
import { readerFirmDomains } from '../lib/sponsor/reader-firms'
import { lastWeeksCloses } from '../lib/newsletter/recap'

// The events section is bounded by the DATE WINDOW, not by a count. A cap of
// 24 silently truncated it to ~8 days once the board grew past ~24 events in
// a fortnight, while the section header still promised "the next two weeks"
// (found 2026-09-04: 67 events in the window, 24 rendered). This ceiling
// exists only so a pathological day can't produce an unbounded email.
const EVENTS_LIMIT = 150


async function main() {
  const to = process.env.TO
  if (!to) {
    console.error(
      'TO env var required. Usage:\n  TO=you@example.com npx tsx --env-file=.env.local scripts/send-test-email.ts',
    )
    process.exit(1)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const resendKey = process.env.RESEND_API_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }
  if (!resendKey) {
    console.error('Missing RESEND_API_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  console.log('Querying articles…')
  const content = await queryNewsletterArticles(supabase, 72, { excludePriorEdition: false })
  console.log(`  ${content.totalArticles} articles across ${content.groups.length} groups`)

  // The live list, so the test shows the same reader figures the send will.
  const { data: subscribers } = await supabase.from('newsletter_subscribers').select('email').eq('status', 'confirmed').limit(10000)

  const editionDate = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/New_York',
  })

  // One sponsor at a time: the placeholder, or whoever is booked for today, or
  // nobody (the house notice).
  const sponsorSlate =
    process.env.MOCK_SPONSORS === '1' ? SAMPLE_SPONSOR_SLATE : slateFor(await sponsorForEdition(supabase, editionDate))

  // One week ahead, as the send does.
  const upcomingEvents = (await queryEventFeed({ when: '1w', limit: EVENTS_LIMIT })).events
  const monday = new Date(`${editionDate}T12:00:00-05:00`).getUTCDay() === 1

  const html = renderNewsletterEmail({
    groups: content.groups,
    totalArticles: content.totalArticles,
    editionDate,
    unsubscribeUrl: 'https://fundopshq.com/api/newsletter/unsubscribe?token=TEST',
    sponsorSlate,
    subscriberCount: subscribers?.length || undefined,
    readerFirms: subscribers ? readerFirmDomains(subscribers.map((s) => String(s.email))).size : undefined,
    recap: monday ? await lastWeeksCloses() : null,
    events: upcomingEvents,
  })

  const from = process.env.RESEND_FROM_EMAIL || 'feedback@fundopshq.com'
  const subject = `[TEST] FundOps Daily — ${editionDate} preview`

  console.log(`Sending test email to ${to}…`)
  console.log(`  Size: ${Math.round(html.length / 1024)} KB`)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `FundOps Daily <${from}>`,
      to,
      reply_to: 'dbloomstine@gmail.com',
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`Resend error ${res.status}: ${body}`)
    process.exit(1)
  }

  const data = (await res.json()) as { id?: string }
  console.log(`\nSent. Message ID: ${data.id ?? '(none)'}`)
  console.log(`Check ${to} — delivery is usually within 10–20 seconds.`)
}

main().catch((err) => {
  console.error('Send failed:', err)
  process.exit(1)
})
