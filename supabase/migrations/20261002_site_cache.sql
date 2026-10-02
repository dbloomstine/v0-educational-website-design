-- site_cache (2026-10-02): one build at a time, site-wide.
--
-- The site's pages share three expensive datasets (ten days of stories, thirty
-- days of stories, the league table). Next's data cache keeps each for a few
-- minutes, but when an entry goes stale every request that notices rebuilds it
-- for itself: on 2026-10-02 a crawler opened fifty firm pages in a minute, each
-- one rebuilt the league table (4 s of database work apiece), and the database
-- stopped answering for twelve minutes.
--
-- A row here is that dataset's turnstile and its last good copy. To rebuild,
-- a server must first move `claimed_until` into the future -- an UPDATE only
-- one of them can win. The winner builds and stores the result; everyone else
-- reads the stored copy. Read by lib/cache/build-once.ts.
create table if not exists public.site_cache (
  key text primary key,
  -- The built value, as JSON text. Text, not jsonb: it is only ever read back whole.
  payload text,
  computed_at timestamptz,
  -- A build is in progress (or failed recently) until this moment.
  claimed_until timestamptz not null default '-infinity'
);

comment on table public.site_cache is
  'Single-flight lock and last good copy for the site''s shared datasets (stories, archive, league). See lib/cache/build-once.ts. Safe to truncate: rows are rebuilt on demand.';

alter table public.site_cache enable row level security;
