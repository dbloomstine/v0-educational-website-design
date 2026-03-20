-- Feedback / suggestions table for fundopshq.com/news
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('missing_source', 'feature_request', 'bug_report', 'general')),
  message text not null,
  email text,
  page text default '/news',
  created_at timestamptz not null default now()
);

-- Index for reviewing recent submissions
create index idx_feedback_created_at on feedback (created_at desc);

-- RLS: no public read, only service role inserts
alter table feedback enable row level security;

-- No policies = only service_role can access (which is what our API uses)
