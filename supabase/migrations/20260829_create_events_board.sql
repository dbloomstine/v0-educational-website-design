-- Events board: industry events aggregation for fundopshq.com/events
--
-- Two-table design mirroring the news pipeline (feed_sources → news_items):
--   event_sources    — registry of calendars we aggregate from (seeded from
--                      docs/EVENTS_SOURCES.md in the workspace; the weekly
--                      scout-events skill walks active rows)
--   industry_events  — the events themselves, curated + verified before insert
--
-- Naming: "industry_events", NOT "events" — the news domain already uses
-- event_type/eventType to mean "kind of news story", so the events-board
-- domain gets unambiguous names throughout (event_kind, event_format).
--
-- fund_categories reuses the exact news_items taxonomy so asset-class
-- filters behave identically across the news feed and the events board.

create table if not exists event_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  url text not null,
  organizer_type text not null check (organizer_type in
    ('association','conference_producer','law_firm','accounting_firm','fund_admin','tech_vendor','community','media','other')),
  tier int not null default 3 check (tier between 1 and 4),
  ingestion_method text not null default 'scrape' check (ingestion_method in
    ('json_ld','ics','scrape','js','blocked','manual')),
  ops_relevance text not null default 'medium' check (ops_relevance in ('high','medium','low')),
  region text,
  cost_profile text,
  notes text,
  is_active boolean not null default true,
  last_scouted_at timestamptz,
  events_found_total int not null default 0,
  created_at timestamptz not null default now()
);

comment on table event_sources is
  'Registry of event calendars the scout-events skill aggregates from. Tier 1 = core fund-ops sources, 2 = industry anchors, 3 = vertical/regional/community, 4 = service providers. RLS enabled with zero policies — service role only.';

create table if not exists industry_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  event_url text not null,
  registration_url text,
  organizer_name text not null,
  organizer_type text not null check (organizer_type in
    ('association','conference_producer','law_firm','accounting_firm','fund_admin','tech_vendor','community','media','other')),
  event_source_id uuid references event_sources(id),
  start_date date not null,
  end_date date,
  time_note text,
  city text,
  state_region text,
  country text,
  venue text,
  event_format text not null default 'in_person' check (event_format in ('in_person','virtual','hybrid')),
  event_kind text not null default 'conference' check (event_kind in
    ('conference','summit','forum','webinar','training','networking','awards','roundtable','other')),
  cost_type text not null default 'paid' check (cost_type in ('free','paid','member_only','invite_only','mixed')),
  price_note text,
  fund_categories text[] not null default '{}',
  ops_relevance text not null default 'medium' check (ops_relevance in ('high','medium','low')),
  region text not null check (region in ('north_america','europe','asia_pacific','middle_east','latam','global')),
  is_featured boolean not null default false,
  status text not null default 'published' check (status in ('draft','published','cancelled','archived')),
  source_notes text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table industry_events is
  'Curated industry events for the /events board. Every row date-verified against the organizer''s own page before publishing (verified_at). Empty fund_categories = cross-asset. RLS enabled with zero policies — service role only.';

comment on column industry_events.time_note is 'Display-only start time for webinars, e.g. ''2:00 PM ET''';
comment on column industry_events.ops_relevance is 'high = squarely for fund ops/finance/compliance/legal people; drives the Ops-focused filter';

-- Dedup: one row per event page
create unique index if not exists idx_industry_events_url on industry_events (lower(event_url));

-- Hot path: upcoming published events ordered by date
create index if not exists idx_industry_events_upcoming
  on industry_events (start_date) where status = 'published';

-- RLS: no policies = only service role can read/write (app uses getSupabaseAdmin())
alter table event_sources enable row level security;
alter table industry_events enable row level security;
