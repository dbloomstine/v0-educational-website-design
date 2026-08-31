import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/crm/session'

/**
 * Gates Lead Desk. Next 16 renamed the `middleware` convention to `proxy`.
 * Scoped by `config.matcher` to /desk and /api/desk ONLY — it must never
 * affect the public site.
 */

const PUBLIC_PATHS = new Set(['/desk/login', '/api/desk/login'])

function harden(res: NextResponse): NextResponse {
  res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')
  res.headers.set('Referrer-Policy', 'no-referrer')
  res.headers.set('Cache-Control', 'no-store, max-age=0')
  return res
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const secret = process.env.CRM_SESSION_SECRET
  const authed = secret
    ? await verifySession(secret, req.cookies.get(SESSION_COOKIE)?.value)
    : false

  if (PUBLIC_PATHS.has(pathname)) {
    // Already signed in and hitting the login page — send them to the grid.
    if (authed && pathname === '/desk/login') {
      return harden(NextResponse.redirect(new URL('/desk', req.url)))
    }
    return harden(NextResponse.next())
  }

  if (!authed) {
    if (pathname.startsWith('/api/')) {
      return harden(
        NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      )
    }
    return harden(NextResponse.redirect(new URL('/desk/login', req.url)))
  }

  return harden(NextResponse.next())
}

export const config = {
  matcher: ['/desk/:path*', '/api/desk/:path*'],
}
