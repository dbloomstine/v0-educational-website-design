/**
 * The words of the in-page asks (components/newsletter/InlineSignup.tsx, 2026-10-22). Pure, browser-safe.
 * Each says what the reader gets and when, in the terms of the page they are reading. The events pages use
 * lib/events/offer.ts.
 */
import { possessive } from '@/lib/events/offer'

/** The daily email's promise: it goes at 7:30am New York time every day (lib/newsletter/first-edition.ts). */
const BY = 'by 7:30am ET'

export const STORY_LINE = `Get stories like this every morning ${BY}.`

/** A firm with closes on record is promised its closes; any other firm (a law firm, an adviser) its news. */
export function firmLine(name: string, hasCloses: boolean): string {
  const n = name.trim()
  return hasCloses ? `Get every ${n} close the morning it’s reported.` : `Get ${possessive(n)} news the morning it’s reported.`
}

/** `market` is a league market's name as lib/news/league-markets.ts gives it ("private credit"); none for all markets. */
export function leagueLine(market?: string | null): string {
  const m = market?.trim()
  return m ? `Get the biggest ${m} closes every morning ${BY}.` : `Get the biggest closes every morning ${BY}.`
}
