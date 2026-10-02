/**
 * Money figures in a headline.
 *
 * The classifier extracts one size per report, in dollars, from the whole
 * article. A headline states its figure in the publisher's own words and
 * currency. Comparing the two answers questions the extracted number cannot:
 * is that size the one the headline is about, is it marked as a target, and do
 * two headlines that disagree on the dollar figure state the same original one?
 *
 * Pure: no I/O.
 */

export interface Money {
  /** ISO-style code: USD, EUR, GBP, JPY, AUD, CAD, INR, ZAR… */
  currency: string
  /** Millions of that currency. */
  amountM: number
  /** Where the figure sits in the headline. */
  index: number
  end: number
}

const SYMBOLS: [RegExp, string][] = [
  [/^US\$$/i, 'USD'], [/^AU?\$$/i, 'AUD'], [/^CA?\$$/i, 'CAD'], [/^S\$$/i, 'SGD'], [/^HK\$$/i, 'HKD'], [/^NZ\$$/i, 'NZD'],
  [/^\$$/, 'USD'], [/^€$/, 'EUR'], [/^£$/, 'GBP'], [/^¥$/, 'JPY'], [/^₹$/, 'INR'], [/^Rs\.?$/i, 'INR'], [/^R$/, 'ZAR'],
  [/^RMB$/i, 'CNY'],
]
const WORDS: Record<string, string> = {
  won: 'KRW', yen: 'JPY', euro: 'EUR', euros: 'EUR', pounds: 'GBP', rupees: 'INR', yuan: 'CNY', rand: 'ZAR', dollars: 'USD',
}

/** Millions per unit word. */
const UNITS: Record<string, number> = {
  trillion: 1_000_000, tn: 1_000_000,
  billion: 1000, bn: 1000, b: 1000,
  million: 1, mn: 1, mm: 1, m: 1,
  crore: 10, cr: 10, lakh: 0.1,
}

/**
 * Dollars per unit of each currency, as a band. The classifier converts at
 * whatever rate the article or its own memory supplies (it has put £3bn at
 * $3.3B), so the band is wide: it tells a plausible conversion from a figure
 * that is plainly a different number.
 */
const USD_PER: Record<string, [number, number]> = {
  USD: [1, 1], EUR: [1.0, 1.25], GBP: [1.05, 1.45], JPY: [0.0058, 0.0078], AUD: [0.6, 0.74], CAD: [0.66, 0.8],
  NZD: [0.55, 0.68], SGD: [0.68, 0.82], HKD: [0.12, 0.135], INR: [0.0105, 0.013], ZAR: [0.048, 0.062],
  CHF: [1.0, 1.3], SEK: [0.085, 0.11], NOK: [0.085, 0.11], DKK: [0.13, 0.16], CNY: [0.13, 0.15],
  KRW: [0.00062, 0.00082], AED: [0.26, 0.28], SAR: [0.26, 0.27], BRL: [0.16, 0.22],
}

const PREFIXED =
  /(US\$|AU?\$|CA?\$|S\$|HK\$|NZ\$|\$|€|£|¥|₹|\bRs\.?|\b(?:USD|EUR|GBP|JPY|AUD|CAD|NZD|SGD|HKD|INR|ZAR|CHF|SEK|NOK|DKK|CNY|RMB|KRW|AED|SAR|BRL)|\bR(?=\d))\s?(\d[\d,]*(?:\.\d+)?)[\s-]?(trillion|tn|billion|bn|b|million|mn|mm|m|crore|cr|lakh)?(?![A-Za-z])/gi
const SUFFIXED =
  /\b(\d[\d,]*(?:\.\d+)?)[\s-]?(trillion|tn|billion|bn|million|mn|m)?[\s-](won|yen|euros?|pounds|rupees|yuan|rand|dollars)\b/gi

function codeFor(prefix: string): string | null {
  const p = prefix.trim()
  for (const [re, code] of SYMBOLS) if (re.test(p)) return code
  const upper = p.toUpperCase()
  return USD_PER[upper] ? upper : null
}

/** Every money figure a headline states, in order. A figure with no unit ("$300k", "$25") is not a fund size and is skipped. */
export function headlineMoney(headline: string): Money[] {
  const out: Money[] = []
  for (const m of headline.matchAll(PREFIXED)) {
    const currency = codeFor(m[1])
    const unit = m[3]?.toLowerCase()
    if (!currency || !unit) continue
    const n = Number(m[2].replace(/,/g, ''))
    if (!Number.isFinite(n) || n <= 0) continue
    out.push({ currency, amountM: n * UNITS[unit], index: m.index ?? 0, end: (m.index ?? 0) + m[0].length })
  }
  for (const m of headline.matchAll(SUFFIXED)) {
    const currency = WORDS[m[3].toLowerCase()]
    const unit = m[2]?.toLowerCase()
    if (!currency || !unit) continue
    const n = Number(m[1].replace(/,/g, ''))
    if (!Number.isFinite(n) || n <= 0) continue
    const index = m.index ?? 0
    // "$1 billion dollars" is one figure, already read with its symbol.
    if (out.some((x) => index >= x.index && index < x.end)) continue
    out.push({ currency, amountM: n * UNITS[unit], index, end: index + m[0].length })
  }
  return out.sort((a, b) => a.index - b.index)
}

/** True when `sizeUsdM` is this headline figure: the same dollars, or a plausible conversion of it. */
export function moneyMatchesUsd(money: Money, sizeUsdM: number): boolean {
  const band = USD_PER[money.currency]
  if (!band) return false
  // Dollars: "over $10 billion" on a $10.8B fund still counts. Other
  // currencies: the band, and a little either side of it.
  const lo = money.currency === 'USD' ? money.amountM * 0.88 : money.amountM * band[0] * 0.95
  const hi = money.currency === 'USD' ? money.amountM * 1.12 : money.amountM * band[1] * 1.05
  return sizeUsdM >= lo && sizeUsdM <= hi
}

/** The headline figure a dollar size corresponds to, if the headline states it. */
export function headlineFigureFor(sizeUsdM: number, headline: string): Money | null {
  return headlineMoney(headline).find((m) => moneyMatchesUsd(m, sizeUsdM)) ?? null
}
