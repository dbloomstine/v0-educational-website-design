/**
 * The site's default share card, for pages that declare their own `openGraph`.
 *
 * Next merges metadata shallowly: a page that sets `openGraph` replaces the
 * layout's whole object, including the image the root `opengraph-image` file
 * would have supplied. Before this, every such page (sections, Latest, events,
 * About…) shared to LinkedIn and Slack with no image at all.
 */
export const OG_IMAGES = [{ url: 'https://fundopshq.com/opengraph-image', width: 1200, height: 630, alt: 'FundOpsHQ — news for private markets' }]
