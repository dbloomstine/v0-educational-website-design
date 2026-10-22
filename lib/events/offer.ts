/**
 * The words of the events offer (2026-10-22), shared by the inline block on
 * event and city pages (components/events/EventsSignup.tsx) and the signup box
 * when it opens on an events page. Pure, browser-safe.
 */

/** "Chicago’s", "Los Angeles’". */
export function possessive(name: string): string {
  const n = name.trim()
  return /s$/i.test(n) ? `${n}’` : `${n}’s`
}

/**
 * The block's line. Until the Monday events email is live (EVENTS_WEEKLY_MODE=live, lib/events/weekly-mode.ts) it
 * promises only what the morning email already carries: the week's North American events and the day's news
 * (2026-10-22: "every Monday" was cut until a Monday events email existed; the tags were kept for it). Once it is
 * live, the page passes `monday: true` and the line promises it.
 */
export function eventsOfferHeadline(city: string | null | undefined, opts: { monday?: boolean } = {}): string {
  const c = city?.trim()
  if (opts.monday) {
    return c ? `Get ${possessive(c)} fund events every Monday, plus the morning news.` : 'Get the week’s fund events every Monday, plus the morning news.'
  }
  return c
    ? `Get the week’s ${c} and North American fund events, with the morning news.`
    : 'Get the week’s fund events and the morning news in one email.'
}
