-- Sponsor bookings (2026-10-02).
--
-- One row is one sponsor's run. The daily newsletter reads the row whose dates
-- cover the edition; fundopshq.com reads the row whose dates cover today. A
-- booking starts and ends by itself: nothing is deployed to put a sponsor up,
-- and nothing has to be remembered to take one down.
--
-- With no row in force, both the email and the site show the house
-- "Your firm here" notice instead.
create table if not exists public.sponsor_bookings (
  id uuid primary key default gen_random_uuid(),
  -- The brand, as it should read. Also the logo's alt text.
  name text not null check (length(btrim(name)) between 2 and 60),
  -- The sponsor's copy: up to about 60 words.
  blurb text not null check (length(btrim(blurb)) between 20 and 600),
  -- Optional one-liner for the slim strip at the top of site pages. The blurb,
  -- clamped, is used when this is null.
  tagline text check (tagline is null or length(btrim(tagline)) between 10 and 120),
  -- Where the logo and the button go. https only.
  cta_url text not null check (cta_url ~ '^https://[^[:space:]]+$'),
  cta_text text check (cta_text is null or length(btrim(cta_text)) between 2 and 40),
  -- A hosted raster logo. Email clients do not render SVG or WebP.
  logo_url text check (logo_url is null or logo_url ~* '^https://[^[:space:]]+\.(png|jpe?g|gif)(\?[^[:space:]]*)?$'),
  -- Display width in pixels (height follows).
  logo_width integer check (logo_width is null or logo_width between 60 and 320),
  starts_on date not null,
  ends_on date not null,
  status text not null default 'booked' check (status in ('booked', 'paused', 'cancelled')),
  note text,
  created_at timestamptz not null default now(),
  constraint sponsor_bookings_dates check (ends_on >= starts_on),
  -- One sponsor at a time: two booked runs may not share a day.
  constraint sponsor_bookings_no_overlap
    exclude using gist (daterange(starts_on, ends_on, '[]') with &&) where (status = 'booked')
);

comment on table public.sponsor_bookings is
  'Sponsor runs for FundOps Daily and fundopshq.com. The row with status=booked whose starts_on..ends_on covers the date is shown in the email (top and bottom) and on the site (top strip and rail card). No row in force = the house "Your firm here" notice. Read by lib/sponsor/bookings.ts.';

alter table public.sponsor_bookings enable row level security;
