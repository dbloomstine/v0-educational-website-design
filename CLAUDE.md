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

| Table                    | Purpose                                                          |
| ------------------------ | ---------------------------------------------------------------- |
| `news_items`             | Articles from all ingested RSS feeds (the live content pool)     |
| `feed_sources`           | RSS feed configs and ingest tier                                 |
| `newsletter_editions`    | Sent newsletter records                                          |
| `newsletter_subscribers` | Single opt-in email list (flipped from double opt-in 2026-04-11) |
| `feedback`               | Inline feedback submissions                                      |

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

## FundOps Daily email template — `lib/newsletter/email-template.ts`

One file renders the entire morning brief. System fonts only — no `@font-face`, no Google Fonts, no external stylesheets. All brand colors, typography stacks, and reusable chrome live as `const` declarations at the top of the file; mirror the palette from `app/brand/page.tsx` rather than inventing new hex codes.

The full editorial redesign landed on 2026-04-11 and matches the fundopshq.com brand treatment: navy masthead with a newspaper eyebrow strip, cream editorial body, Georgia display serif, monospace eyebrows, amber italic accent on "Daily" and "top stories." Read the file's own top comment for the aesthetic intent.

### Size budget — Gmail clipping at ~102 KB

Gmail clips any email whose HTML body exceeds **~102 KB** and shows a `[Message clipped] View entire message` link that hides the tail. A full edition currently delivers around **68–72 KB** with the sample co-sponsor slate — plenty of headroom, but easy to blow if you're careless.

The single biggest thing keeping us under the ceiling is the `STYLE_BLOCK` const at the top of `email-template.ts`. It defines ~35 utility classes (`.fops-serif`, `.fops-ink`, `.fops-title`, `.fops-row`, `.fops-badge` + per-type variants, `.fops-c-pe` + per-category variants, `.fops-cta-outline`, `.fops-cta-solid`, etc.) that every story row, category head, and sponsor card references via `class="..."`. Before that refactor the same template was **139 KB** and got clipped in Gmail. **Do not** revert to "every style attribute inline on every element" — the clipping will come back. Keep repeated styles in `STYLE_BLOCK`.

The final output also runs through `collapseTemplateWhitespace()` to strip per-line indentation, saving another ~15% on delivered bytes without touching inline text spacing.

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

### Sponsor slate model

Sponsor data lives in `lib/newsletter/sponsors.ts`:

```ts
interface Sponsor {
  name;
  logoUrl?;
  logoWidth?;
  wordmarkHtml?;
  blurb;
  ctaUrl;
  ctaText?;
}
interface SponsorSlate {
  label;
  sponsors: Sponsor[];
}
```

The slate `label` (e.g. `"PRESENTED BY"`) renders **once per block** — top sponsor block and bottom sponsor block — not per card. This was a deliberate editorial call: repeating "PRESENTED BY" above every card reads as redundant when stacking multiple co-sponsors. The bottom block adds a filled `fops-cta-solid` CTA per card plus the house "Sponsor FundOps Daily →" invitation at the tail.

`DEFAULT_SPONSOR_SLATE` is what the live send uses. It ships with only the house `FUNDOPSHQ_SPONSOR`. **To add a paid sponsor**, append a new `Sponsor` object to `DEFAULT_SPONSOR_SLATE.sponsors` in `sponsors.ts` — the next morning's send picks it up. Keep the slate between 1 and 5 sponsors; more than 5 dilutes each brand's visibility and the card stack gets unwieldy.

### Sponsor logo assets — always hosted PNG, never base64, never SVG

Logos live in `public/sponsors/` and are served from `https://fundopshq.com/sponsors/*`. Three non-negotiables:

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

### Newsletter content pipeline — `lib/newsletter/query-articles.ts`

(This is how stories are _selected_; the template section above is how they're _rendered_.) Stages in order:

1. Pull last 26h of classified articles whose `article_type` is in the newsletter allowlist.
2. Drop govt/NGO program announcements and blocked sources (facebook.com, x.com, etc.).
3. Same-day story dedup via `isSameStory` from `lib/news/story-dedup.ts`.
4. Cross-edition dedup — a firm+fund fingerprint is computed for every article in the last 3 sent editions and used to filter repeats (so ArcLight Fund VIII doesn't show up two days in a row).
5. Quality gate — drops articles with no firm and no fund, or with placeholder tldrs like "amounts not disclosed".
6. Minimum fund size filter ($25M) for fund activity.
7. Section split: fund activity grouped by fund category, LP Commitments as its own dedicated section (pension/teachers/SERS/PERS patterns in firm name), then People Moves / Deals / Regulatory.
8. `secondaries` with <2 stories rolls up into PE; `other` is suppressed entirely.
9. Floor of 1 — the send will fire if even a single article qualifies. Only a truly-empty result (classification pipeline failure) skips the edition.

The subject line is chosen by `buildSubject` in `lib/newsletter/send-daily.ts` — it picks the biggest GP fund event, preferring `fund_close` > `fund_launch` > `capital_raise`, and excludes LP commitments + exec moves (where extracted "size" is usually firm AUM, not a fund).

`scripts/backfill-decode-entities.ts` is a one-shot utility that scans `news_items` for HTML entities left over from older ingests and rewrites titles/descriptions. Run with `--apply`; re-run until changes stabilize at 0 (the offset-based paging shifts as rows leave the filter, so it takes 3–4 passes).

## Before making changes

1. If the change touches the news pipeline, check what's currently running in `vercel.json` crons before editing schedules.
2. **Newsletter template edits:** never add Google Fonts or `@font-face`. Never base64-inline sponsor logos in the live send path (fine in the preview script). Never remove the inline `color` style on an anchor tag even if you see a class that already sets color — the class will lose to Gmail's `a:link` pseudo-class cascade and the anchor will render bright blue. Never replace `.fops-cta-solid`'s `background-color` property with the `background` shorthand.
3. **Gmail clip budget:** a full edition should stay under ~95 KB HTML. If you find yourself adding verbose inline styles to every story row, stop and add a class to `STYLE_BLOCK` instead. Re-run `send-test-email.ts` and watch the printed size before committing.
4. **Dark-mode opt-out:** don't simplify or remove any of the three layers (meta color-scheme tags, `@media (prefers-color-scheme: dark)` block, Gmail/Outlook-specific selectors) without re-testing in Gmail iOS — each layer hits a different client.
5. If you're adjusting dedup logic, edit `lib/news/story-dedup.ts` — don't add a second copy inside `query-articles.ts` or `api.ts`.
6. **Adding a new sponsor:** edit `DEFAULT_SPONSOR_SLATE.sponsors` in `lib/newsletter/sponsors.ts`. The logo PNG goes in `public/sponsors/` and must be referenced by absolute URL (`https://fundopshq.com/sponsors/foo.png`). Test with `send-test-email.ts` before committing to confirm the image loads through Gmail's proxy.
7. If you're tempted to recreate a page that was deleted, check first — the 2026-04-10 cleanup was deliberate, not a bug.
