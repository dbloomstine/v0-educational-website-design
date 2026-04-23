/**
 * Wave 2 cron entrypoint — see ../outreach-send-wave-1/route.ts for
 * the full context on why we split wave 1 and wave 2 into dedicated
 * paths. Cap 50 is a running daily total, so when wave 2 fires after
 * wave 1 has already sent N emails, the shared handler's idempotency
 * guard computes `remaining = 50 - N` and sends up to that many more.
 */
import { GET as outreachSendHandler } from '../outreach-send/route'

export const maxDuration = 300

export async function GET(req: Request) {
  const url = new URL(req.url)
  url.searchParams.set('cap', '50')
  const forwarded = new Request(url.toString(), {
    method: 'GET',
    headers: req.headers,
  })
  return outreachSendHandler(forwarded)
}
