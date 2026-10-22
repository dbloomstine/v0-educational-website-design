/**
 * Backfill: turn stored Google News redirect links into the publisher's URL.
 *
 *   npx tsx --env-file=.env.local scripts/news/resolve-google-urls.ts --dry            # count, resolve a sample, write nothing
 *   npx tsx --env-file=.env.local scripts/news/resolve-google-urls.ts --dry --sample 20
 *   npx tsx --env-file=.env.local scripts/news/resolve-google-urls.ts --apply           # update source_url (and url_hash) row by row
 *   npx tsx --env-file=.env.local scripts/news/resolve-google-urls.ts --apply --days 30 --limit 500 --pace 800
 *   npx tsx --env-file=.env.local scripts/news/resolve-google-urls.ts --apply --newest --pace 2500 --max-minutes 60
 *
 * Reads rows of the last --days days (default 30) whose source_url is still a
 * news.google.com/rss/articles/ link, oldest first (--newest: newest first).
 * Idempotent: a row that has been resolved is no longer selected.
 * Rate-limited: one link at a time, --pace ms apart (default 700) plus up to
 * --jitter of that again at random (default 0.5). Google refuses a fast
 * client (429 or its captcha page; 2026-10-16 stalled after 99 rows): on a
 * refusal the run waits --backoff seconds (default 120, doubling to 15 min),
 * switches between the two page forms the resolver knows, and stops after
 * --stop-after refusals in a row (default 4). --max-minutes ends the run on
 * time (default none). --apply writes, per resolved row:
 *   source_url  = the publisher's URL
 *   url_hash    = sha256(normalizeUrl(publisher URL))   (what ingest dedup reads)
 *   extracted_data.google_url = the Google link it arrived by (nothing else in extracted_data changes)
 * A publisher URL that another row already holds (unique source_url) is
 * skipped and counted — that row is the same article from the direct feed.
 * Without --apply nothing is written.
 */
/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js'
import { resolveGoogleNewsUrl, type GoogleNewsPageForm, type GoogleNewsResolution } from '../../lib/news/google-news-url'
import { hashString, normalizeUrl } from '../../lib/news/ingest-worker'

const args = process.argv.slice(2)
const flag = (name: string) => args.includes(`--${name}`)
const opt = (name: string, dflt: number) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : dflt
}

const apply = flag('apply')
const days = opt('days', 30)
const limit = opt('limit', Number.POSITIVE_INFINITY)
const pace = opt('pace', 700)
const sample = opt('sample', 10)
const newest = flag('newest')
const jitter = opt('jitter', 0.5)
const backoffBase = opt('backoff', 120) * 1000
const stopAfter = opt('stop-after', 4)
const maxMinutes = opt('max-minutes', Number.POSITIVE_INFINITY)

if (!apply && !flag('dry')) {
  console.log('Pass --dry (count and sample, no writes) or --apply.')
  process.exit(1)
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

type Row = { id: string; source_url: string; published_date: string; extracted_data: Record<string, unknown> | null }

async function loadRows(): Promise<Row[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
  const out: Row[] = []
  const page = 500
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase
      .from('news_items')
      .select('id, source_url, published_date, extracted_data')
      .gte('published_date', since)
      .like('source_url', 'https://news.google.com/rss/articles/%')
      .order('published_date', { ascending: !newest })
      .order('id', { ascending: true })
      .range(from, from + page - 1)
    if (error) throw new Error(error.message)
    out.push(...((data ?? []) as Row[]))
    if (!data || data.length < page) break
  }
  return out
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const rows = await loadRows()
  console.log(`${rows.length} rows of the last ${days} days still link to news.google.com${apply ? '' : ' (dry run: nothing is written)'}`)
  const byDay = new Map<string, number>()
  for (const r of rows) byDay.set(r.published_date, (byDay.get(r.published_date) ?? 0) + 1)
  console.log('by day:', Array.from(byDay.entries()).sort().map(([d, n]) => `${d.slice(5)}:${n}`).join(' '))

  const todo = apply ? rows.slice(0, Math.min(rows.length, limit)) : rows.slice(-Math.min(rows.length, sample))
  const counts: Record<GoogleNewsResolution['method'] | 'updated' | 'held-by-another-row' | 'update-failed' | 'refused', number> = {
    'not-google': 0, payload: 0, batchexecute: 0, redirect: 0, html: 0, unresolved: 0, updated: 0, 'held-by-another-row': 0, 'update-failed': 0, refused: 0,
  }
  const details = new Map<string, number>()
  const started = Date.now()
  let pageForm: GoogleNewsPageForm = 'articles'
  let refusedInARow = 0
  for (let i = 0; i < todo.length; i++) {
    if ((Date.now() - started) / 60000 >= maxMinutes) {
      console.log(`stopping: --max-minutes ${maxMinutes} reached after ${i} rows`)
      break
    }
    const row = todo[i]
    const r = await resolveGoogleNewsUrl(row.source_url, { pageForm })
    if (r.refused) {
      counts.refused++
      refusedInARow++
      const wait = Math.min(backoffBase * 2 ** (refusedInARow - 1), 15 * 60_000)
      console.log(`refused (${r.detail}, form ${pageForm}) at row ${i + 1}, ${refusedInARow} in a row${refusedInARow >= stopAfter ? '' : `; waiting ${Math.round(wait / 1000)} s`}`)
      if (refusedInARow >= stopAfter) {
        console.log(`stopping: ${stopAfter} refusals in a row`)
        break
      }
      pageForm = pageForm === 'articles' ? 'rss' : 'articles'
      await sleep(wait)
      i-- // try the same row again
      continue
    }
    refusedInARow = 0
    counts[r.method]++
    if (r.detail) details.set(r.detail, (details.get(r.detail) ?? 0) + 1)
    const ok = r.method !== 'unresolved' && r.method !== 'not-google'
    if (!apply || i < sample || !ok) console.log(`${r.method.padEnd(13)} ${row.published_date} ${ok ? r.url : `${row.id} ${r.detail ?? ''}`}`)
    if (apply && ok) {
      const { error } = await supabase
        .from('news_items')
        .update({
          source_url: r.url,
          url_hash: hashString(normalizeUrl(r.url)),
          extracted_data: { ...(row.extracted_data ?? {}), google_url: row.source_url },
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
        .like('source_url', 'https://news.google.com/rss/articles/%')
      if (!error) counts.updated++
      else if (error.code === '23505') counts['held-by-another-row']++
      else {
        counts['update-failed']++
        console.error(`update ${row.id}: ${error.message}`)
      }
    }
    if (apply && (i + 1) % 50 === 0) {
      const perRow = (Date.now() - started) / (i + 1)
      console.log(`… ${i + 1}/${todo.length}, ${Math.round(((todo.length - i - 1) * perRow) / 60000)} min left`, counts)
    }
    if (i < todo.length - 1) await sleep(pace * (1 + Math.random() * jitter))
  }
  console.log(apply ? 'done' : `sample of ${todo.length} resolved`, counts, `in ${Math.round((Date.now() - started) / 60000)} min`)
  if (details.size) console.log('unresolved because:', Object.fromEntries(details))
  if (!apply) console.log(`\nTo write: npx tsx --env-file=.env.local scripts/news/resolve-google-urls.ts --apply --days ${days}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
