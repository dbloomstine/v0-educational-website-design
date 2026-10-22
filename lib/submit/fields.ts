/**
 * The fields of "Send us your news" (/submit) that the form and the server
 * share. Browser-safe: no server imports here (lib/submit/news-submission.ts
 * holds the checks and uses node:crypto).
 */
// The stored values are unchanged since the first version (the table's check
// constraint names them); the labels follow Danny's list of 2026-10-22.
export const NEWS_KINDS = ['fund_close', 'fund_launch', 'deal', 'hire', 'other'] as const
export type NewsKind = (typeof NEWS_KINDS)[number]

export const NEWS_KIND_LABELS: Record<NewsKind, string> = {
  fund_close: 'Fund close',
  fund_launch: 'Fundraise launch',
  deal: 'Deal',
  hire: 'Hire or promotion',
  other: 'Other',
}

/** Currencies offered next to the amount. USD first: most of what we cover is North American. */
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY', 'SGD', 'HKD'] as const
export type Currency = (typeof CURRENCIES)[number]

/** "Deal team / people involved": at most this many rows (Danny's staged plan, 2026-10-22: stored, not shown). */
export const MAX_PEOPLE = 5

/** The longest each field may be; the form's `maxLength` matches. */
export const LIMITS = {
  firm: 200,
  firmWebsite: 300,
  headline: 200,
  details: 1000,
  amount: 40,
  url: 500,
  personName: 120,
  personRole: 120,
  contactName: 120,
  contactEmail: 200,
  contactRole: 120,
} as const

/** The short ask on the footer and the /news pages: "Got news?" then the link. */
export const SUBMIT_NEWS_ASK = 'Got news?'
export const SUBMIT_NEWS_LINK = 'Send us your news'
export const SUBMIT_NEWS_PATH = '/submit'

/** The link on a firm page: the form with the firm's name filled in. */
export function submitNewsHref(firm?: string | null): string {
  return firm ? `${SUBMIT_NEWS_PATH}?firm=${encodeURIComponent(firm)}` : SUBMIT_NEWS_PATH
}
