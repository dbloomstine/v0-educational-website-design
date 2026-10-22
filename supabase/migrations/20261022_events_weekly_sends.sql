-- The Monday events email (2026-10-22, lib/events/weekly-send.ts): one row per
-- Monday and mode, so a week is sent once. The cron fires twice on Mondays
-- (10:45 and 11:45 UTC, for daylight saving) and only one fire is inside the
-- send window; this row also turns away a manual re-run after a good send.
-- A row left 'failed' (nothing went out) lets the next run try again; one left
-- 'sending' (a run that died part-way) blocks the week until a person looks.
--
-- Reached only with the service role: row level security on, no policies.

create table if not exists public.events_weekly_sends (
  week_of date not null,
  mode text not null check (mode in ('preview', 'live')),
  status text not null default 'sending' check (status in ('sending', 'sent', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  subject text,
  recipient_count integer not null default 0,
  event_count integer,
  resend_email_ids jsonb,
  error_message text,
  primary key (week_of, mode)
);

comment on table public.events_weekly_sends is
  'Monday events email: one row per week and mode (preview|live); the send refuses to run without this table. RLS enabled with zero policies: service role only.';

alter table public.events_weekly_sends enable row level security;
