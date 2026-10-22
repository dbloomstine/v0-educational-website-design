-- The FundOps Daily welcome series (2026-10-22, approved by Danny; lib/newsletter/welcome-series-send.ts): one
-- row per subscriber per step, so nobody gets a step twice and nobody gets the series twice.
--
--   step        1..4 (step 3 is either email '3' or '3b', so the pair shares one row and one unique key)
--   email_key   which email went: '1', '2', '3', '3b', '4'; null on a skip
--   status      'sending' (claimed, before the send), 'sent', 'skipped', 'failed' (retried, up to 3 attempts)
--   skip_reason 'has_interests' (step 1), 'late', or an exit that ends the series: 'unsubscribed', 'bounced',
--               'complained'
--
-- The row is inserted ('sending') before the email goes: the unique (subscriber_id, step) is the idempotency
-- guard. A row left 'sending' by a run that died part-way stops that reader's series until a person looks.
-- Additive only. Reached only with the service role: row level security on, no policies.

create table if not exists public.welcome_series_sends (
  id bigint generated always as identity primary key,
  subscriber_id uuid not null references public.newsletter_subscribers(id) on delete cascade,
  step smallint not null check (step between 1 and 4),
  email_key text check (email_key in ('1', '2', '3', '3b', '4')),
  variant text,
  due_on date not null,
  status text not null default 'sending' check (status in ('sending', 'sent', 'skipped', 'failed')),
  skip_reason text check (skip_reason in ('has_interests', 'late', 'unsubscribed', 'bounced', 'complained')),
  attempts smallint not null default 1,
  subject text,
  resend_email_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (subscriber_id, step)
);

create index if not exists welcome_series_sends_resend_email_id_idx
  on public.welcome_series_sends (resend_email_id)
  where resend_email_id is not null;

comment on table public.welcome_series_sends is
  'FundOps Daily welcome series: one row per subscriber per step (1-4; step 3 is email 3 or 3b). Unique (subscriber_id, step) stops a second send. RLS enabled with zero policies: service role only.';

alter table public.welcome_series_sends enable row level security;
