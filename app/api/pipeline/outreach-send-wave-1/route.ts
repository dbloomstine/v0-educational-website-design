/**
 * Wave 1 cron entrypoint — dedicated path so Vercel cron registers it
 * separately from wave 2.
 *
 * Why this exists: between 2026-04-22 and 2026-04-23 we observed three
 * consecutive silent misses of the cron at `/api/pipeline/outreach-send`
 * with `?cap=25` and `?cap=50` query-param variants. The registration
 * was visible in Vercel's project.crons API, but the cron never hit the
 * function (no 200, no 401, no 500 — nothing in cold_outreach_sent and
 * nothing in Gmail, even with the observability fix that emits a status
 * email on every skip path). Newsletter-send and news-ingest crons on
 * the same project continued firing normally.
 *
 * The working pattern in the same vercel.json (news-ingest with
 * `?tiers=1,2`, `?tiers=3,4,5`, `?tiers=6`) has three same-base-path
 * entries all scheduled at minute `:00`. The broken pattern had two
 * same-base-path entries at DIFFERENT minutes AND different hours. Our
 * hypothesis: Vercel's cron scheduler gets confused when two entries
 * share a base path but have orthogonal schedules. The fix is
 * path-based routing — wave 1 gets its own route, wave 2 gets its own
 * route. Each passes through to the shared handler in ../outreach-send.
 */
import { GET as outreachSendHandler } from '../outreach-send/route'

export const maxDuration = 300 // must match the shared handler

export async function GET(req: Request) {
  const url = new URL(req.url)
  url.searchParams.set('cap', '25')
  const forwarded = new Request(url.toString(), {
    method: 'GET',
    headers: req.headers,
  })
  return outreachSendHandler(forwarded)
}
