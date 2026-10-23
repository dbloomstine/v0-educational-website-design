/**
 * Sends the "confirm your news" email (lib/submit/news-submission.ts writes
 * it) through Resend, from the same address and name family as the site's
 * reader mail (lib/newsletter/sender.ts: danny@fundopshq.com unless
 * READER_FROM_EMAIL says otherwise). Replies go there too. Without a key it does nothing. It never throws.
 */
import { readerFromEmail, readerReplyTo } from '@/lib/newsletter/sender'

export async function sendConfirmEmail(to: string, mail: { subject: string; text: string; html: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false
  const from = readerFromEmail()
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
        reply_to: readerReplyTo(),
      }),
    })
    if (!res.ok) console.error('Confirm email not sent:', res.status)
    return res.ok
  } catch (err) {
    console.error('Confirm email not sent:', err)
    return false
  }
}
