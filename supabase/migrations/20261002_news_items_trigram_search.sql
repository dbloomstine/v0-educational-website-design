-- Site search (/news?q=) and firm pages (/firm/<slug>) match names inside
-- headlines, summaries and the extracted firm name with ILIKE '%name%'.
-- Without trigram indexes each lookup scans the table and a common name
-- ("ares") runs into the statement timeout. pg_trgm is already installed (public).
--
-- Firm pages now ask with a regular expression (lib/news/firm-lookup.ts). The
-- same indexes serve it, provided the expression writes its word edges as a
-- list of plain punctuation: see the note on MARK in that file.
create index if not exists idx_news_items_title_trgm
  on public.news_items using gin (title public.gin_trgm_ops);
create index if not exists idx_news_items_tldr_trgm
  on public.news_items using gin (tldr public.gin_trgm_ops);
create index if not exists idx_news_items_firm_name_trgm
  on public.news_items using gin ((extracted_data->>'firm_name') public.gin_trgm_ops);
