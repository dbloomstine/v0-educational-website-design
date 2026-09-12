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
import { queryEventFeed } from '@/lib/events/api'
import type { IndustryEvent } from '@/lib/events/types'
import { sendPipelineAlert } from '@/lib/pipeline/alert'

// The events section is bounded by the DATE WINDOW, not by a count. A cap of
// 24 silently truncated it to ~8 days once the board grew past ~24 events in
// a fortnight, while the section header still promised "the next two weeks"
// (found 2026-09-04: 67 events in the window, 24 rendered). This ceiling
// exists only so a pathological day can't produce an unbounded email.
const EVENTS_LIMIT = 150


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
  // Widen the window to cover any gap since the last edition that actually
  // shipped. Without this a missed day's news is lost permanently — the 26h
  // window simply moves past it. The 2026-08 outage cost four editions and
  // roughly 500 articles that no later edition could ever reach.
  const effectiveHoursBack = await resolveLookback(supabase, editionDate, hoursBack)
  let content = await queryNewsletterArticles(supabase, effectiveHoursBack)

  // Weekend rescue: Saturday/Sunday feeds are quiet, so the standard 26h
  // window routinely produces a thin brief — a 2026-06 performance review
  // found 6 of the 7 thinnest editions were Sundays, several with 1–3
  // articles even though the <5 / 48h rescue was already in place. Widen
  // both knobs: trigger at <8 articles and expand to a 72h window. Cross-
  // edition fingerprinting in query-articles suppresses anything we ran in
  // the recent editions (and now holds fund closes/launches for ~14
  // editions), so this backfills cleanly without re-showing cross-day dupes.
  const dayOfWeek = new Date(`${editionDate}T12:00:00-05:00`).getUTCDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  if (isWeekend && content.totalArticles < 8 && effectiveHoursBack < 72) {
    content = await queryNewsletterArticles(supabase, 72)
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

    // A skip reads as a quiet news day, which is why the 2026-08 outage went
    // four editions unnoticed. Diagnose the likely cause before alerting so
    // the email says which of the two very different problems this is.
    await alertOnSkip(supabase, editionDate)

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
  // Section B rides along at the bottom (2026-08-30) — The Circuit no longer
  // sends on its own. A failure here must never block the news send, so the
  // section simply renders empty.
  let upcomingEvents: IndustryEvent[] = []
  try {
    const feed = await queryEventFeed({ when: '2w', limit: EVENTS_LIMIT })
    upcomingEvents = feed.events
  } catch (err) {
    console.error('[send-daily] events lookup failed, sending without Section B:', err)
  }

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
    events: upcomingEvents,
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
 * Hard ceiling on the catch-up window. Past a week a "daily" brief is running
 * stale news, and the reader is better served by moving on.
 */
const MAX_CATCHUP_HOURS = 168

/**
 * Widen the article window to span any gap since the last edition that shipped.
 *
 * The standard 26h window assumes yesterday's edition went out. When one
 * doesn't — an outage, a thin day, a bad deploy — that day's news falls out of
 * range forever and no later edition can recover it. The 2026-08 credit lapse
 * cost four editions this way.
 *
 * Returns the larger of the requested window and the gap, so an explicit
 * override (`?hoursBack=120` for a manual catch-up) is never narrowed. Cross-
 * edition dedup in query-articles is what makes widening safe: anything already
 * published is suppressed by id and by firm/size fingerprint, so a wider window
 * surfaces only what was genuinely missed.
 */
export async function resolveLookback(
  supabase: DbClient,
  editionDate: string,
  requestedHours: number
): Promise<number> {
  const { data } = await supabase
    .from('newsletter_editions')
    .select('edition_date')
    .eq('status', 'sent')
    .lt('edition_date', editionDate)
    .order('edition_date', { ascending: false })
    .limit(1)

  const lastSent = data?.[0]?.edition_date as string | undefined
  if (!lastSent) return requestedHours

  const gapDays = Math.round(
    (Date.parse(`${editionDate}T12:00:00Z`) - Date.parse(`${lastSent}T12:00:00Z`)) / 86_400_000
  )
  // A 1-day gap is the normal daily cadence — nothing was missed.
  if (gapDays <= 1) return requestedHours

  // +2h of overlap so articles published near the boundary aren't clipped.
  const widened = Math.min(gapDays * 24 + 2, MAX_CATCHUP_HOURS)
  return Math.max(requestedHours, widened)
}

/**
 * Alert on a skipped edition, distinguishing the two causes that look
 * identical from the outside.
 *
 * A skip means "nothing qualified". That is either a genuinely thin news day
 * (fine, happens on holidays and some Sundays) or the classifier is dead and
 * every article is stuck unclassified (not fine — four editions were lost to
 * this in 2026-08). The counts below tell them apart, so the email names the
 * actual problem instead of making Danny go look.
 */
async function alertOnSkip(supabase: DbClient, editionDate: string): Promise<void> {
  const since = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()

  const counts: Record<string, number> = {}
  for (const status of ['complete', 'failed', 'pending', 'processing']) {
    const { count } = await supabase
      .from('news_items')
      .select('id', { count: 'exact', head: true })
      .eq('classification_status', status)
      .gte('created_at', since)
    counts[status] = count ?? 0
  }

  const ingested = counts.complete + counts.failed + counts.pending + counts.processing
  const classifierBroken = ingested > 0 && counts.complete === 0

  const lines = classifierBroken
    ? [
        `No edition sent for ${editionDate} — and this is NOT a quiet news day.`,
        `${ingested} articles were ingested in the last 26h but ZERO were classified successfully.`,
        `Unclassified: ${counts.failed} failed, ${counts.pending} pending, ${counts.processing} processing.`,
        'That points at the classifier: check the Anthropic credit balance and ANTHROPIC_API_KEY first.',
      ]
    : [
        `No edition sent for ${editionDate}.`,
        `Classification looks healthy (${counts.complete} articles classified in the last 26h) — nothing cleared the newsletter quality bar.`,
        'Probably a genuinely thin news day, but worth a look if it repeats.',
      ]

  await sendPipelineAlert(
    supabase,
    'newsletter_skipped',
    classifierBroken
      ? 'Newsletter skipped — classifier appears down'
      : 'Newsletter skipped — no qualifying articles',
    lines
  )
}

/**
 * Subject line = the firms in today's edition, most notable first.
 * (Danny, 2026-09-12: "instead of one deal, a bunch of names of firms
 * that are in the news".) Was "{Firm} {size} · + N more moves".
 *
 * Order: GP fund events first (closes > launches > raises, then size),
 * then deals, people moves, service providers, regulatory, and LP
 * commitments last (allocator names are long and rarely the headline).
 * AUM-leak candidates are excluded from the lead slots, same rail as
 * before. Names are deduped, stripped of legal suffixes, and added until
 * the line would pass ~70 characters, which is what Gmail shows.
 *
 * No "FundOps Daily —" prefix — the From: name already carries the brand.
 * Format: "KKR, Arini, EIG, ARCHIMED + 40 more".
 */
export const SUBJECT_MAX_CHARS = 70
export const SUBJECT_MAX_NAMES = 6

const LEGAL_SUFFIX_RE = /(,?\s+(LLC|LLP|L\.?L\.?P\.?|L\.?P\.?|Inc\.?|Ltd\.?|Limited|plc|PLC|Corp\.?|Corporation|Co\.?|S\.?A\.?|AG|GmbH|SE))+\s*$/i

/**
 * Trailing descriptor words that add nothing in a subject line
 * ("Investment Advisers", "Venture Partners", "Capital Management").
 * Stripped as one trailing run, and only when what is left still reads as
 * a name: two or more words, or one word of six-plus letters that is not
 * a generic adjective or place. So "PennantPark Investment Advisers" →
 * "PennantPark" and "Adams Street Partners" → "Adams Street", but
 * "Bain Capital", "Main Capital Partners" and "Intermediate Capital
 * Group" stay whole. (Danny, 2026-09-12: "cut off the 'Investment
 * Advisers' and the 'Venture Partners' etc., tastefully".)
 */
const DESCRIPTOR_WORDS = new Set([
  'partners', 'partner', 'capital', 'management', 'investment', 'investments', 'investors',
  'advisers', 'advisors', 'advisory', 'group', 'holdings', 'equity', 'asset', 'assets',
  'global', 'international', 'securities', 'financial', 'fund', 'funds', 'associates',
  'company', 'venture', 'private', 'markets', 'strategies', 'alternatives', 'alternative',
])
/** Words that must not stand alone as a firm name even when long enough. */
const STANDALONE_STOPLIST = new Set([
  'intermediate', 'general', 'strategic', 'institutional', 'national', 'american', 'european',
  'atlantic', 'pacific', 'northern', 'southern', 'western', 'eastern', 'central', 'united',
  'insight', 'summit', 'francisco', 'boston', 'london', 'chicago', 'first', 'prime', 'index',
  'digital', 'growth', 'value', 'income', 'credit', 'infrastructure', 'energy', 'healthcare',
])

export function shortenFirmName(name: string): string {
  const words = name.split(' ').filter(Boolean)
  let cut = 0
  while (cut < words.length - 1 && DESCRIPTOR_WORDS.has(words[words.length - 1 - cut].toLowerCase().replace(/[.,]/g, ''))) cut++
  if (cut === 0) return name
  const rest = words.slice(0, words.length - cut)
  const last = rest[rest.length - 1].toLowerCase()
  if (last === '&' || last === 'and' || last === 'of' || last === 'de') return name
  if (rest.length >= 2) return rest.join(' ')
  const only = rest[0]
  if (only.replace(/[^A-Za-z]/g, '').length >= 6 && !STANDALONE_STOPLIST.has(only.toLowerCase())) return only
  return name
}

/** "Clayton, Dubilier & Rice, LLC" → "Clayton Dubilier & Rice" (commas separate names in the subject). */
export function subjectFirmName(name: string): string {
  const base = name.replace(LEGAL_SUFFIX_RE, '').replace(/\s*,\s*/g, ' ').replace(/\s+/g, ' ').trim()
  return shortenFirmName(base)
}

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
  const tierFor = (category: string): number => {
    switch (category) {
      case 'deals': return 1
      case 'people_moves': return 2
      case 'service_providers': return 3
      case 'regulatory': return 4
      case 'lp_commitments': return 5
      default: return 0 // asset-class fund activity
    }
  }

  type Cand = { name: string; tier: number; prio: number; size: number; seq: number }
  const cands: Cand[] = []
  let seq = 0
  for (const group of content.groups) {
    const tier = tierFor(group.category)
    for (const article of group.articles) {
      seq++
      if (!article.firmName) continue
      const name = subjectFirmName(article.firmName)
      if (!name) continue
      const size = article.fundSizeUsdMillions ?? 0
      // AUM safety rail — see isLikelyAumLeak() in query-articles.ts. Such a
      // row still names a real firm; it just must not lead on its "size".
      const leak = size > 0 && isLikelyAumLeak(size, article.fundName)
      const prio = tier === 0 ? (typePriority[article.eventType ?? ''] ?? 0) : 0
      cands.push({ name, tier, prio: leak ? 0 : prio, size: leak ? 0 : size, seq })
    }
  }
  cands.sort((a, b) => a.tier - b.tier || b.prio - a.prio || b.size - a.size || a.seq - b.seq)

  const names: string[] = []
  const seen = new Set<string>()
  for (const c of cands) {
    const key = c.name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    names.push(c.name)
  }

  if (names.length === 0) {
    return `${content.totalArticles} moves across private markets`
  }

  const render = (picked: string[]) => {
    const remaining = Math.max(0, content.totalArticles - picked.length)
    return remaining === 0 ? picked.join(', ') : `${picked.join(', ')} + ${remaining} more`
  }
  let picked = [names[0]]
  for (const n of names.slice(1, SUBJECT_MAX_NAMES)) {
    const next = [...picked, n]
    if (render(next).length > SUBJECT_MAX_CHARS) break
    picked = next
  }
  return render(picked)
}
