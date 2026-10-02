import { createClient } from '@supabase/supabase-js'
import { queryNewsletterArticles } from '@/lib/newsletter/query-articles'
import { renderNewsletterEmail } from '@/lib/newsletter/email-template'
import { SAMPLE_SPONSOR_SLATE } from '@/lib/newsletter/sponsors'
import { queryEventFeed } from '@/lib/events/api'
import type { IndustryEvent } from '@/lib/events/types'
import { readerFirmDomains } from '@/lib/sponsor/reader-firms'
import { lastWeeksCloses } from '@/lib/newsletter/recap'

/**
 * Public sample of the most-recent FundOps Daily edition.
 *
 * Linked from the /sponsor page so prospects can see exactly what the
 * newsletter looks like with a sponsor in it. Renders the production
 * email template with real data from the latest 72h of articles — so it
 * stays fresh without any manual regeneration — and one placeholder
 * sponsor, top and bottom.
 *
 * The unsubscribe token is a dead placeholder — this is a preview,
 * not a real delivery, so there's no subscriber to unsubscribe.
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return new Response('Sample newsletter unavailable — missing Supabase config.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const supabase = createClient(url, key)

  try {
    const content = await queryNewsletterArticles(supabase, 72, {
      excludePriorEdition: false,
    })

    if (content.totalArticles === 0) {
      return new Response(
        'Sample newsletter unavailable — no articles in the last 72 hours.',
        {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        },
      )
    }

    const editionDate = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/New_York',
    })

    // The live list, for the "read by" line in the masthead — the sample
    // matches what real recipients see today.
    const { data: subs } = await supabase.from('newsletter_subscribers').select('email').eq('status', 'confirmed').limit(10000)

    // The same extras a real edition carries, so the sample is a whole one:
    // the week ahead, and on a Monday last week's largest closes.
    const events = await queryEventFeed({ when: '1w', limit: 150 })
      .then((feed) => feed.events)
      .catch<IndustryEvent[]>(() => [])
    const monday = new Date(`${editionDate}T12:00:00-05:00`).getUTCDay() === 1

    const email = renderNewsletterEmail({
      groups: content.groups,
      totalArticles: content.totalArticles,
      editionDate,
      unsubscribeUrl: 'https://fundopshq.com/sponsor',
      subscriberCount: subs?.length || undefined,
      readerFirms: subs ? readerFirmDomains(subs.map((s) => String(s.email))).size : undefined,
      events,
      recap: monday ? await lastWeeksCloses() : null,
      // One sponsor, top and bottom: exactly what a sponsor gets.
      sponsorSlate: SAMPLE_SPONSOR_SLATE,
    })

    // A bar above the email — outside it, so it is plainly not part of the
    // edition — saying what this page is and how to get back.
    const notice = `<div style="background:#E6B045;color:#13233A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;line-height:1.45;padding:10px 16px;text-align:center;">
      <b>A sample edition.</b> This is today&rsquo;s FundOps Daily with a sponsor in place: the dashed box, under the masthead and again at the foot, is where your firm would appear.
      &nbsp;<a href="https://fundopshq.com/sponsor" style="color:#13233A;font-weight:700;">Back to sponsorship &rarr;</a>
    </div>`
    const html = email.replace(/<body[^>]*>/, (open) => `${open}${notice}`)

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Short cache so a fresh edition surfaces within the hour.
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return new Response(`Sample newsletter error: ${message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
