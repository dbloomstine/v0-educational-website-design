-- The directory's data system, part 1 (2026-10-25, Danny: "our own way to
-- collect and maintain and present quality data... keep the data updated
-- regularly... be very strict and critical").
--
-- NOT APPLIED when written. Apply this, then 20261025_directory_sources_seed.sql.
-- Code: lib/directory/crawl/*, scripts/directory/crawl/*, .github/workflows/directory-refresh.yml
--
--   directory_sources   one row per firm source the crawler reads: how to find its
--                       bios, whether it worked, what the last run counted
--   directory_people    + source_url, city_basis, office_source_url, and `source` widened:
--                       a banker found on a conference speaker page or a bank's own press
--                       release keeps where he was found, and how his office is known

create table if not exists public.directory_sources (
  id uuid primary key default gen_random_uuid(),
  -- Stable handle for scripts and logs ("kirkland", "acct-deloitte", "parkhill").
  key text not null unique check (key ~ '^[a-z0-9][a-z0-9_-]{0,60}$'),
  firm_name text not null,
  firm_domain text not null check (firm_domain ~ '^[a-z0-9-]+(\.[a-z0-9-]+)+$'),
  -- The trade it yields (an accounting firm's audit and tax: selectors.categories).
  category text not null check (category in ('fund_lawyer', 'fund_auditor', 'placement_agent', 'fund_finance_banker', 'fund_tax_advisor')),
  listing_url text,
  -- sitemap first (most firm sites list bios in sitemap.xml), then listing pages,
  -- a JSON listing, or headless Chrome (local runs only, never CI).
  method text not null check (method in ('sitemap', 'listing', 'json', 'headless')),
  -- Regex a bio URL matches. Null: the listing is itself a team page.
  person_url_pattern text,
  -- Everything else a source needs (lib/directory/crawl/types.ts SourceSelectors):
  -- listings, team_pages, exclude_pattern, sitemaps, json, text_filter,
  -- categories, slug_suffix (required), default_office, approved_domains, max_pages.
  selectors jsonb not null default '{}'::jsonb check (jsonb_typeof(selectors) = 'object' and selectors ? 'slug_suffix'),
  -- robots.txt allowed the listing and bios at the last run (null: never checked).
  robots_ok boolean,
  -- ok | blocked (bot challenge or robots: never bypassed) | empty (nothing usable
  -- on the site) | error (the last run failed). Only ok runs weekly; empty is re-tried on request.
  status text not null default 'ok' check (status in ('ok', 'blocked', 'empty', 'error')),
  -- What every row from this source carries in directory_people.source.
  source text not null default 'firm_site' check (source in ('firm_site', 'event_speaker', 'press_release')),
  last_run_at timestamptz,
  -- {pages, read, kept, rejected, flagged, failed, ...} from the last run.
  last_counts jsonb check (last_counts is null or jsonb_typeof(last_counts) = 'object'),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.directory_sources is
  'FundOpsHQ directory crawler registry: one row per firm source (lib/directory/crawl). Written by scripts/directory/crawl/run.ts (last_run_at, last_counts, status, robots_ok) and by hand. RLS on, no policies: service role only.';

create index if not exists directory_sources_status on public.directory_sources (status, category);
create index if not exists directory_sources_domain on public.directory_sources (firm_domain);

create or replace function public.directory_sources_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists directory_sources_touch on public.directory_sources;
create trigger directory_sources_touch before update on public.directory_sources
  for each row execute function public.directory_sources_touch();

alter table public.directory_sources enable row level security;

-- Provenance on people. firm_site rows keep source_url null (the bio_url is the source).
alter table public.directory_people add column if not exists source_url text
  check (source_url is null or source_url ~ '^https?://');
alter table public.directory_people drop constraint if exists directory_people_source_check;
alter table public.directory_people add constraint directory_people_source_check
  check (source in ('firm_site', 'event_speaker', 'press_release'));
-- A non-firm-site row must say where it was found.
alter table public.directory_people drop constraint if exists directory_people_source_url_required;
alter table public.directory_people add constraint directory_people_source_url_required
  check (source = 'firm_site' or source_url is not null);

-- How the office city is known (2026-10-25: the bankers file): the person's own page,
-- FINRA BrokerCheck, the firm's one-office contact page, or a team page; and that page
-- when it is not the source itself. Null basis: read before this column existed (the person's page).
alter table public.directory_people add column if not exists city_basis text
  check (city_basis is null or city_basis in ('person', 'brokercheck', 'firm_single_office', 'team_page'));
alter table public.directory_people add column if not exists office_source_url text
  check (office_source_url is null or office_source_url ~ '^https?://');

comment on column public.directory_people.city_basis is
  'How the office city is known: person (their own page), brokercheck (FINRA BrokerCheck), firm_single_office (the firm''s contact page lists one office), team_page. See lib/directory/provenance.ts.';

comment on column public.directory_people.source_url is
  'Where the facts were read when that is not the firm bio itself: the conference speaker page or the firm''s own press release. Null for firm_site rows.';
