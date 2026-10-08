-- Where a subscriber came from (2026-10-08).
--
-- /api/newsletter/subscribe writes these four columns when an address signs up
-- for the first time, from what the visitor's browser noted on its first page
-- view of the session (lib/newsletter/signup-source.ts): utm_source, else a
-- label for the referrer (tiktok, linkedin, google, direct, a bare host);
-- utm_medium; utm_campaign; and the first path landed on. A returning or
-- re-subscribing address keeps what it has. Rows from before this migration
-- stay null: nobody knows where they came from.
--
-- Read with scripts/signup-sources.ts.
--
-- Plain nullable text, no CHECK constraints: the route validates every value
-- (letters, digits, dot, dash, underscore; 40 characters, a path 120), and a
-- constraint that ever disagreed with it would refuse a signup. The route also
-- retries without these columns if they are missing, so this can be applied
-- before or after the deploy.
alter table public.newsletter_subscribers
  add column if not exists signup_source text,
  add column if not exists signup_medium text,
  add column if not exists signup_campaign text,
  add column if not exists signup_landing_path text;

comment on column public.newsletter_subscribers.signup_source is
  'First-touch source at first signup: utm_source, else the referrer as a short label (tiktok, linkedin, instagram, facebook, x, google, bing, duckduckgo, a bare host) or direct. Null before 2026-10-08.';
comment on column public.newsletter_subscribers.signup_medium is
  'utm_medium at first signup (bio, video, email...). Null if none.';
comment on column public.newsletter_subscribers.signup_campaign is
  'utm_campaign at first signup. Null if none.';
comment on column public.newsletter_subscribers.signup_landing_path is
  'The first path the visitor landed on in the session that signed up, without query or hash.';
