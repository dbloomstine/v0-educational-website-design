/**
 * Article body enrichment.
 *
 * Fetches the publisher's own article page for stories whose RSS entry carried
 * only a headline or a short teaser, and stores the extracted body text in
 * news_items.full_text. The classifier reads that text, so this is the single
 * biggest lever on summary quality.
 *
 * Why it exists: a 2026-08 audit found 229 of 52,181 articles had a body — 0.4%
 * — and nothing had been enriched since 2026-03-06. The classifier had been
 * running on headlines plus a 77-476 character RSS blurb, and for several
 * sources the "description" was just the headline repeated.
 *
 * Cost: zero model tokens. This is HTTP plus string handling. The only knock-on
 * cost is that the classifier's existing 1,500-character snippet is now filled
 * with real article text instead of a teaser.
 *
 * Conduct — these rules are the point, not decoration:
 *  - Publishers behind a paywall are never requested at all (PAYWALLED_HOSTS).
 *  - robots.txt is fetched once per host and honoured.
 *  - The User-Agent identifies the crawler and links to a contact page.
 *  - One request per host at a time, with a delay between them.
 *  - Only URLs the publisher already handed us in their own feed are fetched.
 *  - A page that yields thin text or trips a paywall marker is recorded as an
 *    error and stored as nothing, rather than saving a "subscribe to continue"
 *    stub that would poison the classifier.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any>;

export interface EnrichmentResult {
  articlesEnriched: number;
  articlesSkipped: number;
  articlesFailed: number;
  errors: string[];
}

const USER_AGENT =
  'FundOpsHQBot/1.0 (+https://fundopshq.com/about; newsletter indexer)';

/** Wall-clock budget, mirroring the classifier. Route declares maxDuration 300. */
const RUN_BUDGET_MS = 260_000;
const MAX_ARTICLES_PER_RUN = 60;
const CONCURRENCY = 4;
const PER_HOST_DELAY_MS = 1_000;
const FETCH_TIMEOUT_MS = 12_000;

/** Below this many characters an RSS entry is too thin to classify well. */
const THIN_TEXT_THRESHOLD = 600;
/** Below this, a fetched page didn't yield a usable article body. */
const MIN_EXTRACTED_CHARS = 400;
/** Cap stored text — the classifier only reads the first 1,500 characters. */
const MAX_STORED_CHARS = 6_000;

/**
 * Publishers whose articles sit behind a hard paywall. We do not request these
 * at all: the fetch would return a teaser or a subscribe wall, so it would burn
 * a request for nothing, and routing around a paywall is not something this
 * pipeline should be doing. Their headlines still flow through the newsletter —
 * we simply summarise from the headline, and credit the source.
 *
 * Getting real depth from these means press access, not scraping.
 */
const PAYWALLED_HOSTS = new Set([
  // PEI Group titles
  'privateequityinternational.com',
  'privatedebtinvestor.com',
  'secondariesinvestor.com',
  'perenews.com',
  'agriinvestor.com',
  'newprivatemarkets.com',
  'privatefundscfo.com',
  'buyoutsinsider.com',
  'pehub.com',
  // Verified 2026-08-08 by fetching a live article from each: PE Hub returns a
  // registration wall ("a verification email is on its way"), AltAssets a
  // "become a Premium Subscriber" wall. Both yield ~250-350 characters of
  // furniture and no article text.
  'altassets.net',
  // Wire services and majors
  'bloomberg.com',
  'wsj.com',
  'ft.com',
  'barrons.com',
  'economist.com',
  'nytimes.com',
  'reuters.com',
  // Trade press
  'pionline.com',
  'institutionalinvestor.com',
  'withintelligence.com',
  'alternativeswatch.com',
  'hfalert.com',
]);

/** Markers that mean we fetched a wall rather than an article. */
const PAYWALL_MARKERS = [
  /subscribe to continue/i,
  /sign in to (read|continue)/i,
  /this (article|content) is for subscribers/i,
  // Publishers qualify the noun ("become a Premium Subscriber", "become an
  // AltAssets subscriber"), so match across the modifier rather than requiring
  // the bare phrase.
  /become an? [\w\s]{0,20}subscriber/i,
  /premium subscriber/i,
  /you have reached your.{0,20}limit/i,
  /register to (read|continue)/i,
  /verification email is on its way/i,
];

// ─── Main ───────────────────────────────────────────────────────────────────

export async function enrichPendingArticles(
  supabase: DbClient
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    articlesEnriched: 0,
    articlesSkipped: 0,
    articlesFailed: 0,
    errors: [],
  };

  const runStart = Date.now();

  // Only articles still awaiting classification are worth enriching — once an
  // article is classified, refetching its body changes nothing downstream.
  const { data: candidates, error } = await supabase
    .from('news_items')
    .select('id, title, description, source_url, full_text')
    .eq('classification_status', 'pending')
    .is('enriched_at', null)
    .order('created_at', { ascending: false })
    .limit(MAX_ARTICLES_PER_RUN);

  if (error || !candidates || candidates.length === 0) return result;

  const robotsCache = new Map<string, Promise<string[]>>();
  const hostLastFetch = new Map<string, number>();

  // Fixed-size worker pool over a shared cursor — simpler than batching and it
  // never leaves a slot idle waiting on a slow host.
  let cursor = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    for (;;) {
      if (Date.now() - runStart > RUN_BUDGET_MS) return;
      const index = cursor++;
      if (index >= candidates.length) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const article = candidates[index] as any;
      try {
        const outcome = await enrichOne(
          supabase,
          article,
          robotsCache,
          hostLastFetch
        );
        if (outcome === 'enriched') result.articlesEnriched++;
        else if (outcome === 'skipped') result.articlesSkipped++;
        else result.articlesFailed++;
      } catch (err) {
        result.articlesFailed++;
        if (result.errors.length < 10) {
          result.errors.push(
            `${article.id}: ${err instanceof Error ? err.message : 'unknown'}`
          );
        }
      }
    }
  });

  await Promise.all(workers);
  return result;
}

// ─── Per-article ────────────────────────────────────────────────────────────

type Outcome = 'enriched' | 'skipped' | 'failed';

async function enrichOne(
  supabase: DbClient,
  article: { id: string; title: string; description: string | null; source_url: string; full_text: string | null },
  robotsCache: Map<string, Promise<string[]>>,
  hostLastFetch: Map<string, number>
): Promise<Outcome> {
  // Already have enough to work with — the RSS feed carried a real body
  // (content:encoded). No reason to spend a request.
  const existing = article.full_text ?? article.description ?? '';
  if (existing.length >= THIN_TEXT_THRESHOLD) {
    await markEnriched(supabase, article.id, null, 'rss body already sufficient');
    return 'skipped';
  }

  let url: URL;
  try {
    url = new URL(article.source_url);
  } catch {
    await markEnriched(supabase, article.id, null, 'unparseable source url');
    return 'skipped';
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    await markEnriched(supabase, article.id, null, 'unsupported protocol');
    return 'skipped';
  }

  const host = url.hostname.replace(/^www\./, '');

  if (PAYWALLED_HOSTS.has(host)) {
    await markEnriched(supabase, article.id, null, 'paywalled publisher — not requested');
    return 'skipped';
  }

  const disallowed = await getDisallowedPaths(url.origin, robotsCache);
  if (disallowed.some((p) => url.pathname.startsWith(p))) {
    await markEnriched(supabase, article.id, null, 'disallowed by robots.txt');
    return 'skipped';
  }

  await waitForHost(host, hostLastFetch);

  const html = await fetchPage(url.toString());
  if (html === null) {
    await markEnriched(supabase, article.id, null, 'fetch failed');
    return 'failed';
  }

  if (PAYWALL_MARKERS.some((m) => m.test(html))) {
    await markEnriched(supabase, article.id, null, 'paywall wall detected');
    return 'skipped';
  }

  const text = extractArticleText(html);
  if (text.length < MIN_EXTRACTED_CHARS) {
    await markEnriched(supabase, article.id, null, `extracted only ${text.length} chars`);
    return 'skipped';
  }

  await markEnriched(supabase, article.id, text.slice(0, MAX_STORED_CHARS), null);
  return 'enriched';
}

async function markEnriched(
  supabase: DbClient,
  id: string,
  fullText: string | null,
  error: string | null
): Promise<void> {
  const patch: Record<string, unknown> = {
    enriched_at: new Date().toISOString(),
    enrichment_error: error,
  };
  // Never overwrite an existing body with null.
  if (fullText) patch.full_text = fullText;

  await supabase.from('news_items').update(patch).eq('id', id);
}

// ─── Fetching ───────────────────────────────────────────────────────────────

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? '';
    if (!type.includes('html')) return null;

    return await res.text();
  } catch {
    return null;
  }
}

async function waitForHost(
  host: string,
  hostLastFetch: Map<string, number>
): Promise<void> {
  const last = hostLastFetch.get(host) ?? 0;
  const wait = PER_HOST_DELAY_MS - (Date.now() - last);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  hostLastFetch.set(host, Date.now());
}

// ─── robots.txt ─────────────────────────────────────────────────────────────

/**
 * Disallow paths that apply to us, from the `User-agent: *` group (and any
 * group naming this bot). Deliberately conservative: anything we cannot parse
 * confidently is treated as "no restrictions we can see" only when robots.txt
 * is genuinely absent — a fetch failure returns no rules, and a malformed file
 * simply yields whatever Disallow lines we could read.
 */
async function getDisallowedPaths(
  origin: string,
  cache: Map<string, Promise<string[]>>
): Promise<string[]> {
  const cached = cache.get(origin);
  if (cached) return cached;

  const promise = (async () => {
    const body = await fetchPage(`${origin}/robots.txt`).catch(() => null);
    if (!body) return [];

    const paths: string[] = [];
    let applies = false;
    for (const rawLine of body.split('\n')) {
      const line = rawLine.split('#')[0].trim();
      if (!line) continue;
      const [rawKey, ...rest] = line.split(':');
      const key = rawKey.trim().toLowerCase();
      const value = rest.join(':').trim();

      if (key === 'user-agent') {
        applies = value === '*' || value.toLowerCase().includes('fundopshq');
      } else if (key === 'disallow' && applies && value) {
        // Strip wildcards — prefix matching is a safe over-approximation.
        const path = value.split('*')[0];
        if (path.startsWith('/')) paths.push(path);
      }
    }
    return paths;
  })();

  cache.set(origin, promise);
  return promise;
}

// ─── Extraction ─────────────────────────────────────────────────────────────

/**
 * Pull readable article text out of an HTML page.
 *
 * Deliberately dependency-free: jsdom is a devDependency and far too heavy for
 * a serverless cron, and a full readability port is more machinery than this
 * needs. Strip the furniture, prefer <article> when the page marks it, then
 * take the paragraph text.
 */
export function extractArticleText(html: string): string {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<(nav|header|footer|aside|form|figure)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  // Prefer an explicit <article> region when it actually holds the body. This
  // excludes sidebars and related-story rails, which matter more than they
  // sound: those rails carry other firms' headlines, and the classifier would
  // happily extract them as entities for this story.
  //
  // The decision is made on extracted text, not raw HTML length — markup
  // weight says nothing about whether the region contains the article.
  const region = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (region) {
    const fromArticle = paragraphsFrom(region[1]);
    if (fromArticle.length >= MIN_ARTICLE_REGION_CHARS) return fromArticle;
  }

  return paragraphsFrom(cleaned);
}

/** An <article> region shorter than this probably isn't the body. */
const MIN_ARTICLE_REGION_CHARS = 200;

function paragraphsFrom(html: string): string {
  return [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => decodeEntities(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim())
    // Drop cookie notices, bylines, share prompts and other one-liners.
    .filter((t) => t.length > 40)
    .join('\n\n')
    .trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&[lr]dquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}
