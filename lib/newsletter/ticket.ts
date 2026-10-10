/**
 * A ticket to say what you follow, for a reader who is already on the list
 * and has never said (2026-10-10).
 *
 * Danny typed an address that was already subscribed into the homepage's
 * form, and was not asked what he follows: the form could not ask, because the
 * only key to a subscriber's choices was the token in their own email, and
 * that is never handed to whoever types an address.
 *
 * The ticket is a narrower key. The subscribe route gives one out only for a
 * subscriber with NO choices on file; it lasts half an hour; and the
 * preferences route honours it only while there are still no choices. So the
 * most a stranger who knows an address can do with one is tick boxes for a
 * reader who never has, once, which that reader can change from any edition.
 * It can never change choices somebody made, unsubscribe anyone, or be used
 * later.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

const LIFE_MS = 30 * 60 * 1000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Signed with a secret only the server holds. Without one there are no tickets, and the forms carry on without the question. */
const secret = () => process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const sign = (text: string, key: string) => createHmac('sha256', key).update(text).digest('base64url')

export function makeTicket(subscriberId: string, now = Date.now(), key = secret()): string | null {
  if (!key || !UUID.test(subscriberId)) return null
  const body = `${subscriberId}.${now + LIFE_MS}`
  return `${body}.${sign(body, key)}`
}

/**
 * The subscriber a ticket is for and when it was made, or null if it is not ours, has been altered, or has run out.
 * `issuedAt` is what lets the same ticket save again as boxes are ticked one by one (the preferences route allows a
 * write over choices made since the ticket was issued, and over nothing older).
 */
export function readTicket(ticket: unknown, now = Date.now(), key = secret()): { id: string; issuedAt: number } | null {
  if (!key || typeof ticket !== 'string') return null
  const [id, expires, mark, ...rest] = ticket.split('.')
  if (rest.length || !UUID.test(id ?? '') || !/^\d{13}$/.test(expires ?? '') || !mark) return null
  const want = Buffer.from(sign(`${id}.${expires}`, key))
  const got = Buffer.from(mark)
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null
  return Number(expires) > now ? { id, issuedAt: Number(expires) - LIFE_MS } : null
}
