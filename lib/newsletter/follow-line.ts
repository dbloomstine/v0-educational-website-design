/**
 * The follow line at the foot of the daily and welcome emails (2026-10-11).
 *
 * The same stories go out through the day as posts on LinkedIn and TikTok. A
 * reader of the email is the one person certain to want them, so the foot of
 * the email says where: the FundOpsHQ page, TikTok, and the editor's own
 * profile (Danny: "my personal and also the LinkedIn page"). One quiet line,
 * no icons, no images, nothing tracked.
 */
import { FOLLOW } from '@/lib/brand/social'

const LINK = 'color:rgba(248,245,236,0.8);text-decoration:underline;'

export function followLineHtml(): string {
  const links = FOLLOW.map((x) => `<a href="${x.href}" style="${LINK}">${x.label}</a>`)
  return `<span style="color:rgba(248,245,236,0.45);">Through the day:&nbsp;</span>${links.join('&nbsp;·&nbsp;')}`
}
