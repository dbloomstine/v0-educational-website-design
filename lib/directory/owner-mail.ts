/**
 * The emails a directory owner gets (plan B1, B3, B7, B8): plain, short, in
 * the house style of the claim email (lib/directory/claim.ts claimEmail). Each
 * builder returns { subject, text, html } and repeats nothing a stranger typed:
 * the profile's own name and firm are ours, and a reason or a reply comes from
 * the desk. Sent from the reader address (lib/newsletter/sender.ts), replies to
 * Danny.
 */
import { readerFromEmail, readerReplyTo } from '@/lib/newsletter/sender'
import { CONFIRM_TTL_DAYS } from '@/lib/submit/news-submission'

export const SITE = 'https://fundopshq.com'

export interface Mail {
  subject: string
  text: string
  html: string
}

interface Named {
  full_name: string
  firm_name: string
}

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Paragraphs as given (already escaped HTML), a button, then small print. */
function frame(paras: string[], button: { href: string; label: string } | null, small: string[] = []): string {
  const p = (h: string) => `<p style="font-size:15px;line-height:1.5;margin:0 0 14px;">${h}</p>`
  const s = (h: string) => `<p style="font-size:13px;line-height:1.5;color:#555;margin:0 0 6px;">${h}</p>`
  const b = button
    ? `<p style="margin:4px 0 18px;"><a href="${esc(button.href)}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 20px;border-radius:2px;">${esc(button.label)}</a></p>`
    : ''
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f8f5ec;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;">
<div style="max-width:520px;margin:0 auto;">
${paras.map(p).join('\n')}
${b}
${small.map(s).join('\n')}
</div></body></html>`
}

const text = (lines: (string | null | false | undefined)[]) => [...lines.filter((l): l is string => typeof l === 'string'), '', 'FundOpsHQ'].join('\n')

const day = (now: Date) => now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })

export const signInPath = (slug: string) => `/directory/claim?p=${slug}`

/** After a claim is confirmed: what they can do now, and how to come back. */
export function claimConfirmedEmail(p: Named & { slug: string }, profilePath: string): Mail {
  const profile = `${SITE}${profilePath}`
  const signIn = `${SITE}${signInPath(p.slug)}`
  return {
    subject: 'Your FundOpsHQ directory profile is claimed',
    text: text([
      `You have claimed the FundOpsHQ directory profile of ${p.full_name} (${p.firm_name}).`,
      '',
      'You can add a headline, a short description, a photo, a contact link and notable matters. We review each change before it shows, usually within two business days.',
      `Your profile: ${profile}`,
      '',
      `To edit it later, choose "Sign in to edit" on the profile, or go to ${signIn}. We email a one-time link to this address. There is no password.`,
    ]),
    html: frame(
      [
        `You have claimed the FundOpsHQ directory profile of <strong>${esc(p.full_name)}</strong> (${esc(p.firm_name)}).`,
        'You can add a headline, a short description, a photo, a contact link and notable matters. We review each change before it shows, usually within two business days.',
      ],
      { href: profile, label: 'See your profile' },
      [`To edit it later, choose &ldquo;Sign in to edit&rdquo; on the profile. We email a one-time link to this address. There is no password.`],
    ),
  }
}

/** "Sign in to edit": a one-time link to the address that claimed the profile. */
export function signInEmail(p: Named, token: string): Mail {
  const link = `${SITE}/directory/claim/confirm?t=${token}`
  return {
    subject: 'Sign in to edit your FundOpsHQ directory profile',
    text: text([
      `Here is your link to edit the FundOpsHQ directory profile of ${p.full_name} (${p.firm_name}):`,
      link,
      '',
      `It works once and expires in ${CONFIRM_TTL_DAYS} days. If you didn't ask for it, ignore this email.`,
    ]),
    html: frame(
      [`Here is your link to edit the FundOpsHQ directory profile of <strong>${esc(p.full_name)}</strong> (${esc(p.firm_name)}).`],
      { href: link, label: 'Edit my profile' },
      [`It works once and expires in ${CONFIRM_TTL_DAYS} days.`, 'If you didn&rsquo;t ask for it, ignore this email.'],
    ),
  }
}

/** To an earlier claimer, when someone else at the firm confirms a claim on the same profile. */
export function otherClaimEmail(p: Named & { slug: string }, otherDomain: string, profilePath: string, now = new Date()): Mail {
  const profile = `${SITE}${profilePath}`
  return {
    subject: 'Someone else claimed your FundOpsHQ directory profile',
    text: text([
      `On ${day(now)} someone with an address at ${otherDomain} confirmed a claim on the FundOpsHQ directory profile of ${p.full_name} (${p.firm_name}). You claimed it earlier.`,
      '',
      'If that was a colleague acting for you, there is nothing to do. If not, reply to this email and we will look into it.',
      `The profile: ${profile}`,
    ]),
    html: frame(
      [
        `On ${day(now)} someone with an address at ${esc(otherDomain)} confirmed a claim on the FundOpsHQ directory profile of <strong>${esc(p.full_name)}</strong> (${esc(p.firm_name)}). You claimed it earlier.`,
        'If that was a colleague acting for you, there is nothing to do. If not, reply to this email and we will look into it.',
      ],
      { href: profile, label: 'See the profile' },
    ),
  }
}

/** The desk approved the edits. */
export function editsLiveEmail(p: Named, profilePath: string): Mail {
  const profile = `${SITE}${profilePath}`
  return {
    subject: 'Your directory profile changes are live',
    text: text([`Your changes to the FundOpsHQ directory profile of ${p.full_name} (${p.firm_name}) are live.`, profile, '', 'Pages refresh within the hour.']),
    html: frame([`Your changes to the FundOpsHQ directory profile of <strong>${esc(p.full_name)}</strong> (${esc(p.firm_name)}) are live.`], { href: profile, label: 'See your profile' }, [
      'Pages refresh within the hour.',
    ]),
  }
}

/** The desk did not accept the edits; the reason is the desk's own words. */
export function editsNotAcceptedEmail(p: Named & { slug: string }, reason: string | null): Mail {
  const signIn = `${SITE}${signInPath(p.slug)}`
  const why = reason?.trim() || null
  return {
    subject: 'Your directory profile changes were not published',
    text: text([
      `We did not publish your changes to the FundOpsHQ directory profile of ${p.full_name} (${p.firm_name}).`,
      why ? `Why: ${why}` : null,
      '',
      `You can sign in and send them again: ${signIn}`,
      'Questions? Reply to this email.',
    ]),
    html: frame(
      [
        `We did not publish your changes to the FundOpsHQ directory profile of <strong>${esc(p.full_name)}</strong> (${esc(p.firm_name)}).`,
        ...(why ? [`Why: ${esc(why)}`] : []),
        'You can sign in and send them again. Questions? Reply to this email.',
      ],
      { href: signIn, label: 'Sign in to edit' },
    ),
  }
}

/** A correction or removal request was resolved. To the address the requester gave: nothing about the profile beyond its name. */
export function requestResolvedEmail(
  r: { kind: 'removal' | 'correction'; person_name: string | null; done: boolean },
  reply: string | null,
): Mail {
  const what = r.kind === 'removal' ? 'removal' : 'correction'
  const about = r.person_name ? ` about the directory profile of ${r.person_name}` : ''
  const outcome = r.done
    ? r.kind === 'removal'
      ? 'The profile has been taken off the directory.'
      : 'We made the correction. Pages refresh within the hour.'
    : r.kind === 'removal'
      ? 'We have kept the profile: it lists only what the firm publishes on its own site.'
      : 'We checked the firm’s own page and left the profile as it is.'
  const note = reply?.trim() || null
  return {
    subject: `Your directory ${what} request`,
    text: text([`Thank you for your ${what} request${about}.`, outcome, note, '', 'Questions? Reply to this email.']),
    html: frame([`Thank you for your ${what} request${r.person_name ? ` about the directory profile of <strong>${esc(r.person_name)}</strong>` : ''}.`, esc(outcome), ...(note ? [esc(note)] : [])], null, [
      'Questions? Reply to this email.',
    ]),
  }
}

/** A suggestion was looked at. To the address the sender gave; names only what they suggested, as they typed it, escaped. */
export function suggestionResolvedEmail(s: { full_name: string | null; firm_name: string; outcome: 'added' | 'rejected' | 'done' }, profileUrl: string | null, reply: string | null): Mail {
  const what = s.full_name ? `${s.full_name} (${s.firm_name})` : s.firm_name
  const outcome =
    s.outcome === 'added'
      ? profileUrl
        ? 'It is in the directory now.'
        : 'We are adding it: it shows once the next refresh has run.'
      : s.outcome === 'rejected'
        ? 'We could not add it this time: the directory lists only partners and directors whose fund work the firm’s own site describes.'
        : 'We have looked at it. Thank you.'
  const note = reply?.trim() || null
  return {
    subject: 'Your FundOpsHQ directory suggestion',
    text: text([`Thank you for suggesting ${what} for the FundOpsHQ directory.`, outcome, profileUrl, note, '', 'Questions? Reply to this email.']),
    html: frame([`Thank you for suggesting ${esc(what)} for the FundOpsHQ directory.`, esc(outcome), ...(note ? [esc(note)] : [])], profileUrl ? { href: profileUrl, label: 'See the profile' } : null, [
      'Questions? Reply to this email.',
    ]),
  }
}

/** To the claimer of the old profile, once the desk has linked a move: confirm from the new firm's address. */
export function moveEmail(from: Named, to: Named & { slug: string; firm_domain: string }): Mail {
  const link = `${SITE}${signInPath(to.slug)}`
  return {
    subject: 'Moved firms? Bring your FundOpsHQ directory profile with you',
    text: text([
      `We see a new profile for ${to.full_name} at ${to.firm_name}. You claimed the one at ${from.firm_name}.`,
      '',
      `Claim the new one with your work address at ${to.firm_domain}. What you added before (headline, description, photo, notable matters) comes with you, for a quick review:`,
      link,
      '',
      'If this is not you, ignore this email.',
    ]),
    html: frame(
      [
        `We see a new profile for <strong>${esc(to.full_name)}</strong> at ${esc(to.firm_name)}. You claimed the one at ${esc(from.firm_name)}.`,
        `Claim the new one with your work address at ${esc(to.firm_domain)}. What you added before (headline, description, photo, notable matters) comes with you, for a quick review.`,
      ],
      { href: link, label: 'Claim my new profile' },
      ['If this is not you, ignore this email.'],
    ),
  }
}

/** The monthly stats email is off unless DIRECTORY_STATS_EMAIL=on (scripts/directory/stats-email.ts). */
export function statsEmailEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return ['on', 'true', '1', 'yes'].includes((env.DIRECTORY_STATS_EMAIL ?? '').trim().toLowerCase())
}

/** The monthly numbers (behind DIRECTORY_STATS_EMAIL). Counts only: no comparison with anyone else. */
export function statsEmail(p: Named & { slug: string }, month: string, views: number, profilePath: string): Mail {
  const profile = `${SITE}${profilePath}`
  const signIn = `${SITE}${signInPath(p.slug)}`
  const times = `${views.toLocaleString('en-US')} ${views === 1 ? 'time' : 'times'}`
  return {
    subject: `Your directory profile in ${month}: viewed ${times}`,
    text: text([
      `The FundOpsHQ directory profile of ${p.full_name} (${p.firm_name}) was viewed ${times} in ${month}.`,
      profile,
      '',
      `To add to it: ${signIn}`,
      'To stop these monthly emails, reply "stop".',
    ]),
    html: frame([`The FundOpsHQ directory profile of <strong>${esc(p.full_name)}</strong> (${esc(p.firm_name)}) was viewed <strong>${times}</strong> in ${esc(month)}.`], { href: profile, label: 'See your profile' }, [
      `<a href="${esc(signIn)}" style="color:#555;">Sign in to add to it</a>.`,
      'To stop these monthly emails, reply &ldquo;stop&rdquo;.',
    ]),
  }
}

/** Sends one owner email through Resend. Without a key it does nothing. It never throws. */
export async function sendDirectoryMail(to: string, mail: Mail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `FundOpsHQ Directory <${readerFromEmail()}>`, to, subject: mail.subject, text: mail.text, html: mail.html, reply_to: readerReplyTo() }),
    })
    if (!res.ok) console.error('[directory] owner email not sent:', res.status)
    return res.ok
  } catch (err) {
    console.error('[directory] owner email not sent:', err)
    return false
  }
}
