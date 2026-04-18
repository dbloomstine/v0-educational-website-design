#!/usr/bin/env npx tsx
/**
 * One-shot verification script for the 2026-04-18 dedup fixes.
 *
 * Replays the newsletter-article query pipeline against the real
 * production article pool and reports what the edition WOULD look
 * like today, specifically:
 *
 *   - total included articles
 *   - per-category story counts
 *   - whether Partners Group collapsed to one row (should be 1, was 4)
 *   - the subject line that would be generated (should not contain
 *     any obvious AUM-leak size like $623B)
 *
 * Bypasses the prior-edition exclusion since today's edition is
 * already sent — we want to see what the same pool yields with the
 * patched helpers.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/dryrun-dedup.ts
 */

import { createClient } from '@supabase/supabase-js'
import { queryNewsletterArticles } from '../lib/newsletter/query-articles'

function requiredEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env var: ${name}`)
  return v
}

async function main() {
  const supabase = createClient(
    requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } }
  )

  console.log('\n=== DRY RUN: newsletter dedup verification ===\n')

  const content = await queryNewsletterArticles(supabase, 26, {
    excludePriorEdition: false,
  })

  console.log(`Total included articles: ${content.totalArticles}`)
  console.log(`Groups: ${content.groups.length}\n`)

  for (const g of content.groups) {
    console.log(`  [${g.category}] ${g.articles.length} story(ies)`)
    for (const a of g.articles) {
      const firm = a.firmName ?? '(no firm)'
      const size = a.fundSizeUsdMillions
        ? ` — $${a.fundSizeUsdMillions >= 1000 ? (a.fundSizeUsdMillions / 1000).toFixed(1) + 'B' : a.fundSizeUsdMillions + 'M'}`
        : ''
      console.log(`    · ${firm}${size} — ${a.title.slice(0, 70)}`)
    }
  }

  // Partners Group must collapse to ≤1 entry.
  const partnersRows = content.groups
    .flatMap((g) => g.articles)
    .filter((a) => (a.firmName ?? '').toLowerCase().includes('partners group'))

  console.log(`\nPartners Group row count: ${partnersRows.length} (expected ≤ 1)`)
  if (partnersRows.length > 1) {
    console.log('  ✗ DEDUP STILL FAILING for Partners Group')
    process.exitCode = 2
  } else {
    console.log('  ✓ Partners Group collapsed correctly')
  }

  // Sanity-check the subject-line candidate selection.
  const { buildSubject } = await import('../lib/newsletter/send-daily')
  const subject = buildSubject(content)
  console.log(`\nSubject line: "${subject}"`)
  const suspiciousSize = subject.match(/\$(\d+(?:\.\d+)?)B/)
  if (suspiciousSize) {
    const billions = parseFloat(suspiciousSize[1])
    if (billions > 30) {
      console.log(`  ✗ Suspicious subject-line size: $${billions}B — AUM leak?`)
      process.exitCode = 2
    } else {
      console.log(`  ✓ Subject-line size $${billions}B is within sane range`)
    }
  }

  console.log('')
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
