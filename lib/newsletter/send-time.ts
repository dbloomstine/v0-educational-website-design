/**
 * When FundOps Daily goes out: 6:30 in the morning, New York time, every day
 * (Danny, 2026-10-14; it was 7:30 until then).
 *
 * Vercel's crons run on UTC and New York moves between UTC-4 (EDT, from the
 * second Sunday of March) and UTC-5 (EST, from the first Sunday of November).
 * So vercel.json fires the send twice a morning, at 10:30 and at 11:30 UTC:
 *
 *   EDT: 10:30 UTC is 6:30, and sends. 11:30 UTC is 7:30: the edition is
 *        already sent, and send-daily's own check skips it (or, if 6:30
 *        failed, it is the retry).
 *   EST: 10:30 UTC is 5:30, before the window, and does nothing. 11:30 UTC
 *        is 6:30, and sends.
 *
 * The window opens at 6:00, not 6:30, on purpose: its only job is to turn
 * away the winter 5:30 fire, and a fire a few seconds early must still send.
 */

/** The time readers are told, and the time the edition goes out. */
export const SEND_TIME_ET = { hour: 6, minute: 30 } as const

/** The earliest New York time at which a scheduled fire sends (minutes after midnight). */
export const WINDOW_OPENS_ET_MINUTES = 6 * 60

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
