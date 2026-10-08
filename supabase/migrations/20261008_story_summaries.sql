-- Long summaries for story pages (2026-10-08).
--
-- The classifier's summary is one or two sentences written from the first 1,500
-- characters of feed text. lib/news/story-summary.ts writes the fuller one a
-- reader gets on /story/<id> before clicking out: 60 to 110 words from every
-- outlet's headline, description and stored text. The hourly job
-- /api/pipeline/story-summaries stores it on the story's best row; the story
-- page shows the one carried by whichever of the story's rows has it.
--
-- summary_long_status says where a story stands, so that nothing is retried
-- every hour:
--   null     never tried
--   written  summary_long holds the summary
--   thin     tried and judged to hold too little text (a headline and a teaser):
--            the page keeps the classifier's short summary, and no model call is made
--   retry    one answer failed a mechanical check and was discarded: one more try
--   failed   the second answer failed too: left alone
-- Nothing reads these columns but that job and the story page.

alter table public.news_items
  add column if not exists summary_long text,
  add column if not exists summary_long_model text,
  add column if not exists summary_long_at timestamptz,
  add column if not exists summary_long_status text
    check (summary_long_status in ('written', 'thin', 'retry', 'failed'));

-- The job asks "which rows of the last ten days have been tried?" once an hour.
-- Only tried rows are in the index, so it stays tiny, and the question is a
-- range on published_date over it rather than a read of news_items.
create index if not exists idx_news_items_story_summary_status
  on public.news_items (published_date)
  where summary_long_status is not null;
