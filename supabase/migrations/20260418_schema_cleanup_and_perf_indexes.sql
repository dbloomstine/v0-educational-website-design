-- Schema cleanup and performance indexes.
--
-- Drops:
--   1. story_cluster_id column + index. Referenced story_clusters table was
--      removed during the intel cleanup; value NULL for every row since.
--      Layer-1 clustering path in lib/news/api.ts has been removed; all feed
--      grouping now runs through isSameStory in lib/news/story-dedup.ts.
--   2. idx_news_items_classified_recent: partial index with predicate
--      WHERE classification_status = 'classified' — but the schema uses
--      'complete', so the index matches zero rows.
--   3. idx_feed_sources_next_fetch: flagged as unused by the Supabase
--      performance advisor.
--
-- Adds:
--   1. idx_news_items_newsletter_pool: covers the queryNewsletterArticles
--      hot-path filter. Partial index only carries rows we actually read
--      from the newsletter/feed pipelines. Cheap at 38K rows, load-bearing
--      as volume grows.
--   2. idx_news_items_canonical_article_id: covering index for the FK the
--      performance advisor flagged as unindexed. Partial to avoid indexing
--      the overwhelmingly common NULL case.

DROP INDEX IF EXISTS public.idx_news_items_story_cluster;
ALTER TABLE public.news_items DROP COLUMN IF EXISTS story_cluster_id;

DROP INDEX IF EXISTS public.idx_news_items_classified_recent;
DROP INDEX IF EXISTS public.idx_feed_sources_next_fetch;

CREATE INDEX IF NOT EXISTS idx_news_items_newsletter_pool
  ON public.news_items (published_date DESC, relevance_score DESC)
  WHERE classification_status = 'complete' AND is_duplicate = false;

CREATE INDEX IF NOT EXISTS idx_news_items_canonical_article_id
  ON public.news_items (canonical_article_id)
  WHERE canonical_article_id IS NOT NULL;
