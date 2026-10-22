-- Outreach v2, third program (2026-10-22): organizer notes, "your event is on
-- the FundOpsHQ events board", to the events or marketing contact at an event's
-- organizer (lib/outreach-v2/organizer-notes.ts). Additive: the program check
-- takes the new value, and a note records its event.

alter table outreach_v2_messages drop constraint if exists outreach_v2_messages_program_check;
alter table outreach_v2_messages
  add constraint outreach_v2_messages_program_check
  check (program in ('sponsor_pitch', 'news_note', 'organizer_note'));

alter table outreach_v2_messages add column if not exists event_id uuid references industry_events(id) on delete set null;
comment on column outreach_v2_messages.event_id is 'Organizer note: the industry_events row it is about. story_url is its fundopshq.com page, source_url the organizer''s own event page.';
create index if not exists outreach_v2_messages_organizer on outreach_v2_messages (program, created_at desc) where program = 'organizer_note';
