/**
 * The site's default share card, for pages that declare their own `openGraph`.
 *
 * Next merges metadata shallowly: a page that sets `openGraph` replaces the
 * layout's whole object, including the image the root `opengraph-image` file
 * would have supplied. Before this, every such page (sections, Latest, events,
 * About…) shared to LinkedIn and Slack with no image at all.
 */
export const OG_IMAGES = [{ url: 'https://fundopshq.com/opengraph-image', width: 1200, height: 630, alt: 'FundOpsHQ — news for private markets' }]

const SITE = 'https://fundopshq.com'

/**
 * The share card for a page that is not a story: Open Graph and the Twitter
 * card together, because the same shallow merge that drops the image drops the
 * card. A page that set `openGraph` and not `twitter` was shared on X with the
 * homepage's title (every event page, 2026-10-12); a page that set neither
 * (/events/submit) said it was the homepage, address included.
 */
export function shareCard(title: string, description: string, path: string) {
  const url = `${SITE}${path}`
  return {
    openGraph: { title, description, type: 'website' as const, url, siteName: 'FundOpsHQ', images: OG_IMAGES },
    twitter: { card: 'summary_large_image' as const, title, description, images: OG_IMAGES.map((i) => i.url) },
  }
}

/** About what a search result shows of a title before it cuts it. */
export const TITLE_MAX = 60

/**
 * A search title with " | FundOpsHQ" on the end when it still fits in a
 * result, else the words alone (2026-10-22). The words people type come
 * first and are the part worth keeping; Google shows the site's name above
 * the result anyway, so the brand is the part to drop.
 */
export function brandedTitle(core: string, max = TITLE_MAX): string {
  const branded = `${core} | FundOpsHQ`
  return branded.length <= max ? branded : core
}

/**
 * A meta description cut to what a search result shows (about 160 characters),
 * on a word, with an ellipsis. Event descriptions were sent at 300.
 */
export function metaDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const atWord = cut.lastIndexOf(' ')
  return `${(atWord > max / 2 ? cut.slice(0, atWord) : cut).replace(/[,;:\-–—]$/, '')}…`
}

/**
 * The BreadcrumbList for a page: where it sits in the site, for the path line
 * under a search result. The first crumb is always the front page; the last is
 * the page itself and carries no address, which schema.org allows. Paths are
 * relative here and absolute in the output.
 */
export function breadcrumbJsonLd(crumbs: { name: string; path?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'FundOpsHQ', path: '/' }, ...crumbs].map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.path ? { item: `${SITE}${c.path}` } : {}),
    })),
  }
}
