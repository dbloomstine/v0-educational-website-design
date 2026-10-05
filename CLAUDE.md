# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FundOpsHQ is the central hub for the investment funds industry. It ties together three products under one brand:

1. **FundOps Daily** — daily news feed (on the site) and morning email newsletter (sent via Resend)
2. **FundOpsHQ Live** — weekly broadcast show streamed on YouTube (Thursdays 11am ET)
3. Long-form reference content across private markets

Audience: **GPs, LPs, and fund service providers** working in and around private markets — the people inside those firms (operations, finance, accounting, compliance, legal, BD, product). Family offices are covered under LPs. Do **not** frame it as "educational", "for fund ops professionals", or "for fund operators" — the site is a brand landing zone for the Daily + Live + newsletter products, and the canonical audience phrase is "GPs, LPs, and fund service providers."

Stack: Next.js 16 (App Router, Turbopack) + React 19, TypeScript, Tailwind CSS, Supabase, Resend, Vercel.

> **Heads up on the directory name:** the repo still lives at `v0-educational-website-design/` because it started as a v0.app scaffold. The "educational" framing is dead — rename later; don't let it shape decisions now.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
```

Tests: `npx vitest run` (lib/news, lib/newsletter, lib/outreach). Types: `npx tsc --noEmit`.

**CI (`.github/workflows/ci.yml`) compiles the site but does not prerender it.** It runs ESLint, `npx tsc --noEmit`, the tests and `next build --experimental-build-mode compile`, which bundles the site and stops: it catches what only the bundler sees (a hook in a server component passes ESLint and `tsc` and fails here), not a route that throws as it loads and not a page that fails to render. The Actions runner has no database, and the news pages fail to prerender without one on purpose (see "The loaders throw" below). Vercel runs the full build, with the database, on every pull request and push: its check is the one that covers loading, prerendering and the `○ ● ƒ` table, so read it before merging. Do not get CI green by making a loader return empty when the database is missing, and do not give Actions the database keys — the loaders use the service-role key, and a build there would query the production database and write to `site_cache`. A local `npm run build` without `.env.local` fails the same way; that is expected.

## Design system (2026-10-01 redesign)

The public site is a newspaper: navy masthead and footer, cream "newsprint" body — the same palette as the
FundOps Daily email. Mechanics, all in `app/globals.css`:

- **`.paper`** on a page's `<main>` re-points every design token (background, foreground, border, muted…) to
  the light palette, and re-points the accent utilities (`text-amber-400`, `text-emerald-400`, chip colours)
  to shades that read on cream. Components keep their classes; the scope does the work. Remove the class and
  a page is navy again. `/brand`, `/desk` and `/admin` do not use it.
- **Type:** Newsreader for headlines (`font-news`), Libre Franklin for labels and UI (`font-ui`, and the
  inherited face inside `.paper`), JetBrains Mono for figures and timestamps. Lead Desk keeps Inter.
- **Headlines:** regular weight with the named firms/people bold (`components/story/Headline.tsx`,
  `splitHeadlineByEntities`). Never all-bold. Hover is an underline (`.hl`), not a colour change.
- **A story, not an article, is the unit** (`lib/news/stories.ts`): one event however many outlets reported
  it, built with the newsletter's own screening, clustering and section rules. The site and the email
  therefore agree on what a story is and where it belongs — change those rules in `lib/newsletter/`.

## Routing (post-cleanup, April 2026)

The site was aggressively consolidated on 2026-04-10. These are the public routes, plus an admin tool:

```
/                       → The FRONT PAGE (redesigned 2026-10-01 as a news site, not a feed).
                           Server-rendered from lib/news/stories.ts, revalidate 600:
                           · HeroSubscribe (now a one-line subscribe band; anchor #subscribe, input #newsletter-email)
                           · "Firms in the news" line, then the sponsor strip (see "Sponsors" below)
                           · LeadStory + six TopStory (ranked: size, coverage breadth, source tier, recency)
                           · rail: the fundraising chart, Latest, Largest closes (7 days), Events (week ahead)
                           · section blocks by story type, then by asset class; a story appears once per page
/news                   → "Latest": the full archive with search and filters (client NewsFeed, unchanged logic)
/news/[section]         → Section fronts — the TABS in the header. 13 sections defined in lib/news/sections.ts:
                           by story type (fundraising, deals, people, lps, regulation, service-providers) and by
                           asset class (private-equity, venture-capital, private-credit, real-estate,
                           infrastructure, secondaries, hedge-funds). STATIC (built at deploy, rebuilt
                           every few minutes): these are the header's tabs, the site's main navigation.
/news/[section]/[facet] → A cut within a section (/news/private-equity/deals): static too, built on
                           first request. It was `?f=deals` until 2026-10-02; a query string forces a
                           page to render on every request. next.config redirects the old form.
                           NOTE next.config.mjs redirects every OTHER /news/* path to /news (legacy article
                           links); a new section slug must be added to SECTION_SLUGS there (a test enforces it).
/story/[id]             → Our page for one story: summary, extracted facts, every outlet that covered it,
                           share buttons, per-story OG image. `id` is any news_items id in the story.
/league-tables          → Final closes ranked by size: 30 days / 90 days / year, by asset class. Built from
                           stories by lib/news/league.ts. See "League tables, the chart and firm pages".
/firms                  → Directory of every firm in the month's stories, with a search that reaches back a year.
/firm/[slug]            → One firm: its stories for the past year, its closes, and where it is named in others'.
/sponsor                → What a sponsor gets. Every number on it is counted (lib/sponsor/stats.ts), never typed —
                           a test enforces that. Shows mock-ups of the placements and whether the space is open.
/newsletter/sample      → Today's edition rendered with a one-sponsor placeholder; linked from /sponsor.
/events                 → Industry events board (added 2026-08-29) — "Section B · The Circuit".
                           EventsBoard component, filterable, backed by industry_events.
                           Refreshed weekly via the scout-events skill (~/.claude/skills/scout-events)
/events/[slug]          → Dual route: reserved slugs in lib/events/collections.ts render
                           pre-filtered LANDING pages (/events/new-york, /events/compliance,
                           /events/webinars, /events/free...); everything else is an event
                           DETAIL page (per-event JSON-LD, Google Cal + .ics buttons, related
                           events). Past events stay up as archived pages for SEO.
/events/submit          → Public "Submit an event" form → event_submissions pending queue
/about                  → About page (rebuilt 2026-04-09)
/brand                  → Brand kit — logos, monograms, backgrounds (added 2026-04-09)
/privacy, /terms        → Legal
/admin/newsletter       → Internal newsletter prep UI (not in sitemap/robots)
```

Everything you might remember is gone: `/blog`, `/interviews`, `/guests`, `/contact`, `/episodes/*`, `/fund-watch/*`, `/articles/*`, `/tools/*`, `/funds/*`, `/roles/*`, and every `/newsletter/*` page except the sample. Do not recreate them without an explicit ask.

## API Routes

```
/api/news/feed                          → Homepage NewsFeed data source
/api/events/feed                        → /events EventsBoard data source (mirrors news/feed pattern)
/api/events/calendar                    → iCalendar: ?slug= for one event's .ics, or filtered webcal:// subscribe feed
/api/events/click                       → Count-only outbound-click beacon (increment_event_click RPC)
/api/events/submit                      → Public event submissions → event_submissions (pending queue)
/api/pipeline/circuit-send              → Cron (Mon 12:00 UTC): The Circuit weekly events digest. SHIPS DARK —
                                           previews to Danny until CIRCUIT_ENABLED=true; ?preview=1 returns HTML
/api/newsletter/subscribe               → Email signup — single opt-in, sends welcome email
/api/newsletter/confirm                 → Legacy endpoint, kept alive for old confirmation links
/api/newsletter/unsubscribe             → One-click unsubscribe
/api/feedback                           → Inline feedback button on the news feed
/api/admin/newsletter-prep              → Admin-only newsletter preview
/api/pipeline/news-ingest               → Cron: RSS fetch + store (3-tier by frequency)
/api/pipeline/news-process              → Cron: Claude-API classification + clustering
/api/pipeline/newsletter-send           → Cron: assemble + send FundOps Daily via Resend
/api/pipeline/outreach-send             → Cron: daily "we covered your firm" outreach via Gmail API
/api/pipeline/outreach-monitor          → Cron: hourly reply/bounce detection for outreach
/api/pipeline/backfill-domains          → One-shot: backfill firm domains for logos
/api/social/export                      → Social desk: the stories, league table and events the nightly social job works from
/api/social/upload                      → Social desk: one-time upload slots into the public `social` storage bucket
/api/social/posts                       → Social desk: the record of what was posted (social_posts, social_metrics)
/api/social/cleanup                     → Social desk: removes finished files more than a week old from the `social` bucket (the job calls it once a day)
```

FundOps Daily flipped to **single opt-in** on 2026-04-10. The `subscribe` route now sets `status = 'confirmed'` + `confirmed_at = now()` on insert and fires a welcome email via `lib/newsletter/welcome-email.ts`. The `confirm` route is still wired up so any stale confirmation-email links already in inboxes land on the homepage instead of 404ing. Don't reintroduce double opt-in without an explicit ask — we measured ~36% drop-off on the confirmation step before the flip.

Cron schedules live in `vercel.json`.

## Cold Outreach Pipeline (Path B) — added 2026-04-14

Daily server-side companion to the `grow-newsletter` Claude skill. Runs after
the morning newsletter cron and sends personalized "we covered your firm"
cold emails directly through the Gmail API from `dbloomstine@gmail.com`
(NOT Resend — Resend's TOS prohibits cold outreach and would risk the main
newsletter account). The skill still exists as the manual-review fallback;
Path B is the automated path.

**Ships dark.** The pipeline is committed and deployed but gated behind
`OUTREACH_ENABLED=true`. Leave off until Danny's ready for a live run.

### Daily flow (`app/api/pipeline/outreach-send`)

```
Cron: two-wave split, 7 days/week (vercel.json crons[].path carries ?cap=…):
  Wave 1: 12:30 UTC (8:30 AM EDT / 7:30 AM EST) — ?cap=25
  Wave 2: 17:00 UTC (1:00 PM EDT / 12:00 PM EST) — ?cap=50
  (wave 2 subtracts wave 1's sent count from its 50 cap → up to 25 more)
  1. Auth (isAuthorizedPipelineRequest)
  2. Kill switch (OUTREACH_ENABLED env flag — absolute off)
  3. Idempotency guard — countTodaysRuns() counts status=sent rows;
     if >= wave cap, exit cleanly (no-op for already-full waves).
  4. Confirm today's newsletter_editions row is status='sent'
  5. Pull articles (join newsletter_editions.article_ids → news_items)
  6. buildCandidates() — hard blocks A through F
  7. firmLevelDedup() — by lower(firm_name) OR firm_domain, 120d + permanent
  8. Apollo enrichment (verified emails only, no fallback to catch-all)
  9. emailLevelDedup() — vs newsletter_subscribers + cold_outreach_sent
  10. Cap to wave's cap (from ?cap= query param, falls back to OUTREACH_DAILY_CAP)
  11. For each surviving candidate:
        generateHook() (Anthropic Haiku 4.5 — one-sentence news anchor)
        composeEmail() (static template, only firstName + hook vary)
        qualityGate() — 9 hard checks, fail → log skipped, try next
        sendGmail() via raw fetch + OAuth2 refresh + MIME base64url
        insert into cold_outreach_sent (status='sent', template_variant=v5)
        sleep 3–7s jitter between sends (human-pacing)
  12. Summary email to dbloomstine@gmail.com

Two-wave rationale: splitting daily volume across AM + PM windows makes
the send pattern look less robotic to Gmail's spam-heuristics, and caps
exposure on any single burst. Bumping `OUTREACH_DAILY_CAP` in env does
nothing — the cron URLs hardcode the caps via `?cap=`. To ramp, edit
vercel.json.
```

**Quality gate checks (all must pass before Gmail send):** ≤110 words,
contains subscribe link, contains `"no thanks"` unsub line, contains
`Founder & Host, FundOpsHQ` signature, no em/en dashes, no `"I write"`
phrasing, greeting present and not empty (`Hi ,`), subject prefix
`Covered `, subject suffix ` today`.

### Hard blocks applied in `lib/outreach/candidates.ts`

- **A — Mega-fund GPs:** Blackstone, KKR, Apollo Global Management, Carlyle,
  TPG Capital, Bain Capital, Advent, Warburg Pincus, CVC, EQT, Permira,
  Cinven, Brookfield, Ares Management, Oaktree, Thoma Bravo, Vista Equity,
  Silver Lake, Hellman & Friedman, Adams Street ($65B AUM), Goldman Sachs
  AM, Morgan Stanley IM. **Allowlisted** (NOT blocked): HarbourVest,
  Hamilton Lane, StepStone, Pantheon, Wilshire, Cambridge Associates, etc.
- **B — Public pensions / sovereign / endowments:** multi-word phrases only
  (`retirement system`, `teachers retirement`, `sovereign wealth`,
  `employees retirement`, etc.) — bare 3-4 char abbreviations like `pers`,
  `sers`, `swf`, `cpp` removed after causing false positives on Pershing
  Square and similar.
- **C — Geography:** candidate must have `North America` OR `Global` in
  `extracted_data.geography`. Empty/missing geography → drop.
- **D — Media outlets:** Bloomberg, Reuters, WSJ, Financial Times,
  PitchBook, etc. No bare 2-char patterns (`ft` was collision-prone).
- **E — Fund admin service providers:** Apex, Alter Domus, Citco, Gen II,
  SS&C, SEI, Mercer, AON, Intertrust, Vistra. Danny's rule: "no other
  service providers."
- **F — Bad-news events:** `close_type='wind_down'`, `event_type` containing
  `bankruptcy`/`insolvency`/`liquidation`, `article_type='regulatory_action'`,
  AND a title+tldr keyword scan for `shutter`, `wind-down`, `liquidate`,
  `dissolve`, `collapse`, `bankrupt`, `insolvent`, `fraud`, `scandal`,
  `indicted`, `enforcement action`. Critical — the classifier's structured
  fields missed Alua being shuttered on 2026-04-14, only the text scan
  caught it.

### Reply/bounce monitor (`app/api/pipeline/outreach-monitor`)

```
Cron: 15 * * * * (hourly)
  1. Gmail query: newer_than:2d in:inbox (max 100 msgs)
  2. For each message: match sender against cold_outreach_sent (30d lookback)
     - Opt-out phrase (regex) → status='opted_out' (permanent)
     - Any other reply     → status='replied' (manual triage)
  3. Gmail query: from:(mailer-daemon OR postmaster) newer_than:2d
  4. For each bounce: parse recipient → status='bounced' (permanent)
```

Opt-out phrases: `no thanks`, `unsubscribe`, `remove me`, `take me off`,
`stop emailing`, `not interested`, `please remove/stop/unsubscribe`,
`opt out`, `do not email/contact`.

### lib/outreach/ module layout

```
lib/outreach/
├── types.ts              # Article, Candidate, Contact, OutreachRunResult, etc.
├── candidates.ts         # buildCandidates() + hard blocks A-F + shortenFirmName()
├── dedup.ts              # firmLevelDedup() + emailLevelDedup() + countTodaysRuns()
├── apollo-client.ts      # Apollo REST (search + match), branch A/B, verified-only
├── anthropic-client.ts   # Haiku 4.5 hook generation via raw fetch
├── template.ts           # composeEmail() + qualityGate() + wordCount()
├── gmail-client.ts       # OAuth2 refresh + MIME + base64url + send/list/get
└── monitor.ts            # detectOptOut(), isBounceMessage(), parseBouncedRecipient()
```

All external APIs use raw `fetch` (no SDKs) to match the existing Resend
and Anthropic patterns. Zero new npm dependencies.

### Required env vars (all in Vercel, applied to Production)

```
GMAIL_OAUTH_CLIENT_ID       — from Google Cloud Console OAuth 2.0 client
GMAIL_OAUTH_CLIENT_SECRET   — same
GMAIL_OAUTH_REFRESH_TOKEN   — generated via OAuth Playground. Lifetime depends on
                              the GCP consent-screen status: TESTING = expires in
                              7 days (this is what killed the pipeline 2026-04-21);
                              PRODUCTION = indefinite while used. Keep it Production.
GMAIL_SENDER_EMAIL          — defaults to dbloomstine@gmail.com
OUTREACH_APOLLO_API_KEY     — Apollo.io REST API key (separate from other
                              Apollo keys Danny may use elsewhere)
OUTREACH_DAILY_CAP          — numeric fallback (default 10) when the cron URL
                              doesn't pass ?cap=. Production URLs hardcode caps
                              (see vercel.json). Change there to ramp volume.
OUTREACH_ENABLED            — string 'true' to activate; any other value = off
ANTHROPIC_API_KEY           — reused from news-process
CRON_SECRET + PIPELINE_API_KEY — reused auth via lib/pipeline/auth.ts
```

### Gmail OAuth setup (one-time, already done 2026-04-14)

Google Cloud project `fundopshq-outreach` → Gmail API enabled → OAuth
consent screen **published to Production** (it was in Testing mode until
2026-09-06, and Testing-mode refresh tokens expire after 7 days — that
is exactly why the pipeline died on 2026-04-21, seven days after the
token was minted) → Web application OAuth client → redirect URI
`https://developers.google.com/oauthplayground` → refresh token generated
via the Playground with ALL THREE scopes requested in one authorization:
`gmail.send`, `gmail.readonly`, `gmail.modify`. In the Playground, tick
"Use your own OAuth credentials" first — otherwise the Playground revokes
the token within 24h. Production-status tokens last indefinitely while
used. If one ever dies, the pipeline now self-alerts via Resend (it can't
alert via Gmail when Gmail is the thing that broke) and spends no Apollo
credits; re-run the Playground flow (~2 min) and update the env var.

### Kill switch (set from phone in <60s)

Vercel dashboard → project → Settings → Environment Variables →
`OUTREACH_ENABLED` → edit → set to `false` → save. Next cron fire (up
to ~1 hour away for the monitor, up to 24h for outreach-send) exits
immediately with `{"skipped":"outreach_disabled"}`. No emails, no
Apollo credits, no Supabase writes.

### How the skill and Path B coexist

The `~/.claude/skills/grow-newsletter/SKILL.md` Claude skill and this
server-side pipeline implement the same logic, but:

- **Skill** = manual invocation via Claude Code, draft-only, Danny reviews
  each draft in Gmail before sending. Used for ad-hoc runs and when Danny
  wants to intervene.
- **Path B** = automated via Vercel cron, sends directly. No human review
  per-email (only the daily summary after the fact).

**The hard-block lists should stay in sync between the two.** If you edit
`lib/outreach/candidates.ts`, reflect the change in the skill's Step 3
instructions too. The skill's current version is slightly out of sync
with the server-side rules — needs a patch before the next manual run.

## Data Layer

**Supabase project** `reolugphmfmlwelnnvet` — 6 tables are in use after the intel platform was deleted (2026-04-09) and the cold outreach table was added (2026-04-14):

| Table                    | Purpose                                                                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `news_items`             | Articles from all ingested RSS feeds (the live content pool)                                                                              |
| `feed_sources`           | RSS feed configs and ingest tier — the ONLY feed registry (the old `lib/news/feed-registry.ts` code copy was dead and deleted 2026-08-15) |
| `newsletter_editions`    | Sent newsletter records                                                                                                                   |
| `newsletter_subscribers` | Single opt-in email list (flipped from double opt-in 2026-04-11)                                                                          |
| `feedback`               | Inline feedback submissions                                                                                                               |
| `cold_outreach_sent`     | Append-only log of outreach drafts + sends (Path B + grow-newsletter)                                                                     |
| `event_sources`          | Events-board source registry (added 2026-08-29) — 60+ calendars, tiered; seeded from workspace docs/EVENTS_SOURCES.md                     |
| `industry_events`        | Curated events for /events (added 2026-08-29) — every row date-verified at the source; refreshed by the scout-events skill                |
| `league_overrides`       | Hand corrections to a league-table row (2026-10-01): `hide` it, or `set` its firm / fund / size / stage. Keyed by any report in the story |
| `sponsor_bookings`       | One row per sponsor run (2026-10-02), read by the daily send and by the site. See "Sponsors" below                                        |
| `site_cache`             | Turnstile + last good copy for the shared datasets (2026-10-02). See "Speed, caching and the database" below. Safe to truncate           |
| `social_posts`           | One row per social post per channel (2026-10-03), written by the nightly job in the `fundopshq-social` repo. See "Social desk" below      |
| `social_metrics`         | Readings of a social post's numbers over time (2026-10-03): a jsonb bag per reading, because each network reports different things        |

Migrations are recorded in `supabase/migrations/`. Read "Speed, caching and the database" below before adding any query to a page.

Events-domain naming is deliberately distinct from news: `event_kind`/`event_format` on `industry_events`, NEVER `event_type` — that column on `news_items` (and `eventType` in the news UI) means "kind of news story". Inserts to `industry_events` go through `scripts/events/load-events.mjs` (validated loader — enforces enums, date rules, URL dedup, and city-alias normalization), not hand-written SQL.

Events board v3 (2026-08-29): `slug` (unique, loader-generated — must never collide with the reserved collection slugs), `click_count` (via `increment_event_click()` RPC only), `expected_attendance`, and the `event_submissions` table (public queue; ALL fields untrusted — scout-events verifies at the source before promoting). `scripts/events/check-links.mjs` = weekly link-health report. The Circuit weekly digest ships dark behind `CIRCUIT_ENABLED`.

Events board v2 (2026-08-29): `industry_events.topics text[]` adds the functional-area dimension (compliance_regulatory, fund_finance, accounting_tax, technology_ai, fundraising_ir, legal, esg, talent — see `EVENT_TOPIC_LABELS`). The board's core use case is "traveling to a city / picking a topic, next 1–2 weeks": the horizon control starts at 2w, and the City filter pills are DYNAMIC (top cities by upcoming-event count from the facets — nothing hardcoded). City matching is exact-string, so keep the loader's CITY_MAP and the DB canonical ("New York", "Washington DC", "London"). `/events` renders schema.org Event JSON-LD server-side for the next ~25 events with `revalidate = 3600` — inserts show in the board instantly but in the structured data within the hour. A weekly scheduled task (`scout-events-weekly`, Mondays 7am, in ~/.claude/scheduled-tasks/) runs the scout-events skill unattended.

`news_items` still carries orphan FK columns (`cluster_id`, `gp_id`, `fund_id`, `firm_id`, `embedding`) from the old architecture. Nothing populates them, so they're always null. (The `story_cluster_id` column and its dormant Layer-1 clustering path were dropped 2026-04-18 — all feed grouping now runs through `isSameStory` in `lib/news/story-dedup.ts`.)

## `lib/` layout

```
lib/
├── news/            # RSS ingestion, classification, firm logo resolution
│   ├── story-dedup.ts   # Shared story-clustering — isSameStory, normalizeFirmName,
│   │                    # fundSizesMatch, titleJaccard. Used by both the newsletter
│   │                    # assembly and the feed UI grouping. Single source of truth
│   │                    # for "are these two articles the same underlying story?".
│   ├── rss-client.ts    # Entity-decoding stripHtml — decodeEntities is exported
│   │                    # for the backfill script and handles named + numeric refs.
│   ├── stories.ts       # buildStories: reports → stories (the unit the site and the email share)
│   ├── league.ts        # buildLeagueReport: stories → fund closes. What counts, what merges, which figure
│   ├── league-data.ts   # …fetched and cached (loadLeagueReport). scripts/league-audit.ts audits it
│   ├── chart-math.ts    # Bars for the fundraising chart. Browser-safe: the chart computes its views client-side
│   ├── firms.ts         # firmIndex: the directory and "firms in the news", from stories
│   ├── firm-data.ts     # getFirm(slug), searchFirms — the database side of firm pages
│   └── firm-lookup.ts   # How a firm's address becomes a database lookup. Read its header before touching
├── cache/           # build-once.ts: one build at a time, site-wide, for the shared datasets
├── events/          # Events board — types, display constants (EVENT_KIND_LABELS etc.),
│                    # queryEventFeed. Mirrors lib/news/api.ts but looks FORWARD in time
│                    # (start_date >= today) instead of back.
├── newsletter/      # Email template, Resend sender, query-articles, top-stories (what leads an edition),
│                    # recap (Monday's largest closes), sponsors (types + the /newsletter/sample placeholder)
├── sponsor/         # bookings.ts (who the sponsor is on a date), stats.ts (the /sponsor page's numbers),
│                    # reader-firms.ts (which firms read it)
├── outreach/        # Path B cold outreach pipeline — candidates, dedup, Apollo,
│                    # Anthropic hook generator, Gmail OAuth/MIME/send, monitor.
│                    # See the "Cold Outreach Pipeline" section above.
├── pipeline/        # Shared orchestration utilities for the cron routes
├── supabase/        # Supabase client singleton
├── utils/           # Misc helpers (content-slug, content-clean, etc.)
├── youtube.ts       # YouTube API wrapper — fetches latest videos for LiveShowFeature
└── utils.ts         # cn() + friends
```

Anything you read about `lib/content/`, `lib/hooks/`, `lib/seo/`, `lib/exports/`, `lib/newsletters.ts`, `lib/blog.ts` is stale — those were deleted in the 2026-04-10 cleanup.

## Components worth knowing

```
components/
├── site-header.tsx          # Masthead (scrolls away) + section TAB STRIP (sticky). Tabs come from lib/news/sections.ts
├── site-footer.tsx          # Navy footer — nameplate, section links by type and asset class
├── story/                   # Headline (bold entities), Coverage, LeadStory/TopStory/HeadlineRow/LatestRow, ShareBar
├── home/
│   ├── hero-subscribe.tsx   # One-line subscribe band under the tabs (homepage only)
│   ├── Rail.tsx             # LatestRail, LargestCloses, EventsRail, SectionBlock
│   ├── InTheNews.tsx        # "Firms in the news" line under the subscribe band
│   └── live-show-feature.tsx # "Channel 02" broadcast section with latest video
├── charts/
│   └── FundraisingChart.tsx # The rail chart (client). Hover explores, click pins — see below
├── sponsor/
│   └── SponsorSlot.tsx      # SponsorStrip (above the stories, every news page) + SponsorCard (rail, booked only)
├── events/
│   ├── EventsBoard.tsx      # /events board (client component — clones NewsFeed's
│   │                        # URL-sync/filter idiom; filters collapsed by default)
│   └── EventRow.tsx         # Single event row — desktop grid + mobile card, links out
├── news/
│   ├── NewsFeed.tsx         # Main news feed (client component, filters, clusters)
│   ├── ArticleRow.tsx       # Single row in the feed
│   ├── ClusterExpander.tsx  # "Also covering" multi-outlet cluster
│   ├── SubscribeWidget.tsx  # Inline subscribe CTA inside the feed
│   └── FeedbackButton.tsx   # Inline feedback button
├── layout/
│   └── page-hero.tsx        # Shared hero used by /privacy and /terms only
├── ui/                      # shadcn/ui primitives — use these, don't roll your own
├── logo.tsx                 # FundOpsHQ wordmark
├── video-lightbox.tsx       # Modal YouTube player
├── back-to-top.tsx
└── theme-provider.tsx
```

## Fund Watch data pipeline (scripts, not a page)

`scripts/fund-watch/` + `.github/workflows/fund-watch-update.yml` run on a GitHub Actions cron and refresh `public/data/fund-directory.json`. **Nothing on the live site reads this file** — the old `/fund-watch` page was deleted. It's kept alive because Danny uses it for show prep and LinkedIn post generation. Don't touch it unless that workflow changes.

## Key Patterns

- **Dark mode only.** Hardcoded `className="dark"` on the root `<html>` in `app/layout.tsx`. Light theme happens inside individual sections, not via the theme switcher.
- **Fonts:** Fraunces (editorial display, variable optical sizing), Inter (body), JetBrains Mono (eyebrows, timestamps, ticker numerals). DM Sans is loaded for backwards compat but prefer the other three.
- **Colors:** OKLCH for brand colors; semantic Tailwind tokens (`foreground`, `muted-foreground`, `border`, `card`, etc.) for everything else.
- **Mono eyebrows everywhere.** The editorial aesthetic leans on monospace uppercase tracking — 10-11px, `tracking-[0.18em]` to `tracking-[0.22em]`. Match existing patterns when adding new sections.
- **No React testing beyond a single logo snapshot.** Don't assume a full test harness exists.

## Deployment

- Vercel project: `v0-educational-website-design-zo2m`
- Canonical domain: `https://fundopshq.com` (not `fundops.com`)
- Syncs with v0.app — edits made in v0.app land here automatically, so expect occasional unfamiliar commits from the v0 bot

## Speed, caching and the database (2026-10-02 — read before adding a query to a page)

**The database is very small** (Supabase Micro: two shared cores, 224 MB of buffers, an 8 s statement limit) and everything shares it: the site, the hourly pipeline, the newsletter send. A scan of `news_items` that takes 70 ms on a quiet instance takes 8–19 s when anything else is running. On 2026-10-02 it stopped answering twice (03:40 and 19:50 UTC), for about twelve minutes each time; requests queued for up to five minutes. Both times a crawler was walking firm and story pages — hundreds of pages in ten minutes, several times a night, which the database handles — at the moment the league cache went stale. Two causes, both fixed, both easy to reintroduce:

1. **Full-table scans in the pipeline.** The ingest's headline check and three housekeeping statements in the classifier had no index and read the whole table — 745 million rows since February, most of the database's CPU. `supabase/migrations/20261002_pipeline_hot_query_indexes.sql` has the indexes. **A new pipeline query needs an index**; check with `explain (analyze, buffers)` — a query touching ~11,000 buffers is reading the table. `select … from extensions.pg_stat_statements order by total_exec_time desc` shows what the database actually spends its time on.
2. **Cache stampedes.** `unstable_cache` has no turnstile: when an entry goes stale, every request that notices rebuilds it. A crawler opened fifty firm pages in a minute as the league went stale; fifty league builds (4 s each) ran at once. `lib/cache/build-once.ts` is the turnstile: one server wins a claim in `site_cache`, builds and stores the result; the rest take the stored copy; a failed build is not retried until the claim lapses. **Wrap any expensive shared build in `buildOnce`** (stories, archive and league are).

Rules that follow:

- **Pages are static wherever they can be** — `/`, `/news/[section]`, `/news/[section]/[facet]`, `/story/[id]`, `/firm/[slug]`, `/events`, `/events/[slug]`, `/sponsor`. A page with a dynamic segment needs `generateStaticParams` (returning `[]` is enough) to be cached at all; without it, it renders on every request, and most requests are crawlers (1,345 story pages in ten minutes). Reading `searchParams` also forces a render per request: put a filter in the path, not the query string. `next build` prints the table — check a new page is `○` or `●`, not `ƒ`.
- **Links to story, firm and event pages say `prefetch={false}`.** A `<Link>` to a static page is prefetched when it scrolls into view, and prefetching a page that is built on demand builds it: one visit to the firm directory would build five hundred firm pages. The header's tabs keep prefetching (thirteen pages built at deploy — that is what makes a tab open instantly). `lib/news/__tests__/links.test.ts` enforces it.
- **The sitemap's dates are honest** (`app/sitemap.ts`): a firm page is dated by its newest story or close, an event by its last edit, a section by its newest story; pages that do not change carry no date. It used to stamp all 1,300 URLs "modified now" every ten minutes, and crawlers re-fetched them all, several times a night. Never write `lastModified: new Date()`.
- **`/news`, `/league-tables` and `/firms` read a query string** (search, filters, paging) and are rendered on request; `next.config.mjs` lets Vercel's edge keep each URL for five minutes (`Vercel-CDN-Cache-Control`).
- **The loaders throw; they do not return empty.** `loadStories`, `loadArchive`, `loadLeagueReport` fall back to the last copy the server has and otherwise throw. A cached page that renders empty on a database failure is cached empty; a page that throws is not cached, and the last good copy stays up. Do not wrap them in a catch that returns `[]`.
- **No retries against the database on a page's path.** A lookup fails because the database is overloaded; a retry is one more query in its queue.
- **Every database request has a 15 s deadline** (`lib/supabase/client.ts`), so a page fails instead of hanging for minutes.
- **Lookups on a page's path must be index-backed and touch few rows**: `idx_news_items_fund_events` (the league), the trigram indexes on `title`, `tldr` and `extracted_data->>'firm_name'` (search, firm pages). `order by … limit n` invites the planner to walk the date index for the whole year when it expects many matches and finds few.
- **Events** are read through `getEventFeed` (kept five minutes). `/events` is sent with its first hundred events in the HTML; the client board fetches only when a filter is set, gives up after 12 s and offers a retry.
- **A dev server talks to the same database.** Its cache starts cold, so a loop over many pages from `next dev` rebuilds the shared datasets on top of whatever production is doing. Test a handful, or against `next build && next start`.

## League tables, the chart and firm pages (2026-10)

**One definition of a fund close.** `lib/news/league.ts` turns stories into closes; the league tables, the rail chart, "Largest closes" and Monday's recap in the email all read it, so a number is the same wherever it appears. A close needs a named manager, a stated size and a headline that says the fund closed — targets, "nears", continuation vehicles, CLOs, mandates and evergreen vehicles are news, not closes. Reports of one close are merged (`sameClose`); when they disagree on the size the table takes the **lower** figure and marks the row † (`altSizeUsdM`) — the higher is usually leverage or sister vehicles added in. ≈ marks a size converted from another currency. A wrong row is fixed with a `league_overrides` row, not with code. After any change to the classifier, the story rules or `league.ts`, run `npx tsx scripts/league-audit.ts` (`--pairs` lists same-manager rows that might be one fund).

**The chart (`components/charts/FundraisingChart.tsx`).** The closes of the last 92 days are sent to the page and the views (market, weeks, size, funds, firms, region) are computed in the browser by `lib/news/chart-math.ts`. Interaction model, on Danny's instruction (2026-10-02 — "should react and or be active on hover. should not require a click"): **hover explores, click sets.** Pointing at a bar opens a pop-out listing the funds in it, each linked to its reports and its firm; pointing at a view tab switches the view after a short dwell; clicking a bar pins its pop-out. Period, measure and the table view are click-only: they sit on the pointer's path to the bars. On a touch screen the pinned card opens inline. Do not gate a value behind hover — every bar prints its figure.

**Firm pages.** There is no firm table. A firm is a key (`entityKey`: "Ares Management" → `ares`, "H.I.G. Capital" → `hig`, "A&O Shearman" → `ao shearman`) and its page address is that key. `lib/news/firm-lookup.ts` turns the key back into a database lookup that finds every spelling — and is written so the trigram index can serve it. That constraint is the whole design; the file's comments say what breaks it (an open-ended character class, or a non-ASCII character inside one). `lib/news/__tests__/firm-lookup.test.ts` holds the names that were dead links before it. `getFirm` returns null for "no such firm" and **throws** when the lookup fails, so a database hiccup is never cached as a 404. The directory's search (`searchFilter`) reads a two-letter query as the start of a word or as initials — "containing mg" cannot be indexed and took nine seconds.

## Sponsors: one at a time, booked by a row (2026-10-02)

A sponsor is a row in `sponsor_bookings` with a start and an end date. The morning's send asks for the sponsor in force on the edition's date (`sponsorForEdition`); the site asks for the one in force today (`getSiteSponsorState`, cached ten minutes). Nothing is deployed to put a sponsor up and nothing has to be remembered to take one down. The table refuses two booked runs that share a day.

- **To book:** insert a row — `name`, `blurb` (≤ ~60 words), `cta_url` (https), optional `cta_text`, `tagline` (one line for the site strip), `logo_url` + `logo_width` (hosted PNG/JPG/GIF), `starts_on`, `ends_on`. The site shows it within ten minutes; the next edition carries it top and bottom.
- **To pull one:** `status = 'paused'` (or `'cancelled'`).
- **With nobody booked** the email and the site show the house notice, "Your firm here" — a slim strip under the masthead / above the stories, and a framed card at the foot of the email. Its reader figure is counted, never typed.
- **Never insert a test row in production**: it is live on the site within ten minutes and in the next send. Test with `sponsorOn()` in a unit test, or `/newsletter/sample`.
- The site strip sits directly above the stories on `/`, `/news`, `/news/[section]`, `/story/[id]`, `/league-tables`, `/firms`, `/firm/[slug]` and `/events` — in view when the page loads, on Danny's instruction.

## Social desk: posts made from the news engine (2026-10-03)

A nightly job turns the day's stories, the league table and the events board into TikTok-shaped posts (slides and short videos) and schedules them through Buffer to TikTok, Instagram and LinkedIn. **The job does not live here.** It is the private `fundopshq-social` repository (a copy of the working folder is at `~/fundopshq-workspace/social/`), run on a GitHub schedule, because rendering needs Chrome and ffmpeg. This site gives it four routes and nothing else:

- `GET /api/social/export`: stories (the ten-day window), league closes, events for thirty days, and the job's own past posts. It reads through the same caches the pages use (`loadStories`, `loadLeagueReport`, `getEventFeed`), so a call costs the database one small query.
- `POST /api/social/upload`: one-time upload slots. The job PUTs each finished file straight to storage; the service key never leaves the site. Paths are checked by `isUploadPath` (`lib/social/records.ts`): a date folder, a post folder, a `.jpg`/`.mp4`/`.pdf`.
- `GET|POST /api/social/posts`: the record. `posts` writes whole rows (replacing on edition + slug + channel), `updates` changes a row by id without touching what it says, `metrics` adds a reading.
- `POST /api/social/cleanup` (2026-10-05): removes the day folders of the `social` bucket that are more than a week old (`{ keepDays }`, never fewer than three; `oldDateFolders` in `lib/social/records.ts`), four days per call. The job calls it once a day. Danny approved deleting old media on 2026-10-05; since then the job posts about thirteen times a day, which is 30 to 40 MB of files a day. A row's `media_urls` outlive its files.

Rules:

- **Auth is `Authorization: Bearer $SOCIAL_SECRET`, a secret of its own** (`lib/social/auth.ts`). Not `CRON_SECRET`: that one also opens the routes that send email, and it should not sit in a second repository. Until `SOCIAL_SECRET` is set in Vercel the routes answer 503.
- The `social` storage bucket is **public** (Buffer fetches each file from its public address when the post goes out, which can be a day after upload) and takes only JPEG, MP4 and PDF. Nothing in it is needed once its post has gone out.
- Nothing on the public site reads `social_posts` or `social_metrics`. If a page ever shows them, read "Speed, caching and the database" first.
- Whether a story is fit to post, and the words on a post, are decided in the other repository. What counts as a story is still decided here (`lib/newsletter/`, `lib/news/stories.ts`): the job posts what the site shows.

## FundOps Daily email template — `lib/newsletter/email-template.ts`

One file renders the entire morning brief. System fonts only — no `@font-face`, no Google Fonts, no external stylesheets. All brand colors, typography stacks, and reusable chrome live as `const` declarations at the top of the file; mirror the palette from `app/brand/page.tsx` rather than inventing new hex codes.

The full editorial redesign landed on 2026-04-11 and matches the fundopshq.com brand treatment: navy masthead with a newspaper eyebrow strip, cream editorial body, Georgia display serif, monospace eyebrows, amber italic accent on "Daily" and "top stories." Read the file's own top comment for the aesthetic intent.

### Size budget — Gmail clipping at ~102 KB

Gmail clips any email whose HTML body exceeds **~102 KB** and shows a `[Message clipped] View entire message` link that hides the tail. A full 40-story edition currently delivers around **57 KB**, 65 KB on a Monday with the weekly recap — plenty of headroom, but easy to blow if you're careless.

The single biggest thing keeping us under the ceiling is the `STYLE_BLOCK` const at the top of `email-template.ts`. It defines ~35 utility classes (`.fops-serif`, `.fops-ink`, `.fops-title`, `.fops-row`, `.fops-badge` + per-type variants, `.fops-c-pe` + per-category variants, `.fops-cta-outline`, `.fops-cta-solid`, etc.) that every story row, category head, and sponsor card references via `class="..."`. Before that refactor the same template was **139 KB** and got clipped in Gmail. **Do not** revert to "every style attribute inline on every element" — the clipping will come back. Keep repeated styles in `STYLE_BLOCK`.

The final output also runs through `collapseTemplateWhitespace()`, which strips per-line indentation (another ~15% of delivered bytes) and removes the template's own comments — HTML and CSS — so notes written for whoever edits the file are not sent to readers. Outlook's conditional block (`<!--[if mso]>`) is kept. Because lines are joined with nothing between them, a space that must survive a line break has to be `&nbsp;`.

### The shape of an edition (2026-10-02)

Masthead → sponsor (or the house strip) → **top stories** → sections → on Mondays, last week's largest closes → the week's events → sponsor (or the house card) → share → footer.

- **Top stories** (`lib/newsletter/top-stories.ts`): up to five, chosen across sections by the site's own `storyWeight`, one per firm, with a brake so they are not five fund closes. Weight decides *which* stories lead; among the raises that do (and among the deals) the larger runs first, so the top block opens on the firm the subject line names first. Each carries a kicker (section · size · stage). They are *removed* from their sections — every story runs once. Fewer than 12 stories and there is no top block.
- **Sections** run in the order of the site's tabs: the asset classes, then Deals, People Moves, LP Commitments, Regulation, Service Providers.
- **Preview text** (`buildPreheader`) is the lead headline and the second: what happened. The subject line already says who.
- **Monday recap** (`lib/newsletter/recap.ts`): the six largest closes of the past week, from the league table, each linked to its story page. It is an extra — if the league cannot be built in 25 s the edition goes without it.
- Rows are headlines only (Danny, 2026-08-30). Do not add summaries, source lines or logos back.

### The anchor color gotcha — every `<a>` needs inline `color`

**Every `<a>` tag in the template has both a class AND inline `color` + `text-decoration:none`.** This is not redundant — it's mandatory.

Gmail's user-agent stylesheet has `a:link { color: -webkit-link; }` at specificity (0,1,1). A plain class selector like `.fops-title { color: #1E3A5F; }` has specificity (0,1,0). The pseudo-class wins the cascade, so anchors render in Gmail's default bright blue regardless of what the class says — and `!important` is unreliable inside `<style>` blocks in Gmail Desktop specifically. The only fix that works everywhere is inlining the color on the anchor element itself.

If you see story titles or CTA labels rendering bright blue in a test send, this is the cause. Check that every `<a>` in the template has an inline `style="color:..."` declaration. Same rule applies to `background-color` on filled CTA buttons — Gmail Desktop occasionally strips the `background` shorthand from classes, so `.fops-cta-solid` uses `background-color` (not shorthand) in the class _and_ inlines it on the anchor.

### Dark-mode opt-out has three layers — keep all three

Gmail iOS/Android auto-invert email colors in dark mode, which turned our navy masthead into light blue on early test sends. Three defenses are in place and all three must stay:

1. `<meta name="color-scheme" content="only light">` + `<meta name="supported-color-schemes" content="only light">` in `<head>` — hits Apple Mail and new Outlook.
2. An `@media (prefers-color-scheme: dark)` block inside `STYLE_BLOCK` that re-pins `.fops-bg-navy` / `.fops-bg-cream` / `.fops-ink` / `.fops-cream` / `.fops-amber` with `!important` — hits clients that respect the media query.
3. Gmail-specific `u + .body` and Outlook-specific `[data-ogsc]` selectors that re-pin the same backgrounds — belt-and-suspenders layer for Gmail iOS where the media query doesn't fire reliably.

Removing any one of these will appear fine in some clients and break in others. Leave all three.

### Sponsor block

Who the sponsor is comes from `sponsor_bookings` (see "Sponsors" above), not from this code. The template is handed a `SponsorSlate` — a label and a list that holds one sponsor or none (it is a list for history's sake: an earlier design stacked up to five co-sponsors). One sponsor renders as a framed "PRESENTED BY" card under the masthead and again at the foot, where its link is a button. An empty slate renders the house notice. `SAMPLE_SPONSOR_SLATE` in `lib/newsletter/sponsors.ts` is the placeholder `/newsletter/sample` shows a prospect; it is never used in a send. A sponsor's copy is escaped: it is text, never markup.

### Sponsor logo assets — always hosted PNG, never base64, never SVG

Logos live in `public/sponsors/` and are served from `https://fundopshq.com/sponsors/*`; that URL goes in the booking's `logo_url`. Three non-negotiables:

1. **PNG only, no SVG.** Gmail doesn't render SVG reliably. Most sponsor assets come in as SVG — render them to PNG with headless Chrome:
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
     --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
     --default-background-color=00000000 \
     --window-size=WIDTH,HEIGHT \
     --screenshot=/tmp/out.png \
     "file://$(pwd)/public/brand/source.svg"
   ```
   The `00000000` flag gives a transparent background so the PNG drops cleanly onto the cream sponsor card.
2. **Hosted absolute URLs, not base64.** Gmail strips `data:image/*;base64` from `<img src>`. Every sponsor logo used in the live send must reference the hosted copy on fundopshq.com. The `preview-newsletter.ts` script base64-inlines for offline mockups, but that's preview-only.
3. **Transparent source PNGs** preferred over PNGs with a baked-in cream or white background. Transparent blends perfectly into the sponsor card; baked-in backgrounds show a visible rectangle at the edges.

### Preview and test scripts

Two utilities for iterating without pinging real subscribers:

```bash
# Local HTML preview — renders to /tmp, opens in default browser.
# Inlines firm favicons AND sponsor logos as base64 data URIs so the
# saved file is self-contained. Forward the HTML to a prospect and
# double-click — everything renders locally with no network.
SAMPLE_SLATE=1 npx tsx --env-file=.env.local scripts/preview-newsletter.ts

# Live test send via Resend to a single recipient. Uses HOSTED logo
# URLs (not base64) because Gmail strips data: URIs, and exercises
# the real email-client rendering path.
TO=you@example.com npx tsx --env-file=.env.local scripts/send-test-email.ts
```

Use the preview script for visual tweaks (offline-safe HTML, fast iteration, forwardable to prospects as mockups). Use the test-send script for end-to-end validation inside an actual Gmail/Apple Mail inbox — it's the only way to catch dark-mode issues, anchor-color cascade issues, or Gmail clipping.

### What the classifier's answers are checked for — `lib/news/classify-articles.ts`

The classifier reads up to fifteen articles in one call, so one article's answer can carry something that belongs to another. Two checks stand between the model and the row:

1. **The answer is about the right article** (`classification-align.ts`, 2026-10-01). Answers are paired with articles by an echoed id, and a name in the answer must appear in that article's text. Before this, one skipped answer shifted every later one in the batch.
2. **Its money is the article's own** (`amount-guard.ts`, 2026-10-04). Every sum the answer states (the size, and each sum in the summary) must be a figure the article gives: the same sum, a plausible conversion, a point inside a stated range, or plain arithmetic on what it says ("half its $2bn target"). If one is not, the article is classified again **alone** and only what was wrong is replaced: the summary, or the size (which becomes null if the article gives none). Type, relevance and names stay the batch's, because an article read alone loses the context that says what kind of story it is. The check fails open: if it cannot be made, the answer is stored as it came.

Why the second exists: "EQT Agreed to Sell Korea's Acuon Group…" (terms not disclosed) was stored at $2.92B, the price of the Vicinity Energy deal classified beside it. Replayed, the same batch borrows the same figure most times; telling the model not to (a prompt rule was tried) made no measurable difference, so the prompt is unchanged. Measured over the rows since 2026-06-27: about 1% of rows that state money state a sum their article does not give. Nearly all are true facts from another outlet's report of the same story (a target, usually); a wrong fact from a different story is rare (two found).

- `npx tsx scripts/amount-audit.ts --save-pool pool.json` reads the rows once (read-only) and lists what fails the check, sorted into another story's sum, the same story from another outlet, and unexplained; `--pool pool.json` re-runs offline.
- `npx tsx scripts/amount-replay.ts --pool pool.json --row <id>` sends a past call through the classifier as it is now, against a pretend database, and prints was/now for each article. About four cents a batch. Use it before changing the prompt or either check.
- The reader in `amount-guard.ts` is deliberately generous about how a figure may be written ("$249mln", "US$30 bil", "Rs. 1,200 crores", "£345.6 deal", "Sh64.5bn", "$4-5 billion"). A figure the article states in a form the reader misses costs one extra call and can drop a true size, so a new misread belongs in `amount-guard.test.ts`.

### Roundups: several stories under one headline — `isRoundup` in `lib/newsletter/story-links.ts`

Some rows are not one story: PE Hub's daily wire ("A backs X; B to acquire Y"), AltAssets' "Deal Roundup:", and columns under their own name ("Field Notes: A; B", "Loan Note:", "Term Sheet:", "Blueprint: A, B and more"). The classifier writes **one** record for such a row, and the record can pair one item's firm and size with another item's fund. On 2026-10-05 a Field Notes column led the front page as "Farm Credit Canada · $707M · Launch" with a fund name from an item its headline did not carry.

- A roundup is known three ways: its column label (`COLUMN_LABEL`, a list), its outlet (`WIRE_OUTLETS`: a PE Hub headline with a semicolon is always the wire), or a later clause that opens with a named party the first clause never mentions. **A semicolon alone is not the test** ("TPG Gets $10 Billion for Climate PE Fund; to Close for New Cash" is one story), and neither is a lead-in or a closing "and more". Pass the outlet: use `isRoundupArticle(article)`.
- A roundup keeps its headline and summary and nothing else: no size, fund or stage (`buildStories`), never `leadEligible`, never the lead, a top story, a firm page, a league row or a name in the subject line. In the email it runs last in its section. On the site it is a story at all only when none of its items has a row of its own **that is shown**; the email drops it when any row of the day tells one of its items.
- `npx tsx scripts/roundup-audit.ts --save-pool pool.json` (read-only; `--pool` re-runs offline) lists lead-ins and outlets that look like columns the list does not know, and every semicolon headline still read as one story. Read them by eye before adding a label; `scripts/replay-editions.ts` shows what a change does to past editions.
- Still read as one story: an unlabelled two-item headline from an outlet that is not on the list (one in a hundred days: AltAssets, "Apollo, KKR seal €3bn Bayer…; Aurelius agrees $323m Hain unit carve-out").

### Newsletter content pipeline — `lib/newsletter/query-articles.ts`

(This is how stories are _selected_; the template section above is how they're _rendered_.) Stages in order:

1. Pull last 26h of classified articles whose `article_type` is in the newsletter allowlist.
2. Drop govt/NGO program announcements and blocked sources (facebook.com, x.com, etc.).
3. Same-day story dedup via `isSameStory` from `lib/news/story-dedup.ts`. `normalizeFirmName` runs a two-pass strip: legal-form tokens (`llc`, `inc`, `corp`, `ltd`, `lp`, `llp`, `plc`, `the`, `and`) always drop; descriptive tokens (`group`, `partners`, `capital`, `management`, `fund`, `equity`, etc.) drop only when a distinctive token survives. Without the second check, all-descriptive firm names like "Partners Group" collapse to `""` and every story about them evades dedup — that's the root cause of the 2026-04-18 Partners Group quad-clone. `isSameStory` also has a **prefix-firm path** for classifier parent/subsidiary variance (2026-04-18 "BTG Pactual" vs "BTG Pactual TIG" on the $370M LatAm timber fund; "Vesper" vs "Vesper Infrastructure Partners" on the €1bn Next Gen fund): when one normalized firm is a token-prefix of the other, match is allowed only when paired with exact fund name match OR a ≤5% size match — keeps distinct arms like KKR / KKR Credit Advisors separate when their deals coincidentally align. **2026-08-15 hardening** (nine outlets covered one Mirae Asset first close and two variants still shipped): same firm + differing extracted fund names now also merges on same `close_type` + sizes within 20% (currency-conversion drift), title Jaccard ≥ 0.5, or same `close_type` + a shared significant headline number (`titlesShareSignificantNumber` — catches the target-vs-close-amount split, ₹1,800cr corpus vs ₹1,125cr first close). Clustering compares a candidate against **every member** of a cluster, not just its representative — story identity is not transitive through one member.
4. Cross-edition dedup — `storyFingerprints` in `query-articles.ts` emits 1–2 keys per article and matches against the last 3 sent editions. Keys: `firm|fund` when a fund name is known, and `firm|event|size-bucket` (size rounded to $500M bands) always. The size-bucket key is why Adams Street $7.5B won't re-run when one day names "Private Credit III" and the next day doesn't. Two extra memories added 2026-08-15: **title memory** (same firm + title Jaccard ≥ 0.55, or any-firm Jaccard ≥ 0.85, vs the recent-edition window — catches null-size re-reports like the CVC secondaries story that ran 7/31 and 8/1 with identical titles) and **person memory** (an exec move whose `person_name` appeared in the window is suppressed regardless of firm extraction — Jonathan Bock ran 7/27 as "Blackstone" and 7/28 as "BCRED").
5. Quality gate — drops articles with no firm and no fund, or with placeholder tldrs like "amounts not disclosed".
6. Minimum fund size filter ($10M) for fund activity (lowered from $25M in 2026-08).
7. Section split: Service Providers carved out first (law firms, fund admins, auditors, valuation shops, fund finance, prime brokerage — `isServiceProvider` matches the classifier's `service_provider` category, title patterns, or the known-provider list), then LP Commitments (pension/teachers/SERS/PERS patterns), then fund activity grouped by fund category, People Moves / Deals / Regulatory. **There is no Emerging Managers section** — it was removed 2026-08-15 on reader feedback (it was a pure ≤$250M size split that filed Mirae Asset and an LP's RFP under "emerging"); small fund events stay in their asset-class section.
8. `other` is suppressed entirely; every asset class (incl. secondaries) stands as its own section.
9. Cross-section dedup (`deduplicateAcrossSections` in `query-articles.ts`) runs after sectioning with a looser matcher (sizes within 10% + title Jaccard ≥ 0.4) to catch the rare case where classifier variance lands the same story in two different sections — e.g. 2026-04-18 sovereign-funds consortium in both PE and LP Commitments because the classifier extracted one firm as "China Sovereign Fund" and the other as "China State Pension Fund". Keeps the earlier group, merges the later group's source into `alsoCoveredBy`.
10. Floor of 1 — the send will fire if even a single article qualifies. Only a truly-empty result (classification pipeline failure) skips the edition.

The subject line is chosen by `buildSubject` in `lib/newsletter/send-daily.ts` — it picks the biggest GP fund event, preferring `fund_close` > `fund_launch` > `capital_raise`, and excludes LP commitments + exec moves (where extracted "size" is usually firm AUM, not a fund). **AUM safety rail:** `isLikelyAumLeak()` in `lib/newsletter/query-articles.ts` flags any candidate with `fund_size_usd_millions > FUND_SIZE_SANITY_CEILING_MILLIONS` (30000) AND no `fund_name`. Dropped from subject-line selection AND suppressed in the row size display in `email-template.ts` (event-type pills themselves were removed 2026-08-15 on reader feedback; rows are now a dense favicon(s) + firm(s) + size meta line, headline, and one truncated summary line with the source folded in). Single-fund sizes above $30B are extremely rare and are always named; an unnamed $623B is almost always the classifier confusing firm AUM with a fund size (regressions: 2026-04-10 "Ares Management Corp $623B" exec-hire leak in subject; 2026-04-09 "Lemssouguer Fund $20B" career-profile leak; 2026-04-18 "Nest $81B" row pill on a £60bn-AUM private-credit-mandate story).

`scripts/backfill-decode-entities.ts` is a one-shot utility that scans `news_items` for HTML entities left over from older ingests and rewrites titles/descriptions. Run with `--apply`; re-run until changes stabilize at 0 (the offset-based paging shifts as rows leave the filter, so it takes 3–4 passes).

## Before making changes

0. **The Chrome extension is sunset (2026-08-15).** All promotion of it was removed from the site, newsletter, and welcome email. Do not re-add links to it. `/privacy/extension` stays up only while the Chrome Web Store listing exists (Google requires a live privacy-policy URL); it can be deleted once the listing is taken down.

1. If the change touches the news pipeline, check what's currently running in `vercel.json` crons before editing schedules.
2. **Newsletter template edits:** never add Google Fonts or `@font-face`. Never base64-inline sponsor logos in the live send path (fine in the preview script). Never remove the inline `color` style on an anchor tag even if you see a class that already sets color — the class will lose to Gmail's `a:link` pseudo-class cascade and the anchor will render bright blue. Never replace `.fops-cta-solid`'s `background-color` property with the `background` shorthand.
3. **Gmail clip budget:** a full edition should stay under ~95 KB HTML. If you find yourself adding verbose inline styles to every story row, stop and add a class to `STYLE_BLOCK` instead. Re-run `send-test-email.ts` and watch the printed size before committing.
4. **Dark-mode opt-out:** don't simplify or remove any of the three layers (meta color-scheme tags, `@media (prefers-color-scheme: dark)` block, Gmail/Outlook-specific selectors) without re-testing in Gmail iOS — each layer hits a different client.
5. Dedup lives in two files for two distinct concepts — don't conflate them. Same-day "are these two articles the same real-world story?" clustering is `isSameStory` / `normalizeFirmName` in `lib/news/story-dedup.ts`, shared by the feed UI (`lib/news/api.ts`) and the newsletter. Cross-edition "did we already run this in the last 3 editions?" fingerprinting is `storyFingerprints` in `lib/newsletter/query-articles.ts`, newsletter-only. Never paste either helper into the other file; never build a private copy in `api.ts`.
6. **Adding a new sponsor:** insert a row in `sponsor_bookings` (see "Sponsors" above) — do not edit code. The logo PNG goes in `public/sponsors/` and is referenced by absolute URL (`https://fundopshq.com/sponsors/foo.png`), so it has to be deployed before the run starts. Check the result on `/newsletter/sample`-style output (a test render with that sponsor) before the first send; one sponsor at a time, and the table will refuse an overlapping run.
7. If you're tempted to recreate a page that was deleted, check first — the 2026-04-10 cleanup was deliberate, not a bug.
8. **Outreach pipeline (Path B):** never remove the `OUTREACH_ENABLED` env var gate — it's the kill switch. Never use Resend for cold outreach (TOS violation would put the real newsletter at risk). Never loosen the quality gate in `lib/outreach/template.ts` without syncing the static template too; the gate is the safety net against bad auto-sends. When editing `lib/outreach/candidates.ts` hard blocks, run the local dry-run test against today's edition before committing (see `project_outreach_pipeline.md` in auto-memory for the script). Never use substring patterns shorter than 5 chars in Block B/D — `'pers'` false-positived on "Pershing Square" in dry-run, `'ft'` would collide with "Softbank"/"Lyft".
