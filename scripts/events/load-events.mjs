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
// Functional-area topics — must match EVENT_TOPIC_LABELS in lib/events/constants.ts
const TOPICS = ['compliance_regulatory','fund_finance','accounting_tax','technology_ai','fundraising_ir','legal','esg','talent']
const TODAY = new Date().toISOString().split('T')[0]

// City normalization — the /events city filter matches on exact strings, so
// every alias must collapse to one canonical name before insert.
const CITY_MAP = {
  'nyc': 'New York', 'new york city': 'New York', 'manhattan': 'New York', 'brooklyn': 'New York',
  'sf': 'San Francisco', 'san fran': 'San Francisco',
  'la': 'Los Angeles',
  'dc': 'Washington DC', 'washington': 'Washington DC', 'washington, d.c.': 'Washington DC',
  'washington d.c.': 'Washington DC', 'washington dc': 'Washington DC', 'washington, dc': 'Washington DC',
  'greater london': 'London',
  'miami beach': 'Miami',
  'west hollywood': 'Los Angeles',
  'luxembourg city': 'Luxembourg',
}
function normalizeCity(city) {
  if (!city) return null
  const trimmed = String(city).trim()
  if (!trimmed) return null
  return CITY_MAP[trimmed.toLowerCase()] ?? trimmed
}

// Reserved landing-page slugs — keep in sync with lib/events/collections.ts.
// An event slug must never shadow one (the route checks collections first,
// but colliding here would make the event page unreachable).
const RESERVED_SLUGS = new Set([
  'submit','new-york','london','boston','chicago','san-francisco','los-angeles','dallas',
  'washington-dc','miami','paris','luxembourg','dublin','dubai','singapore',
  'compliance','fund-finance','accounting-tax','tech-ai','fundraising',
  'webinars','networking','free',
])

function slugify(name, takenSlugs) {
  let base = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
  if (!base || RESERVED_SLUGS.has(base)) base = `${base || 'event'}-listing`
  let slug = base
  let n = 2
  while (takenSlugs.has(slug)) {
    slug = `${base}-${n}`
    n++
  }
  takenSlugs.add(slug)
  return slug
}

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

const { data: existing } = await supabase.from('industry_events').select('event_url, slug')
const seen = new Set((existing ?? []).map((r) => r.event_url.toLowerCase()))
const takenSlugs = new Set((existing ?? []).map((r) => r.slug).filter(Boolean))

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
    const topics = (r.topics ?? []).filter((t) => TOPICS.includes(t))
    if (problems.length) { skipped.push(`${r.name}: ${problems.join('; ')}`); continue }
    const urlKey = r.event_url.toLowerCase()
    if (seen.has(urlKey)) { skipped.push(`${r.name}: duplicate url`); continue }
    seen.add(urlKey)

    const { error } = await supabase.from('industry_events').insert({
      slug: slugify(r.name, takenSlugs),
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
      city: normalizeCity(r.city),
      state_region: r.state_region ?? null,
      country: r.country ?? null,
      venue: r.venue ?? null,
      event_format: r.event_format ?? 'in_person',
      event_kind: r.event_kind ?? 'conference',
      cost_type: r.cost_type ?? 'paid',
      price_note: r.price_note ?? null,
      fund_categories: cats,
      topics,
      expected_attendance: Number.isInteger(r.expected_attendance) && r.expected_attendance > 0 ? r.expected_attendance : null,
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
