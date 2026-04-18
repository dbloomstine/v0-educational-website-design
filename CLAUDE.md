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
/api/pipeline/outreach-send             → Cron: daily "we covered your firm" outreach via Gmail API
/api/pipeline/outreach-monitor          → Cron: hourly reply/bounce detection for outreach
/api/pipeline/backfill-domains          → One-shot: backfill firm domains for logos
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
Cron: 0 13 * * 1-5 (13:00 UTC weekdays = 9 AM EDT / 8 AM EST)
  1. Auth (isAuthorizedPipelineRequest)
  2. Kill switch (OUTREACH_ENABLED env flag — absolute off)
  3. Idempotency guard (count of today's cold_outreach_sent rows vs cap)
  4. Confirm today's newsletter_editions row is status='sent'
  5. Pull articles (join newsletter_editions.article_ids → news_items)
  6. buildCandidates() — hard blocks A through F
  7. firmLevelDedup() — by lower(firm_name) OR firm_domain, 120d + permanent
  8. Apollo enrichment (verified emails only, no fallback to catch-all)
  9. emailLevelDedup() — vs newsletter_subscribers + cold_outreach_sent
  10. Cap to OUTREACH_DAILY_CAP (default 10)
  11. For each surviving candidate:
        generateHook() (Anthropic Haiku 4.5 — one-sentence news anchor)
        composeEmail() (static template, only firstName + hook vary)
        qualityGate() — 9 hard checks, fail → log skipped, try next
        sendGmail() via raw fetch + OAuth2 refresh + MIME base64url
        insert into cold_outreach_sent (status='sent')
  12. Summary email to dbloomstine@gmail.com
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
GMAIL_OAUTH_REFRESH_TOKEN   — generated once via OAuth Playground, never expires
                              (as long as used at least once every 6 months)
GMAIL_SENDER_EMAIL          — defaults to dbloomstine@gmail.com
OUTREACH_APOLLO_API_KEY     — Apollo.io REST API key (separate from other
                              Apollo keys Danny may use elsewhere)
OUTREACH_DAILY_CAP          — numeric, default 10, hard cap enforced in code
OUTREACH_ENABLED            — string 'true' to activate; any other value = off
ANTHROPIC_API_KEY           — reused from news-process
CRON_SECRET + PIPELINE_API_KEY — reused auth via lib/pipeline/auth.ts
```

### Gmail OAuth setup (one-time, already done 2026-04-14)

Google Cloud project `fundopshq-outreach` → Gmail API enabled → OAuth
consent screen in Testing mode with `dbloomstine@gmail.com` as test user
→ Web application OAuth client → redirect URI
`https://developers.google.com/oauthplayground` → refresh token generated
via the Playground with three scopes: `gmail.send`, `gmail.readonly`,
`gmail.modify`. Refresh tokens don't expire as long as they're used
at least once every 6 months. The cron runs daily so expiration is
never a concern; if it ever does expire, re-run the Playground flow
(~2 min) and update the env var.

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

| Table                    | Purpose                                                               |
| ------------------------ | --------------------------------------------------------------------- |
| `news_items`             | Articles from all ingested RSS feeds (the live content pool)          |
| `feed_sources`           | RSS feed configs and ingest tier                                      |
| `newsletter_editions`    | Sent newsletter records                                               |
| `newsletter_subscribers` | Single opt-in email list (flipped from double opt-in 2026-04-11)      |
| `feedback`               | Inline feedback submissions                                           |
| `cold_outreach_sent`     | Append-only log of outreach drafts + sends (Path B + grow-newsletter) |

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
3. Same-day story dedup via `isSameStory` from `lib/news/story-dedup.ts`. `normalizeFirmName` runs a two-pass strip: legal-form tokens (`llc`, `inc`, `corp`, `ltd`, `lp`, `llp`, `plc`, `the`, `and`) always drop; descriptive tokens (`group`, `partners`, `capital`, `management`, `fund`, `equity`, etc.) drop only when a distinctive token survives. Without the second check, all-descriptive firm names like "Partners Group" collapse to `""` and every story about them evades dedup — that's the root cause of the 2026-04-18 Partners Group quad-clone.
4. Cross-edition dedup — `storyFingerprints` in `query-articles.ts` emits 1–2 keys per article and matches against the last 3 sent editions. Keys: `firm|fund` when a fund name is known, and `firm|event|size-bucket` (size rounded to $500M bands) always. The size-bucket key is why Adams Street $7.5B won't re-run when one day names "Private Credit III" and the next day doesn't.
5. Quality gate — drops articles with no firm and no fund, or with placeholder tldrs like "amounts not disclosed".
6. Minimum fund size filter ($25M) for fund activity.
7. Section split: fund activity grouped by fund category, LP Commitments as its own dedicated section (pension/teachers/SERS/PERS patterns in firm name), then People Moves / Deals / Regulatory.
8. `secondaries` with <2 stories rolls up into PE; `other` is suppressed entirely.
9. Floor of 1 — the send will fire if even a single article qualifies. Only a truly-empty result (classification pipeline failure) skips the edition.

The subject line is chosen by `buildSubject` in `lib/newsletter/send-daily.ts` — it picks the biggest GP fund event, preferring `fund_close` > `fund_launch` > `capital_raise`, and excludes LP commitments + exec moves (where extracted "size" is usually firm AUM, not a fund). **AUM safety rail:** any candidate with `fund_size_usd_millions > 30000` AND no `fund_name` is dropped from subject-line selection. Single-fund sizes above $30B are extremely rare and are always named; an unnamed $623B is almost always the classifier confusing firm AUM with a fund size (regression source: 2026-04-10 "Ares Management Corp $623B" exec-hire leak; 2026-04-09 "Lemssouguer Fund $20B" career-profile leak).

`scripts/backfill-decode-entities.ts` is a one-shot utility that scans `news_items` for HTML entities left over from older ingests and rewrites titles/descriptions. Run with `--apply`; re-run until changes stabilize at 0 (the offset-based paging shifts as rows leave the filter, so it takes 3–4 passes).

## Before making changes

1. If the change touches the news pipeline, check what's currently running in `vercel.json` crons before editing schedules.
2. **Newsletter template edits:** never add Google Fonts or `@font-face`. Never base64-inline sponsor logos in the live send path (fine in the preview script). Never remove the inline `color` style on an anchor tag even if you see a class that already sets color — the class will lose to Gmail's `a:link` pseudo-class cascade and the anchor will render bright blue. Never replace `.fops-cta-solid`'s `background-color` property with the `background` shorthand.
3. **Gmail clip budget:** a full edition should stay under ~95 KB HTML. If you find yourself adding verbose inline styles to every story row, stop and add a class to `STYLE_BLOCK` instead. Re-run `send-test-email.ts` and watch the printed size before committing.
4. **Dark-mode opt-out:** don't simplify or remove any of the three layers (meta color-scheme tags, `@media (prefers-color-scheme: dark)` block, Gmail/Outlook-specific selectors) without re-testing in Gmail iOS — each layer hits a different client.
5. Dedup lives in two files for two distinct concepts — don't conflate them. Same-day "are these two articles the same real-world story?" clustering is `isSameStory` / `normalizeFirmName` in `lib/news/story-dedup.ts`, shared by the feed UI (`lib/news/api.ts`) and the newsletter. Cross-edition "did we already run this in the last 3 editions?" fingerprinting is `storyFingerprints` in `lib/newsletter/query-articles.ts`, newsletter-only. Never paste either helper into the other file; never build a private copy in `api.ts`.
6. **Adding a new sponsor:** edit `DEFAULT_SPONSOR_SLATE.sponsors` in `lib/newsletter/sponsors.ts`. The logo PNG goes in `public/sponsors/` and must be referenced by absolute URL (`https://fundopshq.com/sponsors/foo.png`). Test with `send-test-email.ts` before committing to confirm the image loads through Gmail's proxy.
7. If you're tempted to recreate a page that was deleted, check first — the 2026-04-10 cleanup was deliberate, not a bug.
8. **Outreach pipeline (Path B):** never remove the `OUTREACH_ENABLED` env var gate — it's the kill switch. Never use Resend for cold outreach (TOS violation would put the real newsletter at risk). Never loosen the quality gate in `lib/outreach/template.ts` without syncing the static template too; the gate is the safety net against bad auto-sends. When editing `lib/outreach/candidates.ts` hard blocks, run the local dry-run test against today's edition before committing (see `project_outreach_pipeline.md` in auto-memory for the script). Never use substring patterns shorter than 5 chars in Block B/D — `'pers'` false-positived on "Pershing Square" in dry-run, `'ft'` would collide with "Softbank"/"Lyft".
