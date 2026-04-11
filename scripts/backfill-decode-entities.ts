#!/usr/bin/env npx tsx
/**
 * One-shot backfill: decode HTML entities in existing news_items rows.
 *
 * RSS feeds historically delivered titles with raw entity references
 * (e.g. "Marsh&#8217;s Mercer raises $3.8bn") that the ingest worker
 * stored verbatim. The stripHtml fix only decodes new ingests; this
 * script rewrites the existing rows.
 *
 * Dry-run by default. Pass --apply to actually write changes.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/backfill-decode-entities.ts
 *   npx tsx --env-file=.env.local scripts/backfill-decode-entities.ts --apply
 */

import { createClient } from '@supabase/supabase-js'
import { decodeEntities } from '../lib/news/rss-client'

const BATCH_SIZE = 500
const APPLY = process.argv.includes('--apply')

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
    console.error('Run with:  npx tsx --env-file=.env.local scripts/backfill-decode-entities.ts')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — scanning news_items for HTML entities…`)

  // Only fetch rows that actually contain an ampersand — everything else
  // is already clean and doesn't need to be touched.
  let offset = 0
  let scanned = 0
  let changed = 0
  const samples: Array<{ id: string; before: string; after: string }> = []

  while (true) {
    const { data: rows, error } = await supabase
      .from('news_items')
      .select('id, title, description')
      .or('title.ilike.%&%,description.ilike.%&%')
      .order('id', { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1)

    if (error) {
      console.error('Query failed:', error.message)
      process.exit(1)
    }
    if (!rows || rows.length === 0) break

    const updates: Array<{ id: string; title?: string; description?: string }> = []

    for (const row of rows) {
      scanned++
      const newTitle = row.title ? decodeEntities(row.title) : null
      const newDesc = row.description ? decodeEntities(row.description) : null

      const titleChanged = newTitle !== null && newTitle !== row.title
      const descChanged = newDesc !== null && newDesc !== row.description

      if (titleChanged || descChanged) {
        changed++
        const update: { id: string; title?: string; description?: string } = { id: row.id }
        if (titleChanged) update.title = newTitle!
        if (descChanged) update.description = newDesc!
        updates.push(update)

        if (samples.length < 10 && titleChanged) {
          samples.push({ id: row.id, before: row.title!, after: newTitle! })
        }
      }
    }

    if (APPLY && updates.length > 0) {
      // Supabase doesn't support bulk UPDATE with different values per row
      // via the REST API — issue individual PATCHes but in parallel batches
      // of 20 to keep throughput reasonable.
      for (let i = 0; i < updates.length; i += 20) {
        const chunk = updates.slice(i, i + 20)
        await Promise.all(
          chunk.map((u) => {
            const payload: { title?: string; description?: string } = {}
            if (u.title !== undefined) payload.title = u.title
            if (u.description !== undefined) payload.description = u.description
            return supabase.from('news_items').update(payload).eq('id', u.id)
          })
        )
      }
    }

    offset += BATCH_SIZE
    if (rows.length < BATCH_SIZE) break
  }

  console.log(`\nScanned: ${scanned}`)
  console.log(`Would change: ${changed}`)
  if (samples.length > 0) {
    console.log(`\nFirst ${samples.length} title changes:`)
    for (const s of samples) {
      console.log(`  - ${s.before}`)
      console.log(`    → ${s.after}`)
    }
  }

  if (!APPLY) {
    console.log(`\nDry run only. Re-run with --apply to persist changes.`)
  } else {
    console.log(`\nDone.`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
