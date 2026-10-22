/**
 * The columns a story is built from (lib/news/stories.ts reads exactly these).
 * `author` since 2026-10-22: the firm behind a JD Supra alert
 * (lib/news/source-credit.ts).
 */
export const STORY_COLUMNS =
  'id, title, source_url, source_name, author, published_date, created_at, article_type, event_type, fund_categories, is_high_signal, relevance_score, tldr, entities_raw, extracted_data'
