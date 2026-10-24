/**
 * Load a crawl of firms' public bio pages into the directory (2026-10-24).
 *
 *   npx tsx --env-file=.env.local scripts/directory/load-people.ts <file.jsonl>            # dry run
 *   npx tsx --env-file=.env.local scripts/directory/load-people.ts <file.jsonl> --apply
 *
 * Options: --category fund_lawyer (the default) | fund_auditor | placement_agent | ...
 *          --today YYYY-MM-DD (the date stamped on people missing from the crawl)
 *
 * One JSON object a line: full_name, title, firm_name, firm_domain,
 * offices [{city, state}], practice_areas [], client_focus [], represents [],
 * bar_admissions [], education [{school, degree, year}], bio_url, fetched_at, slug.
 *
 * The rules (lib/directory/loader.ts, tested): upsert by slug; new people
 * arrive as `review` (not public); only the firm-site fields are written, never
 * a claim field or the status; a removed person stays removed; a person at a
 * firm in this file who is not in it is stamped missing_since (never deleted).
 * Without --apply nothing is written.
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { CATEGORY_IDS, type CategoryId } from '@/lib/directory/taxonomy'
import { FIRM_SITE_FIELDS, mergeRecord, missingFrom, parseRecord, type ExistingRow, type SourceRecord } from '@/lib/directory/loader'

const BATCH = 200

async function main() {
  const args = process.argv.slice(2)
  const valued = new Set(['--category', '--today'])
  const file = args.find((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]))
  const opt = (n: string) => {
    const i = args.indexOf(`--${n}`)
    return i >= 0 ? args[i + 1] : undefined
  }
  const apply = args.includes('--apply')
  const category = (opt('category') ?? 'fund_lawyer') as CategoryId
  const today = opt('today') ?? new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  if (!file) throw new Error('usage: load-people.ts <file.jsonl> [--apply] [--category fund_lawyer] [--today YYYY-MM-DD]')
  if (!CATEGORY_IDS.includes(category)) throw new Error(`unknown category ${category}`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new Error('--today must be YYYY-MM-DD')

  // Parse and check every line first: one bad file never half-loads.
  const records = new Map<string, SourceRecord>()
  const errors: string[] = []
  const warnings: string[] = []
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((text, i) => {
      if (!text.trim()) return
      let raw: unknown
      try {
        raw = JSON.parse(text)
      } catch {
        errors.push(`line ${i + 1}: not JSON`)
        return
      }
      const parsed = parseRecord(raw)
      if (!parsed.ok) return errors.push(`line ${i + 1}: ${parsed.error}`)
      warnings.push(...parsed.warnings)
      if (records.has(parsed.value.slug)) return errors.push(`line ${i + 1}: duplicate slug ${parsed.value.slug} (first kept)`)
      records.set(parsed.value.slug, parsed.value)
    })

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const existing: ExistingRow[] = []
  const cols = ['id', 'slug', 'category', 'status', 'missing_since', ...FIRM_SITE_FIELDS].join(', ')
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('directory_people').select(cols).order('slug').range(from, from + 999)
    if (error) throw new Error(`reading directory_people failed (is the migration applied?): ${error.message}`)
    existing.push(...((data ?? []) as unknown as ExistingRow[]))
    if (!data || data.length < 1000) break
  }
  const bySlug = new Map(existing.map((e) => [e.slug, e]))

  const merges = [...records.values()].map((r) => mergeRecord(bySlug.get(r.slug) ?? null, r, category))
  const inserts = merges.flatMap((m) => (m.kind === 'insert' ? [m.row] : []))
  const updates = merges.flatMap((m) => (m.kind === 'update' ? [m] : []))
  const skips = merges.flatMap((m) => (m.kind === 'skip' ? [m] : []))
  const unchanged = merges.filter((m) => m.kind === 'unchanged').length
  const firms = new Set([...records.values()].map((r) => r.firm_domain))
  const missing = missingFrom(existing, new Set(records.keys()), firms, category)

  console.log(`${file}: ${records.size} people at ${firms.size} firms (${category})`)
  console.log(`  new (arrive as review): ${inserts.length}`)
  console.log(`  changed: ${updates.filter((u) => u.fields.length).length}   date only: ${updates.filter((u) => !u.fields.length).length}   unchanged: ${unchanged}`)
  console.log(`  skipped: ${skips.length}   to stamp missing_since ${today}: ${missing.length}`)
  for (const u of updates.filter((x) => x.fields.length).slice(0, 25)) console.log(`    ~ ${u.slug}: ${u.fields.join(', ')}`)
  for (const s of skips) console.log(`    - ${s.slug}: ${s.reason}`)
  for (const m of missing.slice(0, 25)) console.log(`    ? ${m.slug} (${m.firm_domain}) not in this crawl`)
  if (warnings.length) console.log(`  warnings (${warnings.length}):\n${warnings.slice(0, 30).map((w) => `    ${w}`).join('\n')}`)
  if (errors.length) console.log(`  refused lines (${errors.length}):\n${errors.slice(0, 50).map((e) => `    ${e}`).join('\n')}`)

  if (!apply) {
    console.log('\nDry run: nothing written. Add --apply to write.')
    return
  }

  for (let i = 0; i < inserts.length; i += BATCH) {
    const { error } = await db.from('directory_people').insert(inserts.slice(i, i + BATCH))
    if (error) throw new Error(`insert failed at ${i}: ${error.message}`)
  }
  // One update per changed person, firm-site columns only (the merge never names any other).
  for (const u of updates) {
    const { error } = await db.from('directory_people').update(u.changes).eq('id', u.id).neq('status', 'removed')
    if (error) throw new Error(`update of ${u.slug} failed: ${error.message}`)
  }
  for (let i = 0; i < missing.length; i += BATCH) {
    const ids = missing.slice(i, i + BATCH).map((m) => m.id)
    const { error } = await db.from('directory_people').update({ missing_since: today }).in('id', ids).is('missing_since', null)
    if (error) throw new Error(`missing stamp failed: ${error.message}`)
  }
  console.log(`\nWritten: ${inserts.length} new, ${updates.length} updated, ${missing.length} stamped missing.`)
  console.log('New people are in review. Publish them with scripts/directory/review.ts, then the pages refresh within the hour.')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
