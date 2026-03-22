# FundOpsHQ Intel Pipeline — Audit & Enhancement Plan

## Context for Claude Code

I run FundOpsHQ, a media and advisory brand focused on investment fund operations. Every week I publish a **Fund Watch Briefing** newsletter that covers fund launches, closes, capital raises, people moves, and M&A across PE, VC, credit, real estate, infrastructure, secondaries, and GP-stakes.

The pipeline works like this:

1. **An upstream intel system** (hosted at intel.fundopshq.com) collects fund news from 91 RSS feeds, classifies them with Claude Haiku, clusters related coverage using Voyage AI vector embeddings, consolidates duplicates, and serves curated story data through an admin API.

2. **I pull story data from that system** and paste it into a Cowork session where a skill (the Fund Watch Briefing skill) processes it into a branded HTML email newsletter that I paste into Beehiiv.

3. **The output looks great.** I'm attaching screenshots of this week's newsletter output. The branding, formatting, section structure, descriptions — all of that is dialed in. The skill that produces the newsletter is working well and doesn't need to change (yet). **The problem is upstream — the data feeding into it.**

## What I Need From You

I need you to do a comprehensive audit of my intel pipeline and come back with a master plan to make the data collection best-in-class. **Do not start coding immediately.** First, study everything, then propose a plan for my review.

### Phase 1: Understand the Current System

Read and understand these files thoroughly before doing anything else:

- **The pipeline codebase** — this is the Next.js app that runs intel.fundopshq.com. Study the RSS feed configuration, the classification pipeline, the clustering logic, the consolidation logic, the newsletter pull-stories endpoint, and the database schema. Understand how stories flow from RSS ingestion to the newsletter output.

- **The Fund Watch Briefing skill** — read the SKILL.md file that the Cowork assistant uses to process the raw data into the final newsletter. This tells you exactly what the downstream consumer (me + the skill) expects from the pipeline output. The skill is located at: look in my project files for a skill directory called `fund-watch-briefing-v3` containing `SKILL.md` and a `references/` folder with `pipeline-explainer.md`, `html-email-template.html`, and `coverage-log.md`.

- **The pipeline explainer** — this is a detailed technical document I wrote for the Cowork assistant explaining how the pipeline works. It covers all 91 RSS feeds (organized in 6 tiers), the Claude Haiku classification, Voyage AI vector clustering, consolidation logic, TLDR generation, and known limitations. Read this carefully — it's the most comprehensive documentation of the current system.

### Phase 2: Identify Gaps

After studying the system, I want you to identify gaps in these areas:

#### A. Source Coverage Gaps

The current system is strong on mega-fund coverage ($500M+) from major trade publications but weak on middle-market and emerging manager activity ($20M–$300M). Specifically:

- **Are there RSS feeds we should add?** Think about publications that cover lower middle market PE, emerging managers, seed/Series A VC fund closes, niche credit strategies, regional fund activity. Examples to investigate: Fundfire, Private Funds CFO, Venture Capital Journal, Preqin news feeds, PitchBook News, middle-market-specific publications, regional business journals with PE/VC coverage.

- **Should we add SEC EDGAR Form D filings as a data source?** Every US fund raise files a Form D within 15 days. This is structured data (fund name, firm, amount, date, exemption type) and would catch every domestic fund raise regardless of press coverage. This could be the single highest-ROI addition.

- **Are our Google News Tier 6 queries optimized?** Currently we have 15 parameterized searches. Should we add more? Should we add long-tail queries like "emerging manager fund close," "first-time fund raise," "lower middle market fund"?

- **Are there non-RSS sources worth integrating?** Think about: LinkedIn fundraising announcements, fund placement agent deal lists, industry conference announcements, PitchBook/Preqin API access, etc.

#### B. Classification & Filtering Gaps

- Is the gravity_score threshold (0.25 minimum) filtering out legitimate small fund stories that only have one source?
- Is the $50M venture/startup filter too aggressive? It's meant to filter out company fundraising rounds (Series A/B/C) but might also be catching small VC fund closes.
- Are there classification rules in the Claude Haiku prompt that bias toward larger, more well-known funds?
- Are stories with no TLDR (15-30% of total) being treated correctly downstream?

#### C. Clustering & Consolidation Gaps

- Is the 7-day clustering window appropriate? Should it be longer?
- Is the firm name abbreviation map complete enough?
- Are there cross-category dedup failures we should fix?
- Should People Moves ever be consolidated (the current system never consolidates them)?

#### D. Pipeline Reliability

- Are there rate limiting issues causing stories to be missed?
- Is the classification batch size (100 articles per run) sufficient for high-volume weeks?
- Are there any Vercel cron reliability issues?
- Should we add monitoring/alerting for pipeline failures?

### Phase 3: Propose a Master Plan

After your audit, come back to me with:

1. **A prioritized list of enhancements** — ranked by impact on newsletter quality and effort to implement. Include your reasoning for the ranking.

2. **Quick wins** (can be done in a day) — things like adding RSS feeds, tweaking Google News queries, adjusting thresholds.

3. **Medium lifts** (1-2 weeks) — things like EDGAR Form D integration, new classification rules, monitoring.

4. **Big bets** (longer term) — things like non-RSS source integrations, ML-based relevance scoring, automated newsletter generation.

5. **For each enhancement, tell me:**
   - What it does
   - Why it matters for newsletter quality
   - Estimated effort
   - Dependencies or risks
   - Whether it requires new API keys, costs, or infrastructure

## What NOT To Do

- **Do not modify the Fund Watch Briefing skill.** That's working well and is maintained separately in Cowork.
- **Do not start implementing before I approve the plan.** I want to review and prioritize together.
- **Do not break existing functionality.** Everything that works today needs to keep working.
- **Do not add paid data sources without discussing cost/value first.**

## Success Criteria

The pipeline is "best in class" when:

- We're catching 80%+ of US fund closes over $10M within 48 hours of announcement
- Middle-market coverage ($20M–$300M) is as strong as our mega-fund coverage
- Every story has a usable TLDR and at least one direct source URL
- False positive rate stays low (noise stories making it to the newsletter < 5%)
- The weekly story count for the newsletter is 30-50 high-quality entries (currently ~25 after filtering 65 raw)
- Pipeline runs reliably with monitoring and alerting for failures

## Tone

Think of yourself as a senior data engineer who's been hired to make this pipeline world-class. Be opinionated. If something is architecturally wrong, say so. If an approach is overkill, say so. I want honest, practical recommendations — not a wish list of everything that's theoretically possible.
