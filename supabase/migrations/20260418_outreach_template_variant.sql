-- Track which outreach template version sent each row so post-change
-- reply rate can be cleanly separated from the pre-v5 baseline.
-- Pre-2026-04-18 rows stay NULL = forward_v4. v5+ rows get the tag
-- stamped on insert from app/api/pipeline/outreach-send/route.ts
-- (see TEMPLATE_VARIANT in lib/outreach/template.ts).

ALTER TABLE public.cold_outreach_sent
  ADD COLUMN IF NOT EXISTS template_variant TEXT;

COMMENT ON COLUMN public.cold_outreach_sent.template_variant IS
  'Outreach template version tag. NULL = pre-v5 (forward_v4). Values are set by TEMPLATE_VARIANT in lib/outreach/template.ts. Useful for comparing reply rates across template iterations.';
