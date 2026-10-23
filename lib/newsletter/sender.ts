/**
 * The address every email a READER gets comes from, and where their replies
 * go: the daily edition, the welcome note and series, the Monday events email
 * and the news-submission confirmation. A person's address, not a role
 * address, because strict corporate filters file role-address bulk mail as
 * graymail ("No Association": Darktrace on Danny's work inbox, 2026-10-23).
 * danny@fundopshq.com forwards to Danny's Gmail through ImprovMX.
 *
 * Owner and ops alerts (lib/alerts, lib/pipeline/alert.ts, lib/outreach/*,
 * the feedback route) stay on RESEND_FROM_EMAIL / feedback@fundopshq.com.
 * Read at call time so an env change (or a test stub) takes effect.
 */
export const DEFAULT_READER_EMAIL = 'danny@fundopshq.com'

export function readerFromEmail(): string {
  return process.env.READER_FROM_EMAIL || DEFAULT_READER_EMAIL
}

export function readerReplyTo(): string {
  return process.env.READER_REPLY_TO || DEFAULT_READER_EMAIL
}
