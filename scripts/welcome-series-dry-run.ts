/**
 * The welcome series' dry run (lib/newsletter/welcome-series-send.ts): who would get which email today, the dates
 * everyone else is waiting on, and whose series is over. Reads the database (and Resend, for bounces) only. Sends
 * nothing and writes nothing, whatever WELCOME_SERIES_ENABLED says. The same as GET /api/pipeline/welcome-series?dryRun=1.
 *
 *   npx tsx --env-file=.env.local scripts/welcome-series-dry-run.ts
 *   AT=2026-10-28T16:30:00Z npx tsx --env-file=.env.local scripts/welcome-series-dry-run.ts    as if run at that moment
 */
import { getSupabaseAdmin } from '../lib/supabase/client'
import { resendEventById } from '../lib/newsletter/resend-events'
import { runWelcomeSeries } from '../lib/newsletter/welcome-series-send'
import { welcomeSeriesEnabled } from '../lib/newsletter/welcome-series-schedule'

async function main() {
  const now = process.env.AT ? new Date(process.env.AT) : new Date()
  const key = process.env.RESEND_API_KEY
  const result = await runWelcomeSeries({
    db: getSupabaseAdmin(),
    mode: 'dry',
    now,
    lastEvent: key ? (id) => resendEventById(key, id) : undefined,
  })
  console.log(`Welcome series dry run for ${result.today} (switch ${welcomeSeriesEnabled() ? 'ON' : 'off'}); ${result.readers} reader(s) in the window`)
  for (const w of result.warnings) console.log(`  warning: ${w}`)
  if (result.error) console.log(`  error: ${result.error}`)
  console.log(`\nDue today (${result.actions.length}):`)
  for (const a of result.actions) console.log(`  ${a.email}  step ${a.step} (due ${a.dueOn})  ${a.send ? `would send ${a.send}: "${a.subject}"` : `skip: ${a.skip}`}`)
  console.log(`\nWaiting (${result.waiting.length}):`)
  for (const w of result.waiting) console.log(`  ${w.email}  signed up ${w.signupDate}; step ${w.step} on ${w.dueOn}  (plan ${Object.values(w.plan).join(', ')})`)
  console.log(`\nDone or stopped (${result.done.length}):`)
  for (const d of result.done) console.log(`  ${d.email}  ${d.reason}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
