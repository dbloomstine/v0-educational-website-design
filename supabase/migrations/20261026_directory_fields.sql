-- Directory filter fields (2026-10-26; Danny 2026-10-24: a dense, Lead-Desk-like
-- table you can filter by experience, primary/secondary focus, school, prior firms).
--
-- NOT APPLIED when written. Apply, then fill with
--   npx tsx scripts/directory/apply-fields.ts <fields.jsonl>          (dry run)
--   npx tsx scripts/directory/apply-fields.ts <fields.jsonl> --apply
--
-- Every value is read from the person's own firm bio page, and each one keeps the
-- verbatim bio phrase it came from in field_evidence. No phrase, no value (null / '{}').

alter table public.directory_people
  -- Earliest stated bar admission year or professional degree year (JD, LLM,
  -- CPA licence, accounting or tax degree). Null if the bio states none.
  add column if not exists career_start_year int
    check (career_start_year is null or career_start_year between 1940 and 2030),
  -- One practice id from lib/directory/taxonomy.ts PRACTICES: the one the bio leads with.
  add column if not exists primary_practice text,
  add column if not exists secondary_practices text[] not null default '{}',
  -- Employers before the current firm, normalized firm names only.
  add column if not exists prior_firms text[] not null default '{}',
  -- Normalized school names, e.g. 'Harvard Law School'.
  add column if not exists schools text[] not null default '{}',
  -- Only when the bio states them.
  add column if not exists languages text[] not null default '{}',
  -- Per field, the verbatim bio phrase(s) it came from:
  -- {"career_start_year": "...", "primary_practice": "...",
  --  "secondary_practices": {"<id>": "..."}, "prior_firms": {"<name>": "..."},
  --  "schools": {"<name>": "..."}, "languages": {"<language>": "..."}}
  add column if not exists field_evidence jsonb not null default '{}'::jsonb
    check (jsonb_typeof(field_evidence) = 'object');

alter table public.directory_people drop constraint if exists directory_people_primary_practice_check;
alter table public.directory_people add constraint directory_people_primary_practice_check
  check (primary_practice is null or primary_practice in (
    'fund_formation', 'buyout_funds', 'venture_funds', 'private_credit_funds', 'real_estate_funds',
    'infrastructure_funds', 'hedge_funds', 'secondaries', 'fund_finance', 'funds_regulatory', 'tax_funds',
    'subscription_lines', 'nav_lending', 'gp_financing', 'other'));

comment on column public.directory_people.career_start_year is
  'Earliest stated bar admission or professional degree year (JD/LLM/CPA/accounting or tax degree), from the firm bio; null if none stated. Evidence in field_evidence.';
comment on column public.directory_people.field_evidence is
  'Verbatim firm-bio phrase behind each of career_start_year, primary_practice, secondary_practices, prior_firms, schools, languages. Written by scripts/directory/apply-fields.ts.';

-- Filtering: equality / range on the scalars, containment (@> / &&) on the arrays.
create index if not exists directory_people_career_start on public.directory_people (career_start_year) where status = 'published';
create index if not exists directory_people_primary_practice on public.directory_people (primary_practice) where status = 'published';
create index if not exists directory_people_secondary_practices_gin on public.directory_people using gin (secondary_practices);
create index if not exists directory_people_prior_firms_gin on public.directory_people using gin (prior_firms);
create index if not exists directory_people_schools_gin on public.directory_people using gin (schools);
create index if not exists directory_people_languages_gin on public.directory_people using gin (languages);
