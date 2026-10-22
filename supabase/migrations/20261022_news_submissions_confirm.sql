-- "Send us your news" v2 (2026-10-22, Danny approved the plan that day).
--
-- 20261022_news_submissions.sql made the table (applied; empty when this was
-- written). This adds what the second version needs:
--   * a work-email check: a row arrives as `unconfirmed`, we email a one-time
--     link to the address given, and clicking it makes the row `pending` (in
--     review). Only the SHA-256 of the link's token is kept; it expires after
--     seven days.
--   * the firm's website, and whether the email's domain matches it (a flag
--     for the reviewer, never a block).
--   * amount + currency, the date of the news, and the deal team / people
--     involved (up to five {name, role}; stored for the desk, never shown).
--   * the announcement link becomes optional (many firms send news nobody has
--     written up yet; the desk verifies it with the firm instead).
--   * `accepted` is renamed `approved`, and a story published from a row
--     points back to it in published_news_item_id. Publishing itself is NOT
--     designed yet: nothing writes that column.
--
-- Still service-role only: RLS stays on with no policies.

alter table public.news_submissions
  add column if not exists firm_website text,
  add column if not exists amount numeric,
  add column if not exists currency text,
  add column if not exists news_date date,
  add column if not exists people jsonb not null default '[]'::jsonb,
  add column if not exists domain_match boolean,
  add column if not exists confirm_token_hash text,
  add column if not exists confirm_expires_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists published_news_item_id uuid references public.news_items (id) on delete set null;

alter table public.news_submissions alter column url drop not null;

-- Rows sent by the first version (no confirmation step) were `pending` or
-- `accepted`; `accepted` becomes `approved`.
update public.news_submissions set status = 'approved' where status = 'accepted';

alter table public.news_submissions drop constraint if exists news_submissions_status_check;
alter table public.news_submissions
  add constraint news_submissions_status_check
  check (status in ('unconfirmed', 'pending', 'approved', 'rejected', 'spam'));
alter table public.news_submissions alter column status set default 'unconfirmed';

alter table public.news_submissions drop constraint if exists news_submissions_currency_check;
alter table public.news_submissions
  add constraint news_submissions_currency_check check (currency is null or currency ~ '^[A-Z]{3}$');

alter table public.news_submissions drop constraint if exists news_submissions_people_check;
alter table public.news_submissions
  add constraint news_submissions_people_check
  check (jsonb_typeof(people) = 'array' and jsonb_array_length(people) <= 5);

create unique index if not exists news_submissions_confirm_token
  on public.news_submissions (confirm_token_hash) where confirm_token_hash is not null;

comment on column public.news_submissions.confirm_token_hash is
  'SHA-256 (hex) of the one-time confirm link token emailed to contact_email. The token itself is never stored.';
comment on column public.news_submissions.domain_match is
  'contact_email''s domain matches firm_website''s domain. A flag for the reviewer, not a block. Null when there was no website to compare.';
comment on column public.news_submissions.people is
  'Deal team / people involved: [{name, role}], at most 5. UNTRUSTED. Stored for the desk, never shown to readers.';
comment on column public.news_submissions.published_news_item_id is
  'The story published from this submission, once there is one. Nothing writes it yet (publishing is not designed).';

comment on table public.news_submissions is
  'Public /submit queue: firms send a fund close, fundraise launch, deal, hire or other news. unconfirmed (work email not yet confirmed) -> pending (in review) -> approved | rejected | spam. All free-text fields are UNTRUSTED; nothing is published from a row without verification. RLS enabled with zero policies: service role only.';
