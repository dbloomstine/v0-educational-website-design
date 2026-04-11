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
      return `<span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#F8F5EC;border:1px solid #D8D0BC;color:#1E3A5F;font-size:11px;font-weight:700;line-height:20px;text-align:center;vertical-align:middle;font-family:Georgia,'Times New Roman',Times,serif;">${altChar}</span>`
    },
  )
}

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
  return {
    label: 'PRESENTED BY',
    sponsors: [
      // Override FUNDOPSHQ_SPONSOR's hosted logoUrl with a data URI
      // so the local preview renders the wordmark without requiring
      // a deploy.
      {
        ...FUNDOPSHQ_SPONSOR,
        logoUrl: publicFileAsDataUri('sponsors/fundopshq-wordmark.png'),
      },
      {
        name: 'Fidelity Careers',
        logoUrl: publicFileAsDataUri('sponsors/fidelity-careers.png'),
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

  let html = renderNewsletterEmail({
    groups: content.groups,
    totalArticles: content.totalArticles,
    editionDate,
    unsubscribeUrl: 'https://fundopshq.com/api/newsletter/unsubscribe?token=PREVIEW',
    sponsorSlate: useSampleSlate ? buildSampleSlate() : undefined,
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
