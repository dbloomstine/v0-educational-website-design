/**
 * A sum of money a classification states must come from its own article.
 *
 * The classifier reads up to fifteen articles in one call. Pairing by id and
 * the name check (classification-align.ts) make sure each answer is about the
 * right article. They cannot see a single figure that leaked across: on
 * 2026-10-01 "EQT Agreed to Sell Korea's Acuon Group…" (whose own text says
 * "Financial terms were not disclosed") was stored with "deal valued at $2.92B
 * enterprise value" and a size of 2,920. $2.92B was the price of a different
 * deal, reported in another article of the same call. The figure ran on the
 * site, and a social post built on it was caught only in rehearsal.
 *
 * The rule: every sum of money in a classification (its size, and each sum
 * its summary states) must be a figure the article's own text states: the
 * same sum, a plausible conversion of it, or plain arithmetic on what the
 * text states ("half its $2bn target", "$4B above the $45B target"). One that
 * is not is foreign, wherever it came from: a batch neighbour, the model's
 * memory, or a guess.
 *
 * The reader is deliberately generous about how a figure may be written
 * ("$249mln", "US$30 bil", "Rs. 1,200 crores", "£345.6 deal", "Sh64.5bn",
 * "a Billion-Dollar fund"): a figure the article states in any form must
 * never be taken for a foreign one.
 *
 * Pure: no I/O.
 */

/** What the article itself says: everything of its own that we store. */
export interface OwnArticle {
  title: string
  description?: string | null
  full_text?: string | null
}

/** The parts of a classification that state money. */
export interface MoneyClaims {
  summary_ai?: string | null
  fund_size_usd_millions?: number | null
  original_currency?: string | null
  original_amount_millions?: number | null
}

export interface Figure {
  /** ISO code; null when the text gives no currency, or one we do not know ("Sh64.5bn"). */
  currency: string | null
  /** Millions of that currency. */
  amountM: number
  /**
   * A small number with a currency and no unit ("£345.6 deal", "$250"): it may
   * be the sum as written, or millions or billions with the unit left off.
   */
  unitless?: boolean
  /** The other end of a range ("$4-5 billion"): anything between the two is given by the text. */
  to?: number
  /** Written with a currency code we do not know ("Sh64.5bn", "RM1.2bn"): its dollar value cannot be worked out. */
  unconvertible?: boolean
  index: number
  end: number
}

/**
 * How far apart two statements of one sum may be: "$2.92 billion" against
 * "$2.9B", "nearly $1bn" against 987. Wider than rounding needs, far narrower
 * than the gap between two different deals.
 */
export const SAME_SUM = 0.05

/**
 * Dollars per unit of each currency, as a band (as in money.ts): the
 * classifier converts at whatever rate the article or its memory supplies.
 */
const USD_PER: Record<string, [number, number]> = {
  USD: [1, 1], EUR: [1.0, 1.25], GBP: [1.05, 1.45], JPY: [0.0058, 0.0078], AUD: [0.6, 0.74], CAD: [0.66, 0.8],
  NZD: [0.55, 0.68], SGD: [0.68, 0.82], HKD: [0.12, 0.135], INR: [0.0105, 0.013], ZAR: [0.048, 0.062],
  CHF: [1.0, 1.3], SEK: [0.085, 0.11], NOK: [0.085, 0.11], DKK: [0.13, 0.16], CNY: [0.13, 0.15],
  KRW: [0.00062, 0.00082], AED: [0.26, 0.28], SAR: [0.26, 0.27], BRL: [0.16, 0.22], TWD: [0.028, 0.035],
}

const CODES: Record<string, string> = {
  $: 'USD', US$: 'USD', 'U.S.$': 'USD', USD: 'USD',
  A$: 'AUD', AU$: 'AUD', AUD: 'AUD', C$: 'CAD', CA$: 'CAD', CAD: 'CAD', S$: 'SGD', SGD: 'SGD',
  HK$: 'HKD', HKD: 'HKD', NZ$: 'NZD', NZD: 'NZD', R$: 'BRL', BRL: 'BRL', NT$: 'TWD', TWD: 'TWD',
  '€': 'EUR', EUR: 'EUR', '£': 'GBP', GBP: 'GBP', '¥': 'JPY', JPY: 'JPY', CNY: 'CNY', RMB: 'CNY',
  '₹': 'INR', INR: 'INR', RS: 'INR', 'RS.': 'INR', '₩': 'KRW', KRW: 'KRW',
  CHF: 'CHF', SEK: 'SEK', NOK: 'NOK', DKK: 'DKK', AED: 'AED', SAR: 'SAR', ZAR: 'ZAR', R: 'ZAR',
}

const WORDS: Record<string, string> = {
  dollar: 'USD', dollars: 'USD', 'us dollar': 'USD', 'us dollars': 'USD', usd: 'USD',
  euro: 'EUR', euros: 'EUR', eur: 'EUR', pound: 'GBP', pounds: 'GBP', sterling: 'GBP', gbp: 'GBP',
  yen: 'JPY', yuan: 'CNY', renminbi: 'CNY', won: 'KRW', rupee: 'INR', rupees: 'INR', rand: 'ZAR',
  franc: 'CHF', francs: 'CHF', dirham: 'AED', dirhams: 'AED', riyal: 'SAR', riyals: 'SAR',
}

/** Millions per unit. */
const UNITS: Record<string, number> = {
  'lakh crore': 1_000_000, 'lakh crores': 1_000_000,
  trillion: 1_000_000, trillions: 1_000_000, trn: 1_000_000, tr: 1_000_000, tn: 1_000_000, t: 1_000_000,
  billion: 1000, billions: 1000, bln: 1000, bil: 1000, bn: 1000, b: 1000,
  million: 1, millions: 1, mln: 1, mil: 1, mn: 1, mm: 1, m: 1,
  thousand: 0.001, k: 0.001,
  crore: 10, crores: 10, cr: 10, lakh: 0.1, lakhs: 0.1,
}
/** A unit too short to stand without a currency beside it ("500m" is also five hundred metres). */
const SHORT_UNIT = new Set(['b', 'm', 'k', 't', 'mm', 'cr'])

const CUR = '(?:US\\$|U\\.S\\.\\$|(?:USD|AUD|CAD|NZD|SGD|HKD)\\s?\\$|AU?\\$|CA?\\$|S\\$|HK\\$|NZ\\$|NT\\$|R\\$|\\$|€|£|¥|₹|₩'
  + '|\\b(?:USD|EUR|GBP|JPY|AUD|CAD|NZD|SGD|HKD|INR|ZAR|CHF|SEK|NOK|DKK|CNY|RMB|KRW|AED|SAR|BRL|TWD)\\b|\\bRs\\.?)'
const NUM = '(?:\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?)'
const UNIT = '(?:lakh crores?|trillions?|trn|tr|tn|billions?|bln|bil|bn|b|millions?|mln|mil|mn|mm|m|thousand|k|t|crores?|cr|lakhs?)'
const WORD = '(?:US dollars?|dollars?|USD|euros?|EUR|pounds?|sterling|GBP|yen|yuan|renminbi|won|rupees?|rand|francs?|dirhams?|riyals?)'

const FIGURE = new RegExp(
  // a currency sign or code; or a short capitalised code we may not know, hard against the number ("Sh64.5bn", "RM1.2bn")
  `(${CUR}|\\b[A-Z][A-Za-z]{0,2}(?=\\d))?\\s?(${NUM})(?:[\\s-]?(${UNIT})(?![A-Za-z]))?(?:[\\s-](${WORD})\\b)?`,
  'gi',
)
/** "$4-5 billion", "€3–4bn", "$30-40K", "$2 billion to $3 billion" is read by FIGURE; this is the short form, one unit for both ends. */
const RANGE = new RegExp(`(?:(${CUR})\\s?|(?<![\\w.,$€£¥₹₩]))(${NUM})\\s?(?:-|–|—|\\sto\\s)\\s?(?:${CUR})?\\s?(${NUM})[\\s-]?(${UNIT})(?![A-Za-z])`, 'gi')
/**
 * A sum in words: "two billion dollars", "four trillion reasons", "half a billion", and the adjective
 * "a Billion-Dollar fund". "Several billion dollars" names no sum and is not read as one.
 */
const IN_WORDS = /\b(?:(a|one|two|three|four|five|six|seven|eight|nine|ten|half a)[\s-](million|billion|trillion)(?:[\s-]dollars?)?|(million|billion|trillion)-dollar)\b/gi
const SMALL: Record<string, number> = { a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, 'half a': 0.5 }

const codeOf = (prefix: string | undefined): string | null => {
  if (!prefix) return null
  const p = prefix.trim().toUpperCase().replace(/\s/g, '')
  // "CAD $100M", "AUD $1.05 billion": the code decides, the sign is decoration.
  const lead = p.match(/^(USD|AUD|CAD|NZD|SGD|HKD)\$$/)
  return lead ? lead[1] : CODES[p] ?? null
}
const numberOf = (s: string) => Number(s.replace(/,/g, ''))

/** Every sum of money a text states, however it is written. */
export function figuresIn(text: string): Figure[] {
  const out: Figure[] = []
  const inside = (index: number) => out.some((f) => index >= f.index && index < f.end)

  for (const m of text.matchAll(RANGE)) {
    const index = m.index ?? 0
    const currency = codeOf(m[1])
    const unitName = m[4].toLowerCase().replace(/\s+/g, ' ')
    // "10-15 m" with no currency could be anything; "10-15 million" is money.
    if (!currency && SHORT_UNIT.has(unitName)) continue
    const unit = UNITS[unitName]
    const lo = numberOf(m[2]) * unit, hi = numberOf(m[3]) * unit
    // "2 to 5.6tn" out of "in Q2 to $5.6tn" is not a range; the two ends of one are of a size.
    if (!(lo > 0 && hi > lo && hi <= lo * 10)) continue
    // Both ends share the span, so nothing inside it is read a second time.
    out.push({ currency, amountM: lo, to: hi, index, end: index + m[0].length }, { currency, amountM: hi, to: lo, index, end: index + m[0].length })
  }

  for (const m of text.matchAll(FIGURE)) {
    const [raw, pre, num, unitRaw, word] = m
    const index = m.index ?? 0
    if (inside(index)) continue
    const n = numberOf(num)
    if (!Number.isFinite(n) || n <= 0) continue
    const unit = unitRaw?.toLowerCase().replace(/\s+/g, ' ')
    const known = codeOf(pre)
    const byWord = word ? WORDS[word.toLowerCase()] ?? null : null
    const currency = known ?? byWord
    // A capitalised prefix we do not know ("Sh", "RM") is a currency we cannot name: the figure is kept, with no currency.
    const unknownCode = Boolean(pre?.trim()) && !known && !byWord
    const at = { index, end: index + raw.length }
    if (unit) {
      // "500m" alone could be metres, and "B2B" is not two billion; with a currency, or a longer unit, it is money.
      if (!currency && SHORT_UNIT.has(unit)) continue
      out.push({ currency, amountM: n * UNITS[unit], ...(unknownCode ? { unconvertible: true } : {}), ...at })
    } else if (currency && (num.includes(',') || n >= 1000)) {
      if (/^(19|20)\d\d$/.test(num)) continue // "USD 2026 outlook"
      out.push({ currency, amountM: n / 1_000_000, ...at }) // "$950,000,000", "£503,000"
    } else if (known) {
      out.push({ currency, amountM: n, unitless: true, ...at }) // "£345.6 deal"
    }
  }

  for (const m of text.matchAll(IN_WORDS)) {
    const index = m.index ?? 0
    if (inside(index)) continue
    const dollars = /dollar/i.test(m[0])
    out.push({ currency: dollars ? 'USD' : null, amountM: (SMALL[(m[1] ?? 'a').toLowerCase()] ?? 1) * UNITS[(m[2] ?? m[3]).toLowerCase()], index, end: index + m[0].length })
  }

  out.sort((a, b) => a.index - b.index)
  // "$2 billion to $3 billion", "$200m–$300m", "between $8bn and $12bn": two whole figures that are the ends of one range.
  for (let i = 0; i + 1 < out.length; i++) {
    const a = out[i], b = out[i + 1]
    if (a.to !== undefined || b.to !== undefined || a.unitless || b.unitless || a.end > b.index) continue
    if (a.currency && b.currency && a.currency !== b.currency) continue
    const between = text.slice(a.end, b.index)
    const joined = /^\s?(?:-|–|—|to)\s?$/i.test(between) || (/^\sand\s$/i.test(between) && /\bbetween\s$/i.test(text.slice(Math.max(0, a.index - 9), a.index)))
    if (joined && b.amountM > a.amountM && b.amountM <= a.amountM * 4) { a.to = b.amountM; b.to = a.amountM }
  }
  return out
}

/** "$" in an Australian or Canadian outlet is that country's dollar: a bare dollar figure answers for any of them. */
const DOLLARS = new Set(['USD', 'AUD', 'CAD', 'NZD', 'SGD', 'HKD'])

/** Within the tolerance, or within a few thousand of the currency: "$84,510" is 0.08 to a classifier that keeps two decimals. */
const close = (a: number, b: number, tolerance: number) => Math.abs(a - b) <= Math.max(tolerance * Math.max(Math.abs(a), Math.abs(b)), 0.006)

/** Is `want` one of the figures `own` holds: the same sum, a sum inside a stated range, or a plausible conversion of one? */
export function stated(own: Figure[], want: { currency: string | null; amountM: number }, tolerance = SAME_SUM): boolean {
  const band = want.currency ? USD_PER[want.currency] : undefined
  return own.some((have) => {
    // With no unit written, "£345.6" may be the sum itself, or millions, or billions.
    const sums = have.unitless ? [have.amountM / 1_000_000, have.amountM, have.amountM * 1000] : [have.amountM]
    const within = (s: number, w: number) => close(s, w, tolerance) || (have.to !== undefined && w >= Math.min(have.amountM, have.to) && w <= Math.max(have.amountM, have.to))
    // No currency on one side, the same on both, or two kinds of dollar: the same number.
    const sameKind = !have.currency || !want.currency || have.currency === want.currency || (have.currency === 'USD' && DOLLARS.has(want.currency))
    if (sameKind && sums.some((s) => within(s, want.amountM))) return true
    if (!have.currency || !want.currency || have.currency === want.currency) return false
    // Two currencies: one must be a conversion of the other, through dollars.
    const haveBand = USD_PER[have.currency]
    if (!band || !haveBand) return false
    return sums.some((s) => want.amountM >= (s * haveBand[0] * 0.95) / band[1] && want.amountM <= (s * haveBand[1] * 1.05) / band[0])
  })
}

/**
 * Sums the text does not print but plainly gives: "half its $2bn target" is
 * $1bn, "doubling the $70m" is $140m; and, for a summary, one stated figure
 * taken from or added to another ("$4B above the $45B target").
 */
function derived(text: string, own: Figure[], { pairs }: { pairs: boolean }): Figure[] {
  const out: Figure[] = []
  const whole = own.filter((f) => !f.unitless)
  const at = { index: -1, end: -1 }
  if (/\bhalf(?:way)?\b/i.test(text)) for (const f of whole) out.push({ currency: f.currency, amountM: f.amountM / 2, ...at }, { currency: f.currency, amountM: f.amountM * 2, ...at })
  if (/\b(?:doubl\w*|twice)\b/i.test(text)) for (const f of whole) out.push({ currency: f.currency, amountM: f.amountM * 2, ...at }, { currency: f.currency, amountM: f.amountM / 2, ...at })
  if (/\btripl\w*\b/i.test(text)) for (const f of whole) out.push({ currency: f.currency, amountM: f.amountM * 3, ...at }, { currency: f.currency, amountM: f.amountM / 3, ...at })
  if (pairs) {
    for (let i = 0; i < whole.length; i++) {
      for (let j = i + 1; j < whole.length; j++) {
        const a = whole[i], b = whole[j]
        if (a.currency !== b.currency || a.amountM === b.amountM) continue
        out.push({ currency: a.currency, amountM: Math.abs(a.amountM - b.amountM), ...at }, { currency: a.currency, amountM: a.amountM + b.amountM, ...at })
      }
    }
  }
  return out
}

export interface ForeignAmounts {
  /** The size (and the original amount it was converted from) is not a figure the article gives. */
  size: boolean
  /** Sums the summary states that the article does not give, with where each sits in the summary. */
  summary: Figure[]
}

/** The sums of money a classification states that its own article does not give. */
export function foreignAmounts(article: OwnArticle, claims: MoneyClaims, tolerance = SAME_SUM): ForeignAmounts {
  const text = `${article.title}\n${article.description ?? ''}\n${article.full_text ?? ''}`
  const own = figuresIn(text)
  const forSize = [...own, ...derived(text, own, { pairs: false })]
  const forSummary = [...own, ...derived(text, own, { pairs: true })]
  // A figure in a currency we cannot name cannot be converted, so a dollar value given for it cannot be checked.
  const unconvertible = own.some((f) => f.unconvertible)

  let size = false
  const sizeUsd = claims.fund_size_usd_millions
  const sizeGiven = typeof sizeUsd === 'number' && sizeUsd > 0
  if (sizeGiven) {
    const currency = (claims.original_currency ?? '').toUpperCase()
    const original = claims.original_amount_millions
    const foreignCurrency = Boolean(currency) && currency !== 'USD'
    const hasOriginal = foreignCurrency && typeof original === 'number' && original > 0
    // The original amount. Its unit is not trusted: the classifier has written 64.5 for "Sh64.5bn" and 11,000 for "₹11,000 crore".
    const byOriginal = hasOriginal && [1, 10, 1000, 0.1, 0.001].some((k) => stated(forSize, { currency: USD_PER[currency] ? currency : null, amountM: (original as number) * k }, tolerance))
    // A figure the article prints with no currency we can name is read in the currency the classifier says it is.
    const named = foreignCurrency && USD_PER[currency] ? forSize.map((f) => (f.currency === null ? { ...f, currency } : f)) : forSize
    const byDollars = stated(named, { currency: 'USD', amountM: sizeUsd as number }, tolerance)
    // "RM1.2bn" in the article and 270 in the answer: a conversion we cannot check is not called foreign.
    const unverifiable = unconvertible && (!foreignCurrency || !USD_PER[currency])
    size = !byOriginal && !byDollars && !unverifiable
  }

  const summaryText = claims.summary_ai ?? ''
  const summary = figuresIn(summaryText).filter((f) => {
    if (stated(forSummary, f, tolerance)) return false
    // The summary giving the row's own size in dollars ("€65M (~$71M)"), where that size is the article's.
    if (sizeGiven && !size && (f.currency === 'USD' || f.currency === null) && close(f.amountM, sizeUsd as number, tolerance)) return false
    // "Sh64.5bn (~$500M)": a dollar gloss on a sum in a currency we cannot convert.
    if (unconvertible && f.currency === 'USD' && /[~≈(]\s?$|\b(?:about|approximately|roughly|around|or)\s$/i.test(summaryText.slice(Math.max(0, f.index - 16), f.index))) return false
    return true
  })

  return { size, summary }
}

export const isClean = (f: ForeignAmounts) => !f.size && f.summary.length === 0

// ─── In the pipeline ────────────────────────────────────────────────────────

export interface Rechecked<T> {
  /** What to store. Null when the article could not be classified cleanly this time (try again later). */
  result: T | null
  /** The article was classified again, on its own. */
  asked: boolean
  /** The size was foreign and the article, read alone, gives none: it was dropped. */
  sizeDropped: boolean
  /** What was foreign in the batch's answer, in words (for the log). */
  why: string | null
}

const sumLabel = (f: { currency: string | null; amountM: number }) =>
  `${f.currency ?? ''} ${f.amountM >= 1000 ? `${+(f.amountM / 1000).toFixed(2)}bn` : `${+f.amountM.toFixed(2)}m`}`.trim()

/**
 * The classifier's answer for one article, with its money checked.
 *
 * Clean: stored as it is. If it states a sum the article does not give, the
 * article is classified again on its own (`askAlone`), where there is no
 * neighbour to take a figure from, and only what was wrong is replaced:
 *
 *   - a summary that stated a foreign sum gives way to the summary written alone;
 *   - a foreign size gives way to the size given alone, if the article states
 *     that one; otherwise there is no size (a size is a figure the article
 *     prints, not one the model adds up or works out of a percentage).
 *
 * Everything else stays as the batch had it. Read alone, an article loses the
 * context that told the classifier what kind of story it is: replayed, a fund
 * launch four outlets reported came back alone as "other, relevance 0". The
 * batch's judgement of type and relevance was never the problem.
 *
 * `askAlone` may throw (the API is down): that is the caller's to handle, as
 * for any classifier call. The check itself never throws: if it cannot be
 * made, the batch's answer is stored as it came, which is how things stood
 * before there was a check.
 */
export async function withOwnAmounts<T extends MoneyClaims>(
  article: OwnArticle,
  result: T,
  askAlone: () => Promise<T | null>,
): Promise<Rechecked<T>> {
  // The check must never be what stops an article being classified: if it fails, the answer stands as it came.
  let foreign: ForeignAmounts
  try {
    foreign = foreignAmounts(article, result)
  } catch {
    return { result, asked: false, sizeDropped: false, why: null }
  }
  if (isClean(foreign)) return { result, asked: false, sizeDropped: false, why: null }
  const why = [foreign.size ? `size ${result.fund_size_usd_millions}` : null, ...foreign.summary.map(sumLabel)].filter(Boolean).join(', ')

  const alone = await askAlone()
  if (!alone || (foreign.summary.length > 0 && !alone.summary_ai)) return { result: null, asked: true, sizeDropped: false, why }

  let fixed: T = result
  let sizeDropped = false
  if (foreign.summary.length > 0) fixed = { ...fixed, summary_ai: alone.summary_ai }
  if (foreign.size) {
    let given = false
    try {
      given = typeof alone.fund_size_usd_millions === 'number' && alone.fund_size_usd_millions > 0 && !foreignAmounts(article, alone).size
    } catch { /* cannot be checked: no size */ }
    sizeDropped = !given
    fixed = {
      ...fixed,
      fund_size_usd_millions: given ? alone.fund_size_usd_millions : null,
      original_currency: given ? alone.original_currency ?? null : null,
      original_amount_millions: given ? alone.original_amount_millions ?? null : null,
    }
  }
  return { result: fixed, asked: true, sizeDropped, why }
}
