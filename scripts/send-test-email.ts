#!/usr/bin/env npx tsx
/**
 * Send a one-off test email of the FundOps Daily preview to a
 * specific recipient so the design can be validated inside a real
 * email client (Gmail, Apple Mail, Outlook) before pitching to a
 * sponsor. Uses the SAMPLE_SLATE (FundOpsHQ + Fidelity Careers
 * mockup) by default so the recipient sees the co-sponsor layout
 * with real brand marks.
 *
 * Usage:
 *   TO=dbloomstine@gmail.com npx tsx --env-file=.env.local scripts/send-test-email.ts
 */

import { createClient } from '@supabase/supabase-js'
import { queryNewsletterArticles } from '../lib/newsletter/query-articles'
import { renderNewsletterEmail } from '../lib/newsletter/email-template'
import { FUNDOPSHQ_SPONSOR, type SponsorSlate } from '../lib/newsletter/sponsors'

// Hosted asset URLs. Gmail strips base64 data: URIs in <img src>, so
// test emails must reference the deployed copies on fundopshq.com.
// These PNGs are committed in public/sponsors/ and served by Vercel.
const FUNDOPSHQ_LOGO_URL = 'https://fundopshq.com/sponsors/fundopshq-wordmark.png'
const FIDELITY_LOGO_URL = 'https://fundopshq.com/sponsors/fidelity-careers.png'

function buildSampleSlate(): SponsorSlate {
  return {
    label: 'PRESENTED BY',
    sponsors: [
      {
        ...FUNDOPSHQ_SPONSOR,
        logoUrl: FUNDOPSHQ_LOGO_URL,
      },
      {
        name: 'Fidelity Careers',
        logoUrl: FIDELITY_LOGO_URL,
        logoWidth: 200,
        blurb:
          'Fidelity is hiring across fund operations, fund accounting, investor reporting, and technology. Join a team supporting trillions in assets and the teams running private markets at scale.',
        ctaUrl: 'https://jobs.fidelity.com',
        ctaText: 'See open roles',
      },
    ],
  }
}

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

  const editionDate = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/New_York',
  })

  const html = renderNewsletterEmail({
    groups: content.groups,
    totalArticles: content.totalArticles,
    editionDate,
    unsubscribeUrl: 'https://fundopshq.com/api/newsletter/unsubscribe?token=TEST',
    sponsorSlate: buildSampleSlate(),
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
