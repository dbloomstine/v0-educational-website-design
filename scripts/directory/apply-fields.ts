/**
 * Write the directory's filter fields (2026-10-26) by slug.
 *
 *   npx tsx --env-file=.env.local scripts/directory/apply-fields.ts <fields.jsonl>            # dry run
 *   npx tsx --env-file=.env.local scripts/directory/apply-fields.ts <fields.jsonl> --apply
 *
 * Needs supabase/migrations/20261026_directory_fields.sql applied first.
 *
 * One JSON object a line: slug, career_start_year (int | null), primary_practice (a PRACTICES id | null),
 * secondary_practices [], prior_firms [], schools [], languages [], field_evidence {}.
 * Only those seven columns are written, and only on rows that exist (an unknown slug is reported,
 * never inserted). A line whose values are all already in place is skipped. Without --apply nothing is written.
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { isPracticeId } from '@/lib/directory/taxonomy'

const COLS = ['career_start_year', 'primary_practice', 'secondary_practices', 'prior_firms', 'schools', 'languages', 'field_evidence'] as const
type Fields = {
  slug: string
  career_start_year: number | null
  primary_practice: string | null
  secondary_practices: string[]
  prior_firms: string[]
  schools: string[]
  languages: string[]
  field_evidence: Record<string, unknown>
}

const strings = (v: unknown, name: string, slug: string): string[] => {
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string' || !x.trim())) throw new Error(`${slug}: ${name} must be an array of strings`)
  return [...new Set(v as string[])]
}

export function parseLine(o: Record<string, unknown>): Fields {
  const slug = o.slug
  if (typeof slug !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`bad slug ${String(slug)}`)
  const y = o.career_start_year
  if (y !== null && (typeof y !== 'number' || !Number.isInteger(y) || y < 1940 || y > 2030)) throw new Error(`${slug}: career_start_year ${y}`)
  const p = o.primary_practice
  if (p !== null && !isPracticeId(p)) throw new Error(`${slug}: primary_practice ${String(p)}`)
  const sec = strings(o.secondary_practices, 'secondary_practices', slug)
  if (sec.some((s) => !isPracticeId(s))) throw new Error(`${slug}: secondary_practices ${sec}`)
  const ev = o.field_evidence
  if (!ev || typeof ev !== 'object' || Array.isArray(ev)) throw new Error(`${slug}: field_evidence must be an object`)
  return {
    slug,
    career_start_year: y as number | null,
    primary_practice: p as string | null,
    secondary_practices: sec,
    prior_firms: strings(o.prior_firms, 'prior_firms', slug),
    schools: strings(o.schools, 'schools', slug),
    languages: strings(o.languages, 'languages', slug),
    field_evidence: ev as Record<string, unknown>,
  }
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

async function main() {
  const args = process.argv.slice(2)
  const file = args.find((a) => !a.startsWith('--'))
  const apply = args.includes('--apply')
  if (!file) throw new Error('usage: apply-fields.ts <fields.jsonl> [--apply]')
  const lines = readFileSync(file, 'utf8').split('\n').filter((l) => l.trim())
  const rows = lines.map((l, i) => {
    try {
      return parseLine(JSON.parse(l))
    } catch (e) {
      throw new Error(`line ${i + 1}: ${(e as Error).message}`)
    }
  })
  if (new Set(rows.map((r) => r.slug)).size !== rows.length) throw new Error('duplicate slugs in file')

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const existing = new Map<string, Record<string, unknown>>()
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('directory_people').select(['slug', ...COLS].join(', ')).order('slug').range(from, from + 999)
    if (error) throw new Error(`reading directory_people failed (is 20261026_directory_fields.sql applied?): ${error.message}`)
    for (const r of (data ?? []) as unknown as Record<string, unknown>[]) existing.set(r.slug as string, r)
    if (!data || data.length < 1000) break
  }

  const unknown = rows.filter((r) => !existing.has(r.slug))
  const changes = rows.filter((r) => existing.has(r.slug) && COLS.some((c) => !same(existing.get(r.slug)![c], r[c])))
  const filled = (c: (typeof COLS)[number]) => rows.filter((r) => (Array.isArray(r[c]) ? (r[c] as unknown[]).length > 0 : r[c] !== null)).length
  console.log(`${rows.length} lines; ${changes.length} to update; ${rows.length - changes.length - unknown.length} unchanged; ${unknown.length} unknown slugs`)
  for (const c of COLS.slice(0, 6)) console.log(`  ${c.padEnd(20)} ${filled(c)} with a value (${((100 * filled(c)) / rows.length).toFixed(1)}%)`)
  if (unknown.length) console.log(`  unknown: ${unknown.slice(0, 10).map((r) => r.slug).join(', ')}${unknown.length > 10 ? ' …' : ''}`)
  for (const r of changes.slice(0, 3)) console.log('  e.g.', JSON.stringify({ ...r, field_evidence: undefined }))

  if (!apply) {
    console.log('\nDry run: nothing written. Add --apply to write.')
    return
  }
  let n = 0
  for (const r of changes) {
    const { slug, ...set } = r
    const { error } = await db.from('directory_people').update(set).eq('slug', slug)
    if (error) throw new Error(`${slug}: ${error.message}`)
    if (++n % 200 === 0) console.log(`  ${n}/${changes.length}`)
  }
  console.log(`updated ${n}`)
}

if (process.argv[1]?.endsWith('apply-fields.ts')) main().catch((e) => {
  console.error(e)
  process.exit(1)
})
