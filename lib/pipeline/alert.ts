/**
 * Pipeline health alerts.
 *
 * The 2026-08-04 Anthropic credit lapse ran for four days before anyone
 * noticed. Nothing was broken in a way the system could see: ingest kept
 * working, the crons kept firing on schedule, and each morning the newsletter
 * recorded status 'skipped' with "No qualifying articles found" — which is
 * indistinguishable from a genuinely quiet news day. The only signal was an
 * email that didn't arrive, and absence is exactly the thing a human doesn't
 * notice for four days.
 *
 * These alerts make silent degradation loud. Delivery is deliberately
 * best-effort: an alert that throws must never take down the pipeline run it
 * was reporting on.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any>

const ALERT_FROM = process.env.RESEND_FROM_EMAIL || 'feedback@fundopshq.com'
const ALERT_TO = process.env.PIPELINE_ALERT_EMAIL || 'dbloomstine@gmail.com'

export type AlertKey =
  | 'classification_api_outage'
  | 'newsletter_skipped'
  | 'classification_backlog_empty'

/** Cooldown per alert type, in hours. */
const COOLDOWN_HOURS: Record<AlertKey, number> = {
  // news-process runs every 2h; during a multi-day outage that would be 12
  // identical emails a day without this.
  classification_api_outage: 12,
  // At most one edition per day, so this only ever fires once per incident.
  newsletter_skipped: 20,
  classification_backlog_empty: 24,
}

async function withinCooldown(
  supabase: DbClient,
  key: AlertKey
): Promise<boolean> {
  const cutoff = new Date(
    Date.now() - COOLDOWN_HOURS[key] * 60 * 60 * 1000
  ).toISOString()

  const { data } = await supabase
    .from('pipeline_alerts')
    .select('id')
    .eq('alert_key', key)
    .gte('created_at', cutoff)
    .limit(1)

  return (data?.length ?? 0) > 0
}

/**
 * Email Danny about a pipeline problem, at most once per cooldown window.
 * Returns true if an alert was actually sent.
 */
export async function sendPipelineAlert(
  supabase: DbClient,
  key: AlertKey,
  subject: string,
  lines: string[]
): Promise<boolean> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) return false

    if (await withinCooldown(supabase, key)) return false

    const html = [
      '<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#111">',
      `<p style="margin:0 0 12px"><strong>${escapeHtml(subject)}</strong></p>`,
      ...lines.map((l) => `<p style="margin:0 0 8px">${escapeHtml(l)}</p>`),
      '<p style="margin:16px 0 0;color:#666;font-size:13px">FundOpsHQ pipeline monitor</p>',
      '</div>',
    ].join('')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `FundOps Pipeline <${ALERT_FROM}>`,
        to: ALERT_TO,
        subject: `[FundOps] ${subject}`,
        html,
      }),
    })

    if (!res.ok) return false

    // Only log after a confirmed send, so a Resend outage doesn't silently
    // consume the cooldown and suppress the next real alert.
    await supabase
      .from('pipeline_alerts')
      .insert({ alert_key: key, detail: lines.join(' | ').slice(0, 2000) })

    return true
  } catch {
    // Never let alerting break the pipeline it is monitoring.
    return false
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
