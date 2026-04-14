/**
 * Outreach reply / bounce monitor.
 *
 * Runs hourly at :15 via Vercel cron. Scans Danny's Gmail inbox for recent
 * messages and:
 *
 *   1. If a reply is from an email we've outreached to in the last 30 days,
 *      check the body for opt-out phrases. Match → flip status to 'opted_out'.
 *      No match → flip to 'replied' (Danny triages manually).
 *
 *   2. If a reply is a bounce from mailer-daemon / postmaster, parse the
 *      bounced recipient and flip that row's status to 'bounced'.
 *
 * Both statuses are permanent blocks in the dedup logic, so once flipped
 * the recipient will never be contacted again regardless of time window.
 */

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import {
  listInboxMessages,
  getMessage,
  type GmailMessageDetail,
} from '@/lib/outreach/gmail-client'
import { detectOptOut, isBounceMessage, parseBouncedRecipient } from '@/lib/outreach/monitor'

export const maxDuration = 120

interface MonitorResult {
  ok: boolean
  processedReplies: number
  processedBounces: number
  optOuts: string[]
  replies: string[]
  bounces: string[]
  skipped?: string
  error?: string
}

export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  if (process.env.OUTREACH_ENABLED !== 'true') {
    return NextResponse.json({
      ok: true,
      skipped: 'outreach_disabled',
    } satisfies Pick<MonitorResult, 'ok' | 'skipped'>)
  }

  const supabase = getSupabaseAdmin()
  const result: MonitorResult = {
    ok: true,
    processedReplies: 0,
    processedBounces: 0,
    optOuts: [],
    replies: [],
    bounces: [],
  }

  try {
    // ─── 1. Scan recent inbox for replies ─────────────────────────────────
    // Look at anything newer than 2 days to catch overnight replies + today's.
    const recent = await listInboxMessages({
      query: 'newer_than:2d in:inbox',
      maxResults: 100,
    })

    for (const msg of recent) {
      let detail: GmailMessageDetail
      try {
        detail = await getMessage(msg.id)
      } catch (err) {
        console.error(`Failed to fetch message ${msg.id}:`, err)
        continue
      }

      // Skip if no sender email parseable.
      if (!detail.fromEmail) continue

      // Check if this sender matches a recent outreach target. 30-day
      // lookback — opt-out or reply signals should always land within a
      // few days of send, but 30 gives buffer for delayed replies.
      const { data: match } = await supabase
        .from('cold_outreach_sent')
        .select('id, email, status')
        .ilike('email', detail.fromEmail)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!match) continue // not one of our targets, skip
      result.processedReplies++

      // Already permanently blocked? Skip.
      if (match.status === 'opted_out' || match.status === 'bounced') continue

      if (detectOptOut(detail.body)) {
        await supabase
          .from('cold_outreach_sent')
          .update({
            status: 'opted_out',
            responded_at: new Date().toISOString(),
            notes: `opted_out via monitor: message ${msg.id}`,
          })
          .eq('id', match.id)
        result.optOuts.push(detail.fromEmail)
      } else if (match.status === 'sent' || match.status === 'draft_created') {
        // Generic reply — flag for manual triage but don't hard-block.
        await supabase
          .from('cold_outreach_sent')
          .update({
            status: 'replied',
            responded_at: new Date().toISOString(),
            notes: `reply detected via monitor: message ${msg.id}`,
          })
          .eq('id', match.id)
        result.replies.push(detail.fromEmail)
      }
    }

    // ─── 2. Scan for bounce messages ─────────────────────────────────────
    const bounceMessages = await listInboxMessages({
      query: 'from:(mailer-daemon OR postmaster) newer_than:2d',
      maxResults: 50,
    })

    for (const msg of bounceMessages) {
      let detail: GmailMessageDetail
      try {
        detail = await getMessage(msg.id)
      } catch (err) {
        console.error(`Failed to fetch bounce message ${msg.id}:`, err)
        continue
      }

      if (!isBounceMessage(detail)) continue

      const bouncedEmail = parseBouncedRecipient(detail.body)
      if (!bouncedEmail) continue

      result.processedBounces++

      // Find the most recent cold_outreach_sent row for this email.
      const { data: match } = await supabase
        .from('cold_outreach_sent')
        .select('id, email, status')
        .ilike('email', bouncedEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!match) continue
      if (match.status === 'bounced') continue // already flagged

      await supabase
        .from('cold_outreach_sent')
        .update({
          status: 'bounced',
          responded_at: new Date().toISOString(),
          notes: `bounce detected via monitor: message ${msg.id}`,
        })
        .eq('id', match.id)
      result.bounces.push(bouncedEmail)
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Outreach monitor cron failed:', err)
    return NextResponse.json(
      {
        ...result,
        ok: false,
        error: err instanceof Error ? err.message : 'unknown',
      },
      { status: 500 },
    )
  }
}
