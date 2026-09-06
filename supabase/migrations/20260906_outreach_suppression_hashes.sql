-- Hashed suppression list for FundOpsHQ outreach (2026-09-06).
--
-- Danny's rule: never email anyone the IQ-EQ Lead Desk is reaching out to,
-- and never join the two datasets. So this table holds ONLY SHA-256 hashes
-- of lower-cased Lead Desk emails, computed inside the Lead Desk database
-- (sha256() in Postgres) so no identity ever crosses projects. The outreach
-- pipeline hashes each candidate and checks membership. See
-- scripts/outreach/SUPPRESSION_SYNC.md for the refresh procedure.
create table if not exists outreach_suppression_hashes (
  hash       text primary key,          -- sha256(lower(trim(email))), hex
  source     text not null default 'lead_desk',
  added_at   timestamptz not null default now()
);
alter table outreach_suppression_hashes enable row level security;
comment on table outreach_suppression_hashes is
  'SHA-256 hashes of emails FundOpsHQ outreach must never contact. Hashes only, by design.';
