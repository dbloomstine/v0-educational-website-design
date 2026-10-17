/**
 * After resolve-google-urls.ts: send the last --days days of resolved rows back
 * through enrichment and classification, so their summaries are rebuilt from the
 * publisher's text instead of the headline. Danny approved this for 7 days on
 * 2026-10-16 (about $3 of classifier spend).
 *
 *   npx tsx --env-file=.env.local scripts/news/requeue-resolved.ts --dry
 *   npx tsx --env-file=.env.local scripts/news/requeue-resolved.ts --apply --days 7
 *
 * Selects rows whose extracted_data.google_url is set (resolved) and whose
 * enrichment_error says the Google interstitial was skipped, i.e. rows whose text
 * was never fetched. Resets enriched_at/enrichment_error and sets
 * classification_status = 'pending', processing_attempts = 0. Nothing else changes;
 * the classifier replaces tldr/type/extracted_data when it writes the row back.
 */
import { createClient } from '@supabase/supabase-js'
async function main() {
const args = process.argv.slice(2)
const flag = (n: string) => args.includes(`--${n}`)
const opt = (n: string, d: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d }
const days = Number(opt('days', '7'))
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const since = new Date(Date.now() - days * 86_400_000).toISOString()
const { data, error } = await db.from('news_items').select('id, title').gte('published_date', since.slice(0, 10)).not('extracted_data->>google_url', 'is', null).ilike('enrichment_error', '%google news redirect%').limit(5000)
if (error) throw error
console.log(`${data!.length} rows resolved in the last ${days} days whose text was never fetched`)
if (!flag('apply')) { console.log(data!.slice(0, 5).map((r) => ` - ${r.title}`).join('\n')); return }
let n = 0
for (let i = 0; i < data!.length; i += 200) {
  const ids = data!.slice(i, i + 200).map((r) => r.id)
  const { error: e } = await db.from('news_items').update({ enriched_at: null, enrichment_error: null, classification_status: 'pending', processing_attempts: 0, updated_at: new Date().toISOString() }).in('id', ids)
  if (e) throw e
  n += ids.length
}
console.log(`requeued ${n}; the hourly enrich (:00) and classify (:30) runs take them from here, 60 and 200 a run`)
}
main().catch((e) => { console.error(e.message); process.exit(1) })
