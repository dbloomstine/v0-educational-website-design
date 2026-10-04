-- Social desk (2026-10-03): the record of what the nightly social job makes
-- and posts, and the bucket its finished files live in.
--
-- The job runs outside the site (the `fundopshq-social` repository, on a
-- GitHub schedule). It reads the day's stories from /api/social/export, renders
-- slides and videos, uploads them here, and schedules them with Buffer, which
-- publishes to TikTok, Instagram and LinkedIn. It reaches these tables only
-- through /api/social/posts; nothing on the public site reads them.

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  -- The edition: the news day the post belongs to (Eastern time), not the day it goes out.
  post_date date not null,
  -- The post's folder name within the edition: '03-big-number-ares'.
  slug text not null,
  -- Which template made it: dailyFive, bigNumber, leagueChart, …
  format text not null,
  kind text not null check (kind in ('carousel', 'video')),
  channel text not null check (channel in ('tiktok', 'instagram', 'linkedin')),
  -- The news_items rows the post rests on. No foreign key: a story's rows can be re-ingested.
  story_ids uuid[] not null default '{}',
  caption text not null,
  media_urls text[] not null default '{}',
  -- draft: in the scheduler but not due to go out (a dry run). held: bad news
  -- about a named firm, waiting for Danny. posted / failed: what the scheduler
  -- reported afterwards. skipped: made, but not sent anywhere.
  status text not null check (status in ('draft', 'scheduled', 'held', 'posted', 'failed', 'skipped')),
  hold_reason text,
  scheduled_for timestamptz,
  buffer_post_id text,
  -- The post's address on the network, once it is out.
  permalink text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_date, slug, channel)
);

comment on table public.social_posts is
  'One row per social post per channel, written by the nightly job in the fundopshq-social repository through /api/social/posts. Not read by the public site.';

create index if not exists idx_social_posts_date on public.social_posts (post_date desc);

-- A reading of one post's numbers. Networks report different things (views,
-- reach, saves…), so a reading is a bag of numbers; a post gets one a day.
create table if not exists public.social_metrics (
  id bigint generated always as identity primary key,
  post_id uuid not null references public.social_posts (id) on delete cascade,
  captured_at timestamptz not null default now(),
  metrics jsonb not null,
  -- Where the reading came from: 'buffer', or 'manual' when read off a screen.
  source text not null default 'buffer'
);

comment on table public.social_metrics is
  'Readings of a social post''s numbers over time (views, likes, …), written through /api/social/posts.';

create index if not exists idx_social_metrics_post on public.social_metrics (post_id, captured_at desc);

-- Service key only: no policies, like the other internal tables.
alter table public.social_posts enable row level security;
alter table public.social_metrics enable row level security;

-- The finished slides and videos. Public, because the scheduler fetches each
-- file from its public address at the moment the post goes out. Uploads come
-- only through one-time slots issued by /api/social/upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('social', 'social', true, 104857600, array['image/jpeg', 'video/mp4', 'application/pdf'])
on conflict (id) do nothing;
