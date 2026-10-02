-- Indexes for the news pipeline's hot queries (2026-10-02).
--
-- pg_stat_statements showed the hourly ingest and classification jobs reading
-- the whole of news_items (10,900 blocks, 1.4-6.7 s a time) thousands of times:
-- 745 million rows read by sequential scan since February. On this instance
-- that is most of the database's CPU, and it is what the site's own queries
-- queue behind. Each index below turns one of those scans into a lookup.

-- 1. Ingest: "do we already have this headline from this source?"
--    select title, source_name from news_items where title = any($1)
--    7,587 calls, 1.4 s each. source_name rides along so the answer comes
--    from the index alone.
create index if not exists idx_news_items_title
  on public.news_items (title) include (source_name);

-- 2. Classification: reset rows stuck in 'processing' for ten minutes.
--    update ... where classification_status = 'processing' and updated_at < $1
--    701 calls, 4-6.7 s each, to find (almost always) nothing.
create index if not exists idx_news_items_processing
  on public.news_items (updated_at)
  where classification_status = 'processing';

-- 3. Classification: retry recent failures.
--    select id ... where classification_status = 'failed' and created_at >= $1
--    order by created_at desc limit 50 -- 629 calls, 3.3 s each.
create index if not exists idx_news_items_failed
  on public.news_items (created_at desc)
  where classification_status = 'failed';

-- 4. Classification: give a type to complete rows that came back without one.
--    update ... where classification_status = 'complete' and event_type is null
--    and created_at < $1 -- 507 calls, 1.3 s each.
create index if not exists idx_news_items_untyped
  on public.news_items (created_at)
  where classification_status = 'complete' and event_type is null;

-- 5. Feed health: "has this feed stored anything this week?" -- 29,507 calls.
--    The single-column index found the feed's rows and then read every one of
--    them from the table to check its date; with the date in the index it is
--    answered there. The new index does everything the old one did.
create index if not exists idx_news_items_feed_source_created
  on public.news_items (feed_source_id, created_at desc);
drop index if exists public.idx_news_items_feed_source;

-- 6. news_items is updated constantly and had not been vacuumed since
--    2026-09-14 (13,000 dead rows, a fifth of the table): the default
--    threshold is a fifth of the table. Vacuum at a twentieth instead.
alter table public.news_items set (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.05
);
