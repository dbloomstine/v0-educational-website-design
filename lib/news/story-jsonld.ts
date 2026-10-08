/**
 * The NewsArticle structured data on a story page.
 *
 * Our page is a summary of other people's reporting with a link to it, and the
 * data says so: `isBasedOn` is the publisher's article, `description` is the
 * short summary, and the fuller summary is NOT marked up as `articleBody` — that
 * property would claim the publisher's article as ours.
 */
import type { Story } from './stories'

const SITE = 'https://fundopshq.com'

export function storyPermalink(story: Pick<Story, 'id'>): string {
  return `${SITE}/story/${story.id}`
}

/** The page's Open Graph image (app/story/[id]/opengraph-image.tsx). */
export function storyImageUrl(story: Pick<Story, 'id'>): string {
  return `${storyPermalink(story)}/opengraph-image`
}

/**
 * `modifiedAt` is when the page last changed: the time the fuller summary was
 * written, if there is one. Never earlier than the story was published.
 */
export function storyJsonLd(story: Story, modifiedAt?: string | null) {
  const permalink = storyPermalink(story)
  const published = new Date(story.firstSeen).getTime()
  const modified = modifiedAt ? new Date(modifiedAt).getTime() : NaN
  const dateModified = Number.isNaN(modified) || modified < published ? story.firstSeen : new Date(modified).toISOString()
  const organization = { '@type': 'Organization', name: 'FundOpsHQ', url: SITE }
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: story.headline,
    description: story.summary ?? undefined,
    datePublished: story.firstSeen,
    dateModified,
    url: permalink,
    mainEntityOfPage: { '@type': 'WebPage', '@id': permalink },
    image: [storyImageUrl(story)],
    isBasedOn: story.url,
    author: organization,
    publisher: organization,
  }
}

/** JSON for a <script type="application/ld+json">: "<" is escaped so a headline cannot close the tag. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
