-- League tables (fundopshq.com/league-tables), 2026-10-01.

-- 1. Corrections to a league row. A ranking is our claim, so a human must be
--    able to overrule the software: hide a row that is not a fund close, or
--    set the manager / fund / size / stage the reports got wrong.
create table if not exists public.league_overrides (
  news_item_id uuid primary key references public.news_items(id) on delete cascade,
  action text not null check (action in ('hide', 'set')),
  firm_name text,
  fund_name text,
  size_usd_millions numeric,
  stage text check (stage in ('final', 'first', 'interim')),
  note text,
  created_at timestamptz not null default now()
);
comment on table public.league_overrides is
  'Manual corrections to league-table rows. news_item_id is any report in the story. action=hide removes the row; action=set replaces whichever of firm_name/fund_name/size_usd_millions/stage are non-null.';
alter table public.league_overrides enable row level security;

-- 2. The league query reads every fund-close report since coverage began.
--    Without this it scans the whole table and hits the statement timeout.
create index if not exists idx_news_items_fund_events
  on public.news_items (published_date desc, id)
  where event_type in ('fund_close', 'capital_raise')
    and classification_status = 'complete'
    and is_duplicate = false;
