/**
 * A short plain-text email to the owner when something arrives from a public
 * form (an event submitted on /events/submit, news sent on /submit).
 *
 * Plain text on purpose: everything in it was typed by a stranger, and text
 * cannot carry markup or a disguised link. Sent through Resend from the site's
 * own address; without a key it does nothing. It never throws: a failed alert
 * must not fail the submission, which is already saved.
 */
export const OWNER_EMAIL = 'dbloomstine@gmail.com'

export interface OwnerAlert {
  /** The sender's display name ("FundOpsHQ Events"). */
  fromName: string
  subject: string
  text: string
  /** Where a reply goes, when the alert is about someone who left an address. */
  replyTo?: string
}

/** One line, no control characters, at most `max` characters: for a subject built from typed text. */
export function oneLine(text: string, max: number): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

export async function sendOwnerAlert(alert: OwnerAlert): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false
  const from = process.env.RESEND_FROM_EMAIL || 'feedback@fundopshq.com'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${alert.fromName} <${from}>`,
        to: OWNER_EMAIL,
        subject: oneLine(alert.subject, 150),
        text: alert.text,
        ...(alert.replyTo ? { reply_to: alert.replyTo } : {}),
      }),
    })
    if (!res.ok) console.error('Owner alert not sent:', res.status)
    return res.ok
  } catch (err) {
    console.error('Owner alert not sent:', err)
    return false
  }
}
