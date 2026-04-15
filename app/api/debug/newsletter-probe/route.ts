/**
 * TEMPORARY debug route — inspects today's newsletter fetch + clean
 * pipeline before wiring it into the outreach-send route. Deleted
 * after the forward-mode implementation is validated.
 *
 * Returns JSON with:
 *   - newsletter meta (subject, from, date, lengths)
 *   - pattern match counts on the raw HTML (tracking pixels, etc.)
 *   - samples of the HTML (first 800, last 2000) BEFORE cleaning
 *   - samples of the HTML AFTER cleaning
 *   - samples of the text/plain before + after cleaning
 *
 * Auth: standard CRON_SECRET / PIPELINE_API_KEY bearer.
 */

import { NextResponse } from 'next/server'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { listInboxMessages, getMessageContent } from '@/lib/outreach/gmail-client'
import { cleanNewsletterContent } from '@/lib/outreach/newsletter-fetch'

export const maxDuration = 30

const NEWSLETTER_FROM = 'feedback@fundopshq.com'

export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  try {
    // 1. Find today's newsletter in the inbox.
    const messages = await listInboxMessages({
      query: `from:${NEWSLETTER_FROM} subject:"FundOps Daily" newer_than:1d`,
      maxResults: 5,
    })
    if (messages.length === 0) {
      return NextResponse.json({ ok: false, error: 'no_newsletter_found' })
    }

    const content = await getMessageContent(messages[0].id)
    const cleaned = cleanNewsletterContent(content)

    // 2. Pattern scan on the raw HTML — gives us visibility into what
    //    sorts of junk we should be stripping.
    const patterns: Array<{ name: string; regex: RegExp }> = [
      { name: 'resend-clicks-a.com wrapper', regex: /resend-clicks-a\.com/gi },
      { name: '1x1 img tags (attr)', regex: /<img[^>]*(?:width=["']?1["']?|height=["']?1["']?)[^>]*>/gi },
      { name: '1x1 img tags (inline style)', regex: /<img[^>]*style=["'][^"']*(?:width\s*:\s*1px|height\s*:\s*1px)/gi },
      { name: 'unsubscribe raw URL', regex: /\/api\/newsletter\/unsubscribe\?token=/gi },
      { name: 'unsubscribe URL-encoded', regex: /%2Fapi%2Fnewsletter%2Funsubscribe/gi },
      { name: 'receiving this because (plain apos)', regex: /You['\u2019]re receiving this because/gi },
      { name: 'receiving this because (HTML entity)', regex: /You&(?:rsquo|#8217|#x2019|apos);re receiving this because/gi },
      { name: 'token=<uuid>', regex: /token=[0-9a-f]{8}-[0-9a-f]{4}/gi },
      { name: 'Unsubscribe word occurrences', regex: /\bUnsubscribe\b/gi },
      { name: 'fundopshq.com href/text', regex: /fundopshq\.com/gi },
    ]

    const rawCounts: Record<string, number> = {}
    const cleanedCounts: Record<string, number> = {}
    for (const p of patterns) {
      rawCounts[p.name] = (content.html.match(p.regex) ?? []).length
      cleanedCounts[p.name] = (cleaned.html.match(p.regex) ?? []).length
    }

    return NextResponse.json({
      ok: true,
      source: {
        messageId: content.id,
        subject: content.subject,
        fromName: content.fromName,
        fromEmail: content.fromEmail,
        date: content.date,
      },
      lengths: {
        rawHtml: content.html.length,
        cleanedHtml: cleaned.html.length,
        rawText: content.text.length,
        cleanedText: cleaned.text.length,
        deltaHtml: content.html.length - cleaned.html.length,
      },
      patternCounts: {
        raw: rawCounts,
        cleaned: cleanedCounts,
      },
      samples: {
        rawHtmlHead: content.html.slice(0, 600),
        rawHtmlTail: content.html.slice(-1500),
        cleanedHtmlHead: cleaned.html.slice(0, 600),
        cleanedHtmlTail: cleaned.html.slice(-1500),
        rawTextTail: content.text.slice(-600),
        cleanedTextTail: cleaned.text.slice(-600),
      },
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    )
  }
}
