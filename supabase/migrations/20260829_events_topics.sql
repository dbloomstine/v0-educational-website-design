-- Events board v2: functional-topic dimension.
--
-- fund_categories answers "which asset class"; topics answers "which part of
-- the job" — so a CCO can filter to compliance events and a fund-finance
-- person to theirs, across every asset class. Taxonomy (validated by the
-- loader, not a DB check, to keep additions cheap):
--   compliance_regulatory | fund_finance | accounting_tax | technology_ai |
--   fundraising_ir | legal | esg | talent
-- Empty array = general/deal-focused event.

alter table industry_events
  add column if not exists topics text[] not null default '{}';

comment on column industry_events.topics is
  'Functional-area tags: compliance_regulatory, fund_finance, accounting_tax, technology_ai, fundraising_ir, legal, esg, talent. Empty = general. Validated by scripts/events/load-events.mjs.';
