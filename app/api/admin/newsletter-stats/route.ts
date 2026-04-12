import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * GET /api/admin/newsletter-stats?password=...&edition_date=YYYY-MM-DD
 *
 * Fetches per-email delivery status from Resend for a given edition.
 * If edition_date is omitted, returns stats for the most recent edition.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const password = url.searchParams.get('password')

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const editionDate = url.searchParams.get('edition_date')

  // Fetch edition(s)
  let query = supabase
    .from('newsletter_editions')
    .select('edition_date, subject, recipient_count, article_count, status, sent_at, resend_email_ids')
    .eq('status', 'sent')
    .order('edition_date', { ascending: false })

  if (editionDate) {
    query = query.eq('edition_date', editionDate)
  }

  const { data: editions, error: edError } = await query.limit(10)

  if (edError) {
    return NextResponse.json({ error: edError.message }, { status: 500 })
  }

  if (!editions || editions.length === 0) {
    return NextResponse.json({ error: 'No sent editions found' }, { status: 404 })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  // For each edition, fetch per-email status from Resend
  const results = await Promise.all(
    editions.map(async (edition) => {
      const emailIds = edition.resend_email_ids as Record<string, string> | null
      if (!emailIds || Object.keys(emailIds).length === 0) {
        return {
          edition_date: edition.edition_date,
          subject: edition.subject,
          recipient_count: edition.recipient_count,
          article_count: edition.article_count,
          sent_at: edition.sent_at,
          tracking_available: false,
          recipients: [],
        }
      }

      // Fetch each email's status from Resend (parallel, capped at 10 concurrent)
      const entries = Object.entries(emailIds)
      const recipients: Array<{
        email: string
        resend_id: string
        last_event: string | null
        error: string | null
      }> = []

      // Process in chunks of 10 to avoid rate limits
      for (let i = 0; i < entries.length; i += 10) {
        const chunk = entries.slice(i, i + 10)
        const chunkResults = await Promise.all(
          chunk.map(async ([email, resendId]) => {
            try {
              const res = await fetch(`https://api.resend.com/emails/${resendId}`, {
                headers: { Authorization: `Bearer ${resendApiKey}` },
              })
              if (!res.ok) {
                return { email, resend_id: resendId, last_event: null, error: `HTTP ${res.status}` }
              }
              const data = (await res.json()) as { last_event?: string }
              return { email, resend_id: resendId, last_event: data.last_event ?? null, error: null }
            } catch (err) {
              return {
                email,
                resend_id: resendId,
                last_event: null,
                error: err instanceof Error ? err.message : 'fetch error',
              }
            }
          })
        )
        recipients.push(...chunkResults)
      }

      // Compute summary
      const delivered = recipients.filter((r) => r.last_event === 'delivered').length
      const opened = recipients.filter((r) => r.last_event === 'opened').length
      const clicked = recipients.filter((r) => r.last_event === 'clicked').length
      const bounced = recipients.filter((r) => r.last_event === 'bounced').length
      const complained = recipients.filter((r) => r.last_event === 'complained').length
      const total = recipients.length

      return {
        edition_date: edition.edition_date,
        subject: edition.subject,
        recipient_count: edition.recipient_count,
        article_count: edition.article_count,
        sent_at: edition.sent_at,
        tracking_available: true,
        summary: {
          total,
          delivered,
          opened,
          clicked,
          bounced,
          complained,
          open_rate: total > 0 ? Math.round(((opened + clicked) / total) * 100) : 0,
          click_rate: total > 0 ? Math.round((clicked / total) * 100) : 0,
        },
        recipients,
      }
    })
  )

  return NextResponse.json({ editions: results })
}
