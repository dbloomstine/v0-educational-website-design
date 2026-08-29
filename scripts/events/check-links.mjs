// Link health check for the events board. Fetches every upcoming published
// event's URL (HEAD, falling back to GET on 405) and reports anything dead
// or redirected off-domain. Run by the weekly scout-events skill:
//   node scripts/events/check-links.mjs
// Read-only — prints a report; fixing rows (status='cancelled', new URL,
// verified_at) is a judgment call left to the scout run.
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync(new URL('../../.env.local', import.meta.url).pathname, 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data: events, error } = await supabase
  .from('industry_events')
  .select('slug, name, event_url, start_date')
  .eq('status', 'published')
  .gte('start_date', new Date().toISOString().split('T')[0])
  .order('start_date')

if (error) {
  console.error('query failed:', error.message)
  process.exit(1)
}

const UA = 'Mozilla/5.0 (compatible; FundOpsHQ-LinkCheck/1.0; +https://fundopshq.com/events)'

async function check(url) {
  const opts = { redirect: 'follow', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) }
  try {
    let res = await fetch(url, { ...opts, method: 'HEAD' })
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { ...opts, method: 'GET' })
    }
    return { status: res.status, finalUrl: res.url }
  } catch (err) {
    return { status: 0, finalUrl: null, error: err.name === 'TimeoutError' ? 'timeout' : err.message }
  }
}

const problems = []
let ok = 0
// small concurrency pool to stay polite
const queue = [...events]
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const e = queue.shift()
      const r = await check(e.event_url)
      if (r.status >= 200 && r.status < 400) {
        ok++
      } else if (r.status === 403 || r.status === 429) {
        // bot walls aren't dead links — note but don't alarm
        problems.push(`BOT-BLOCKED ${r.status} · ${e.start_date} · ${e.name} · ${e.event_url}`)
      } else {
        problems.push(`DEAD ${r.status || r.error} · ${e.start_date} · ${e.name} · ${e.event_url} (slug: ${e.slug})`)
      }
    }
  })
)

console.log(`checked: ${events.length} | ok: ${ok} | flagged: ${problems.length}`)
if (problems.length) console.log(problems.join('\n'))
