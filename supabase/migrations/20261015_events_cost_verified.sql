-- Whether we saw an event's cost ourselves (2026-10-15).
--
-- Danny, that morning: the board called McDermott's "HPE NYC 2026" free, and its registration page charges.
-- "We either need to be better at that stuff or remove the free vs paid thing." The scout had marked law-firm
-- events free by assumption, from the event page alone. From now on the board and the daily email say "Free"
-- only when cost_type = 'free' AND this is true, and show a price note only when this is true. It is set by
-- whoever saw the price, or the free registration, on the organizer's own registration page (scout-events,
-- review-submissions, the loader's `cost_verified` field); everything else stays false and shows no cost.
alter table public.industry_events add column if not exists cost_verified boolean not null default false;
comment on column public.industry_events.cost_verified is 'True only when the cost (cost_type and price_note) was seen on the organizer''s registration page itself: a $0 ticket or "free"/"complimentary" for the relevant attendee, or the stated price. The board and the daily email label an event "Free" only when cost_type = ''free'' and this is true, and show price_note only when this is true.';
