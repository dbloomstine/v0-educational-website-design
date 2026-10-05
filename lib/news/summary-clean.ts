/**
 * The classifier's remarks, taken out of a summary before a reader sees it.
 *
 * The classifier writes one sentence or two about each article (`tldr`), and
 * that field is the only free text it has. So it also uses it to say what the
 * article did not tell it, and why it filed the story as it did:
 *
 *   "MAPP appoints senior advisor to leadership team—executive hire with
 *    insufficient detail to assess seniority or relevance."
 *   "Adams Street names partner for venture secondaries strategy. Leadership
 *    hire at secondary fund manager."
 *   "KKR-backed Spectris acquires sensor business Sentech; portfolio company
 *    M&A, not fund vehicle activity."
 *   "Coastal Ridge closes first close on debut student housing fund; size not
 *    disclosed in snippet."
 *
 * None of that is news, and all of it was printed: under the headline on the
 * front page and on the story's own page, in the RSS feed, on social cards.
 * Measured 2026-10-05 over the rows the site can show since 2026-06-27: about
 * one summary in twenty carries such a remark.
 *
 * The remark is almost always the LAST clause, hung on with a semicolon, a
 * dash or a full stop. So this reads a summary as clauses and drops clauses
 * from the end for as long as they are remarks. Three rules keep it honest:
 *
 *   - the first clause is never dropped: a summary keeps its news;
 *   - a clause is a remark only if it matches a pattern below, and each
 *     pattern is a phrase the classifier uses about its own work (its text,
 *     its filing, what it could not find) that a reporter would not write;
 *   - "deal value not disclosed" stays. A reporter writes that too, and the
 *     reader is told something by it.
 *
 * It changes what is shown, never what is stored or what is selected: the
 * quality gate and the story clustering read the row's own `tldr`.
 */

/** A clause that talks about the text the classifier was given. */
const ABOUT_ITS_TEXT = [
  // "…not disclosed in headline", "unclear from headline": the clause ends on
  // the word. ("A rise in headline inflation" does not.)
  /\b(in|from|per) (the |this )?(available |provided )?(snippet|headline|excerpt)$/i,
  /\b(in|from) (the |this )?(available|provided) (text|article|information)\b/i,
  /\bsnippet\b/i,
  /\b(the |this )?headline (references|mentions|notes|suggests|indicates|says|only)\b/,
  /\b(the |this )?article (also |only |primarily |merely )?(mentions?|references?|notes?|discuss(es)?|covers?|frames?|lacks?|focus(es)?|provides?|does not|doesn't|offers?|contains?|is)\b/i,
  /^(deals? |m&a |pe )?round-?up (also )?(notes|mentions|mentioning|covers|covering)\b/i,
]

/** A clause that says how much the classifier was told. */
const ABOUT_DETAIL = [
  /\b(limited|insufficient|minimal|scant) (detail|details|information|specifics|context)\b/i,
  // "unable to assess relevance". Not "a review to assess the impact on pension funds".
  /\b(insufficient|unable|not enough|cannot|hard|difficult)\b[^;.]{0,40}\bto (assess|determine|gauge|judge|classify|evaluate)\b/i,
  /\bno (further |additional |other |specific )?(details?|specifics|information) (on|about|provided|given|available|disclosed)\b/i,
  /\bno (specific |further |additional )?[^;.]{0,60}\b(details?|specifics) (provided|given|available)\b/i,
  /\bno specifics\b/i,
  /\b(details?|specifics|information|significance) (on [^;.]{0,40} )?(is |are |was |were )?not (provided|given|specified|stated|detailed)\b/i,
  /\b(details?|specifics|information) (is |are |was |were )?not available$/i,
]

/** A clause that argues the filing: what kind of story this is, and is not. */
const ABOUT_ITS_FILING = [
  // "not fund-related", "not a fund vehicle or GP", "not about investment
  // funds", "not a fund". Not the verb ("would not fund the buyout") and not
  // "not a fund-of-funds".
  /(?<!\b(?:will|would|does|do|did|could|can|may|might|shall|should|must) )\bnot (a |an |the |about (a |an )?|related to (a |an )?|tied to (a |an )?)?((traditional|core|dedicated|institutional|specific|private|pe\/vc|lp|gp\/lp|investment|alternative asset manager) )*funds?([- ](related|level|specific|focused|raising)\b|,|$| (vehicles?|managers?|management|activity|capital|launch|launches|raise|raising|event|story|news|industry|announcement|transaction|operations|formation|or|nor|gp|lp)\b)/i,
  /\bnot (a |an )?(alternative asset manager |fund[- ]manager |fund )?capital raise\b/i,
  /\bno (specific |named )?(fund[- ]specific|fund[- ]level|fund[- ]related|fund vehicle|fund or |fund capital (event|raise))\b/i,
  /\bno (specific )?fund (vehicle )?(or [^;.]{0,30} )?(named|announced|identified)\b/i,
  /\b(fund[- ]related|fund[- ]level|fund vehicle|fund) capital event\b/i,
  /\bappears? to be (a |an )?[^;.]{0,60}\b(vehicle|fund)\b/i,
  /^(specific )?fund vehicle\b[^;.]*\b(confirmed|specified|named)\b/i,
  /^[^;.]{0,40}\bfund vehicle and (size|close type) (specified|confirmed)\b/i,
]

/**
 * A clause that is only the name of a filing: no subject, no verb. Each is
 * the label alone, or the label and what it is pinned to ("…hire at secondary
 * fund manager"). A label that goes on to say something is news: "portfolio
 * company acquisition expected to close in Q4", "regulatory update due in
 * March", "LP-led activity reached $50bn".
 */
const BARE_LABEL = [
  /^(leadership|executive|partner[- ]level|c-suite|asset manager|law firm( service provider)?|service provider) (hire|hiring|move|appointment|change|departure)( (at|in|for|with|within)\b[^;.]*)?$/i,
  /^(mid[- ]level|junior|routine|standard|internal|lateral) [^;.]{0,40}\b(hire|appointment|move|promotion)$/i,
  /^(lp|gp) [\w/ -]{0,30}\b(activity|announcement)( (across|at|in|for|by|to|from|with)\b[^;.]*)?$/i,
  /^lp commitment to [^;.]*\b(fund|vehicle)$/i,
  /\b(announcement|launch|update) without (a |any )?(stated |specific )?(size|target|capital|fund[- ]specific|fund size|fund or|details)\b/i,
  /^regulatory (process |framework )?(update|intervention)( (with|without|on|for|affecting)\b[^;.]*)?$/i,
  /^portfolio[- ]company (m&a|acquisition|investment|exit|financing|fundraising|funding|capital raise|venture round|transactions?)(,|$|\/| (by|for|of|round-?up)\b)/i,
  /^portfolio (activity|m&a|exit) ?(round-?up)?$/i,
]

const REMARK = [...ABOUT_ITS_TEXT, ...ABOUT_DETAIL, ...ABOUT_ITS_FILING, ...BARE_LABEL]

/** Is this clause the classifier talking about its own work? */
export function isClassifierRemark(clause: string): boolean {
  const c = clause.trim().replace(/[.;,\s]+$/, '')
  if (!c) return false
  return REMARK.some((p) => p.test(c))
}

/**
 * Where a summary's clauses part: a semicolon, a dash used as one, or a full
 * stop followed by a space and a capital. That last also parts "Inc. Announces"
 * and "U.S. Treasury", and it is meant to: a clause read too short costs
 * nothing (it is cut only if it is itself a remark), while a clause read too
 * long takes the news in front of a remark with it. "…nears $900M. Portfolio
 * company funding, not a fund vehicle." has to part after the figure.
 */
const CLAUSE_BREAK = /\s*;\s+|\s*[—–]\s*|\s+-\s+|\.\s+(?=[A-Z0-9“"‘'$€£])/g

/** The summary without the classifier's closing remarks. Null stays null. */
export function cleanSummary(summary: string | null | undefined): string | null {
  if (!summary) return null
  let text = summary.trim()
  // "(limited details available in snippet)" — a remark in brackets, anywhere.
  text = text.replace(/\s*\(([^()]*)\)/g, (whole, inner: string) => (isClassifierRemark(inner) ? '' : whole)).trim()

  const breaks = [...text.matchAll(CLAUSE_BREAK)]
  let end = text.length
  // From the last clause back, never as far as the first.
  for (let i = breaks.length - 1; i >= 0; i--) {
    const start = (breaks[i].index ?? 0) + breaks[i][0].length
    if (!isClassifierRemark(text.slice(start, end))) break
    end = breaks[i].index ?? 0
  }
  if (end === text.length) return text === summary.trim() ? summary.trim() : finish(text)
  return finish(text.slice(0, end))
}

function finish(text: string): string {
  const t = text.trim().replace(/[\s,;:—–-]+$/, '')
  return /[.!?…)’'"”]$/.test(t) ? t : `${t}.`
}
