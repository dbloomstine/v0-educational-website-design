-- Per-event override of the North America-only board scope. Set by hand, only
-- on Danny's say-so (first use 2026-10-01: GP Stakes News London Social).
-- Applied to reolugphmfmlwelnnvet on 2026-10-01.
alter table industry_events add column if not exists board_exception boolean not null default false;
comment on column industry_events.board_exception is 'true = list on the public board and in the daily email even though region is outside the NA board scope. Hand-set only, on Danny''s instruction.';
