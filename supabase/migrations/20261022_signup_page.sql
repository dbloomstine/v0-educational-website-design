-- The page a signup form was on (2026-10-22).
--
-- `signup_landing_path` is where the visitor's session began; this is where they said yes: the event page
-- whose events block they used, or the page the signup box appeared on. With `signup_form` ('events',
-- 'firstvisit', 'popup'...) it tells which form on which page brings subscribers.
--
-- Nullable, no default, no check: every existing row is untouched, and the subscribe route saves a signup
-- without this column if the deploy lands first (lib/newsletter/insert-subscriber.ts).

alter table newsletter_subscribers
  add column if not exists signup_page text;
