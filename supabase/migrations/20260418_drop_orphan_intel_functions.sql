-- 15 SQL functions left over from the intel-platform deprecation (2026-04-09).
-- All reference tables (gps, funds, adv_funds, contacts, sps, entity_aliases,
-- story_clusters) that no longer exist. Confirmed zero references in the
-- codebase at drop time. All flagged mutable-search-path advisories now clear.
--
-- handle_new_user() is intentionally kept — it's attached to the Supabase
-- auth.users trigger on_auth_user_created and dropping it requires cascading
-- a trigger on a Supabase-managed schema.

DROP FUNCTION IF EXISTS public.cluster_similar_articles(vector, double precision, integer, uuid, integer);
DROP FUNCTION IF EXISTS public.contact_counts_by_firm(uuid[]);
DROP FUNCTION IF EXISTS public.contact_readiness_by_firm(uuid[]);
DROP FUNCTION IF EXISTS public.explore_raising(text, text, text, date, text, text, integer, integer);
DROP FUNCTION IF EXISTS public.fn_fund_name_normalized();
DROP FUNCTION IF EXISTS public.match_similar_articles(vector, double precision, integer, uuid);
DROP FUNCTION IF EXISTS public.search_adv_funds_fuzzy(text, integer, integer);
DROP FUNCTION IF EXISTS public.search_contacts_fuzzy(text, integer, integer);
DROP FUNCTION IF EXISTS public.search_funds_fuzzy(text, integer, integer);
DROP FUNCTION IF EXISTS public.search_gps_fuzzy(text, integer, integer);
DROP FUNCTION IF EXISTS public.search_sps_fuzzy(text, integer, integer);
DROP FUNCTION IF EXISTS public.trending_firms(timestamp with time zone, integer);
DROP FUNCTION IF EXISTS public.update_contacts_updated_at();
DROP FUNCTION IF EXISTS public.update_entity_aliases_updated_at();
DROP FUNCTION IF EXISTS public.update_updated_at();
