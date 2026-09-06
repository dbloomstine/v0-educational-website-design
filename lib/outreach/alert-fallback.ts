/**
 * Gmail-independent alert channel for the outreach pipeline.
 *
 * Every status/alert email used to go out through the same Gmail OAuth
 * token the pipeline sends with — so when that token died on 2026-04-21
 * the alert died with it and the failure was silent for weeks. This
 * sends through Resend (the newsletter's transport, already configured)
 * so a dead Gmail token can still tell Danny it is dead.
 *
 * Deliberately dependency-free: one fetch to Resend's REST API.
 */
export async function sendAlertViaResend(params: {
  to: string
  subject: string
  text: string
}): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, error: 'RESEND_API_KEY not set' }
  const from = process.env.RESEND_FROM_EMAIL || 'feedback@fundopshq.com'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `FundOpsHQ outreach <${from}>`,
        to: [params.to],
        subject: params.subject,
        text: params.text,
      }),
    })
    if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
