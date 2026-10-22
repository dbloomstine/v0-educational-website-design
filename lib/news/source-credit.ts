/**
 * Who to credit for a report (2026-10-22).
 *
 * JD Supra republishes law firms' client alerts. Danny noticed many
 * regulation stories credited to "JD Supra" when a law firm wrote them. We
 * now credit the firm and keep the link to the JD Supra page we actually
 * read: "Morgan Lewis via JD Supra".
 *
 * Where the firm comes from: from 2026-10-22 ingest stores it in `author`
 * (the feed's first <dc:creator>). Older rows have no author, but every JD
 * Supra description ends "...By: <Firm>", so the helper reads that instead.
 *
 * Only JD Supra for now. Of the other republishers in our feeds, Law360,
 * Bloomberg Law and The National Law Review write or edit their own pieces,
 * and Lexology and Mondaq do not reach us with the author firm in the text.
 *
 * Pure: no database, safe in tests and in the browser.
 */
import { decodeHtmlEntities, normalizeSourceName } from './constants'

/** Outlets that republish other people's work, keyed by their canonical name (normalizeSourceName). */
const REPUBLISHERS = new Set(['jd supra'])

export interface CreditInput {
  sourceName: string | null | undefined
  /** Kept for callers that have it; the credit links to it unchanged. */
  sourceUrl?: string | null
  description?: string | null
  author?: string | null
}

/** True when this outlet republishes others' work and the author can be credited. */
export function isRepublisher(sourceName: string | null | undefined): boolean {
  const name = normalizeSourceName(sourceName ?? null)
  return !!name && REPUBLISHERS.has(name.toLowerCase())
}

// "...By: Alston & Bird" at the very end of a description. The raw feed
// has "<BR />By: <a href=...>Firm</a>"; tags are taken out before this runs.
const BYLINE_RE = /(?:\.{2,}|…)?\s*\bBy:\s*([^\n]{1,160}?)\s*$/

function plain(text: string): string {
  // Twice: the feed escapes some names twice ("A&amp;amp;O Shearman").
  return decodeHtmlEntities(decodeHtmlEntities(text.replace(/<[^>]+>/g, ' ')))
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** A firm name as given, tidied: entities decoded, spaces collapsed. Null when it does not look like a name. */
export function cleanFirmName(raw: string | null | undefined): string | null {
  if (!raw) return null
  const name = plain(raw).replace(/^by:\s*/i, '').replace(/[\s,;:.-]+$/, '').trim()
  if (name.length < 2 || name.length > 90) return null
  if (/https?:|www\.|@/.test(name)) return null
  if (/^jd ?supra\b/i.test(name)) return null
  return name
}

/** The firm named in a description's closing "By: <Firm>" line, or null. */
export function bylineFirm(description: string | null | undefined): string | null {
  if (!description) return null
  const m = plain(description).match(BYLINE_RE)
  return m ? cleanFirmName(m[1]) : null
}

/**
 * The credit to show for a report: "Firm via JD Supra" for a republished
 * alert whose firm we know, otherwise the outlet's name as before.
 */
export function sourceCredit(input: CreditInput): string | null {
  const outlet = normalizeSourceName(input.sourceName ?? null)
  if (!outlet || !REPUBLISHERS.has(outlet.toLowerCase())) return outlet
  const firm = cleanFirmName(input.author) ?? bylineFirm(input.description)
  return firm ? `${firm} via ${outlet}` : outlet
}

/** The outlet a credit names: "Morgan Lewis via JD Supra" -> "JD Supra". Anything else unchanged. */
export function creditOutlet(credit: string | null | undefined): string | null {
  if (!credit) return null
  const i = credit.lastIndexOf(' via ')
  return i > 0 ? credit.slice(i + 5) : credit
}

/**
 * A description without its closing "...By: <Firm>" line, for any text a
 * reader (or a model writing for readers) sees. A cut-off sentence keeps an
 * ellipsis; a finished one keeps its own full stop. Only republishers' rows
 * are touched: elsewhere "By:" could be part of the text.
 */
export function stripByline(text: string | null | undefined, sourceName: string | null | undefined): string {
  if (!text) return ''
  if (!isRepublisher(sourceName)) return text
  const m = text.match(/(?:\.{2,}|…)?\s*(?:<br\s*\/?>\s*)?\bBy:\s*(?:<a\b[^>]*>)?[^\n<]{1,160}(?:<\/a>)?\s*$/i)
  if (!m || m.index === undefined) return text
  const body = text.slice(0, m.index).trimEnd()
  if (!body) return ''
  return /[.!?"”')\]]$/.test(body) ? body : `${body}…`
}
