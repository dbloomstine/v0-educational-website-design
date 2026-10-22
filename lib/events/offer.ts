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

/** The block's line: the city's events when the page has one, the week's fund events when it does not (virtual, the board). */
export function eventsOfferHeadline(city: string | null | undefined): string {
  const c = city?.trim()
  return c
    ? `Get ${possessive(c)} private-markets events every Monday, plus the morning news.`
    : 'Get the week’s fund events every Monday, plus the morning news.'
}
