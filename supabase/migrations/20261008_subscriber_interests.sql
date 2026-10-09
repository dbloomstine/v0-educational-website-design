-- What a subscriber says they follow (2026-10-08).
--
-- The signup card and /preferences offer a short list of asset classes and
-- where the reader sits (lib/newsletter/interests.ts). The daily send reads
-- `interests` to group each reader's stories; `reader_role` and `signup_form`
-- are for counting (who reads, which form brought them).
--
-- All three are nullable with no default: every existing row is untouched
-- and keeps getting the edition as it always was.

alter table newsletter_subscribers
  add column if not exists interests text[],
  add column if not exists reader_role text,
  add column if not exists signup_form text;
