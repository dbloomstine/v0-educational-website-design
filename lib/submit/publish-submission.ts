/**
 * The publish step of "Send us your news" (2026-10-22): a submission the desk
 * has reviewed and verified becomes an ordinary news_items row, and from there
 * an ordinary story. scripts/news/publish-submission.ts does the I/O; this is
 * the pure part, the row itself.
 *
 * The row goes in as `pending`, like a feed item, so the hourly classifier
 * (:30, classify-articles.ts) types it, scores it, writes its summary and finds
 * the firm, the fund and the amount exactly as it does for every other story.
 * It can, because the classifier reads only the row's own text (title plus
 * full_text, else description); it never fetches a page. That text is written
 * here from the submission, and `enriched_at` is set at once so neither text
 * pass (enrich-articles.ts, enrich-stories.ts) ever fetches the row's link: a
 * link to our own story page would hand them our own HTML.
 *
 * What a reader can see, and what never leaves the table:
 *   shown   the headline, what the details say (email addresses and phone
 *           numbers taken out), the firm, its website, the amount, the date
 *   never   the people / deal team, the contact's name, email and role, the IP
 *           hash, the review notes
 *
 * The link (source_url, unique in news_items):
 *   - the public announcement the firm gave, when there is one: that is where
 *     "read the full story" should go, as for any outlet;
 *   - otherwise https://fundopshq.com/story/<the row's own id>. The id is made
 *     before the insert, so the address is the story's own page (a whole uuid
 *     after /story/ is redirected to the canonical slug, story-path.ts). It is
 *     unique by construction, never 404s once the story is classified, and the
 *     daily email (which links a headline to source_url) sends the reader to
 *     our page, not to a form. The /submit page was rejected for this: every
 *     submission would share it, and the email would link a headline to a form.
 *     A fragment (#id) would not do either: normalizeUrl drops it, so every row
 *     would carry the same url_hash and look like one article to the ingest
 *     dedup.
 */
import { hashString, normalizeText, normalizeUrl, titleSourceKey, MAX_ARTICLE_AGE_DAYS } from '@/lib/news/ingest-worker'
import { SUBMISSION_SOURCE_NAME } from '@/lib/news/submission-source'
import { cleanBlock, cleanLine, cleanUrl, LIMITS, NEWS_KIND_LABELS, SITE, type NewsKind } from './news-submission'

/** The columns of news_submissions the publish step reads. Never the people or the contact. */
export const SUBMISSION_PUBLISH_COLUMNS =
  'id, status, kind, firm, firm_website, headline, details, amount, currency, news_date, url, domain_match, published_news_item_id, review_notes, created_at'

export interface SubmissionForPublish {
  id: string
  status: string
  kind: NewsKind | string
  firm: string
  firm_website: string | null
  headline: string
  details: string | null
  amount: number | string | null
  currency: string | null
  news_date: string | null
  url: string | null
  domain_match: boolean | null
  published_news_item_id: string | null
  review_notes?: string | null
}

export interface PublishOptions {
  /** The new news_items id (crypto.randomUUID() in the script). */
  id: string
  now?: Date
  /** The desk's headline, in place of the firm's. */
  title?: string | null
  /** The desk's text, in place of the firm's details. */
  details?: string | null
  /** The date to publish under, in place of news_date (YYYY-MM-DD). Bypasses the age check. */
  publishedDate?: string | null
}

/** Exactly what the script inserts into news_items. */
export interface SubmissionNewsRow {
  id: string
  title: string
  source_url: string
  source_name: string
  published_date: string
  description: string
  full_text: string
  url_hash: string
  content_hash: string
  classification_status: 'pending'
  source_type: 'manual'
  is_duplicate: false
  processing_attempts: 0
  enriched_at: string
  enrichment_error: string
}

export type BuildResult =
  | { ok: true; row: SubmissionNewsRow; titleKey: string | null; warnings: string[] }
  | { ok: false; error: string }

/** Recorded in enrichment_error, so the text passes leave the row alone and a reader of the table knows why. */
export const SUBMISSION_TEXT_NOTE = 'news submission: text from the firm, nothing fetched'

const EMAIL_IN_TEXT = /[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}/gi
/** +1 (212) 555-0100, 212.555.0100, +44 20 7946 0958. Not a date (2026-10-22) or an amount (450,000,000). */
const PHONE_IN_TEXT = /(?:\+\d{1,3}[\s.-]?)?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b|\+\d{1,3}(?:[\s.-]?\d){8,13}\b/g

/** Contact details out of free text: a story never prints an email address or a phone number someone typed. */
export function scrubContacts(text: string): string {
  return text
    .replace(EMAIL_IN_TEXT, '')
    .replace(PHONE_IN_TEXT, '')
    .replace(/[^\S\n]{2,}/g, ' ')
    .replace(/ +([.,;:])/g, '$1')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .trim()
}

/** "450000000" in its currency, as the classifier reads amounts: "450 million USD", "1.2 billion EUR". */
export function amountPhrase(amount: number | string | null, currency: string | null): string | null {
  const n = typeof amount === 'string' ? Number(amount) : amount
  if (n == null || !Number.isFinite(n) || n <= 0) return null
  const cur = (currency ?? 'USD').toUpperCase()
  const trim = (x: number) => String(Number(x.toFixed(2)))
  if (n >= 1e9) return `${trim(n / 1e9)} billion ${cur}`
  if (n >= 1e6) return `${trim(n / 1e6)} million ${cur}`
  return `${Math.round(n).toLocaleString('en-US')} ${cur}`
}

function hostOf(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase()
  } catch {
    return null
  }
}

/** Whole days from `date` (YYYY-MM-DD) to the day of `now`, both UTC. Negative for a date ahead. */
function daysAgo(date: string, now: Date): number {
  const d = Date.parse(`${date}T00:00:00Z`)
  return Math.floor(now.getTime() / 86_400_000) - Math.floor(d / 86_400_000)
}

/**
 * The text the classifier and the long summary read: the details, then one
 * line of facts from the form's own fields. No people, no contact.
 */
export function submissionText(s: Pick<SubmissionForPublish, 'kind' | 'firm' | 'firm_website' | 'amount' | 'currency' | 'url'>, details: string, date: string): string {
  const facts: string[] = [`Firm: ${s.firm}.`]
  const site = hostOf(s.firm_website)
  if (site) facts.push(`Website: ${site}.`)
  const kind = NEWS_KIND_LABELS[s.kind as NewsKind]
  if (kind && s.kind !== 'other') facts.push(`News: ${kind.toLowerCase()}.`)
  const amount = amountPhrase(s.amount, s.currency)
  if (amount) facts.push(`Amount: ${amount}.`)
  facts.push(`Date: ${date}.`)
  return `${details}\n\n${facts.join(' ')}`
}

/** The review_notes after publishing: what was there, then a dated line. */
export function publishedNotes(existing: string | null | undefined, notes: string, newsItemId: string, now = new Date()): string {
  const line = `${now.toISOString().slice(0, 10)} published as news_items ${newsItemId}: ${notes.trim()}`
  return existing?.trim() ? `${existing.trim()}\n${line}` : line
}

export function buildSubmissionRow(s: SubmissionForPublish, opts: PublishOptions): BuildResult {
  const now = opts.now ?? new Date()
  const fail = (error: string): BuildResult => ({ ok: false, error })
  const warnings: string[] = []

  if (s.status !== 'pending') return fail(`status is ${s.status}: only a pending (confirmed, in review) submission is published`)
  if (s.published_news_item_id) return fail(`already published as news_items ${s.published_news_item_id}`)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(opts.id)) return fail('the new row id must be a uuid')

  const title = cleanLine(opts.title ?? s.headline, LIMITS.headline)
  if (!title || title.length < 10) return fail('no usable headline')
  if (/https?:\/\/|www\.|@/.test(title)) return fail('the headline carries a link or an email address: give one with --title')

  const rawDetails = cleanBlock(opts.details ?? s.details, LIMITS.details * 2)
  const details = rawDetails ? scrubContacts(rawDetails) : ''
  if (rawDetails && details !== rawDetails) warnings.push('an email address or phone number was taken out of the details')
  if (details.length < 20) return fail('no usable details (fewer than 20 characters): give some with --details')
  if (/https?:\/\/|www\./i.test(details)) warnings.push('the details carry a link; it will be in the text the classifier reads')

  const date = opts.publishedDate ?? s.news_date
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    return fail('no date of the news: give one with --date YYYY-MM-DD')
  }
  if (!opts.publishedDate) {
    const age = daysAgo(date, now)
    if (age < 0) return fail(`the news is dated ${date}, ahead of today: wait for the day, or give --date`)
    if (age > MAX_ARTICLE_AGE_DAYS) {
      return fail(`the news is dated ${date}, ${age} days ago: older than a feed item may be (${MAX_ARTICLE_AGE_DAYS} days); give --date to publish anyway`)
    }
  }

  const publicUrl = s.url ? cleanUrl(s.url) : null
  if (s.url && !publicUrl) warnings.push(`the announcement link ${s.url} is not a usable web address; the story's own page is the link instead`)
  if (!publicUrl) warnings.push('no public announcement: the link is the story page itself')
  if (s.domain_match === false) warnings.push("the sender's email domain is not the firm website's")
  const sourceUrl = publicUrl ?? `${SITE}/story/${opts.id}`

  const text = submissionText(s, details, date)
  const row: SubmissionNewsRow = {
    id: opts.id,
    title,
    source_url: sourceUrl,
    source_name: SUBMISSION_SOURCE_NAME,
    published_date: date,
    description: text,
    full_text: text,
    // The same recipes as the ingest worker, so its dedup sees this row like any other.
    url_hash: hashString(normalizeUrl(sourceUrl)),
    content_hash: hashString(normalizeText(`${title} ${text.slice(0, 500)}`)),
    classification_status: 'pending',
    source_type: 'manual',
    is_duplicate: false,
    processing_attempts: 0,
    enriched_at: now.toISOString(),
    enrichment_error: SUBMISSION_TEXT_NOTE,
  }
  return { ok: true, row, titleKey: titleSourceKey(title, SUBMISSION_SOURCE_NAME), warnings }
}

