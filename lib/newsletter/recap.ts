/**
 * Last week's largest closes, for Monday's edition.
 *
 * Built from the league table (lib/news/league.ts) — the same closes, under
 * the same rules, as fundopshq.com/league-tables — so the email never ranks a
 * fund the site would not. It is an extra: any failure, or a slow database,
 * and the edition goes out without it.
 */
import type { WeekRecap } from './email-template'

const TIMEOUT_MS = 25_000

export async function lastWeeksCloses(nowMs: number = Date.now()): Promise<WeekRecap | null> {
  try {
    // Loaded here, not at the top: the league pulls in the page cache, which
    // the send only needs on the one morning a week it builds this.
    const [{ computeLeagueReport }, { weekCloses, STAGE_LABEL }] = await Promise.all([
      import('@/lib/news/league-data'),
      import('@/lib/news/league'),
    ])
    const report = await Promise.race([
      computeLeagueReport(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`league not built in ${TIMEOUT_MS / 1000}s`)), TIMEOUT_MS)),
    ])
    const week = weekCloses(report.closes, nowMs, { days: 7, limit: 6 })
    return {
      rows: week.rows.map((c) => ({ id: c.id, firm: c.firm, fund: c.fund, stage: STAGE_LABEL[c.stage], sizeUsdM: c.sizeUsdM, converted: c.converted })),
      finals: week.finals,
      capitalUsdM: week.capitalUsdM,
    }
  } catch (err) {
    console.error('[send-daily] weekly recap unavailable, sending without it:', err)
    return null
  }
}
