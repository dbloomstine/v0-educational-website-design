#!/usr/bin/env npx tsx
/**
 * Send a test forward-mode cold-outreach email to dbloomstine@gmail.com
 * so the v5 template + newsletter-fetch + section-pointer + one-click
 * deep-link rendering can be validated in a real inbox without sending
 * to a real prospect.
 *
 * Exercises the REAL pipeline code path:
 *   1. fetchTodaysNewsletter() — pulls today's FundOps Daily from Gmail,
 *      cleans out unsubscribe/tracking junk.
 *   2. composeForwardEmail() — v5 story-specific hook, section pointer,
 *      one-line "Danny" signature, ?e= subscribe deep-link.
 *   3. sendGmail() — multipart/alternative with both text + HTML.
 *
 * Picks a real article from today's newsletter edition so the hook is
 * accurate. Prefers fund_close / capital_raise stories because they
 * produce the highest-signal v5 hooks.
 *
 * Usage:
 *   TO=dbloomstine@gmail.com npx tsx --env-file=.env.local scripts/send-test-outreach.ts
 *   TO=... FIRM="Adams Street Partners" npx tsx ... (force a specific firm)
 */

import { createClient } from '@supabase/supabase-js'
import { fetchTodaysNewsletter } from '../lib/outreach/newsletter-fetch'
import { composeForwardEmail } from '../lib/outreach/template'
import { sendGmail } from '../lib/outreach/gmail-client'
import type { Article } from '../lib/outreach/types'

async function main() {
  const to = process.env.TO ?? 'dbloomstine@gmail.com'
  const firmOverride = process.env.FIRM

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.error('NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required')
    process.exit(1)
  }
  const supabase = createClient(supabaseUrl, supabaseKey)

  // ─── 1. Pull today's edition from Supabase ──────────────────────────
  // Use NY time to match the production route's todayNewYork() helper.
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const { data: edition, error: edErr } = await supabase
    .from('newsletter_editions')
    .select('edition_date, status, article_ids')
    .eq('edition_date', today)
    .single()

  if (edErr || !edition) {
    console.error(`No newsletter edition for ${today}:`, edErr?.message)
    process.exit(1)
  }
  if (edition.status !== 'sent') {
    console.error(`Edition ${today} status=${edition.status} (expected "sent"). Has today's newsletter actually been sent yet?`)
    process.exit(1)
  }

  console.log(`Edition ${today} has ${edition.article_ids.length} articles.`)

  // ─── 2. Pick a strong article for the test hook ─────────────────────
  // firm_name + firm_domain live inside extracted_data JSONB, same as
  // the production route (see toArticle() in outreach-send/route.ts).
  const { data: articles, error: artErr } = await supabase
    .from('news_items')
    .select('id, title, tldr, article_type, event_type, fund_categories, extracted_data, source_name')
    .in('id', edition.article_ids)

  if (artErr || !articles?.length) {
    console.error('Failed to pull articles:', artErr?.message)
    process.exit(1)
  }

  const withFirm = articles.filter((a) => a.extracted_data?.firm_name)
  if (!withFirm.length) {
    console.error('No article with extracted_data.firm_name found in today\'s edition.')
    process.exit(1)
  }

  const preferredEventTypes = ['fund_close', 'capital_raise', 'fund_launch']
  const picked = firmOverride
    ? withFirm.find((a) =>
        (a.extracted_data.firm_name as string).toLowerCase().includes(firmOverride.toLowerCase()),
      )
    : withFirm
        .filter((a) => preferredEventTypes.includes(a.event_type ?? ''))
        .sort((a, b) => {
          const sizeA = Number(a.extracted_data?.fund_size_usd_millions ?? 0)
          const sizeB = Number(b.extracted_data?.fund_size_usd_millions ?? 0)
          return sizeB - sizeA
        })[0] ?? withFirm[0]

  if (!picked) {
    console.error(firmOverride ? `No article for firm matching "${firmOverride}"` : 'Failed to pick article.')
    process.exit(1)
  }

  const ed = picked.extracted_data ?? {}
  console.log(`Using article: "${picked.title}" (firm=${ed.firm_name}, event=${picked.event_type})`)

  // ─── 3. Normalize to Article shape used by composeForwardEmail ──────
  const article: Article = {
    articleId: picked.id,
    title: picked.title,
    tldr: picked.tldr,
    articleType: picked.article_type,
    eventType: picked.event_type,
    fundCategories: picked.fund_categories,
    firmName: ed.firm_name ?? null,
    firmDomain: ed.firm_domain ?? null,
    fundName: ed.fund_name ?? null,
    fundNumber: ed.fund_number ?? null,
    fundSizeUsdMillions:
      ed.fund_size_usd_millions != null ? Number(ed.fund_size_usd_millions) : null,
    fundStrategy: ed.fund_strategy ?? null,
    closeType: ed.close_type ?? null,
    personName: ed.person_name ?? null,
    personTitle: ed.person_title ?? null,
    geography: ed.geography ?? null,
    sourceName: picked.source_name ?? null,
  }

  // ─── 4. Fetch today's newsletter HTML from Danny's Gmail inbox ──────
  console.log('Fetching today\'s newsletter from Gmail inbox...')
  const newsletter = await fetchTodaysNewsletter()
  console.log(`Newsletter: "${newsletter.subject}" (${newsletter.cleanedHtmlLength} chars cleaned)`)

  // ─── 5. Compose + send via the REAL template ────────────────────────
  const composed = composeForwardEmail({
    firstName: 'Danny',
    firmName: article.firmName!,
    article,
    newsletter,
    recipientEmail: to,
  })

  console.log(`Subject: ${composed.subject}`)
  console.log(`Text length: ${composed.body.length}`)
  console.log(`HTML length: ${composed.html?.length ?? 0}`)

  const { messageId } = await sendGmail({
    to,
    subject: composed.subject,
    body: composed.body,
    html: composed.html,
  })

  console.log(`✓ Sent to ${to} — Gmail message ID: ${messageId}`)
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
