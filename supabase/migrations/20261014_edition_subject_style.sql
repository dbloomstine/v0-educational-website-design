-- Which subject-line style an edition went out with (2026-10-14, Danny): the
-- two-week test of the names list ('A') against the lead headline ('B'),
-- 2026-10-15 to 2026-10-28, judged on the share of recipients who clicked.
-- Null for editions before the test. Additive; the send writes it.
alter table public.newsletter_editions add column if not exists subject_style text;
