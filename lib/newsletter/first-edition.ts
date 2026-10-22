/**
 * When a new reader's first FundOps Daily arrives, said plainly (2026-10-22). Every form and the welcome email said
 * "tomorrow morning", which was wrong for anyone who signed up before the morning's send: the edition goes at 7:30am New
 * York time every day to everyone confirmed when it is built, so a reader who joins before about 7:15 gets that
 * morning's. Browser-safe: no server imports.
 */

/** Minutes after midnight in New York before which a new reader still gets that morning's edition. */
export const SAME_MORNING_CUTOFF = 7 * 60 + 15

/** "this morning by 7:30am ET" or "tomorrow by 7:30am ET". */
export function firstEditionWhen(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(now)
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return h * 60 + m < SAME_MORNING_CUTOFF ? 'this morning by 7:30am ET' : 'tomorrow by 7:30am ET'
}

/** "Your first edition lands tomorrow by 7:30am ET." */
export const firstEditionSentence = (now: Date = new Date()) => `Your first edition lands ${firstEditionWhen(now)}.`
