#!/usr/bin/env npx tsx
/**
 * Release a previewed sponsor-pitch batch to the dispatcher:
 *
 *   npx tsx --env-file=.env.local scripts/outreach-v2/release-batch.ts sponsor-batch-1
 *
 * Moves the batch's `preview` rows to `queued`. The dispatcher cron
 * (/api/pipeline/outreach-v2-dispatch, every five minutes on weekdays,
 * 9am to 6pm New York) then sends one per tick while OUTREACH_V2_MODE=live in
 * Vercel Production, re-checking every exclusion at the moment of sending.
 * Run it only after Danny has read the preview.
 */
import { createClient } from '@supabase/supabase-js'
import { releaseBatch } from '../../lib/outreach-v2/sponsor-pitch'

async function main() {
  const batch = process.argv[2]
  if (!batch) throw new Error('usage: release-batch.ts <batch>')
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const n = await releaseBatch(db, batch)
  console.log(`${n} messages of ${batch} queued. They send one every five minutes while production is live.`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
