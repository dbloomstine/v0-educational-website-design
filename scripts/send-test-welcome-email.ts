#!/usr/bin/env npx tsx
/**
 * Send a one-off test of the welcome email (sent on single opt-in
 * signup) to a specific recipient. Used to validate the design in a
 * real Gmail/Apple Mail inbox before going live.
 *
 * Usage:
 *   TO=dbloomstine@gmail.com npx tsx --env-file=.env.local scripts/send-test-welcome-email.ts
 */

import { renderWelcomeEmail } from '../lib/newsletter/welcome-email'

async function main() {
  const to = process.env.TO
  if (!to) {
    console.error(
      'TO env var required. Usage:\n  TO=you@example.com npx tsx --env-file=.env.local scripts/send-test-welcome-email.ts',
    )
    process.exit(1)
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.error('Missing RESEND_API_KEY in .env.local')
    process.exit(1)
  }

  // Use a real-looking unsubscribe URL for the preview; it won't
  // actually resolve to a subscriber since this is a test send.
  const unsubscribeUrl = 'https://fundopshq.com/api/newsletter/unsubscribe?token=TEST'
  const html = renderWelcomeEmail(unsubscribeUrl)

  const from = process.env.RESEND_FROM_EMAIL || 'feedback@fundopshq.com'
  const subject = '[TEST] Welcome to FundOps Daily — a note from Danny'

  console.log(`Sending welcome-email test to ${to}…`)
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
