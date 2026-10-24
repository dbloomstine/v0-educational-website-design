import { badgeSvg } from '@/lib/directory/badge'
import { categoryBySlug } from '@/lib/directory/taxonomy'

/**
 * GET ?trade=fund-lawyers: the badge a claimed person can show on their own site (lib/directory/badge.ts).
 * The same image for everyone in a trade: no database, nothing recorded. Cached a day at the edge.
 */
export async function GET(req: Request) {
  const trade = categoryBySlug(new URL(req.url).searchParams.get('trade') ?? '')
  if (!trade?.live) return new Response('Not found', { status: 404 })
  return new Response(badgeSvg(trade), {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'",
    },
  })
}
