# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FundOpsHQ is the central hub for the investment funds industry. It ties together three products under one brand:

1. **FundOps Daily** — daily news feed (on the site) and morning email newsletter (sent via Resend)
2. **FundOpsHQ Live** — weekly broadcast show streamed on YouTube (Thursdays 11am ET)
3. Long-form reference content across private markets

Audience: GPs, LPs, fund operators, and service providers working in and around private markets. Do **not** frame it as "educational" or "for fund ops professionals" — the site is a brand landing zone for the Daily + Live + newsletter products.

Stack: Next.js 16 (App Router, Turbopack) + React 19, TypeScript, Tailwind CSS, Supabase, Resend, Vercel.

> **Heads up on the directory name:** the repo still lives at `v0-educational-website-design/` because it started as a v0.app scaffold. The "educational" framing is dead — rename later; don't let it shape decisions now.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
```

Note: no Jest/Vitest suite is configured. TypeScript build errors are ignored in `next.config.mjs` — rely on `next build` for type validation.

## Routing (post-cleanup, April 2026)

The site was aggressively consolidated on 2026-04-10. There are only six public routes plus an admin tool:

```
/                       → Editorial newsroom homepage
                           · HeroSubscribe (hero + newsletter signup, anchor #subscribe)
                           · NewsFeed (section #news — the daily news feed)
                           · LiveShowFeature (section #show — latest broadcast)
/about                  → About page (rebuilt 2026-04-09)
/brand                  → Brand kit — logos, monograms, backgrounds (added 2026-04-09)
/privacy, /terms        → Legal
/admin/newsletter       → Internal newsletter prep UI (not in sitemap/robots)
```

Everything you might remember is gone: `/blog`, `/interviews`, `/guests`, `/news`, `/contact`, `/episodes/*`, `/fund-watch/*`, `/newsletter/*`, `/articles/*`, `/tools/*`, `/funds/*`, `/roles/*`. Do not recreate them without an explicit ask.

## API Routes

```
/api/news/feed                          → Homepage NewsFeed data source
/api/newsletter/subscribe               → Email signup — single opt-in, sends welcome email
/api/newsletter/confirm                 → Legacy endpoint, kept alive for old confirmation links
/api/newsletter/unsubscribe             → One-click unsubscribe
/api/feedback                           → Inline feedback button on the news feed
/api/admin/newsletter-prep              → Admin-only newsletter preview
/api/pipeline/news-ingest               → Cron: RSS fetch + store (3-tier by frequency)
/api/pipeline/news-process              → Cron: Claude-API classification + clustering
/api/pipeline/newsletter-send           → Cron: assemble + send FundOps Daily via Resend
/api/pipeline/backfill-domains          → One-shot: backfill firm domains for logos
```

FundOps Daily flipped to **single opt-in** on 2026-04-10. The `subscribe` route now sets `status = 'confirmed'` + `confirmed_at = now()` on insert and fires a welcome email via `lib/newsletter/welcome-email.ts`. The `confirm` route is still wired up so any stale confirmation-email links already in inboxes land on the homepage instead of 404ing. Don't reintroduce double opt-in without an explicit ask — we measured ~36% drop-off on the confirmation step before the flip.

Cron schedules live in `vercel.json`.

## Data Layer

**Supabase project** `reolugphmfmlwelnnvet` — only 5 tables are still in use after the intel platform was deleted (2026-04-09):

| Table                    | Purpose                                                      |
| ------------------------ | ------------------------------------------------------------ |
| `news_items`             | Articles from all ingested RSS feeds (the live content pool) |
| `feed_sources`           | RSS feed configs and ingest tier                             |
| `newsletter_editions`    | Sent newsletter records                                      |
| `newsletter_subscribers` | Double-opt-in email list                                     |
| `feedback`               | Inline feedback submissions                                  |

`news_items` still carries orphan FK columns (`cluster_id`, `story_cluster_id`, `gp_id`, `fund_id`, `firm_id`, `embedding`) from the old architecture. Nothing populates them, so they're always null. `lib/news/api.ts` has a Layer-1 clustering path that keys on `story_cluster_id` but it's effectively dormant — all feed grouping runs through the Layer-2 path that uses `isSameStory`.

## `lib/` layout

```
lib/
├── news/            # RSS ingestion, classification, firm logo resolution
│   ├── story-dedup.ts   # Shared story-clustering — isSameStory, normalizeFirmName,
│   │                    # fundSizesMatch, titleJaccard. Used by both the newsletter
│   │                    # assembly and the feed UI grouping. Single source of truth
│   │                    # for "are these two articles the same underlying story?".
│   └── rss-client.ts    # Entity-decoding stripHtml — decodeEntities is exported
│                        # for the backfill script and handles named + numeric refs.
├── newsletter/      # Email template, Resend sender, query-articles, sponsors, confirmation email
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
├── site-header.tsx          # Sticky top nav — News / Show / About / Live / Subscribe
├── site-footer.tsx          # Editorial "Colophon" footer — brand + CTA + nav + socials
├── home/
│   ├── hero-subscribe.tsx   # Homepage hero + inline subscribe form
│   └── live-show-feature.tsx # "Channel 02" broadcast section with latest video
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

## FundOps Daily newsletter pipeline

The morning send is assembled in `lib/newsletter/query-articles.ts` and runs these stages in order:

1. Pull last 26h of classified articles with `article_type` in the newsletter allowlist
2. Drop govt/NGO program announcements and blocked sources (facebook.com, x.com, etc.)
3. Same-day story dedup via `isSameStory` from `lib/news/story-dedup.ts`
4. Cross-edition dedup — a firm+fund fingerprint is computed for every article in the last 3 sent editions and used to filter repeats (so ArcLight Fund VIII doesn't show up two days in a row)
5. Quality gate — drops articles with no firm and no fund, or with placeholder tldrs like "amounts not disclosed"
6. Minimum fund size filter ($25M) for fund activity
7. Section split: fund activity grouped by fund category, LP Commitments as its own dedicated section (pension/teachers/SERS/PERS patterns in firm name), then People Moves / Deals / Regulatory
8. `secondaries` with <2 stories rolls up into PE; `other` is suppressed entirely

The subject line is chosen by `buildSubject` in `lib/newsletter/send-daily.ts` — it picks the biggest GP fund event, preferring `fund_close` > `fund_launch` > `capital_raise`, and excludes LP commitments + exec moves (where extracted "size" is usually firm AUM, not a fund).

Preview the current feed at any time:

```bash
npx tsx --env-file=.env.local scripts/preview-newsletter.ts
```

`scripts/backfill-decode-entities.ts` is a one-shot utility that scans `news_items` for HTML entities left over from older ingests and rewrites the titles/descriptions. Run with `--apply`; re-run until changes stabilize at 0 (the offset-based paging shifts as rows leave the filter, so it takes 3–4 passes).

## Before making changes

1. If the change touches the news pipeline, check what's currently running in `vercel.json` crons before editing schedules.
2. If the change touches the newsletter email template, remember it's inline CSS only (Gmail/Outlook/Apple Mail). Don't introduce external stylesheets.
3. If you're adjusting dedup logic, edit `lib/news/story-dedup.ts` — don't add a second copy inside query-articles or api.ts.
4. If you're tempted to recreate a page that was deleted, check first — the 2026-04-10 cleanup was deliberate, not a bug.
