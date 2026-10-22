-- "Submit your news" (2026-10-22): a firm sends a fund close, launch, hire or
-- deal from fundopshq.com/submit (POST /api/news/submit).
--
-- A submission is a LEAD for the news desk, never a story: nothing here is
-- shown to readers or read by the newsletter. Every text field is what a
-- stranger typed and is UNTRUSTED; a story runs only once the firm's own
-- announcement or a credible outlet (the required `url`) says the same.
--
-- Reached only with the service role: row level security is on and there are
-- no policies, like event_submissions.

create table if not exists public.news_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'spam')),
  kind text not null check (kind in ('fund_close', 'fund_launch', 'hire', 'deal', 'other')),
  firm text not null,
  headline text not null,
  details text,
  url text not null,
  contact_name text not null,
  contact_email text not null,
  contact_role text,
  wants_newsletter boolean not null default false,
  review_notes text,
  -- A keyed hash of the sender's IP address (HMAC-SHA256, server secret), for
  -- abuse control only: how many submissions one address sent in a day. The
  -- address itself is never stored.
  ip_hash text
);

comment on table public.news_submissions is
  'Public /submit queue: fund closes, launches, hires and deals sent in by firms. Leads for the news desk, never published as they stand. All free-text fields are UNTRUSTED. RLS enabled with zero policies: service role only.';

create index if not exists news_submissions_status on public.news_submissions (status, created_at desc);
create index if not exists news_submissions_ip on public.news_submissions (ip_hash, created_at desc);
create index if not exists news_submissions_contact on public.news_submissions (contact_email, status);

alter table public.news_submissions enable row level security;
