/**
 * The reader's own section in the daily email (2026-10-08).
 *
 * A subscriber who has said what they follow gets those stories pulled
 * together under one heading, straight after the top stories. Nothing is
 * added and nothing is dropped: a story moves from its usual section to the
 * reader's, so it is never printed twice. A reader with no choices on file,
 * or with every box ticked, gets the edition exactly as it always was.
 */
import type { ArticleGroup, NewsletterArticle } from './query-articles'
import { ALL_INTERESTS, INTERESTS, interestCategories, interestSections, sanitizeInterests } from './interests'
import { secondariesClass } from './secondaries'

/** More than this and the reader's section stops being a short list; the rest stay where they were. */
export const FOLLOWED_MAX = 6

export const FOLLOWED_LABEL = 'What you follow'

export function followsStory(
  article: Pick<NewsletterArticle, 'fundCategories' | 'title' | 'fundStrategy' | 'eventType'>,
  categories: Set<string>,
): boolean {
  if (article.fundCategories.some((c) => categories.has(c))) return true
  // A continuation vehicle tagged PE, or a secondaries hire tagged by the
  // firm's other business, is still news to a reader who follows secondaries.
  const secondaries = secondariesClass(article)
  return !!secondaries && categories.has(secondaries)
}

/**
 * Splits the sections (already without the top stories) into the reader's
 * section and the rest. `followed` is null when there is nothing to pull.
 */
export function pullFollowed(
  sections: ArticleGroup[],
  interests: string[] | undefined,
): { followed: ArticleGroup | null; sections: ArticleGroup[] } {
  const chosen = sanitizeInterests(interests ?? [])
  // Every box ticked is the whole edition: there is nothing to single out. The
  // forms offer the asset classes only, so all of those with no section is
  // "everything" too (the section choices come from the email's follow row).
  const wholeSections = interestSections(chosen)
  const everyAssetClass = INTERESTS.every((i) => chosen.includes(i.id))
  if (chosen.length === 0 || chosen.length === ALL_INTERESTS.length || (everyAssetClass && wholeSections.size === 0)) return { followed: null, sections }

  const categories = interestCategories(chosen)
  // A section followed whole (LPs, people moves, regulation): its stories come too.
  const taken = new Set<string>()
  const articles: NewsletterArticle[] = []
  for (const group of sections) {
    for (const article of group.articles) {
      if (articles.length >= FOLLOWED_MAX) break
      if (wholeSections.has(group.category) || followsStory(article, categories)) {
        articles.push(article)
        taken.add(article.id)
      }
    }
  }
  if (articles.length === 0) return { followed: null, sections }

  return {
    followed: { category: 'followed', label: FOLLOWED_LABEL, articles },
    sections: sections
      .map((g) => ({ ...g, articles: g.articles.filter((a) => !taken.has(a.id)) }))
      .filter((g) => g.articles.length > 0),
  }
}
