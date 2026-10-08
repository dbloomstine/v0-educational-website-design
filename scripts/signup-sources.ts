/**
 * Where subscribers came from. Read-only: one query, no writes.
 *
 *   npx tsx --env-file=.env.local scripts/signup-sources.ts
 *
 * Counts newsletter_subscribers by signup_source / signup_medium for the last
 * 7, 30 and 90 days and all time, confirmed against unconfirmed. Needs
 * supabase/migrations/20261008_signup_source.sql applied; rows from before it
 * show as "(not recorded)". Prints counts only, never an address.
 */
import { getSupabaseAdmin } from '../lib/supabase/client'
import { tallySignups, type SignupRow, type SourceCounts } from '../lib/newsletter/signup-report'

// Well above the list's size; the count below says if it was not enough.
const MAX_ROWS = 50_000

function line(c: SourceCounts, width: number) {
  return `  ${c.source.padEnd(width)}  ${String(c.total).padStart(6)}  ${String(c.confirmed).padStart(9)}  ${String(c.unconfirmed).padStart(11)}  ${String(c.unsubscribed).padStart(12)}`
}

async function main() {
  const { data, error, count } = await getSupabaseAdmin()
    .from('newsletter_subscribers')
    .select('signup_source, signup_medium, status, created_at', { count: 'exact' })
    .limit(MAX_ROWS)

  if (error) {
    console.error(`query failed: ${error.message}`)
    if (/signup_/.test(error.message)) console.error('The signup_* columns are missing: apply supabase/migrations/20261008_signup_source.sql first.')
    process.exit(1)
  }
  const rows = (data ?? []) as SignupRow[]
  if (count !== null && rows.length < count) {
    console.error(`WARNING: read ${rows.length} of ${count} subscribers; the figures below are partial.`)
  }

  for (const w of tallySignups(rows)) {
    const width = Math.max(14, ...w.rows.map((r) => r.source.length))
    console.log(`\n${w.label}: ${w.total.total} signups`)
    if (w.rows.length === 0) continue
    console.log(`  ${'source / medium'.padEnd(width)}  ${'total'.padStart(6)}  ${'confirmed'.padStart(9)}  ${'unconfirmed'.padStart(11)}  ${'unsubscribed'.padStart(12)}`)
    for (const r of w.rows) console.log(line(r, width))
    console.log(line(w.total, width))
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
