/**
 * Replays past classifier calls through the classifier as it is now. It writes
 * nothing: the database is a pretend one that only remembers what it was told.
 *
 *   npx tsx scripts/amount-replay.ts --pool pool.json --row <news_items id> [--row <id> …]
 *
 * For each row named, the articles that were classified in the same call
 * (written back within a few seconds of it) are sent to the classifier again
 * as one batch, and what comes back is set beside what was stored. Use it
 * after changing the classifier's prompt or its checks, on the calls that are
 * known to have gone wrong (scripts/amount-audit.ts finds them).
 *
 * It calls the Claude API (about four cents a batch) and nothing else.
 * `pool.json` is what `amount-audit.ts --save-pool` keeps.
 */
process.loadEnvFile('.env.local')

import { readFileSync } from 'node:fs'

interface Row {
  id: string
  title: string
  description: string | null
  full_text: string | null
  source_name: string | null
  created_at: string
  updated_at: string | null
  event_type: string | null
  relevance_score: number | string | null
  tldr: string | null
  size: number | null
}

const SAME_CALL_MS = 10_000

function flags(name: string): string[] {
  const out: string[] = []
  process.argv.forEach((a, i) => { if (a === name && process.argv[i + 1]) out.push(process.argv[i + 1]) })
  return out
}

async function main() {
  const { classifyPendingArticles } = await import('../lib/news/classify-articles')
  const poolFile = flags('--pool')[0]
  const ids = flags('--row')
  if (!poolFile || !ids.length) throw new Error('usage: amount-replay.ts --pool pool.json --row <id> [--row <id> …]')
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
  const rows = (JSON.parse(readFileSync(poolFile, 'utf8')) as { rows: Row[] }).rows

  for (const id of ids) {
    const anchor = rows.find((r) => r.id === id)
    if (!anchor?.updated_at) { console.error(`  ${id}: not in the pool`); continue }
    const t = Date.parse(anchor.updated_at)
    const batch = rows
      .filter((r) => r.updated_at && Math.abs(Date.parse(r.updated_at) - t) <= SAME_CALL_MS)
      .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
      .slice(0, 15)

    // A database that hands the batch out as pending and remembers every update.
    const stored = new Map<string, Record<string, unknown>>()
    const table = () => {
      let values: Record<string, unknown> | null = null
      let selecting = ''
      const chain: Record<string, unknown> = {
        select: (cols: string) => { selecting = cols; return chain },
        update: (v: Record<string, unknown>) => { values = v; return chain },
        eq: (col: string, v: string) => { if (values && col === 'id' && values.classification_status === 'complete') stored.set(v, values); return chain },
        in: () => chain, is: () => chain, lt: () => chain, gte: () => chain, order: () => chain,
        single: async () => ({ data: { processing_attempts: 0 }, error: null }),
        limit: async () => ({ data: selecting.includes('title') ? batch.map(({ id: rid, title, description, full_text, source_name }) => ({ id: rid, title, description, full_text, source_name })) : [], error: null }),
        then: (resolve: (v: { data: unknown[]; error: null }) => void) => resolve({ data: [], error: null }),
      }
      return chain
    }

    let calls = 0
    const realFetch = globalThis.fetch
    globalThis.fetch = (async (...args: Parameters<typeof fetch>) => { calls++; return realFetch(...args) }) as typeof fetch
    const notes: string[] = []
    const realWarn = console.warn
    console.warn = (s: unknown) => { notes.push(String(s)) }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await classifyPendingArticles({ from: table } as any, apiKey)
    globalThis.fetch = realFetch
    console.warn = realWarn

    console.log(`\n══ The call of ${anchor.updated_at.slice(0, 19)}Z: ${batch.length} articles, ${calls} API call${calls === 1 ? '' : 's'} now; processed ${result.articlesProcessed}, failed ${result.articlesFailed}${result.errors.length ? `; errors: ${result.errors.join(' | ')}` : ''}`)
    for (const n of notes) console.log(`  ! ${n}`)
    for (const r of batch) {
      const now = stored.get(r.id)
      const size = (now?.extracted_data as { fund_size_usd_millions?: number | null } | undefined)?.fund_size_usd_millions ?? null
      const changed = !now || size !== (r.size ?? null) || now.event_type !== r.event_type
      console.log(`\n  ${r.id === id ? '▶' : ' '} ${r.title.slice(0, 120)}`)
      console.log(`      was: [${r.event_type}, ${r.relevance_score}] size ${r.size ?? '—'} | ${(r.tldr ?? '').slice(0, 230)}`)
      console.log(`      now: ${now ? `[${now.event_type}, ${now.relevance_score}] size ${size ?? '—'} | ${String(now.tldr ?? '').slice(0, 230)}` : 'NOT STORED (will be tried again)'}${changed ? '   ← differs' : ''}`)
    }
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
