/**
 * The switch for the Monday events email (2026-10-22): Vercel env `EVENTS_WEEKLY_MODE`.
 *
 *   off      (the default; unset or anything unknown) nothing is built or sent by the cron, and the events offer
 *            promises only what the morning email carries.
 *   preview  each Monday's run sends ONE copy to the owner, marked [PREVIEW], and nothing to readers.
 *   live     each Monday's run sends to every confirmed reader who asked for the events; the offer on the site
 *            promises the Monday email.
 *
 * An env change needs a redeploy to reach the cron and the pages (they read it when they are built).
 */

export type EventsWeeklyMode = 'off' | 'preview' | 'live'

export const EVENTS_WEEKLY_ENV = 'EVENTS_WEEKLY_MODE'

export function eventsWeeklyMode(env: Record<string, string | undefined> = process.env): EventsWeeklyMode {
  const v = (env[EVENTS_WEEKLY_ENV] ?? '').trim().toLowerCase()
  return v === 'live' || v === 'preview' ? v : 'off'
}

/** The site may promise the Monday email only when it really goes to readers. */
export function mondayEmailLive(env: Record<string, string | undefined> = process.env): boolean {
  return eventsWeeklyMode(env) === 'live'
}
