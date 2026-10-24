-- The FundOpsHQ directory, phase 1: Fund Lawyers (2026-10-24, Danny: GO; US
-- only; data from firms' own public bio pages; no deal matching yet).
-- Plan: ~/fundopshq-workspace/docs/directory/2026-10-24-people-directory-plan.md
--
-- NOT APPLIED when written. Apply, then load with
-- scripts/directory/load-people.ts, then publish with scripts/directory/review.ts,
-- then set DIRECTORY_ENABLED=true and redeploy.
--
-- Three tables, all service-role only (RLS on, no policies), like
-- news_submissions:
--   directory_people    one row per person; firm-site facts + claim fields
--   directory_claims    one-time claim links (only the token's SHA-256 kept)
--   directory_requests  removal / correction requests from anyone
-- and a public storage bucket for photos a claimer uploads.

create table if not exists public.directory_people (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('fund_lawyer', 'fund_auditor', 'placement_agent', 'fund_finance_banker', 'fund_tax_advisor')),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 120),

  -- From the firm's own public bio page (source = firm_site). Written only by
  -- scripts/directory/load-people.ts. We keep facts and a link, never the bio text.
  full_name text not null,
  title text,
  firm_name text not null,
  firm_domain text not null,
  offices jsonb not null default '[]'::jsonb check (jsonb_typeof(offices) = 'array'),
  practice_areas text[] not null default '{}',
  client_focus text[] not null default '{}',
  represents text[] not null default '{}',
  bar_admissions text[] not null default '{}',
  education jsonb not null default '[]'::jsonb check (jsonb_typeof(education) = 'array'),
  bio_url text,
  fetched_at timestamptz,
  source text not null default 'firm_site' check (source in ('firm_site')),

  -- review: loaded, not public | published | hidden (by the person, a removal
  -- request or the desk; see hidden_by) | removed (for good; a crawl never brings it back)
  status text not null default 'review' check (status in ('review', 'published', 'hidden', 'removed')),
  hidden_by text check (hidden_by in ('owner', 'request', 'desk')),
  -- The bio page was not in the last crawl of this firm. Listed with a note
  -- for 30 days, then dropped from the site; cleared if it comes back.
  missing_since date,

  -- The claim: set when someone at the firm's domain confirmed the emailed link.
  claimed_at timestamptz,
  claimed_email_domain text,
  -- What the person added, live only once the desk approved it.
  headline text check (headline is null or length(headline) <= 120),
  description text check (description is null or length(description) <= 600),
  photo_url text,
  contact_url text,
  claimed_practice_areas text[],
  -- Self-reported: [{text, year}], shown labelled as such.
  notable jsonb not null default '[]'::jsonb check (jsonb_typeof(notable) = 'array'),
  -- Edits waiting for the desk: the ProfileEdits shape (lib/directory/claim.ts).
  pending_edits jsonb,
  pending_edits_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.directory_people is
  'FundOpsHQ directory (fundopshq.com/fund-lawyers). Firm-site facts are written only by scripts/directory/load-people.ts; claim fields (headline, description, photo_url, contact_url, claimed_practice_areas, notable) only after desk review of pending_edits. RLS enabled with zero policies: service role only.';

create index if not exists directory_people_category_status on public.directory_people (category, status, slug);
create index if not exists directory_people_firm on public.directory_people (firm_domain);
create index if not exists directory_people_pending on public.directory_people (pending_edits_at) where pending_edits is not null;

create or replace function public.directory_people_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists directory_people_touch on public.directory_people;
create trigger directory_people_touch before update on public.directory_people
  for each row execute function public.directory_people_touch();

alter table public.directory_people enable row level security;

create table if not exists public.directory_claims (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.directory_people (id) on delete cascade,
  email text not null,
  -- SHA-256 (hex) of the emailed token; the token itself is never stored.
  token_hash text not null unique,
  expires_at timestamptz not null,
  confirmed_at timestamptz,
  -- Keyed hash of the requester's IP (HMAC, server secret), for rate limits only.
  ip_hash text,
  created_at timestamptz not null default now()
);

comment on table public.directory_claims is
  'One-time claim links for directory profiles: hashed token, 7 days, single use. Service role only.';

create index if not exists directory_claims_email on public.directory_claims (email, created_at desc);
create index if not exists directory_claims_person on public.directory_claims (person_id, created_at desc);
create index if not exists directory_claims_ip on public.directory_claims (ip_hash, created_at desc);

alter table public.directory_claims enable row level security;

create table if not exists public.directory_requests (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references public.directory_people (id) on delete set null,
  -- The profile's slug when it was asked, so the record survives a deletion.
  person_slug text not null,
  kind text not null check (kind in ('removal', 'correction')),
  message text check (message is null or length(message) <= 2000),
  contact_email text not null,
  status text not null default 'open' check (status in ('open', 'done', 'rejected')),
  notes text,
  ip_hash text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

comment on table public.directory_requests is
  'Removal and correction requests from any directory profile. A removal hides the profile at once (status hidden, hidden_by request) pending review. message is UNTRUSTED. Service role only.';

create index if not exists directory_requests_open on public.directory_requests (status, created_at desc);
create index if not exists directory_requests_ip on public.directory_requests (ip_hash, created_at desc);

alter table public.directory_requests enable row level security;

-- Photos a claimer uploads (PNG or JPEG, up to 1 MB). Shown only once the desk approves the edit.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('directory-photos', 'directory-photos', true, 1000000, array['image/png', 'image/jpeg'])
on conflict (id) do nothing;
