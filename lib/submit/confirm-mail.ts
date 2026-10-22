/**
 * Sends the "confirm your news" email (lib/submit/news-submission.ts writes
 * it) through Resend, from the same address and name family as the site's
 * other submission mail (feedback@fundopshq.com unless RESEND_FROM_EMAIL says
 * otherwise; the review-submissions skill sends event confirmations from it).
 * Replies go to the owner. Without a key it does nothing. It never throws.
 */
import { OWNER_EMAIL } from '@/lib/alerts/owner-alert'

export async function sendConfirmEmail(to: string, mail: { subject: string; text: string; html: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false
  const from = process.env.RESEND_FROM_EMAIL || 'feedback@fundopshq.com'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `FundOpsHQ News Desk <${from}>`,
        to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        reply_to: OWNER_EMAIL,
      }),
    })
    if (!res.ok) console.error('Confirm email not sent:', res.status)
    return res.ok
  } catch (err) {
    console.error('Confirm email not sent:', err)
    return false
  }
}
