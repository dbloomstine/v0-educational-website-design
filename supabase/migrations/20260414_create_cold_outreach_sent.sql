-- Append-only log of the "we covered your firm" outreach pipeline.
-- Each row represents one Gmail draft created by the grow-newsletter skill.
-- Used to dedup candidates against a 120-day rolling window and to enforce
-- a permanent opt-out list (anyone who replies "unsubscribe" / "no thanks").
create table if not exists cold_outreach_sent (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text,
  last_name text,
  firm_name text,
  firm_domain text,
  person_title text,
  article_id uuid references news_items(id) on delete set null,
  story_type text,
  subject text not null,
  draft_id text,
  status text not null default 'draft_created'
    check (status in (
      'draft_created',   -- Gmail draft exists, awaiting Danny's review
      'sent',            -- Danny sent the draft
      'replied',         -- Recipient responded (neutral / needs triage)
      'replied_positive',-- Recipient said yes / asked to be added
      'opted_out',       -- Recipient asked to never be contacted — permanent block
      'bounced',         -- Email bounced hard
      'skipped'          -- Draft deleted before send
    )),
  notes text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  responded_at timestamptz
);

-- Primary dedup lookup: is this email in the rolling window or permanent-block?
-- Uses lower(email) because Gmail/Apollo return mixed case and we want exact
-- dedup regardless of capitalization.
create index if not exists idx_cold_outreach_sent_email_created
  on cold_outreach_sent (lower(email), created_at desc);

-- Fast scan for permanent-block / hard-bounce rows (small subset, partial index).
create index if not exists idx_cold_outreach_sent_blocked
  on cold_outreach_sent (lower(email))
  where status in ('opted_out', 'bounced');

-- Reporting: pull today's batch back by status + date.
create index if not exists idx_cold_outreach_sent_created
  on cold_outreach_sent (created_at desc);

-- RLS: no public access, only service_role. The skill reaches this table via
-- the Supabase MCP which runs with admin credentials. The website app layer
-- should never touch this table directly.
alter table cold_outreach_sent enable row level security;

comment on table cold_outreach_sent is
  'Append-only log of the daily firm-covered outreach pipeline. One row per Gmail draft created by the grow-newsletter skill. Dedup enforced by the skill, not by a unique constraint (same email can be re-contacted after 120 days).';
