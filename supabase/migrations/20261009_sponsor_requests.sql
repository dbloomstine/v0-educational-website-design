-- Self-serve sponsorship (2026-10-09).
--
-- sponsor_requests: one row per booking a prospect submits on /sponsor. It
-- waits as 'pending' until the owner approves or declines it from the link in
-- his email (action_token). Approval copies it into sponsor_bookings, which is
-- what the email and the site read; nothing here is shown to readers.
--
-- sponsor_interest: one row each time a subscriber opens /sponsor from the
-- link in their own copy of the email (the link carries their subscriber id).
-- It is how the owner learns which readers are looking at sponsorship.
--
-- Both are reached only with the service role: row level security is on and
-- there are no policies.

create table if not exists public.sponsor_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'withdrawn')),
  package text not null check (package in ('week', 'month', 'quarter')),
  price_usd integer not null check (price_usd >= 0),
  starts_on date not null,
  ends_on date not null,
  company text not null,
  contact_name text not null,
  email text not null,
  website text not null,
  tagline text,
  blurb text not null,
  cta_url text not null,
  cta_text text,
  logo_link text,
  notes text,
  -- How the prospect reached the site (lib/newsletter/signup-source.ts), when the browser knew.
  arrived_from text,
  -- The secret in the owner's approve / decline link.
  action_token uuid not null default gen_random_uuid(),
  decided_at timestamptz,
  booking_id uuid references public.sponsor_bookings(id),
  reminded_at timestamptz,
  constraint sponsor_requests_dates check (ends_on >= starts_on)
);
create unique index if not exists sponsor_requests_action_token on public.sponsor_requests (action_token);
create index if not exists sponsor_requests_status on public.sponsor_requests (status, created_at);
alter table public.sponsor_requests enable row level security;

create table if not exists public.sponsor_interest (
  id uuid primary key default gen_random_uuid(),
  seen_at timestamptz not null default now(),
  subscriber_id uuid not null references public.newsletter_subscribers(id) on delete cascade,
  -- Whether the owner was told about this visit (he is told at most once a week per reader).
  notified boolean not null default false
);
create index if not exists sponsor_interest_subscriber on public.sponsor_interest (subscriber_id, seen_at desc);
alter table public.sponsor_interest enable row level security;

-- Logos sent with a request. Public to read (the email and the site load them from here), written
-- only by the server; PNG or JPEG, 400 KB at most.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sponsors', 'sponsors', true, 400000, array['image/png', 'image/jpeg'])
on conflict (id) do nothing;
