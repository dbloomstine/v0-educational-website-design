-- Enable RLS on newsletter_subscribers and newsletter_editions.
-- All application code accesses via getSupabaseAdmin() (service role) which
-- bypasses RLS. Anon + authenticated roles are locked out by default when RLS
-- is enabled with zero policies, which is exactly what we want — subscriber
-- emails, confirmation tokens, and sent HTML bodies must never be reachable
-- via the embedded anon key in the public site bundle.

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_editions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.newsletter_subscribers IS
  'Subscriber list. RLS enabled with zero policies — only service role can read or write. Application always accesses via getSupabaseAdmin().';
COMMENT ON TABLE public.newsletter_editions IS
  'Send history. RLS enabled with zero policies — only service role can read or write. Application always accesses via getSupabaseAdmin().';
