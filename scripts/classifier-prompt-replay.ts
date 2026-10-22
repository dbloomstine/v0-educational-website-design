/**
 * Replays stored rows through the classifier's prompt as it is now and sets what comes back beside what was stored.
 * Writes nothing. Use it after a prompt change, on the rows the change is for and on a random control.
 *
 *   npx tsx --env-file=.env.local scripts/classifier-prompt-replay.ts ids.json [more.json …]
 *
 * Each file is a JSON array of news_items ids. Costs one classifier call per 15 rows (Haiku: a few cents).
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { classifyBatch, type ArticleForClassification } from '@/lib/news/classify-articles'
import { ALL_NEWSLETTER_TYPES } from '@/lib/newsletter/query-articles'

const shown = (type: string | null | undefined, rel: number | null | undefined, high = false) =>
  !!type && (ALL_NEWSLETTER_TYPES as readonly string[]).includes(type) && (high || (rel ?? 0) >= 0.3)

async function main() {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set')
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  for (const file of process.argv.slice(2)) {
    const ids: string[] = JSON.parse(readFileSync(file, 'utf8'))
    const { data, error } = await db.from('news_items').select('id, title, description, full_text, source_name, article_type, relevance_score').in('id', ids)
    if (error) throw error
    const rows = data ?? []
    let appear = 0, vanish = 0, retyped = 0
    const lines: string[] = []
    for (let i = 0; i < rows.length; i += 15) {
      const batch = rows.slice(i, i + 15)
      const out = await classifyBatch(batch as ArticleForClassification[], key)
      batch.forEach((r, k) => {
        const n = out[k]
        if (!n) { lines.push(`  ?  ${r.title.slice(0, 90)} (no answer)`); return }
        const was = shown(r.article_type, Number(r.relevance_score)), now = shown(n.article_type, n.relevance_score)
        if (!was && now) appear++
        if (was && !now) vanish++
        if (r.article_type !== n.article_type) retyped++
        const mark = !was && now ? '+' : was && !now ? '-' : ' '
        if (mark !== ' ' || r.article_type !== n.article_type) lines.push(`  ${mark}  ${r.article_type}/${Number(r.relevance_score).toFixed(2)} -> ${n.article_type}/${n.relevance_score.toFixed(2)}  ${r.title.slice(0, 90)}`)
      })
    }
    console.log(`\n${file}: ${rows.length} rows; ${appear} would newly show, ${vanish} would no longer show, ${retyped} retyped`)
    for (const l of lines) console.log(l)
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
