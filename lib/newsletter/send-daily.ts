/**
 * Daily newsletter orchestrator.
 *
 * 1. Check idempotency (skip if today's edition already sent)
 * 2. Query last 26h of high-value articles
 * 3. Render HTML email
 * 4. Send via Resend to all confirmed subscribers
 * 5. Store edition record
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { queryNewsletterArticles } from './query-articles'
import { renderNewsletterEmail } from './email-template'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any>

export interface SendResult {
  ok: boolean
  skipped?: string
  editionDate?: string
  articleCount?: number
  recipientCount?: number
  error?: string
}

function todayDateET(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

export async function sendDailyNewsletter(
  supabase: DbClient,
  resendApiKey: string,
  hoursBack: number = 26
): Promise<SendResult> {
  const editionDate = todayDateET()

  // ─── 1. Idempotency check ─────────────────────────────────────────────────
  const { data: existing } = await supabase
    .from('newsletter_editions')
    .select('id, status')
    .eq('edition_date', editionDate)
    .single()

  if (existing?.status === 'sent') {
    return { ok: true, skipped: 'already_sent', editionDate }
  }

  // ─── 2. Query articles ────────────────────────────────────────────────────
  const content = await queryNewsletterArticles(supabase, hoursBack)

  // Floor of 1 — a literally-empty brief never ships, but quiet weekend
  // days with even a single story still send. Consistency is the main
  // driver of newsletter retention and a fully-empty send is the only
  // true failure mode the pipeline protects against.
  if (content.totalArticles < 1) {
    await supabase.from('newsletter_editions').upsert({
      edition_date: editionDate,
      subject: `FundOps Daily — ${editionDate}`,
      intro_text: '',
      html_body: '',
      article_count: content.totalArticles,
      recipient_count: 0,
      status: 'skipped',
      error_message: 'No qualifying articles found',
    }, { onConflict: 'edition_date' })

    return { ok: true, skipped: 'insufficient_articles', editionDate, articleCount: content.totalArticles }
  }

  // ─── 3. Get subscribers ───────────────────────────────────────────────────
  const { data: subscribers, error: subError } = await supabase
    .from('newsletter_subscribers')
    .select('email, unsubscribe_token')
    .eq('status', 'confirmed')

  if (subError) {
    throw new Error(`Failed to query subscribers: ${subError.message}`)
  }

  if (!subscribers || subscribers.length === 0) {
    await supabase.from('newsletter_editions').upsert({
      edition_date: editionDate,
      subject: `FundOps Daily — ${editionDate}`,
      intro_text: '',
      html_body: '',
      article_count: content.totalArticles,
      recipient_count: 0,
      status: 'skipped',
      error_message: 'No confirmed subscribers',
    }, { onConflict: 'edition_date' })

    return { ok: true, skipped: 'no_subscribers', editionDate }
  }

  // ─── 4. Render & send ─────────────────────────────────────────────────────
  const subject = buildSubject(content)
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'feedback@fundopshq.com'

  // Build individual emails with personalized unsubscribe links
  const emails = subscribers.map((sub) => {
    const unsubscribeUrl = `https://fundopshq.com/api/newsletter/unsubscribe?token=${sub.unsubscribe_token}`
    const html = renderNewsletterEmail({
      groups: content.groups,
      totalArticles: content.totalArticles,
      editionDate,
      unsubscribeUrl,
    })

    return {
      from: `FundOps Daily <${fromEmail}>`,
      to: sub.email,
      // Replies route to Danny's personal gmail. fundopshq.com has no
      // MX records (Vercel DNS is name-service only), so any address
      // at @fundopshq.com bounces inbound mail. Reply-To is the
      // zero-infrastructure fix: mail still originates from
      // feedback@fundopshq.com (Resend-authenticated), but hitting
      // reply in any mail client addresses the response to dbloomstine.
      reply_to: 'dbloomstine@gmail.com',
      subject,
      html,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      // Track opens and link clicks for engagement analysis
      tracking: {
        opens: true,
        clicks: true,
      },
    }
  })

  // Send via Resend batch API (up to 100 per call)
  let totalSent = 0
  let batchId = ''
  const errors: string[] = []

  for (let i = 0; i < emails.length; i += 100) {
    const batch = emails.slice(i, i + 100)
    try {
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      })

      if (!res.ok) {
        const body = await res.text()
        errors.push(`Resend batch error ${res.status}: ${body.slice(0, 200)}`)
      } else {
        const data = (await res.json()) as { data?: Array<{ id?: string }> }
        totalSent += batch.length
        // Resend batch API returns { data: [{ id }, ...] }
        if (Array.isArray(data?.data) && data.data[0]?.id) {
          batchId = data.data[0].id
        }
      }
    } catch (err) {
      errors.push(`Resend batch exception: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // ─── 5. Store edition record ──────────────────────────────────────────────
  const placeholderHtml = renderNewsletterEmail({
    groups: content.groups,
    totalArticles: content.totalArticles,
    editionDate,
    unsubscribeUrl: '#',
  })

  const status = totalSent > 0 ? 'sent' : 'failed'

  await supabase.from('newsletter_editions').upsert({
    edition_date: editionDate,
    subject,
    intro_text: '',
    html_body: placeholderHtml,
    article_count: content.totalArticles,
    recipient_count: totalSent,
    status,
    sent_at: totalSent > 0 ? new Date().toISOString() : null,
    resend_batch_id: batchId || null,
    error_message: errors.length > 0 ? errors.join('; ') : null,
    article_ids: content.articleIds,
  }, { onConflict: 'edition_date' })

  if (errors.length > 0 && totalSent === 0) {
    return { ok: false, error: errors.join('; '), editionDate }
  }

  return {
    ok: true,
    editionDate,
    articleCount: content.totalArticles,
    recipientCount: totalSent,
  }
}

/**
 * Pick the subject-line headline: biggest GP fund event of the day,
 * preferring closes over launches over raises. Excludes LP commitments
 * (which are allocation news, not "fund X landed Y") and exec moves
 * (where the extracted size is usually firm AUM, not a fund size).
 */
function buildSubject(content: {
  groups: {
    category: string
    label: string
    articles: {
      title: string
      firmName: string | null
      fundSizeUsdMillions: number | null
      eventType: string | null
    }[]
  }[]
  totalArticles: number
}): string {
  const typePriority: Record<string, number> = {
    fund_close: 3,
    fund_launch: 2,
    capital_raise: 1,
  }

  let bestArticle: {
    firmName: string | null
    fundSizeUsdMillions: number | null
  } | null = null
  let bestSize = 0
  let bestPriority = -1

  for (const group of content.groups) {
    if (group.category === 'lp_commitments') continue
    for (const article of group.articles) {
      if (!article.firmName) continue
      const prio = typePriority[article.eventType ?? ''] ?? -1
      if (prio < 0) continue
      const size = article.fundSizeUsdMillions ?? 0
      if (size <= 0) continue

      if (prio > bestPriority || (prio === bestPriority && size > bestSize)) {
        bestPriority = prio
        bestSize = size
        bestArticle = article
      }
    }
  }

  if (!bestArticle?.firmName) {
    return `FundOps Daily — ${content.totalArticles} stories`
  }

  let sizeHint = ''
  if (bestSize >= 1000) {
    sizeHint = ` $${(bestSize / 1000).toFixed(1).replace(/\.0$/, '')}B`
  } else if (bestSize > 0) {
    sizeHint = ` $${bestSize}M`
  }

  const remaining = content.totalArticles - 1
  return `FundOps Daily — ${bestArticle.firmName}${sizeHint} + ${remaining} more`
}
