/**
 * League-table audit. Run before trusting the page after any change to the
 * classifier, the story rules or lib/news/league.ts:
 *
 *   npx tsx scripts/league-audit.ts            # summary + anything suspicious
 *   npx tsx scripts/league-audit.ts --top 40   # also print the top N rows
 *
 * It prints what a human should look at: rows that might be the same fund
 * twice, sizes that stand out, rows resting on a single small outlet, and how
 * many reports were kept out and why. Exit code 1 if a hard check fails.
 */
process.loadEnvFile('.env.local')

async function main() {
  const { fetchLeagueRows, fetchLeagueOverrides } = await import('../lib/news/league-data')
  const { buildLeague, leagueRejection, leagueRows } = await import('../lib/news/league')
  const { buildStories } = await import('../lib/news/stories')
  const { entityKey, keysMatch } = await import('../lib/newsletter/story-links')
  const top = Number(process.argv[process.argv.indexOf('--top') + 1]) || 0

  const [rows, overrides] = await Promise.all([fetchLeagueRows(), fetchLeagueOverrides()])
  const t = Date.now()
  const league = buildLeague(rows, overrides)
  const ms = Date.now() - t
  const now = Date.now()
  const fmt = (m: number) => (m >= 1000 ? `$${(m / 1000).toFixed(2)}B` : `$${Math.round(m)}M`)

  console.log(`reports ${rows.length} → closes ${league.length} (final ${league.filter((c) => c.stage === 'final').length}), built in ${ms}ms, overrides ${overrides.length}`)
  for (const p of ['30d', '90d', 'ytd'] as const) {
    const r = leagueRows(league, { period: p }, now)
    console.log(`  ${p}: ${r.length} final closes, ${fmt(r.reduce((s, c) => s + c.sizeUsdM, 0))}`)
  }

  const reasons: Record<string, number> = {}
  for (const s of buildStories(rows)) {
    const why = leagueRejection(s)
    if (why) reasons[why] = (reasons[why] ?? 0) + 1
  }
  console.log('\nkept out:', reasons)
  const show = process.argv.includes('--rejected')
  if (show) {
    for (const why of Object.keys(reasons)) {
      console.log(`\n— ${why}`)
      buildStories(rows).filter((s) => leagueRejection(s) === why).sort((a, b) => (b.sizeUsdM ?? 0) - (a.sizeUsdM ?? 0)).slice(0, 14)
        .forEach((s) => console.log(`   ${String(s.sizeUsdM ?? '-').padEnd(7)} ${s.closeType}  ${s.headline.slice(0, 120)}`))
    }
  }

  let failed = false
  // Hard check 1: no two rows for one manager, stage and figure.
  const dup: string[] = []
  for (let i = 0; i < league.length; i++) for (let j = i + 1; j < league.length; j++) {
    const a = league[i], b = league[j]
    if (a.stage === b.stage && keysMatch(entityKey(a.firm), entityKey(b.firm)) && Math.abs(a.sizeUsdM - b.sizeUsdM) / a.sizeUsdM < 0.02) {
      dup.push(`  ${a.firm} | ${a.fund} | ${fmt(a.sizeUsdM)} ${a.date}   vs   ${b.firm} | ${b.fund} | ${fmt(b.sizeUsdM)} ${b.date}`)
    }
  }
  console.log(`\nsame manager, stage and figure (should be 0 unless two real funds): ${dup.length}`)
  dup.slice(0, 25).forEach((d) => console.log(d))

  // Hard check 2: nothing outside the size range, nothing dated in the future.
  const today = new Date().toISOString().slice(0, 10)
  const bad = league.filter((c) => c.sizeUsdM > 60_000 || c.sizeUsdM < 5 || c.date > today || !c.firmSlug)
  if (bad.length) { failed = true; console.log('\nFAIL out-of-range rows:', bad.map((c) => `${c.firm} ${fmt(c.sizeUsdM)} ${c.date}`)) }

  // Soft: the biggest rows resting on one outlet — the ones worth reading.
  const single = league.filter((c) => c.stage === 'final' && c.sources === 1 && c.sizeUsdM >= 2000)
  console.log(`\nfinal closes of $2B+ with a single source (read these): ${single.length}`)
  single.slice(0, 30).forEach((c) => console.log(`  ${fmt(c.sizeUsdM).padEnd(8)} ${c.date}  ${c.firm} — ${c.fund ?? '(unnamed)'}  [${c.source}]  ${c.headline.slice(0, 90)}`))

  if (top) {
    console.log(`\ntop ${top} final closes, year to date:`)
    leagueRows(league, { period: 'ytd' }, now).slice(0, top).forEach((c, i) =>
      console.log(`${String(i + 1).padStart(3)}. ${fmt(c.sizeUsdM).padEnd(8)} ${c.date} ${String(c.assetClass).padEnd(14)} ${c.sources}src  ${c.firm} — ${c.fund ?? '(unnamed)'}\n       ${c.headline.slice(0, 120)}`))
  }
  if (failed) process.exit(1)
}
main()
