/**
 * Nightly cron entrypoint — one small wave, cap 4.
 *
 * Restarted 2026-09-06 after the pipeline had been dormant since the
 * 2026-04-21 token death. Deliberately tiny: a sending pattern that has
 * been dead for months should warm back up, and Danny asked for "three to
 * five a day." Same path-based-routing rationale as the wave-1/wave-2
 * wrappers (see ../outreach-send-wave-1/route.ts): a dedicated path per
 * schedule avoids the same-base-path cron confusion seen in April.
 */
import { GET as outreachSendHandler } from '../outreach-send/route'

export const maxDuration = 300 // must match the shared handler

export async function GET(req: Request) {
  const url = new URL(req.url)
  url.searchParams.set('cap', '4')
  const forwarded = new Request(url.toString(), {
    method: 'GET',
    headers: req.headers,
  })
  return outreachSendHandler(forwarded)
}
