#!/usr/bin/env npx tsx
/**
 * Preview the FundOps Daily newsletter template with real data.
 *
 * Re-queries the last ~72h of articles from Supabase (bypassing the
 * prior-edition exclusion so today's content still renders), pipes them
 * through the production email template, writes the HTML to a temp file,
 * and opens it in your default browser.
 *
 * It renders what the next send would: the sponsor booked for today
 * (lib/sponsor/bookings.ts) or the house "Your firm here" notice, the reader
 * figures, the week's events, and on a Monday the weekly recap.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/preview-newsletter.ts
 *   SAMPLE_SLATE=1 npx tsx …   # with the one-sponsor placeholder a prospect sees
 *
 * Re-run after every template tweak — the browser tab just needs Cmd+R.
 */

import { writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
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


const OUTPUT_PATH = '/tmp/fundops-newsletter-preview.html'
const HOURS_BACK = 72

/**
 * Fetch every external favicon referenced in the rendered HTML and
 * inline each one as a base64 data URI. Runs only in the preview
 * script so the saved mockup file stays self-contained — no broken
 * images when the HTML is opened locally or forwarded as an
 * attachment — while still showing the real firm logos that the
 * production resolver surfaces.
 *
 * Any favicon that 404s, times out, or returns an empty body falls
 * back to a cream initial tile using the existing alt letter.
 */
async function inlineExternalFaviconsForOfflinePreview(html: string): Promise<string> {
  const FAVICON_URL_RE = /https:\/\/t1\.gstatic\.com\/faviconV2[^"]+/g
  // The URLs live inside HTML attributes, so ampersands are entity-encoded.
  // Decode before handing to fetch(); re-encode when substituting back in.
  const decode = (s: string) => s.replace(/&amp;/g, '&')

  const encodedUrls = Array.from(new Set(html.match(FAVICON_URL_RE) ?? []))
  if (encodedUrls.length === 0) return html

  console.log(`  Inlining ${encodedUrls.length} favicon(s)…`)

  const dataUris = new Map<string, string>() // keyed by encoded URL, matching the HTML
  const BATCH = 10
  for (let i = 0; i < encodedUrls.length; i += BATCH) {
    const batch = encodedUrls.slice(i, i + BATCH)
    const results = await Promise.all(
      batch.map(async (encoded): Promise<[string, string | null]> => {
        const fetchUrl = decode(encoded)
        try {
          const res = await fetch(fetchUrl, {
            signal: AbortSignal.timeout(8000),
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
              Accept: 'image/png,image/*,*/*;q=0.8',
              Referer: 'https://fundopshq.com/',
            },
          })
          if (!res.ok) return [encoded, null]
          const buf = Buffer.from(await res.arrayBuffer())
          if (buf.length === 0) return [encoded, null]
          const ct = res.headers.get('content-type') || 'image/png'
          return [encoded, `data:${ct};base64,${buf.toString('base64')}`]
        } catch {
          return [encoded, null]
        }
      }),
    )
    for (const [encoded, dataUri] of results) {
      if (dataUri) dataUris.set(encoded, dataUri)
    }
  }

  const fetched = dataUris.size
  const failed = encodedUrls.length - fetched
  console.log(
    `  Inlined ${fetched} favicon(s)${failed > 0 ? ` — ${failed} fell back to initials` : ''}.`,
  )

  return html.replace(
    /<img src="(https:\/\/t1\.gstatic\.com\/faviconV2[^"]+)" alt="([^"]+)"([^>]*)\/>/g,
    (_match, url: string, altChar: string, rest: string) => {
      const dataUri = dataUris.get(url)
      if (dataUri) {
        return `<img src="${dataUri}" alt="${altChar}"${rest}/>`
      }
      return `<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:#F8F5EC;border:1px solid #D8D0BC;color:#1E3A5F;font-size:10px;font-weight:700;line-height:16px;text-align:center;vertical-align:middle;margin-right:5px;font-family:Georgia,'Times New Roman',Times,serif;">${altChar}</span>`
    },
  )
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

  // One sponsor at a time. SAMPLE_SLATE=1 shows the placeholder a prospect
  // sees at /newsletter/sample; otherwise it is whoever is booked for today,
  // or nobody — the house notice — exactly as the send would render it.
  const useSampleSlate = process.env.SAMPLE_SLATE === '1'
  const booked = useSampleSlate ? null : await sponsorForEdition(supabase, editionDate)
  console.log(useSampleSlate ? '  Sponsor: the one-sponsor placeholder (SAMPLE_SLATE).' : `  Sponsor: ${booked ? booked.name : 'none booked — house notice'}.`)

  const upcomingEvents = (await queryEventFeed({ when: '1w', limit: EVENTS_LIMIT })).events
  const { data: subscribers } = await supabase.from('newsletter_subscribers').select('email').eq('status', 'confirmed').limit(10000)
  const monday = new Date(`${editionDate}T12:00:00-05:00`).getUTCDay() === 1

  let html = renderNewsletterEmail({
    groups: content.groups,
    totalArticles: content.totalArticles,
    editionDate,
    unsubscribeUrl: 'https://fundopshq.com/api/newsletter/unsubscribe?token=PREVIEW',
    sponsorSlate: useSampleSlate ? SAMPLE_SPONSOR_SLATE : slateFor(booked),
    subscriberCount: subscribers?.length || undefined,
    readerFirms: subscribers ? readerFirmDomains(subscribers.map((s) => String(s.email))).size : undefined,
    recap: monday ? await lastWeeksCloses() : null,
    events: upcomingEvents,
  })

  // Fetch every external favicon the template references and inline
  // each one as a base64 data URI so the saved mockup file is fully
  // self-contained — real firm logos, no broken-image icons when the
  // HTML is opened locally or forwarded as an attachment. The real
  // newsletter send keeps the live favicon URLs intact since Gmail
  // and Apple Mail proxy them through their own image caches.
  html = await inlineExternalFaviconsForOfflinePreview(html)

  writeFileSync(OUTPUT_PATH, html, 'utf8')
  console.log(`Wrote ${OUTPUT_PATH}`)

  if (process.env.NO_OPEN === '1') {
    console.log(`Skipped auto-open (NO_OPEN=1): file://${OUTPUT_PATH}`)
  } else {
    try {
      execSync(`open "${OUTPUT_PATH}"`)
      console.log('Opened in default browser. Refresh after each tweak.')
    } catch {
      console.log('Could not auto-open — paste this path in your browser:')
      console.log(`  file://${OUTPUT_PATH}`)
    }
  }
}

main().catch((err) => {
  console.error('Preview failed:', err)
  process.exit(1)
})
