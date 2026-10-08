-- The archive and the sitemap read only stories whose fuller summary was written, newest first.
-- The first index on summary_long_status covers every row the job has tried (most are "thin"),
-- so those reads stepped over several thin rows for each one they returned. This one holds
-- only the written rows, in the order they are read. Applied to production 2026-10-08.
create index if not exists idx_news_items_story_written
  on public.news_items (published_date desc, id)
  where summary_long_status = 'written';
