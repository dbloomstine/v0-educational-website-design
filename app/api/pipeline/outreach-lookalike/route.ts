/**
 * Lookalike outreach — the successor to the article-driven outreach-send.
 *
 * Instead of "we covered your firm today" to whoever raised a fund, this
 * finds people who look like the subscribers who already open FundOps
 * Daily every morning (see lib/outreach/segments.ts for the data) and
 * sends Danny's plain note: who he is, why this reader, one link, share
 * it if you like, tell me if you have feedback.
 *
 * Guardrails, in order:
 *   auth → OUTREACH_ENABLED → cap/mode → idempotency → Gmail token
 *   preflight (before any Apollo spend) → one Apollo search (free) →
 *   at most cap*3 match calls (1 credit each) → guards → email dedup
 *   (subscribers, 120-day history, opt-outs, bounces) → suppression
 *   (iqeq.com + hashed Lead Desk list) → compose → gate → draft or send
 *   → log → summary email.
 *
 * Modes: `draft` (default; Gmail drafts for Danny to review and send by
 * hand) or `send`. Danny asked for review mode for week one.
 */
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { emailLevelDedup, countTodaysRuns } from '@/lib/outreach/dedup'
import { searchPeopleBySegment, matchPersonById, applyLookalikeGuards, titleIsJunior } from '@/lib/outreach/apollo-client'
import { verifyGmailToken, sendGmail, createGmailDraft } from '@/lib/outreach/gmail-client'
import { sendAlertViaResend } from '@/lib/outreach/alert-fallback'
import { filterSuppressed } from '@/lib/outreach/suppression'
import { composeLookalikeEmail, qualityGateLookalike, LOOKALIKE_TEMPLATE_VARIANT } from '@/lib/outreach/template'
import { LOOKALIKE_SEGMENTS, segmentForDate, segmentByKey, titleMatchesSegment, isCompetitor } from '@/lib/outreach/segments'
import type { Contact, LookalikeContact } from '@/lib/outreach/types'

export const maxDuration = 300

function todayDateET(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

async function notify(subject: string, lines: string[]) {
  const to = process.env.GMAIL_SENDER_EMAIL ?? 'dbloomstine@gmail.com'
  const body = lines.join('\n')
  try {
    await sendGmail({ to, subject, body })
  } catch (err) {
    const r = await sendAlertViaResend({ to, subject, text: body + `\n\n[Resend fallback; Gmail failed: ${err instanceof Error ? err.message : String(err)}]` })
    if (!r.ok) console.error('lookalike notify: both channels failed', r.error)
  }
}

export async function GET(req: Request) {
  const startedAt = Date.now()
  if (!isAuthorizedPipelineRequest(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)
  const force = url.searchParams.get('force') === 'true'
  const dateET = todayDateET()
  const cap = Number(url.searchParams.get('cap') ?? process.env.OUTREACH_LOOKALIKE_CAP ?? '2')
  const mode = (url.searchParams.get('mode') ?? process.env.OUTREACH_LOOKALIKE_MODE ?? 'draft') === 'send' ? 'send' : 'draft'
  const segKey = url.searchParams.get('segment')
  const segment = (segKey && segmentByKey(segKey)) || segmentForDate(dateET)
  const tag = `Lookalike ${dateET} [${segment.key}, ${mode}]`

  try {
    if ((process.env.OUTREACH_ENABLED ?? '').trim().toLowerCase() !== 'true') {
      await notify(`${tag} — skipped: outreach_disabled`, ['OUTREACH_ENABLED is not true.'])
      return NextResponse.json({ ok: true, skipped: 'outreach_disabled' })
    }
    if (!Number.isFinite(cap) || cap <= 0) {
      await notify(`${tag} — skipped: invalid_cap`, [`cap=${cap}`])
      return NextResponse.json({ ok: false, error: 'invalid cap' }, { status: 500 })
    }
    const supabase = getSupabaseAdmin()

    if (!force) {
      const already = await countTodaysRuns(supabase)
      if (already > 0) {
        await notify(`${tag} — skipped: already_ran`, [`${already} row(s) logged today. Pass ?force=true to override.`])
        return NextResponse.json({ ok: true, skipped: 'already_ran', already })
      }
    }

    const token = await verifyGmailToken()
    if (!token.ok) {
      await notify(`${tag} — skipped: gmail_oauth_dead`, [token.error, 'No Apollo credits spent.'])
      return NextResponse.json({ ok: false, error: `gmail oauth dead: ${token.error}`, spentApolloCredits: 0 }, { status: 500 })
    }

    // One search (free). Page by day-of-year so consecutive runs of the same
    // segment don't keep re-reading the same top results.
    const dayOfYear = Math.floor((Date.parse(dateET + 'T12:00:00Z') - Date.UTC(new Date(dateET).getUTCFullYear(), 0, 0)) / 86_400_000)
    let page = (Math.floor(dayOfYear / LOOKALIKE_SEGMENTS.length) % 4) + 1
    const isViable = (p: { has_email?: boolean; title?: string; organization?: { name?: string } }) =>
      Boolean(p.has_email) && !titleIsJunior(p.title) && titleMatchesSegment(p.title, segment) && !isCompetitor(p.title, p.organization?.name)
    let hits = await searchPeopleBySegment(segment, { perPage: 25, page })
    let viable = hits.filter(isViable)
    if (viable.length === 0 && page !== 1) {
      // Past the end of a thin segment; the searches are free, so start over.
      page = 1
      hits = await searchPeopleBySegment(segment, { perPage: 25, page })
      viable = hits.filter(isViable)
    }

    // Reveal at most cap*3 (1 credit each) until we have `cap` contacts.
    const maxMatches = cap * 3
    const found: LookalikeContact[] = []
    const dropped: Array<{ reason: string; firm?: string }> = []
    let matchCalls = 0
    for (const hit of viable) {
      if (found.length >= cap || matchCalls >= maxMatches) break
      matchCalls++
      const person = await matchPersonById(hit.id)
      const r = applyLookalikeGuards(segment, person)
      if (r.ok) found.push(r.contact)
      else dropped.push({ reason: r.reason, firm: hit.organization?.name })
    }

    // Dedup + suppression. emailLevelDedup wants Contact[]; adapt the shape.
    const asContacts = found.map((c) => ({ ...c, article: null } as unknown as Contact))
    const deduped = await emailLevelDedup(supabase, asContacts)
    const dedupedSet = new Set(deduped.map((c) => c.email.toLowerCase()))
    const afterDedup = found.filter((c) => dedupedSet.has(c.email.toLowerCase()))
    for (const c of found) if (!dedupedSet.has(c.email.toLowerCase())) dropped.push({ reason: 'already_subscribed_or_contacted', firm: c.firmName })
    const sup = await filterSuppressed(supabase, afterDedup)
    for (const d of sup.dropped) dropped.push({ reason: d.reason })

    const results: Array<{ email: string; firm: string; title: string; status: string }> = []
    for (const contact of sup.kept.slice(0, cap)) {
      const { subject, body } = composeLookalikeEmail({ firstName: contact.firstName, segment, recipientEmail: contact.email })
      const gate = qualityGateLookalike(body, subject)
      if (!gate.ok) { dropped.push({ reason: `gate:${gate.reason}`, firm: contact.firmName }); continue }

      let draftId: string | null = null
      let status: 'sent' | 'draft_created'
      if (mode === 'send') {
        const r = await sendGmail({ to: contact.email, subject, body }); draftId = r.messageId; status = 'sent'
      } else {
        const r = await createGmailDraft({ to: contact.email, subject, body }); draftId = r.draftId; status = 'draft_created'
      }
      await supabase.from('cold_outreach_sent').insert({
        email: contact.email,
        first_name: contact.firstName || null,
        last_name: contact.lastName || null,
        firm_name: contact.firmName || null,
        firm_domain: contact.firmDomain,
        person_title: contact.title || null,
        article_id: null,
        story_type: `lookalike:${segment.key}`,
        subject,
        draft_id: draftId,
        status,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
        notes: `lookalike ${mode} via outreach-lookalike, segment=${segment.key}, run=${startedAt}`,
        template_variant: LOOKALIKE_TEMPLATE_VARIANT,
      })
      results.push({ email: contact.email, firm: contact.firmName, title: contact.title, status })
      if (mode === 'send') await new Promise((r) => setTimeout(r, 3000 + Math.floor(Math.random() * 4000)))
    }

    const summary = [
      `Segment: ${segment.key} (${segment.label}) · page ${page} · ${hits.length} search hits, ${viable.length} viable · mode ${mode}`,
      `Search hits ${hits.length} → viable ${viable.length} → matched ${found.length} (Apollo match calls: ${matchCalls}) → after dedup ${afterDedup.length} → after suppression ${sup.kept.length}`,
      '',
      ...(results.length ? results.map((r) => `${r.status === 'sent' ? 'SENT ' : 'DRAFT'}  ${r.firm} · ${r.title} · ${r.email}`) : ['Nothing produced.']),
      '',
      ...(dropped.length ? ['Dropped:', ...dropped.map((d) => `  ${d.reason}${d.firm ? ' · ' + d.firm : ''}`)] : []),
      '',
      mode === 'draft' ? 'Review mode: open Gmail → Drafts, read, and send the ones you like.' : 'Auto-send mode.',
    ]
    await notify(`${tag} — ${results.length} ${mode === 'send' ? 'sent' : 'drafted'}`, summary)
    return NextResponse.json({ ok: true, mode, segment: segment.key, page, produced: results.length, apolloMatchCalls: matchCalls, results, dropped })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('outreach-lookalike failed:', err)
    await notify(`${tag} — FAILED`, [msg])
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
