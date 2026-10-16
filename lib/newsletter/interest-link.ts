/**
 * The one-click "follow" links at the foot of the daily email (2026-10-16).
 *
 * 146 of 154 readers had never said what they follow, because the only
 * places to say so were the signup box (most readers joined before it asked)
 * and a preferences page behind a footer link. Each edition now carries a row
 * of links, one per interest; the link opens a small page that asks once and
 * saves. The link names the reader with a token signed by the server, so an
 * address alone cannot set anyone's choices, and the token has no expiry
 * because the editions it sits in are read for months.
 *
 * The page asks before it saves: corporate link scanners open every link in a
 * message (the clicks sat at 40 a day whatever went out), and a link that
 * acted on being opened would have ticked boxes for readers who never tapped.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const secret = () => process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const sign = (text: string, key: string) => createHmac('sha256', key).update(`interest:${text}`).digest('base64url')

/** `<subscriber id>.<signature>`, or null without a secret or a proper id. */
export function makeInterestToken(subscriberId: string, key = secret()): string | null {
  if (!key || !UUID.test(subscriberId)) return null
  return `${subscriberId}.${sign(subscriberId, key)}`
}

/** The subscriber a token names, or null if it is not ours or has been altered. */
export function readInterestToken(token: unknown, key = secret()): string | null {
  if (!key || typeof token !== 'string') return null
  const [id, mark, ...rest] = token.split('.')
  if (rest.length || !UUID.test(id ?? '') || !mark) return null
  const want = Buffer.from(sign(id, key))
  const got = Buffer.from(mark)
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null
  return id
}

export const INTEREST_ROUTE = 'https://fundopshq.com/api/newsletter/interest'

/** The link for one interest in one reader's email. */
export function interestLink(token: string, id: string): string {
  return `${INTEREST_ROUTE}?t=${encodeURIComponent(token)}&i=${encodeURIComponent(id)}`
}
