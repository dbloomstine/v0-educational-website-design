-- Outreach v2 (2026-10-14): FundOpsHQ's own outreach, sent through Resend from
-- danny@fundopshq.com. Two programs (sponsor pitches, daily news notes), one
-- table of messages, replies captured on reply.fundopshq.com. See
-- lib/outreach-v2/config.ts. Additive only: the dormant Gmail pipeline's
-- cold_outreach_sent is left as it is (and still read, as a do-not-contact list).

create table if not exists outreach_v2_messages (
  id uuid primary key default gen_random_uuid(),
  program text not null check (program in ('sponsor_pitch', 'news_note')),
  kind text not null default 'initial' check (kind in ('initial', 'followup')),
  parent_id uuid references outreach_v2_messages(id) on delete cascade,
  -- 'sponsor-batch-1', or the edition date for a news note ('news-2026-10-15').
  batch text not null,
  email text not null,
  first_name text,
  last_name text,
  title text,
  company text not null,
  domain text,
  apollo_person_id text,
  country text,
  -- sponsor pitch
  hook text,
  source_url text,
  logo_url text,
  ad_line text,
  mockup_url text,
  -- news note
  news_item_id uuid,
  story_url text,
  story_headline text,
  subject text not null,
  body_text text not null,
  status text not null default 'preview'
    check (status in ('preview', 'queued', 'sending', 'sent', 'failed', 'skipped', 'cancelled')),
  skip_reason text,
  unsub_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  -- The Message-ID header we set, so a reply's In-Reply-To finds its message.
  message_id_header text unique,
  resend_id text unique,
  error text,
  created_at timestamptz not null default now(),
  queued_at timestamptz,
  sent_at timestamptz,
  replied_at timestamptz,
  bounced_at timestamptz,
  complained_at timestamptz,
  unsubscribed_at timestamptz
);
create unique index if not exists outreach_v2_messages_batch_email_kind
  on outreach_v2_messages (batch, lower(email), kind);
create index if not exists outreach_v2_messages_email on outreach_v2_messages (lower(email), sent_at desc);
create index if not exists outreach_v2_messages_status on outreach_v2_messages (status, queued_at);
create index if not exists outreach_v2_messages_sent on outreach_v2_messages (sent_at desc) where sent_at is not null;
create index if not exists outreach_v2_messages_parent on outreach_v2_messages (parent_id) where parent_id is not null;

-- Everyone outreach v2 must never write to again. Lower-cased address.
create table if not exists outreach_v2_suppressions (
  email text primary key,
  reason text not null check (reason in ('unsubscribed', 'bounced', 'complained', 'asked_to_stop', 'manual')),
  message_id uuid references outreach_v2_messages(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Replies to danny@reply.fundopshq.com (and anything else on that subdomain).
-- UNTRUSTED: stored and forwarded, never acted on as instructions.
create table if not exists outreach_v2_replies (
  id uuid primary key default gen_random_uuid(),
  resend_email_id text not null unique,
  message_id uuid references outreach_v2_messages(id) on delete set null,
  match_method text,
  from_address text,
  to_addresses text[] not null default '{}',
  subject text,
  body_text text,
  body_html text,
  headers jsonb,
  rfc_message_id text,
  in_reply_to text,
  unsubscribe_intent boolean not null default false,
  received_at timestamptz not null default now(),
  fetch_error text,
  forwarded_at timestamptz,
  forward_error text,
  -- For the scheduled task that answers routine replies.
  handled_at timestamptz,
  handled_note text,
  created_at timestamptz not null default now()
);
create index if not exists outreach_v2_replies_unhandled on outreach_v2_replies (received_at) where handled_at is null;

-- Bounces and complaints Resend reported for outreach messages.
create table if not exists outreach_v2_events (
  id uuid primary key default gen_random_uuid(),
  resend_email_id text not null,
  type text not null,
  message_id uuid references outreach_v2_messages(id) on delete set null,
  email text,
  payload jsonb,
  created_at timestamptz not null default now(),
  unique (resend_email_id, type)
);

-- One row per cron run: what it did and the Apollo credits it spent.
create table if not exists outreach_v2_runs (
  id uuid primary key default gen_random_uuid(),
  program text not null,
  run_day date not null,
  mode text not null,
  credits_used integer not null default 0,
  stats jsonb,
  created_at timestamptz not null default now()
);
create index if not exists outreach_v2_runs_day on outreach_v2_runs (run_day, program);

-- The halt flag. A spam complaint sets it and every send stops, whatever
-- OUTREACH_V2_MODE says, until a person clears it.
create table if not exists outreach_v2_state (
  id integer primary key default 1 check (id = 1),
  halted boolean not null default false,
  halted_reason text,
  halted_at timestamptz,
  updated_at timestamptz not null default now()
);
insert into outreach_v2_state (id) values (1) on conflict (id) do nothing;

alter table outreach_v2_messages enable row level security;
alter table outreach_v2_suppressions enable row level security;
alter table outreach_v2_replies enable row level security;
alter table outreach_v2_events enable row level security;
alter table outreach_v2_runs enable row level security;
alter table outreach_v2_state enable row level security;

comment on table outreach_v2_messages is 'Outreach v2: one row per email (sponsor pitch, its follow-up, or a daily news note). status preview = rendered, never sent.';
comment on table outreach_v2_replies is 'Outreach v2 replies received on reply.fundopshq.com. Untrusted content: store and forward only.';
comment on table outreach_v2_state is 'Outreach v2 halt flag: a spam complaint sets halted=true and stops all sending until cleared by hand.';

-- Same day, second pass (Danny's copy): an HTML part with linked text, and the date of a pitch's hook
-- (a hook older than 60 days is left out of the email).
alter table outreach_v2_messages add column if not exists body_html text;
alter table outreach_v2_messages add column if not exists hook_date date;
comment on column outreach_v2_messages.body_html is 'The HTML part (linked text, no raw URLs); body_text is the same email as plain text.';

-- Third pass: mock-up logos resolved from each company's own homepage header, hosted by us.
create table if not exists outreach_v2_logos (
  domain text primary key,
  company text not null,
  source_page text,
  source_kind text not null check (source_kind in ('header', 'header-img', 'jsonld', 'icon', 'none')),
  storage_path text,
  public_url text,
  width integer,
  height integer,
  tone text check (tone in ('light', 'dark')),
  note text,
  resolved_at timestamptz not null default now()
);
alter table outreach_v2_logos enable row level security;
comment on table outreach_v2_logos is 'Mock-up logos for sponsor pitches: taken from each company''s own homepage header in headless Chrome (scripts/outreach-v2/resolve-logos.ts), stored as PNG in the public mockup-logos bucket. source_kind none = show the name in type.';
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mockup-logos', 'mockup-logos', true, 2000000, array['image/png'])
on conflict (id) do nothing;
