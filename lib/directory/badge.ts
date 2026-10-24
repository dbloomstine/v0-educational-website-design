/**
 * The badge a claimed person can put on their own site (plan B6). Facts only:
 * "Listed in the FundOpsHQ Directory of Fund Lawyers". No rank, no "top", no
 * "best", no stars, and it links to their own profile and nowhere else (Avvo's
 * badge linked to rival lawyers, and lawyers resented it). The image is the
 * same for everyone in a trade, so serving it reads nothing and records
 * nothing about who shows it.
 */
import type { Category } from './taxonomy'

export const SITE = 'https://fundopshq.com'
export const BADGE_WIDTH = 248
export const BADGE_HEIGHT = 66

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** "Listed in the FundOpsHQ Directory of Fund Lawyers": the whole claim the badge makes. */
export const badgeWords = (c: Pick<Category, 'plural'>) => `Listed in the FundOpsHQ Directory of ${c.plural}`

export const badgeImageUrl = (c: Pick<Category, 'slug'>) => `${SITE}/api/directory/badge?trade=${c.slug}`

export function badgeSvg(c: Pick<Category, 'plural'>): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BADGE_WIDTH}" height="${BADGE_HEIGHT}" viewBox="0 0 ${BADGE_WIDTH} ${BADGE_HEIGHT}" role="img" aria-label="${esc(badgeWords(c))}">
<title>${esc(badgeWords(c))}</title>
<rect x="0.5" y="0.5" width="${BADGE_WIDTH - 1}" height="${BADGE_HEIGHT - 1}" rx="3" fill="#f8f5ec" stroke="#13233A"/>
<rect x="0.5" y="0.5" width="6" height="${BADGE_HEIGHT - 1}" rx="2" fill="#13233A"/>
<text x="18" y="20" font-family="Helvetica, Arial, sans-serif" font-size="9.5" font-weight="700" letter-spacing="1.2" fill="#6b5a2e">LISTED IN THE</text>
<text x="18" y="38" font-family="Helvetica, Arial, sans-serif" font-size="15" font-weight="700" fill="#13233A">FundOpsHQ Directory</text>
<text x="18" y="55" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#13233A">of ${esc(c.plural)}</text>
</svg>`
}

/** The HTML to paste: their own profile's address, the image, and the words as its alt text. */
export function badgeSnippet(c: Pick<Category, 'plural' | 'slug'>, profilePath: string): string {
  const href = `${SITE}${profilePath}`
  const words = esc(badgeWords(c))
  return `<a href="${esc(href)}" title="${words}"><img src="${esc(badgeImageUrl(c))}" alt="${words}" width="${BADGE_WIDTH}" height="${BADGE_HEIGHT}" style="border:0"></a>`
}
