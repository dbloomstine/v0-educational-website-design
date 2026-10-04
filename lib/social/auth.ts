import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'

/**
 * The social desk's routes (/api/social/*) have one caller: the nightly job in
 * the `fundopshq-social` repository, which sends
 * `Authorization: Bearer <SOCIAL_SECRET>`.
 *
 * A secret of its own, not CRON_SECRET. That one also opens the routes that
 * send the newsletter and the outreach emails, and it should not have to live
 * in a second repository; this one opens nothing but these routes.
 *
 * Returns the refusal to send back, or null when the caller may proceed.
 */
export function socialGate(req: Request): NextResponse | null {
  const secret = process.env.SOCIAL_SECRET
  if (!secret) return NextResponse.json({ error: 'The social routes are not switched on' }, { status: 503 })
  const header = req.headers.get('authorization') ?? ''
  const given = Buffer.from(header.startsWith('Bearer ') ? header.slice(7) : '')
  const wanted = Buffer.from(secret)
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
