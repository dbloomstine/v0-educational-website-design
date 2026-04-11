#!/usr/bin/env npx tsx
/**
 * Preview the FundOps Daily newsletter template with real data.
 *
 * Re-queries the last ~72h of articles from Supabase (bypassing the
 * prior-edition exclusion so today's content still renders), pipes them
 * through the production email template, writes the HTML to a temp file,
 * and opens it in your default browser.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/preview-newsletter.ts
 *
 * Re-run after every template tweak — the browser tab just needs Cmd+R.
 */

import { writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
import { queryNewsletterArticles } from '../lib/newsletter/query-articles'
import { renderNewsletterEmail } from '../lib/newsletter/email-template'
import type { SponsorSlate } from '../lib/newsletter/sponsors'

const OUTPUT_PATH = '/tmp/fundops-newsletter-preview.html'
const HOURS_BACK = 72

/**
 * A sample multi-brand slate for visually checking how the co-sponsor
 * logo strip renders. Opt in with `SAMPLE_SLATE=1` in the env. Uses
 * text wordmarks so no external assets are required.
 */
const SAMPLE_SPONSOR_SLATE: SponsorSlate = {
  label: 'SUPPORTED BY',
  marks: [
    {
      name: 'Juniper Square',
      ctaUrl: 'https://junipersquare.com',
      wordmarkHtml:
        '<span style="font-size:15px;font-weight:700;color:#1e293b;letter-spacing:-0.2px;line-height:1;">Juniper Square</span>',
    },
    {
      name: 'Petra Funds',
      ctaUrl: 'https://petrafundsgroup.com',
      wordmarkHtml:
        '<span style="font-size:15px;font-weight:700;color:#1e293b;letter-spacing:-0.2px;line-height:1;">Petra Funds</span>',
    },
    {
      name: 'DLA Piper',
      ctaUrl: 'https://dlapiper.com',
      wordmarkHtml:
        '<span style="font-size:15px;font-weight:700;color:#1e293b;letter-spacing:-0.2px;line-height:1;">DLA Piper</span>',
    },
    {
      name: 'SVB',
      ctaUrl: 'https://svb.com',
      wordmarkHtml:
        '<span style="font-size:15px;font-weight:700;color:#1e293b;letter-spacing:-0.2px;line-height:1;">SVB</span>',
    },
  ],
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
    console.error('Run with:  npx tsx --env-file=.env.local scripts/preview-newsletter.ts')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  console.log(`Querying newsletter articles (last ${HOURS_BACK}h)…`)
  const content = await queryNewsletterArticles(supabase, HOURS_BACK, {
    excludePriorEdition: false,
  })
  console.log(`  ${content.totalArticles} articles across ${content.groups.length} groups`)

  const editionDate = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/New_York',
  })

  const useSampleSlate = process.env.SAMPLE_SLATE === '1'
  if (useSampleSlate) {
    console.log('  Using SAMPLE_SLATE — 4-brand co-sponsor preview.')
  }

  const html = renderNewsletterEmail({
    groups: content.groups,
    totalArticles: content.totalArticles,
    editionDate,
    unsubscribeUrl: 'https://fundopshq.com/api/newsletter/unsubscribe?token=PREVIEW',
    sponsorSlate: useSampleSlate ? SAMPLE_SPONSOR_SLATE : undefined,
  })

  writeFileSync(OUTPUT_PATH, html, 'utf8')
  console.log(`Wrote ${OUTPUT_PATH}`)

  try {
    execSync(`open "${OUTPUT_PATH}"`)
    console.log('Opened in default browser. Refresh after each tweak.')
  } catch {
    console.log('Could not auto-open — paste this path in your browser:')
    console.log(`  file://${OUTPUT_PATH}`)
  }
}

main().catch((err) => {
  console.error('Preview failed:', err)
  process.exit(1)
})
