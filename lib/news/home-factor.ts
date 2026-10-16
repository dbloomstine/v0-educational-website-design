/**
 * Where a story is from, as a factor on its weight. Shared by the email's top
 * stories (lib/newsletter/top-stories.ts) and the front page (stories.ts).
 *
 * Danny's readers are in North America. On 2026-10-13 the email's top block
 * led with Square Peg (Australia), then Carta's Luxembourg fund and Bajaj
 * Alts (India), with Apogem the one home story in five. So a story's weight
 * is multiplied by where it is: at home or everywhere it counts for more,
 * from elsewhere for less. Nothing is excluded: a story from elsewhere still
 * leads when it is far bigger or far more widely reported (1.35 against 0.6
 * is about the weight gap between a $100M close nobody else carried and a
 * $10B one three desks did).
 *
 * A story the classifier placed nowhere — a third of rows, mostly from the
 * North American and UK trade press — counts a little under one placed at
 * home, not a third under: at 1.0 the two $1.35B US closes of 10-13
 * (Consonance, Sheridan, both untagged) fell out of the top for a $472M close
 * and a CIO hire. Such a story is from elsewhere when its headline states a
 * figure in another currency or its outlet reports only its own market; the
 * figure test also reads a "Global" tag that sits beside a region elsewhere
 * (Oraseya's "AED 1 Billion" fund was Middle East + Global).
 */
export const HOME_FACTOR = { home: 1.35, unknown: 1.2, elsewhere: 0.6 } as const

/** A figure in the headline in a currency that is not the dollar: "€13M first close", "₹9,000 crore", "A$4.5bn". */
const FOREIGN_FIGURE = /€|£|₹|\b(?:A|S|NZ|HK)\$|\bAED\b|\bcrore\b/

/** Outlets that report their own market and nothing else; the trade press that covers everyone is not here. */
const FOREIGN_OUTLETS = new Set([
  'afr', 'australian financial review', 'business standard', 'the economic times', 'economic times', 'mint', 'livemint',
  'moneycontrol', 'moneycontrol.com', 'vccircle', 'hdfc sky', 'dealstreetasia', 'nikkei asia', 'the business times', 'zawya',
  'arabian business', 'gulf business', 'khaleej times', 'the national',
])

export function homeFactor(a: { geography?: string[] | null; title: string; sourceName?: string | null }): number {
  const regions = (a.geography ?? []).map((g) => String(g).trim()).filter(Boolean)
  if (regions.includes('North America')) return HOME_FACTOR.home
  if (FOREIGN_FIGURE.test(a.title)) return HOME_FACTOR.elsewhere
  if (regions.includes('Global')) return HOME_FACTOR.home
  if (regions.length > 0) return HOME_FACTOR.elsewhere
  if (a.sourceName && FOREIGN_OUTLETS.has(a.sourceName.toLowerCase().trim())) return HOME_FACTOR.elsewhere
  return HOME_FACTOR.unknown
}
