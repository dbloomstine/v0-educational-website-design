#!/usr/bin/env npx tsx
/**
 * Dry-run the newsletter selection pipeline and report what an edition WOULD
 * contain. Sends nothing, writes nothing.
 *
 * Built during the 2026-08 pipeline rework to validate three changes against
 * the real article pool rather than fixtures:
 *   - relative-size cross-edition dedup (replacing $500M bucket hashing)
 *   - the per-firm cap
 *   - the Emerging Managers section
 *
 * It doubles as the pre-flight check before any manual catch-up send: run it,
 * read the repeat-firm and size-mix lines, then decide whether to send.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/audit-edition.ts [hoursBack]
 */

import { createClient } from '@supabase/supabase-js'
import { queryNewsletterArticles } from '../lib/newsletter/query-articles'
import { buildSubject } from '../lib/newsletter/send-daily'
import { normalizeFirmName } from '../lib/news/story-dedup'

const hoursBack = Number(process.argv[2]) || 26

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

function fmtSize(m: number | null): string {
  if (!m) return '     —'
  return m >= 1000 ? `$${(m / 1000).toFixed(1)}B`.padStart(6) : `$${m}M`.padStart(6)
}

async function main() {
  console.log(`\nDry run — ${hoursBack}h lookback, prior-edition dedup ON\n`)

  const content = await queryNewsletterArticles(supabase, hoursBack)

  if (content.totalArticles === 0) {
    console.log('No qualifying articles. The edition would SKIP.\n')
    return
  }

  console.log(`Subject:  ${buildSubject(content)}`)
  console.log(`Articles: ${content.totalArticles} across ${content.groups.length} sections\n`)

  for (const group of content.groups) {
    console.log(`── ${group.label} (${group.articles.length})`)
    for (const a of group.articles) {
      const dupes = a.alsoCoveredBy.length ? `  [+${a.alsoCoveredBy.length} src]` : ''
      console.log(
        `   ${fmtSize(a.fundSizeUsdMillions)}  ${(a.firmName ?? '—').slice(0, 28).padEnd(28)} ${a.title.slice(0, 62)}${dupes}`
      )
    }
    console.log()
  }

  // ─── Health checks ──────────────────────────────────────────────────────
  const all = content.groups.flatMap((g) => g.articles)

  const byFirm = new Map<string, number>()
  for (const a of all) {
    const firm = normalizeFirmName(a.firmName)
    if (firm) byFirm.set(firm, (byFirm.get(firm) ?? 0) + 1)
  }
  const repeats = [...byFirm.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1])

  console.log('── Checks')
  console.log(`   Repeat firms:     ${repeats.length === 0 ? 'none' : repeats.map(([f, n]) => `${f} ×${n}`).join(', ')}`)

  const sized = all.filter((a) => a.fundSizeUsdMillions != null)
  const mega = sized.filter((a) => a.fundSizeUsdMillions! >= 1000).length
  const small = sized.filter((a) => a.fundSizeUsdMillions! < 250).length
  console.log(
    `   Size mix:         ${sized.length} sized · ${mega} at $1B+ (${sized.length ? Math.round((100 * mega) / sized.length) : 0}%) · ${small} under $250M`
  )

  // Near-identical sizes within one edition are the signature of the dedup
  // failure this rework targeted (HarbourVest $4.75B ran twice on 2026-07-11).
  const suspicious: string[] = []
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const [x, y] = [all[i], all[j]]
      if (!x.fundSizeUsdMillions || !y.fundSizeUsdMillions) continue
      if (normalizeFirmName(x.firmName) !== normalizeFirmName(y.firmName)) continue
      const lo = Math.min(x.fundSizeUsdMillions, y.fundSizeUsdMillions)
      const hi = Math.max(x.fundSizeUsdMillions, y.fundSizeUsdMillions)
      if ((hi - lo) / hi <= 0.25) suspicious.push(`${x.firmName}: "${x.title.slice(0, 45)}" vs "${y.title.slice(0, 45)}"`)
    }
  }
  console.log(`   Possible dupes:   ${suspicious.length === 0 ? 'none' : ''}`)
  suspicious.forEach((s) => console.log(`      ${s}`))
  console.log()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
