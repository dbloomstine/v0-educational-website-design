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
 * The block's line. It promises only what the morning email already carries: the week's North American events
 * and the day's news (2026-10-22: "every Monday" was cut until a Monday events email exists; the tags are kept for it).
 */
export function eventsOfferHeadline(city: string | null | undefined): string {
  const c = city?.trim()
  return c
    ? `Get the week’s ${c} and North American fund events, with the morning news.`
    : 'Get the week’s fund events and the morning news in one email.'
}
