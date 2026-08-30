// Watchlist prober: bulk-imports ecosystem companies as INACTIVE registry
// rows and probes each one's likely event-page URLs so the weekly scout can
// prioritize verification. Active (is_active=true) rows = verified sources;
// watchlist rows stay inactive until a scout run confirms a real calendar.
//
// Usage: node scripts/events/probe-watchlist.mjs universe_a.json [universe_b.json ...]
// Input rows: {name, domain, category, events_url_guess?, note?}
// category → organizer_type: fund_admin | tech_vendor | law_firm |
//   accounting_firm | media | other (anything else falls back to 'other')
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
const TYPES = new Set(['fund_admin', 'tech_vendor', 'law_firm', 'accounting_firm', 'media', 'association', 'community', 'conference_producer', 'other'])
const UA = 'Mozilla/5.0 (compatible; FundOpsHQ-SourceProbe/1.0; +https://fundopshq.com/events)'
const TODAY = new Date().toISOString().split('T')[0]

function candidates(row) {
  const d = row.domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const urls = []
  if (row.events_url_guess) urls.push(row.events_url_guess)
  for (const path of ['/events', '/webinars', '/insights/events', '/news-and-events', '/resources/events']) {
    urls.push(`https://www.${d}${path}`)
  }
  return [...new Set(urls)]
}

async function probe(url) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(12000),
    })
    if (res.status !== 200) return { status: res.status, url: res.url, hasEventContent: false }
    const text = (await res.text()).slice(0, 60000)
    const hasEventContent = /\b(webinar|upcoming event|register|event calendar|conference)\b/i.test(text)
    return { status: 200, url: res.url, hasEventContent }
  } catch (err) {
    return { status: 0, url, hasEventContent: false, error: err.name === 'TimeoutError' ? 'timeout' : 'fetch-error' }
  }
}

const { data: existing } = await supabase.from('event_sources').select('name')
const taken = new Set((existing ?? []).map((r) => r.name.toLowerCase()))

const rows = process.argv.slice(2).flatMap((f) => JSON.parse(readFileSync(f, 'utf8')))
let inserted = 0
let skippedExisting = 0
const summary = { hit: 0, blocked: 0, none: 0 }

const queue = [...rows]
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const row = queue.shift()
      if (!row?.name || !row?.domain) continue
      if (taken.has(row.name.toLowerCase())) {
        skippedExisting++
        continue
      }
      taken.add(row.name.toLowerCase())

      let best = null
      for (const url of candidates(row)) {
        const r = await probe(url)
        if (r.status === 200 && r.hasEventContent) {
          best = { ...r, verdict: 'hit' }
          break
        }
        if (!best || (r.status === 403 && best.status !== 200)) best = { ...r, verdict: r.status === 403 ? 'blocked' : 'none' }
      }

      const verdict = best?.verdict ?? 'none'
      summary[verdict] = (summary[verdict] ?? 0) + 1

      const { error } = await supabase.from('event_sources').insert({
        name: row.name,
        url: best?.status === 200 ? best.url : `https://www.${row.domain.replace(/^https?:\/\//, '')}`,
        organizer_type: TYPES.has(row.category) ? row.category : 'other',
        tier: 4,
        ingestion_method: verdict === 'hit' ? 'scrape' : verdict === 'blocked' ? 'blocked' : 'manual',
        ops_relevance: 'medium',
        region: 'north_america',
        is_active: false,
        notes: `WATCHLIST (unverified) — probed ${TODAY}: ${verdict}${best?.status ? ` (${best.status})` : ''}. ${row.note ?? ''}`.trim(),
      })
      if (!error) inserted++
    }
  })
)

console.log(`watchlist inserted: ${inserted} | already tracked: ${skippedExisting}`)
console.log(`probe verdicts — event page found: ${summary.hit} | blocked: ${summary.blocked} | none found: ${summary.none}`)
console.log('These rows are INACTIVE. The scout skill activates them as it verifies real calendars (quota per run).')
