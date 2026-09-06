/** Nightly cron entrypoint for lookalike outreach: cap 2, mode from env (default draft). */
import { GET as handler } from '../outreach-lookalike/route'
export const maxDuration = 300
export async function GET(req: Request) {
  const url = new URL(req.url)
  url.searchParams.set('cap', '2')
  return handler(new Request(url.toString(), { method: 'GET', headers: req.headers }))
}
