-- The directory's owner side, round 2 (2026-10-24, workstream B of
-- ~/fundopshq-workspace/docs/directory/2026-10-24-implementation-plan.md).
--
-- NOT APPLIED when written. Apply it BEFORE the code that uses it is deployed
-- (the code tolerates its absence: view counts, search misses and the desk log
-- fail quietly; suggestions and moves report an error).
--
-- All service-role only (RLS on, no policies), like the rest of the directory:
--   directory_profile_views   one row per profile per day: a counter, nothing about the viewer
--   directory_search_misses   one row per (day, trade, normalised query) that found nobody
--   directory_suggestions     "Suggest a firm / add yourself", queued for the desk
--   directory_moves           a claimed person who moved firm: re-verified at the new domain, history kept
--   directory_desk_log        what the desk did (review.ts --apply), and which owner emails went
-- and two counter functions, so a view or a miss is one round trip (an upsert).
--
-- directory_claims is unchanged: a sign-in link is a claim row too, told apart
-- at confirm time (an earlier confirmed claim from the same address).

-- ── Profile views ──────────────────────────────────────────────────────────

create table if not exists public.directory_profile_views (
  person_id uuid not null references public.directory_people (id) on delete cascade,
  -- New York calendar day.
  day date not null,
  views integer not null default 0 check (views >= 0),
  primary key (person_id, day)
);

comment on table public.directory_profile_views is
  'Directory profile views per day, counted by /api/directory/view (a beacon from the page; bots, prefetches and the owner''s own views left out). No IP, no user agent, nothing about the viewer is stored. Service role only.';

create index if not exists directory_profile_views_day on public.directory_profile_views (day);

alter table public.directory_profile_views enable row level security;

create or replace function public.directory_count_view(p_person uuid)
returns void
language sql
set search_path = ''
as $$
  insert into public.directory_profile_views (person_id, day, views)
  values (p_person, (now() at time zone 'America/New_York')::date, 1)
  on conflict (person_id, day) do update set views = public.directory_profile_views.views + 1;
$$;

revoke all on function public.directory_count_view(uuid) from public, anon, authenticated;
grant execute on function public.directory_count_view(uuid) to service_role;

-- ── Searches that found nobody ─────────────────────────────────────────────

create table if not exists public.directory_search_misses (
  day date not null,
  category text not null check (category in ('fund_lawyer', 'fund_auditor', 'placement_agent', 'fund_finance_banker', 'fund_tax_advisor')),
  -- Lowercased, spaces collapsed, at most 60 characters; anything that looks like an address or a number is never logged.
  query text not null check (length(query) between 2 and 60),
  misses integer not null default 0 check (misses >= 0),
  primary key (day, category, query)
);

comment on table public.directory_search_misses is
  'Directory searches that matched nobody, counted per day, trade and normalised query (lib/directory/views.ts normalizeMissQuery). Demand data for the desk. Service role only.';

alter table public.directory_search_misses enable row level security;

create or replace function public.directory_log_search_miss(p_category text, p_query text)
returns void
language sql
set search_path = ''
as $$
  insert into public.directory_search_misses (day, category, query, misses)
  values ((now() at time zone 'America/New_York')::date, p_category, p_query, 1)
  on conflict (day, category, query) do update set misses = public.directory_search_misses.misses + 1;
$$;

revoke all on function public.directory_log_search_miss(text, text) from public, anon, authenticated;
grant execute on function public.directory_log_search_miss(text, text) to service_role;

-- ── Suggestions ────────────────────────────────────────────────────────────

create table if not exists public.directory_suggestions (
  id uuid primary key default gen_random_uuid(),
  -- add_self: "add me"; person: someone else; firm: a firm we don't list.
  kind text not null check (kind in ('add_self', 'person', 'firm')),
  category text not null check (category in ('fund_lawyer', 'fund_auditor', 'placement_agent', 'fund_finance_banker', 'fund_tax_advisor')),
  full_name text check (full_name is null or length(full_name) <= 120),
  firm_name text not null check (length(firm_name) <= 160),
  firm_website text check (firm_website is null or length(firm_website) <= 300),
  bio_url text check (bio_url is null or length(bio_url) <= 500),
  contact_email text not null check (length(contact_email) <= 200),
  message text check (message is null or length(message) <= 1500),
  -- The sender's address is at the bio's (or the firm site's) own domain. A hint for the desk, not proof.
  domain_match boolean not null default false,
  -- The search that found nobody, when they came from one.
  from_query text check (from_query is null or length(from_query) <= 60),
  status text not null default 'open' check (status in ('open', 'added', 'rejected', 'done')),
  notes text,
  ip_hash text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

comment on table public.directory_suggestions is
  'Suggest a firm / add yourself (/directory/suggest). Every field is UNTRUSTED, typed by the sender; the desk checks the firm''s own site before anything is loaded. Service role only.';

create index if not exists directory_suggestions_open on public.directory_suggestions (status, created_at desc);
create index if not exists directory_suggestions_ip on public.directory_suggestions (ip_hash, created_at desc);

alter table public.directory_suggestions enable row level security;

-- ── Moves between firms ────────────────────────────────────────────────────

create table if not exists public.directory_moves (
  id uuid primary key default gen_random_uuid(),
  -- The old profile stays (hidden by the desk once the move is verified): its claim rows and history with it.
  from_person_id uuid not null references public.directory_people (id) on delete cascade,
  to_person_id uuid not null references public.directory_people (id) on delete cascade,
  from_domain text not null,
  to_domain text not null,
  -- awaiting: the desk linked them, the person has to confirm from the new domain
  -- verified: they did; the owner fields went to the new profile as pending edits
  status text not null default 'awaiting' check (status in ('awaiting', 'verified', 'cancelled')),
  created_at timestamptz not null default now(),
  verified_at timestamptz,
  verified_claim_id uuid references public.directory_claims (id) on delete set null,
  check (from_person_id <> to_person_id)
);

comment on table public.directory_moves is
  'A claimed person who moved firm (scripts/directory/review.ts link-move). Verified when they confirm a claim on the new profile from the new firm''s domain. Service role only.';

create unique index if not exists directory_moves_one_open on public.directory_moves (to_person_id) where status = 'awaiting';
create index if not exists directory_moves_from on public.directory_moves (from_person_id);

alter table public.directory_moves enable row level security;

-- ── The desk's log ─────────────────────────────────────────────────────────

create table if not exists public.directory_desk_log (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  -- publish, approve-edits, reject-edits, hide, unhide, remove, resolve, suggestion, link-move, stats-email, ...
  action text not null,
  person_id uuid references public.directory_people (id) on delete set null,
  ref_id uuid,
  detail jsonb not null default '{}'::jsonb
);

comment on table public.directory_desk_log is
  'What the directory desk did and which owner emails went (scripts/directory/review.ts, scripts/directory/stats-email.ts). Service role only.';

create index if not exists directory_desk_log_at on public.directory_desk_log (at desc);
create index if not exists directory_desk_log_action on public.directory_desk_log (action, at desc);

alter table public.directory_desk_log enable row level security;
