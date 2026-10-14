-- An event its organizer sent in through fundopshq.com/events/submit (2026-10-13).
--
-- Since 2026-10-12 the daily email shows two events a day, not the whole week. Danny, the next day, when a
-- fund administrator submitted a webinar: "if someone submits one proactively it should automatically get
-- shown when it's in the window that we show them." The loader (scripts/events/load-events.mjs) sets this
-- from the review-submissions batch; lib/newsletter/email-events.ts always shows such an event on its day.
alter table public.industry_events add column if not exists is_submitted boolean not null default false;
comment on column public.industry_events.is_submitted is 'True when the organizer sent the event in themselves through fundopshq.com/events/submit (set by the loader from the review-submissions batch). The daily email always shows such an event in the days it lists.';
