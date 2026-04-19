import { createClient } from '@supabase/supabase-js'
import { queryNewsletterArticles } from '@/lib/newsletter/query-articles'
import { renderNewsletterEmail } from '@/lib/newsletter/email-template'
import { SAMPLE_SPONSOR_SLATE } from '@/lib/newsletter/sponsors'

/**
 * Public sample of the most-recent FundOps Daily edition.
 *
 * Linked from the /sponsor page so prospects can see exactly what the
 * newsletter looks like before committing to a slot. Renders the
 * production email template with real data from the latest 72h of
 * articles so it stays fresh without any manual regeneration.
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

    // Subscriber count is the live confirmed-subscriber total. Used
    // in the social-proof eyebrow so the sample matches what real
    // recipients see today.
    const { count } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')

    const html = renderNewsletterEmail({
      groups: content.groups,
      totalArticles: content.totalArticles,
      editionDate,
      unsubscribeUrl: 'https://fundopshq.com/sponsor',
      subscriberCount: count ?? undefined,
      // Preview uses a shared slate (1 FundOpsHQ house card + 4
      // placeholder firms with dashed "YOUR LOGO HERE" boxes) so
      // prospects see up front that sponsorship is a shared slate,
      // not an exclusive-sponsor arrangement.
      sponsorSlate: SAMPLE_SPONSOR_SLATE,
    })

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
