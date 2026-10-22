/**
 * The fields of "Submit your news" (/submit) that the form and the server
 * share. Browser-safe: no server imports here (lib/submit/news-submission.ts
 * holds the checks and uses node:crypto).
 */
export const NEWS_KINDS = ['fund_close', 'fund_launch', 'hire', 'deal', 'other'] as const
export type NewsKind = (typeof NEWS_KINDS)[number]

export const NEWS_KIND_LABELS: Record<NewsKind, string> = {
  fund_close: 'Fund close',
  fund_launch: 'Fund launch',
  hire: 'Hire',
  deal: 'Deal',
  other: 'Other',
}

/** The longest each field may be; the form's `maxLength` matches. */
export const LIMITS = {
  firm: 200,
  headline: 200,
  details: 2000,
  url: 500,
  contactName: 120,
  contactEmail: 200,
  contactRole: 120,
} as const

/** The short ask on the footer, the /news pages and the daily email's footer: "Got news?" then the link. */
export const SUBMIT_NEWS_ASK = 'Got news?'
export const SUBMIT_NEWS_LINK = 'Send us your fund close or hire'
export const SUBMIT_NEWS_PATH = '/submit'
