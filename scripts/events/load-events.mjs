// Loader: validated insert of scout-events research-batch JSON into
// industry_events. Usage (from repo root or anywhere):
//   node scripts/events/load-events.mjs batch_a.json [batch_b.json ...]
// Reads Supabase creds from the repo's .env.local. Skips rows that fail
// enum/date validation or already exist (case-insensitive event_url).
// See ~/.claude/skills/scout-events for the weekly workflow that
// produces the batch files.
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

const ENUMS = {
  organizer_type: ['association','conference_producer','law_firm','accounting_firm','fund_admin','tech_vendor','community','media','other'],
  event_format: ['in_person','virtual','hybrid'],
  event_kind: ['conference','summit','forum','webinar','training','networking','awards','roundtable','other'],
  cost_type: ['free','paid','member_only','invite_only','mixed'],
  ops_relevance: ['high','medium','low'],
  region: ['north_america','europe','asia_pacific','middle_east','latam','global'],
}
const CATS = ['PE','VC','credit','hedge','real_estate','infrastructure','secondaries','gp_stakes']
const TODAY = new Date().toISOString().split('T')[0]

const { data: sources, error: srcErr } = await supabase.from('event_sources').select('id, name')
if (srcErr) { console.error('source fetch failed:', srcErr.message); process.exit(1) }
const sourceByName = new Map(sources.map((s) => [s.name.toLowerCase(), s.id]))
function resolveSource(key) {
  if (!key) return null
  const k = key.toLowerCase()
  if (sourceByName.has(k)) return sourceByName.get(k)
  for (const [name, id] of sourceByName) {
    if (name.startsWith(k) || k.startsWith(name)) return id
  }
  return null
}

const { data: existing } = await supabase.from('industry_events').select('event_url')
const seen = new Set((existing ?? []).map((r) => r.event_url.toLowerCase()))

let inserted = 0
const skipped = []
for (const file of process.argv.slice(2)) {
  const rows = JSON.parse(readFileSync(file, 'utf8'))
  for (const r of rows) {
    const problems = []
    if (!r.name || !r.event_url || !r.organizer_name) problems.push('missing required field')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.start_date ?? '') || r.start_date < TODAY) problems.push(`bad start_date ${r.start_date}`)
    if (r.end_date && (!/^\d{4}-\d{2}-\d{2}$/.test(r.end_date) || r.end_date < r.start_date)) problems.push(`bad end_date ${r.end_date}`)
    for (const [field, allowed] of Object.entries(ENUMS)) {
      if (r[field] != null && !allowed.includes(r[field])) problems.push(`bad ${field} ${r[field]}`)
    }
    const cats = (r.fund_categories ?? []).filter((c) => CATS.includes(c))
    if (problems.length) { skipped.push(`${r.name}: ${problems.join('; ')}`); continue }
    const urlKey = r.event_url.toLowerCase()
    if (seen.has(urlKey)) { skipped.push(`${r.name}: duplicate url`); continue }
    seen.add(urlKey)

    const { error } = await supabase.from('industry_events').insert({
      name: r.name,
      description: r.description ?? null,
      event_url: r.event_url,
      registration_url: r.registration_url ?? null,
      organizer_name: r.organizer_name,
      organizer_type: r.organizer_type ?? 'other',
      event_source_id: resolveSource(r.source_key),
      start_date: r.start_date,
      end_date: r.end_date && r.end_date !== r.start_date ? r.end_date : null,
      time_note: r.time_note ?? null,
      city: r.city ?? null,
      state_region: r.state_region ?? null,
      country: r.country ?? null,
      venue: r.venue ?? null,
      event_format: r.event_format ?? 'in_person',
      event_kind: r.event_kind ?? 'conference',
      cost_type: r.cost_type ?? 'paid',
      price_note: r.price_note ?? null,
      fund_categories: cats,
      ops_relevance: r.ops_relevance ?? 'medium',
      region: r.region,
      status: 'published',
      source_notes: `seeded ${TODAY} from verified research batch (${file.split('/').pop()})`,
      verified_at: new Date().toISOString(),
    })
    if (error) { skipped.push(`${r.name}: insert error ${error.message}`); continue }
    inserted++
  }
}

console.log(`inserted: ${inserted}`)
if (skipped.length) console.log('skipped:\n  ' + skipped.join('\n  '))
