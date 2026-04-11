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

import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { queryNewsletterArticles } from '../lib/newsletter/query-articles'
import { renderNewsletterEmail } from '../lib/newsletter/email-template'
import { FUNDOPSHQ_SPONSOR, type SponsorSlate } from '../lib/newsletter/sponsors'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = join(__dirname, '..')

const OUTPUT_PATH = '/tmp/fundops-newsletter-preview.html'
const HOURS_BACK = 72

/**
 * Read a file from public/ and return a data URI. Used by the sample
 * slate so local previews render hosted logos without needing a deploy
 * first — and so the generated HTML can be forwarded to a prospect as
 * a self-contained mockup with no broken images.
 */
function publicFileAsDataUri(relativePath: string): string {
  const abs = join(PROJECT_ROOT, 'public', relativePath)
  const buf = readFileSync(abs)
  const ext = relativePath.split('.').pop()?.toLowerCase() ?? 'png'
  const mime =
    ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`
  return `data:${mime};base64,${buf.toString('base64')}`
}

/**
 * A sample co-sponsor slate used by the SAMPLE_SLATE=1 preview mode.
 * Currently demonstrates FundOpsHQ + a Fidelity Careers mockup card
 * so we can tweak the visual before pitching real sponsors.
 */
function buildSampleSlate(): SponsorSlate {
  return [
    FUNDOPSHQ_SPONSOR,
    {
      label: 'PRESENTED BY',
      name: 'Fidelity Careers',
      logoUrl: publicFileAsDataUri('sponsors/fidelity-careers.png'),
      logoWidth: 200,
      blurb:
        'Fidelity is hiring across fund operations, fund accounting, investor reporting, and technology. Join a team supporting trillions in assets and the teams running private markets at scale.',
      ctaUrl: 'https://jobs.fidelity.com',
      ctaText: 'See open roles',
    },
  ]
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
    console.log('  Using SAMPLE_SLATE — co-sponsor preview (FundOpsHQ + Fidelity Careers).')
  }

  const html = renderNewsletterEmail({
    groups: content.groups,
    totalArticles: content.totalArticles,
    editionDate,
    unsubscribeUrl: 'https://fundopshq.com/api/newsletter/unsubscribe?token=PREVIEW',
    sponsorSlate: useSampleSlate ? buildSampleSlate() : undefined,
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
