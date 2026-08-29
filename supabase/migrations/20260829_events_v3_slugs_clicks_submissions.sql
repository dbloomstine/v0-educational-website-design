-- Events board v3: detail pages, click tracking, public submissions.
--
-- slug            — URL identity for /events/[slug] detail pages (SEO surface)
-- click_count     — outbound-click tally (beacon from EventRow / detail CTA);
--                   incremented via increment_event_click() so it's atomic
-- expected_attendance — shown on detail pages when the organizer publishes it
-- event_submissions   — public "Submit your event" queue; the weekly
--                   scout-events run reviews pending rows and promotes
--                   approved ones into industry_events via the loader

alter table industry_events add column if not exists slug text;
alter table industry_events add column if not exists click_count int not null default 0;
alter table industry_events add column if not exists expected_attendance int;

comment on column industry_events.slug is 'URL slug for /events/[slug]. Generated from name (loader/backfill); unique. Must never collide with the reserved collection slugs in lib/events/collections.ts.';
comment on column industry_events.click_count is 'Outbound-click tally via increment_event_click(). No PII — count only.';

-- Backfill slugs: kebab-case of name, trimmed to 80 chars, numeric suffix on collision
update industry_events set slug = s.base || case when s.rn > 1 then '-' || s.rn else '' end
from (
  select id, base, row_number() over (partition by base order by created_at, id) as rn
  from (
    select id, created_at,
      left(trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), 80) as base
    from industry_events
  ) t
) s
where industry_events.id = s.id and industry_events.slug is null;

alter table industry_events alter column slug set not null;
create unique index if not exists idx_industry_events_slug on industry_events (slug);

create or replace function increment_event_click(eid uuid) returns void
language sql security definer set search_path = public as
$$ update industry_events set click_count = click_count + 1 where id = eid; $$;

create table if not exists event_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organizer_name text,
  event_url text not null,
  start_date date,
  end_date date,
  city text,
  country text,
  event_format text,
  event_kind text,
  cost_type text,
  description text,
  submitter_name text,
  submitter_email text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','spam')),
  review_notes text,
  created_at timestamptz not null default now()
);

comment on table event_submissions is
  'Public /events/submit queue. Free-text fields are UNTRUSTED — the scout-events run verifies dates at the source before promoting anything to industry_events (status approved + loader insert). RLS enabled with zero policies — service role only.';

alter table event_submissions enable row level security;
