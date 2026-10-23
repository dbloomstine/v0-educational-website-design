import { adsTxt } from '@/lib/ads/config'

// Built once: the publisher ID is a build-time variable (lib/ads/config.ts), so a change ships with a redeploy.
export const dynamic = 'force-static'

/** /ads.txt: Google's one line while AdSense is on (verify or live), a 404 while it is off. */
export function GET() {
  const body = adsTxt()
  if (!body) return new Response('Not found\n', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
