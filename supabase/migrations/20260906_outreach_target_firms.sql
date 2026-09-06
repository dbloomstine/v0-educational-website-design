-- Curated registry of referral-partner firms for FundOps Daily lookalike outreach.
-- Registry-first: the nightly job works through these before any Apollo keyword search.
-- Applied to reolugphmfmlwelnnvet on 2026-09-06 and seeded with 250 firms
-- (loyal-reader firms + curated lawyers / banks / auditors / software / placement / insurance).
create table if not exists outreach_target_firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null unique,
  category text not null check (category in ('fund_lawyers','fund_finance_banking','fund_auditors','fund_software','placement_agents','fund_insurance')),
  keywords text,                          -- optional Apollo q_keywords override for this firm
  source text not null default 'curated', -- curated | engaged_reader | manual
  notes text,
  is_active boolean not null default true,
  priority int not null default 0,        -- higher first
  contacts_found int not null default 0,
  last_targeted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists outreach_target_firms_pick_idx on outreach_target_firms (is_active, last_targeted_at nulls first, priority desc);
alter table outreach_target_firms enable row level security;
