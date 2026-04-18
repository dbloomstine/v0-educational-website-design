/**
 * Outreach cron handler — Path B automation pipeline.
 *
 * Runs daily on the Vercel cron schedule defined in vercel.json. Every
 * weekday at 13:00 UTC it:
 *
 *   1. Gates on auth + OUTREACH_ENABLED env flag
 *   2. Verifies today's newsletter has actually sent
 *   3. Pulls the articles that went out
 *   4. Builds candidate firms through the hard-block filters
 *   5. Runs firm-level dedup against cold_outreach_sent
 *   6. Enriches a senior contact per firm via Apollo
 *   7. Runs email-level dedup against subscribers + prior outreach
 *   8. Caps to OUTREACH_DAILY_CAP (default 10)
 *   9. For each surviving candidate: generate hook, compose email, quality gate, send via Gmail
 *  10. Logs every row (sent + skipped) to cold_outreach_sent
 *  11. Emails Danny a summary
 *
 * Kill switches:
 *   - OUTREACH_ENABLED=true required (default off)
 *   - OUTREACH_DAILY_CAP enforced in code (default 10)
 *   - Idempotency guard via countTodaysRuns()
 */

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { buildCandidates } from '@/lib/outreach/candidates'
import { firmLevelDedup, emailLevelDedup, countTodaysRuns } from '@/lib/outreach/dedup'
import { findContactsForFirm } from '@/lib/outreach/apollo-client'
import {
  composeEmail,
  qualityGate,
  composeForwardEmail,
  qualityGateForward,
  TEMPLATE_VARIANT,
} from '@/lib/outreach/template'
import { fetchTodaysNewsletter } from '@/lib/outreach/newsletter-fetch'
import type { NewsletterPayload } from '@/lib/outreach/newsletter-fetch'
import type { TemplateMode } from '@/lib/outreach/types'
import { sendGmail } from '@/lib/outreach/gmail-client'
import type { Article, Contact, OutreachRunResult } from '@/lib/outreach/types'

export const maxDuration = 300 // 5 minutes — Apollo + Anthropic + Gmail for 10 candidates

interface NewsletterEditionRow {
  id: string
  edition_date: string
  subject: string
  status: string
  article_ids: string[] | null
}

function todayDateET(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

// Convert a raw news_items row (with jsonb extracted_data) into our Article type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toArticle(row: any): Article {
  const ed = row.extracted_data ?? {}
  return {
    articleId: row.id,
    title: row.title ?? '',
    tldr: row.tldr ?? null,
    articleType: row.article_type ?? null,
    eventType: row.event_type ?? null,
    fundCategories: row.fund_categories ?? null,
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
    sourceName: row.source_name ?? null,
  }
}

export async function GET(req: Request) {
  const startedAt = Date.now()

  // ─── 1. Auth ────────────────────────────────────────────────────────────
  if (!isAuthorizedPipelineRequest(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  // ─── 2. Kill switch ─────────────────────────────────────────────────────
  if (process.env.OUTREACH_ENABLED !== 'true') {
    return NextResponse.json({
      ok: true,
      skipped: 'outreach_disabled',
      note: 'Set OUTREACH_ENABLED=true in Vercel env to activate',
    })
  }

  // Authenticated query-param overrides — let a trusted caller (us, with
  // the CRON_SECRET) tune the pipeline per-invocation without touching
  // Vercel env vars. The scheduled cron passes no query params, so its
  // behavior is unchanged.
  const url = new URL(req.url)
  const capOverride = url.searchParams.get('cap')
  const force = url.searchParams.get('force') === 'true'
  const editionDateOverride = url.searchParams.get('editionDate') // YYYY-MM-DD
  const contactsPerFirmOverride = url.searchParams.get('contactsPerFirm')
  const skipFirmDedup = url.searchParams.get('skipFirmDedup') === 'true'
  // Template mode resolution order:
  //   1. ?templateMode=short|forward query param (highest priority — lets
  //      us test either mode manually regardless of env/default).
  //   2. OUTREACH_TEMPLATE_MODE env var (production toggle — lets Danny
  //      flip from forward back to short via Vercel env without a
  //      code deploy if anything looks wrong tomorrow morning).
  //   3. Code default — 'forward'. Shipping as default after validating
  //      forward mode end-to-end on 2026-04-15 (cleaned HTML, section
  //      pointer, multi-contact sends to TPG/Ares/Blue Owl). Short mode
  //      is still fully functional, just opt-in.
  const templateModeParam = url.searchParams.get('templateMode')
  const envTemplateMode = process.env.OUTREACH_TEMPLATE_MODE
  const resolvedMode =
    templateModeParam ?? envTemplateMode ?? 'forward'
  const templateMode: TemplateMode =
    resolvedMode === 'short' ? 'short' : 'forward'

  // Default: 5 contacts per firm PER RUN. This is the per-run quota,
  // NOT a 120-day limit. A firm that gets hit today can still be hit
  // tomorrow with different people — firmLevelDedup only blocks on
  // permanent failures (bounced/opted_out), and emailLevelDedup is the
  // per-person 120-day safety net. Set OUTREACH_CONTACTS_PER_FIRM in
  // Vercel to override the code default without a redeploy. Query param
  // still overrides both.
  const envContactsPerFirm = process.env.OUTREACH_CONTACTS_PER_FIRM
  const baseContactsPerFirm = envContactsPerFirm
    ? Number(envContactsPerFirm)
    : 5
  const contactsPerFirm = contactsPerFirmOverride != null
    ? Number(contactsPerFirmOverride)
    : baseContactsPerFirm
  if (!Number.isFinite(contactsPerFirm) || contactsPerFirm <= 0) {
    return NextResponse.json(
      { ok: false, error: 'Invalid contactsPerFirm (env OUTREACH_CONTACTS_PER_FIRM or ?contactsPerFirm= query param)' },
      { status: 500 },
    )
  }

  const dailyCap = capOverride != null
    ? Number(capOverride)
    : Number(process.env.OUTREACH_DAILY_CAP ?? '10')
  if (!Number.isFinite(dailyCap) || dailyCap <= 0) {
    return NextResponse.json(
      { ok: false, error: 'Invalid cap (env OUTREACH_DAILY_CAP or ?cap= query param)' },
      { status: 500 },
    )
  }

  const supabase = getSupabaseAdmin()

  try {
    // ─── 3. Idempotency guard ─────────────────────────────────────────────
    const existingCount = await countTodaysRuns(supabase)
    if (!force && existingCount >= dailyCap) {
      return NextResponse.json({
        ok: true,
        skipped: 'already_ran_today',
        existingCount,
        dailyCap,
        hint: 'pass ?force=true to bypass',
      })
    }

    // ─── 4. Verify newsletter sent (today by default, or override) ───────
    const editionDate = editionDateOverride ?? todayDateET()
    const { data: edition, error: editionErr } = await supabase
      .from('newsletter_editions')
      .select('id, edition_date, subject, status, article_ids')
      .eq('edition_date', editionDate)
      .eq('status', 'sent')
      .single<NewsletterEditionRow>()

    if (editionErr || !edition) {
      return NextResponse.json({
        ok: true,
        skipped: 'newsletter_not_sent',
        editionDate,
        note: 'Outreach anchors on the morning newsletter. If newsletter_editions has no sent row, outreach aborts.',
      })
    }

    if (!edition.article_ids || edition.article_ids.length === 0) {
      return NextResponse.json({
        ok: true,
        skipped: 'no_articles',
        editionDate,
      })
    }

    // ─── 5. Pull articles ─────────────────────────────────────────────────
    const { data: newsRows, error: newsErr } = await supabase
      .from('news_items')
      .select('id, title, tldr, article_type, event_type, fund_categories, extracted_data, source_name')
      .in('id', edition.article_ids)

    if (newsErr) {
      throw new Error(`Failed to fetch articles: ${newsErr.message}`)
    }

    const articles: Article[] = (newsRows ?? []).map(toArticle)

    // ─── 6. Hard-block filters + candidate build ──────────────────────────
    const allCandidates = buildCandidates(articles)

    // ─── 7. Firm-level dedup (permanent blocks only) ─────────────────────
    // Drops firms that have ever bounced or opted out. Does NOT drop
    // firms with prior sends — we WANT to cycle through new people at
    // the same firm over time as news comes up. The per-run quota is
    // enforced downstream by findContactsForFirm(maxContacts), and
    // individual re-contacts are blocked by emailLevelDedup (step 9).
    //
    // `?skipFirmDedup=true` bypasses even the permanent blocks, for
    // manual tests only. Never use in production.
    const dedupedFirms = skipFirmDedup
      ? allCandidates
      : await firmLevelDedup(supabase, allCandidates)

    // ─── 8. Apollo enrichment, capped at CAP + headroom ───────────────────
    // Enrich up to CAP * 2 candidates so we have headroom for Apollo misses
    // and email-level dedup attrition. Stop early once we have CAP verified
    // contacts to minimize credit spend.
    const enrichmentTarget = dailyCap * 2
    const apolloCounters = { searchCalls: 0, matchCalls: 0 }
    const contacts: Contact[] = []
    const apolloMisses: Array<{ firm: string; reason: string }> = []
    // Per-guard drop counters for diagnostic visibility. Previously every
    // drop was logged as generic "no_verified_email" which made tuning the
    // pipeline hard. Now we know which guard fired on each candidate.
    const guardDrops: Record<string, number> = {}

    for (const candidate of dedupedFirms) {
      if (contacts.length >= enrichmentTarget) break
      try {
        const results = await findContactsForFirm(
          candidate.article,
          contactsPerFirm,
          apolloCounters,
        )
        for (const result of results) {
          if (contacts.length >= enrichmentTarget) break
          if (result.ok) {
            contacts.push(result.contact)
          } else {
            apolloMisses.push({
              firm: candidate.firmName,
              reason: result.reason,
            })
            guardDrops[result.reason] = (guardDrops[result.reason] ?? 0) + 1
          }
        }
      } catch (err) {
        console.error(`Apollo lookup failed for ${candidate.firmName}:`, err)
        const reason = err instanceof Error ? err.message : 'unknown'
        apolloMisses.push({ firm: candidate.firmName, reason })
        guardDrops.apollo_exception = (guardDrops.apollo_exception ?? 0) + 1
      }
    }

    // ─── 9. Email-level dedup ─────────────────────────────────────────────
    const beforeEmailDedup = contacts.length
    const dedupedContacts = await emailLevelDedup(supabase, contacts)
    const emailDedupDropped = beforeEmailDedup - dedupedContacts.length
    if (emailDedupDropped > 0) {
      guardDrops.email_dedup = emailDedupDropped
    }

    // ─── 10. Determine remaining cap slots ────────────────────────────────
    // When force=true, treat dailyCap as a fresh send budget independent of
    // what's already gone out today — otherwise subtract existingCount so
    // the daily cron still respects the rolling daily total.
    const remainingCapSlots = force
      ? dailyCap
      : Math.max(0, dailyCap - existingCount)

    // ─── 10b. Forward-mode: fetch today's newsletter once for the run ─────
    // When templateMode=forward, we compose each outbound email as a
    // forwarded copy of today's FundOps Daily newsletter (with a personal
    // note at the top). Fetch the newsletter once at the start of the
    // send loop — it's identical for all recipients, so we pay one Gmail
    // inbox search + one getMessageContent per run regardless of send
    // count. The payload is cached in `newsletter` for the send loop.
    let newsletter: NewsletterPayload | null = null
    if (templateMode === 'forward' && dedupedContacts.length > 0) {
      try {
        newsletter = await fetchTodaysNewsletter()
      } catch (err) {
        console.error('fetchTodaysNewsletter failed:', err)
        return NextResponse.json(
          {
            ok: false,
            error: `newsletter fetch failed: ${err instanceof Error ? err.message : 'unknown'}`,
            hint: 'Forward mode requires today\'s FundOps Daily newsletter to be in the pipeline Gmail inbox.',
          },
          { status: 500 },
        )
      }
    }

    // ─── 11. Generate hooks, compose, gate, send, log ─────────────────────
    // Iterate the full deduped contact list and break when we've SENT the
    // remaining-cap count. Quality-gate drops and hook-generation failures
    // do NOT consume cap slots — we keep going until we hit the cap or run
    // out of candidates. This is important because Danny wants a reliable
    // daily send volume even when some candidates fail quality checks.
    const sentDetails: OutreachRunResult['sentDetails'] = []
    const skipped: Record<string, number> = {}
    const dropped: Array<{ firm: string; reason: string }> = [...apolloMisses]
    const gmailFailures: string[] = []

    for (const contact of dedupedContacts) {
      // Hit the cap — stop iterating.
      if (sentDetails.length >= remainingCapSlots) break

      // Short-circuit if we've hit 3 consecutive Gmail failures — likely
      // auth or rate-limit issue, bail before burning more Anthropic calls.
      if (gmailFailures.length >= 3) {
        const recentThree = gmailFailures.slice(-3)
        if (recentThree.every((f) => f === 'fail')) {
          dropped.push({
            firm: contact.firmName,
            reason: 'bailed_after_3_gmail_failures',
          })
          skipped.gmail_failed = (skipped.gmail_failed ?? 0) + 1
          continue
        }
      }

      // Compose email — short-mode (v4 static) or forward-mode.
      let subject: string
      let body: string
      let htmlBody: string | undefined
      let gateResult: { ok: boolean; reason?: string }

      if (templateMode === 'forward') {
        if (!newsletter) {
          // Shouldn't happen — the earlier fetch would have failed the run.
          dropped.push({
            firm: contact.firmName,
            reason: 'forward_mode_no_newsletter',
          })
          skipped.forward_mode_no_newsletter =
            (skipped.forward_mode_no_newsletter ?? 0) + 1
          continue
        }
        const composed = composeForwardEmail({
          firstName: contact.firstName,
          firmName: contact.firmName,
          article: contact.article,
          newsletter,
          recipientEmail: contact.email,
        })
        subject = composed.subject
        body = composed.body
        htmlBody = composed.html
        gateResult = qualityGateForward(composed, {
          firstName: contact.firstName,
          firmName: contact.firmName,
        })
      } else {
        const composed = composeEmail({
          firstName: contact.firstName,
          firmName: contact.firmName,
          recipientEmail: contact.email,
          article: contact.article,
        })
        subject = composed.subject
        body = composed.body
        gateResult = qualityGate(body, subject)
      }

      if (!gateResult.ok) {
        dropped.push({
          firm: contact.firmName,
          reason: `quality_gate: ${gateResult.reason}`,
        })
        skipped[`quality_${gateResult.reason}`] =
          (skipped[`quality_${gateResult.reason}`] ?? 0) + 1
        await logSkipped(contact, `quality_${gateResult.reason}`)
        continue
      }

      // Send via Gmail — html is passed through only when forward mode
      // produced one; short mode sends text/plain as before.
      try {
        const { messageId } = await sendGmail({
          to: contact.email,
          subject,
          body,
          html: htmlBody,
        })
        gmailFailures.push('ok')
        sentDetails.push({
          firm: contact.firmName,
          email: contact.email,
          subject,
          messageId,
        })

        // Log successful send.
        await supabase.from('cold_outreach_sent').insert({
          email: contact.email,
          first_name: contact.firstName || null,
          last_name: contact.lastName || null,
          firm_name: contact.firmName,
          firm_domain: contact.firmDomain,
          person_title: contact.title || null,
          article_id: contact.article.articleId,
          story_type: contact.article.eventType ?? contact.article.articleType ?? 'unknown',
          subject,
          draft_id: messageId,
          status: 'sent',
          sent_at: new Date().toISOString(),
          notes: `auto-sent via outreach-send cron, run=${startedAt}`,
          template_variant: TEMPLATE_VARIANT,
        })

        // Throttle between successful sends: random 3-7 second delay
        // so a batch of 30 doesn't all hit recipient inboxes in the same
        // second. Looks more like a human sending in sequence than a
        // spambot blasting from a queue. Only sleeps if more sends are
        // still expected — no wasted time on the last iteration.
        if (sentDetails.length < remainingCapSlots) {
          const jitterMs = 3000 + Math.floor(Math.random() * 4000)
          await new Promise((resolve) => setTimeout(resolve, jitterMs))
        }
      } catch (err) {
        console.error(`Gmail send failed for ${contact.email}:`, err)
        gmailFailures.push('fail')
        dropped.push({
          firm: contact.firmName,
          reason: `gmail_send: ${err instanceof Error ? err.message : 'unknown'}`,
        })
        skipped.gmail_send_failed = (skipped.gmail_send_failed ?? 0) + 1
      }
    }

    // ─── 12. Summary email to Danny ──────────────────────────────────────
    const result: OutreachRunResult = {
      ok: true,
      sent: sentDetails.length,
      cap: dailyCap,
      skipped,
      dropped,
      sentDetails,
      apolloSearchCalls: apolloCounters.searchCalls,
      apolloMatchCalls: apolloCounters.matchCalls,
      runtimeMs: Date.now() - startedAt,
      guardDrops,
      candidatesConsidered: dedupedFirms.length,
    }

    try {
      await sendSummaryEmail(result, editionDate, edition.subject)
    } catch (err) {
      console.error('Summary email send failed:', err)
      // Don't fail the whole run on summary email failure — the actual
      // outreach already happened. But DO surface the error in the
      // response so diagnosis doesn't require Vercel log access.
      ;(result as OutreachRunResult & { summaryEmailError?: string }).summaryEmailError =
        err instanceof Error ? err.message : String(err)
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Outreach cron failed:', err)
    const errorMessage = err instanceof Error ? err.message : 'unknown'

    // Attempt to alert Danny via the same Gmail send path.
    try {
      await sendGmail({
        to: process.env.GMAIL_SENDER_EMAIL ?? 'dbloomstine@gmail.com',
        subject: `⚠️ Outreach cron failed ${todayDateET()}`,
        body: `The /api/pipeline/outreach-send cron failed at ${new Date().toISOString()}.\n\nError: ${errorMessage}\n\nRuntime so far: ${Date.now() - startedAt}ms\n\nCheck Vercel function logs for the full stack trace.`,
      })
    } catch (alertErr) {
      console.error('Failure alert email also failed:', alertErr)
    }

    return NextResponse.json(
      { ok: false, error: errorMessage, runtimeMs: Date.now() - startedAt },
      { status: 500 },
    )
  }

  // Helper: log a skipped row so dedup still protects this contact.
  async function logSkipped(contact: Contact, reason: string) {
    await supabase.from('cold_outreach_sent').insert({
      email: contact.email,
      first_name: contact.firstName || null,
      last_name: contact.lastName || null,
      firm_name: contact.firmName,
      firm_domain: contact.firmDomain,
      person_title: contact.title || null,
      article_id: contact.article.articleId,
      story_type: contact.article.eventType ?? contact.article.articleType ?? 'unknown',
      subject: `[skipped: ${reason}]`,
      draft_id: null,
      status: 'skipped',
      notes: `${reason} | run=${startedAt}`,
      template_variant: TEMPLATE_VARIANT,
    })
  }
}

async function sendSummaryEmail(
  result: OutreachRunResult,
  editionDate: string,
  editionSubject: string,
) {
  const to = process.env.GMAIL_SENDER_EMAIL ?? 'dbloomstine@gmail.com'
  const subject = `Outreach summary ${editionDate} — ${result.sent} sent`

  const lines: string[] = []
  lines.push(`FundOpsHQ outreach cron — ${editionDate}`)
  lines.push('')
  lines.push(`Anchored on: ${editionSubject}`)
  lines.push(`Sent: ${result.sent} of ${result.cap} (cap)`)
  lines.push(`Candidates considered: ${result.candidatesConsidered}`)
  lines.push(`Runtime: ${(result.runtimeMs / 1000).toFixed(1)}s`)
  lines.push(`Apollo calls: ${result.apolloSearchCalls} search + ${result.apolloMatchCalls} match`)
  lines.push('')

  if (result.sentDetails.length > 0) {
    lines.push('Recipients:')
    for (const s of result.sentDetails) {
      lines.push(`  - ${s.firm} — ${s.email}`)
    }
    lines.push('')
  }

  if (Object.keys(result.guardDrops).length > 0) {
    lines.push('Guard drops (candidates rejected by which filter):')
    for (const [reason, count] of Object.entries(result.guardDrops)) {
      lines.push(`  - ${reason}: ${count}`)
    }
    lines.push('')
  }

  if (result.dropped.length > 0) {
    lines.push('Dropped firms:')
    for (const d of result.dropped) {
      lines.push(`  - ${d.firm}: ${d.reason}`)
    }
    lines.push('')
  }

  if (Object.keys(result.skipped).length > 0) {
    lines.push('Skipped counts (post-Apollo):')
    for (const [reason, count] of Object.entries(result.skipped)) {
      lines.push(`  - ${reason}: ${count}`)
    }
    lines.push('')
  }

  lines.push('Next run: tomorrow 12:30 UTC (wave 1, cap 25) and 17:00 UTC (wave 2, cap 50 total).')
  lines.push(`Kill switch: set OUTREACH_ENABLED=false in Vercel env to pause.`)

  await sendGmail({
    to,
    subject,
    body: lines.join('\n'),
  })
}
