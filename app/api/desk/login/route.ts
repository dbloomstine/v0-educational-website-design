import { NextResponse } from 'next/server'
import { verifyPassword } from '@/lib/crm/password'
import { signSession, SESSION_COOKIE, SESSION_TTL_SECONDS } from '@/lib/crm/session'

export const runtime = 'nodejs' // scrypt needs Node, not edge

// Crude in-process rate limit. Resets on cold start, which is fine — it exists
// to make online guessing slow, not to be a durable counter.
const attempts = new Map<string, { n: number; first: number }>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 8

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const rec = attempts.get(ip)
  if (!rec || now - rec.first > WINDOW_MS) {
    attempts.set(ip, { n: 1, first: now })
    return false
  }
  rec.n += 1
  return rec.n > MAX_ATTEMPTS
}

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many attempts. Wait 15 minutes.' },
      { status: 429 }
    )
  }

  const secret = process.env.CRM_SESSION_SECRET
  const stored = process.env.CRM_PASSWORD_HASH
  if (!secret || !stored) {
    return NextResponse.json({ error: 'Lead Desk is not configured.' }, { status: 500 })
  }

  let password = ''
  try {
    const body = await req.json()
    password = typeof body?.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  if (!verifyPassword(password, stored)) {
    // Deliberately vague — no hint about whether anything else was wrong.
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const token = await signSession(secret)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
  return res
}
