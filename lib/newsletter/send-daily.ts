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
import { queryNewsletterArticles, isLikelyAumLeak } from './query-articles'
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
  let content = await queryNewsletterArticles(supabase, hoursBack)

  // Weekend rescue: 2026-04-12 and 2026-04-13 shipped with 1 and 2 articles
  // respectively because Saturday/Sunday feeds are quiet. Subscribers got a
  // thin brief and nearly-empty sections. When the Monday–Friday 26h window
  // is dry, expand to 48h on weekend days. Cross-edition fingerprinting in
  // query-articles already suppresses anything we ran in the prior 3
  // editions, so this cleanly backfills without re-showing Adams-Street-
  // style cross-day dupes.
  const dayOfWeek = new Date(`${editionDate}T12:00:00-05:00`).getUTCDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  if (isWeekend && content.totalArticles < 5 && hoursBack < 48) {
    content = await queryNewsletterArticles(supabase, 48)
  }

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

  // Render the full HTML body once with a sentinel token, then per-subscriber
  // string-replace the sentinel with the personalized unsubscribe URL. This
  // is load-bearing at scale: at 97 subs either approach is fine, but
  // renderNewsletterEmail allocates thousands of strings per call and the
  // body is otherwise byte-identical across recipients. Keeping the render
  // O(1) in subscriber count is a cheap win now and prevents the send cron
  // from running long as the list grows.
  const UNSUB_SENTINEL = '__FUNDOPS_UNSUB_URL_SENTINEL__'
  const templateHtml = renderNewsletterEmail({
    groups: content.groups,
    totalArticles: content.totalArticles,
    editionDate,
    unsubscribeUrl: UNSUB_SENTINEL,
    subscriberCount: subscribers.length,
  })

  const emails = subscribers.map((sub) => {
    const unsubscribeUrl = `https://fundopshq.com/api/newsletter/unsubscribe?token=${sub.unsubscribe_token}`
    const html = templateHtml.replaceAll(UNSUB_SENTINEL, unsubscribeUrl)

    return {
      from: `FundOps Daily <${fromEmail}>`,
      to: sub.email,
      // Replies route directly to Danny's personal gmail, skipping the
      // ImprovMX forward hop that otherwise catches @fundopshq.com mail.
      reply_to: 'dbloomstine@gmail.com',
      subject,
      html,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }
  })

  // Send via Resend batch API (up to 100 per call)
  let totalSent = 0
  let batchId = ''
  const errors: string[] = []
  // Map subscriber email → Resend email ID for per-email stat lookups
  const emailIdMap: Record<string, string> = {}

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
        // Resend batch API returns { data: [{ id }, ...] } in same order as input
        if (Array.isArray(data?.data)) {
          for (let j = 0; j < data.data.length; j++) {
            const resendId = data.data[j]?.id
            if (resendId) {
              emailIdMap[batch[j].to] = resendId
              if (!batchId) batchId = resendId
            }
          }
        }
      }
    } catch (err) {
      errors.push(`Resend batch exception: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // ─── 5. Store edition record ──────────────────────────────────────────────
  // Stored body is the rendered template with the unsub URL replaced by a
  // harmless anchor — same bytes as what recipients got, minus a per-user
  // token. Skips a redundant second render.
  const placeholderHtml = templateHtml.replaceAll(UNSUB_SENTINEL, '#')

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
    resend_email_ids: Object.keys(emailIdMap).length > 0 ? emailIdMap : null,
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
 *
 * No "FundOps Daily —" prefix — the From: name already carries the
 * brand, so leading the subject with the news gives the inbox preview
 * more signal. Format: "{Firm} {size} · + {N} more moves".
 */
export function buildSubject(content: {
  groups: {
    category: string
    label: string
    articles: {
      title: string
      firmName: string | null
      fundName?: string | null
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

  // AUM safety rail — see isLikelyAumLeak() in query-articles.ts. Drop
  // from subject candidates rather than risk another $623B-style headline.
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

      // Drop AUM leaks
      if (isLikelyAumLeak(size, article.fundName)) continue

      if (prio > bestPriority || (prio === bestPriority && size > bestSize)) {
        bestPriority = prio
        bestSize = size
        bestArticle = article
      }
    }
  }

  if (!bestArticle?.firmName) {
    return `${content.totalArticles} moves across private markets`
  }

  let sizeHint = ''
  if (bestSize >= 1000) {
    sizeHint = ` $${(bestSize / 1000).toFixed(1).replace(/\.0$/, '')}B`
  } else if (bestSize > 0) {
    sizeHint = ` $${bestSize}M`
  }

  const remaining = content.totalArticles - 1
  if (remaining === 0) {
    return `${bestArticle.firmName}${sizeHint}`
  }
  return `${bestArticle.firmName}${sizeHint} · + ${remaining} more move${remaining === 1 ? '' : 's'}`
}
