/**
 * Shared types for the outreach pipeline (Path B).
 *
 * The pipeline runs after the morning newsletter and sends personalized
 * "we covered your firm" cold emails via the Gmail API directly. All
 * external data shapes (Supabase articles, Apollo people, Gmail messages)
 * are normalized into these interfaces so the rest of the lib doesn't have
 * to deal with raw API responses.
 */

export interface Article {
  articleId: string
  title: string
  tldr: string | null
  articleType: string | null
  eventType: string | null
  fundCategories: string[] | null
  firmName: string | null
  firmDomain: string | null
  fundName: string | null
  fundNumber: string | null
  fundSizeUsdMillions: number | null
  fundStrategy: string | null
  closeType: string | null
  personName: string | null
  personTitle: string | null
  geography: string[] | null
  sourceName: string | null
}

/**
 * A firm that survived the hard-block filters and is queued for Apollo
 * enrichment. One candidate per firm per day.
 */
export interface Candidate {
  article: Article
  firmName: string
  firmDomain: string | null
  storyType: string
  hasNamedPerson: boolean
  personName: string | null
  personTitle: string | null
}

/**
 * A verified senior contact from Apollo, ready for drafting.
 */
export interface Contact {
  email: string
  firstName: string
  lastName: string
  title: string
  firmName: string
  firmDomain: string | null
  personId: string
  article: Article
}

/**
 * Per-guard drop reasons from findContactForFirm. Used for diagnostic
 * visibility into WHICH guard fired on each dropped candidate. Previously
 * every drop was logged as generic "no_verified_email" which made tuning
 * the pipeline hard.
 */
export type ContactDropReason =
  | 'empty_firm_name'        // article had no firm_name to search
  | 'apollo_no_match'        // Apollo search/match returned nothing
  | 'no_verified_email'      // Apollo returned a person but no verified email
  | 'empty_first_name'       // returned person had empty first_name
  | 'title_not_acceptable'   // titleIsAcceptable() failed (junior or non-investment-function)
  | 'org_name_mismatch'      // Apollo org.name didn't match article.firmName
  | 'missing_firm_domain'    // article.firmDomain was null/empty — can't verify domain match
  | 'email_domain_mismatch'  // returned email domain didn't match article.firmDomain

/**
 * findContactForFirm result. Either a contact was found, or a typed
 * reason explaining which guard rejected the candidate.
 */
export type FindContactResult =
  | { ok: true; contact: Contact }
  | { ok: false; reason: ContactDropReason }

/**
 * The composed email ready to hand to the Gmail API.
 */
export interface ComposedEmail {
  subject: string
  body: string
}

export type QualityGateReason =
  | 'over_word_cap'
  | 'missing_link'
  | 'missing_unsub'
  | 'missing_signature'
  | 'em_dash'
  | 'disingenuous_phrasing'
  | 'missing_greeting'
  | 'wrong_subject_prefix'
  | 'wrong_subject_suffix'

export interface QualityGateResult {
  ok: boolean
  reason?: QualityGateReason
}

/**
 * One row that will be inserted into cold_outreach_sent. Mirrors the
 * migration schema in supabase/migrations/20260414_create_cold_outreach_sent.sql.
 */
export interface OutreachLogRow {
  email: string
  firstName: string | null
  lastName: string | null
  firmName: string
  firmDomain: string | null
  personTitle: string | null
  articleId: string
  storyType: string
  subject: string
  draftId: string | null
  status: 'sent' | 'skipped' | 'draft_created'
  notes: string | null
}

/**
 * The return shape of the main cron handler. Mirrored by Vercel logs
 * and the daily summary email.
 */
export interface OutreachRunResult {
  ok: boolean
  sent: number
  cap: number
  /**
   * Total number of firms that survived candidate filters AND firm-level
   * dedup — i.e. the pool that was passed to the Apollo enrichment loop.
   * Useful for diagnosing "why so few sends today" questions.
   */
  candidatesConsidered: number
  skipped: Record<string, number>
  dropped: Array<{ firm: string; reason: string }>
  sentDetails: Array<{ firm: string; email: string; subject: string; messageId: string }>
  apolloSearchCalls: number
  apolloMatchCalls: number
  /**
   * Per-guard drop counters. Each key is one of ContactDropReason (from
   * findContactForFirm) plus `apollo_exception` and `email_dedup`. Tells
   * us which guard layers are firing most often on each run.
   */
  guardDrops: Record<string, number>
  runtimeMs: number
  error?: string
}
