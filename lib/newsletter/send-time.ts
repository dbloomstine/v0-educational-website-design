/**
 * When FundOps Daily goes out: 7:30 in the morning, New York time, every day.
 * (Danny chose 6:30 on 2026-10-14 and took it back the same afternoon: "leave
 * the time at 7:30am ET". The daylight-saving handling below stayed.)
 *
 * Vercel's crons run on UTC and New York moves between UTC-4 (EDT, from the
 * second Sunday of March) and UTC-5 (EST, from the first Sunday of November).
 * Until 2026-10-14 there was one cron at 11:30 UTC, which would have slipped
 * to 6:30 EST in November. So vercel.json fires the send twice a morning, at
 * 11:30 and at 12:30 UTC:
 *
 *   EDT: 11:30 UTC is 7:30, and sends. 12:30 UTC is 8:30: the edition is
 *        already sent, and send-daily's own check skips it (or, if 7:30
 *        failed, it is the retry).
 *   EST: 11:30 UTC is 6:30, before the window, and does nothing. 12:30 UTC
 *        is 7:30, and sends.
 *
 * The window opens at 7:00, not 7:30, on purpose: its only job is to turn
 * away the winter 6:30 fire, and a fire a few seconds early must still send.
 */

/** The time readers are told, and the time the edition goes out. */
export const SEND_TIME_ET = { hour: 7, minute: 30 } as const

/** The earliest New York time at which a scheduled fire sends (minutes after midnight). */
export const WINDOW_OPENS_ET_MINUTES = 7 * 60

/** Minutes after midnight in New York at `now`. */
export function minutesIntoDayET(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return hour * 60 + minute
}

/** True when a scheduled fire at `now` should send. */
export function sendWindowOpen(now: Date): boolean {
  return minutesIntoDayET(now) >= WINDOW_OPENS_ET_MINUTES
}
