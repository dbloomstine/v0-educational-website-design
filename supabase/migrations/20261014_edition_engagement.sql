-- Each edition's opens and clicks, counted from Resend a day or more after the send and saved by
-- /api/pipeline/edition-engagement (daily, 12:00 UTC) for the Monday scorecard. Shape: lib/scorecard/engagement.ts
-- (EditionEngagement). Null until the edition has been counted. Additive only.
alter table public.newsletter_editions add column if not exists engagement jsonb;
comment on column public.newsletter_editions.engagement is
  'Opens and clicks for this edition, counted from Resend by /api/pipeline/edition-engagement: {recipients, measured, delivered, opened, clicked, bounced, complained, measured_at, final}. Final once counted three days after the send.';
