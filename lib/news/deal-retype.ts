/**
 * A deal the classifier filed where nothing shows it.
 *
 * The site and the email read only the newsletter types (fund events, people
 * moves, acquisitions, regulatory actions). A row typed `other` or
 * `market_commentary` is never fetched, however relevant the classifier
 * thought it. Audited over the fortnight to 2026-10-12: about ten rows a
 * fortnight were plain deals typed that way and so hidden — "Aurora Capital
 * Partners acquires education and government software firm Softdocs" (other,
 * 0.4), "KKR exits Japanese midscale hotel portfolio after two-year turnaround"
 * (other, 0.4), "HIG exits Italian beauty and personal care retailer" (other,
 * 0.3). Most are a manager's exit or acquisition of a property or a portfolio
 * company, which the prompt's property-sale rule pushes toward `other`; the
 * audience are the managers doing them.
 *
 * This retypes such a row to `acquisition` at classification time, when the
 * headline is a transaction told plainly: a named firm the classifier
 * extracted, a transaction verb near the front, no sign of a column, a list or
 * a question, and a relevance the site would show. Only the type (and so the
 * section) changes; relevance, names and summary stay the classifier's. It is
 * deliberately narrow: a headline it is not sure about stays as filed.
 */

/** Types nothing shows. `press_release` is here because a firm's own announcement of its deal is often filed as one. */
const HIDDEN_TYPES = new Set(['other', 'market_commentary', 'industry_analysis', 'press_release'])

/** The site shows a row at this relevance; below it the classifier did not think the story was ours. */
const MIN_RELEVANCE = 0.3

/**
 * A transaction verb. `exits` only as a verb with an object ("exits Japanese
 * hotel portfolio", "exits its stake"), never the noun ("hits $12bn of exits",
 * "looking for exit optionality", "with first exit").
 */
const TRANSACTION =
  /\b(acquires?|acquired|to acquire|acquisition of|buys?|bought|to buy|purchases?|sells?|sold|to sell|sale of|divests?|divested|exits? (?=(?:its|the|a|an|from)\b|[A-Z0-9£$€])|takes? (?:a |an )?(?:majority|minority|controlling|significant|strategic|\d+%)? ?stake|agrees? (?:to )?(?:sale|acquisition|to acquire|to sell|to buy|deal)|completes? (?:the )?(?:sale|acquisition|purchase|exit|take-?private)|take-?private|takeover of|carve-?out of|snaps up|offloads?)\b/

/** Signs the headline is not one plain transaction. */
const NOT_ONE_DEAL = /[;?]|\b\d+ (?:standout |notable |biggest |top )?deals\b|\b(?:roundup|round-up|recap|in focus|explained|how to|why |what |inside |on the move)\b|^\s*(?:[A-Z][\w&.' -]{1,40}:)/i

/** The subject before the verb: at most six words, so the firm (or its fund) is the one acting. */
const MAX_SUBJECT_WORDS = 6

export interface RetypeInput {
  article_type: string
  relevance_score: number
  firm_name: string | null
}

/** True when a hidden-type row's headline is a plain transaction by a named firm. */
export function isHiddenDeal(title: string, c: RetypeInput): boolean {
  if (!HIDDEN_TYPES.has(c.article_type)) return false
  if (!(c.relevance_score >= MIN_RELEVANCE)) return false
  if (!c.firm_name || c.firm_name.trim().length < 2) return false
  const t = title.replace(/\s+/g, ' ').trim()
  if (NOT_ONE_DEAL.test(t)) return false
  const m = TRANSACTION.exec(t)
  if (!m) return false
  const subject = t.slice(0, m.index).trim()
  if (!subject) return false
  if (subject.split(' ').length > MAX_SUBJECT_WORDS) return false
  // A firm name in the subject, in some form: the first word of the extracted
  // name is in it, or the subject is a possessive of it ("Redevco's … fund").
  const firstWord = c.firm_name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9&]/g, '')
  const subj = subject.toLowerCase().replace(/[^a-z0-9& ]/g, ' ')
  return firstWord.length > 0 && subj.split(/\s+/).some((w) => w === firstWord || (firstWord.length >= 4 && w.startsWith(firstWord)))
}

/** The classification with the type changed to `acquisition` when the headline is a hidden deal; otherwise as given. */
export function retypeHiddenDeal<T extends RetypeInput>(title: string, c: T): T {
  return isHiddenDeal(title, c) ? { ...c, article_type: 'acquisition' } : c
}
