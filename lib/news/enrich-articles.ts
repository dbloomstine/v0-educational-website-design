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
/** A page is read up to this many bytes; the article is in the first of them. */
const MAX_PAGE_BYTES = 2_000_000;
/** Redirects followed by hand, each checked against the publisher's domain. */
const MAX_REDIRECTS = 4;

/** Below this many characters an RSS entry is too thin to classify well. */
export const THIN_TEXT_THRESHOLD = 600;
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

/**
 * Hosts whose pages we fetch and get no article from: 266 of 266 JD Supra pages
 * in the week to 2026-10-08 ended "extracted only 0 chars" (the body is not in
 * <p> tags in the HTML we are served). Not requested, rather than asked for again.
 */
const UNEXTRACTABLE_HOSTS = new Set(['jdsupra.com']);

export function isUnextractableHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^www\./, '');
  return [...UNEXTRACTABLE_HOSTS].some((p) => h === p || h.endsWith(`.${p}`));
}

/** A paywalled publisher, or any subdomain of one (news.pehub.com is PE Hub). */
export function isPaywalledHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^www\./, '');
  for (const p of PAYWALLED_HOSTS) if (h === p || h.endsWith(`.${p}`)) return true;
  return false;
}

/** The hostname of a feed URL without `www.`, or null when it is not a web address. */
export function hostOf(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

/** Second-level labels under which the registrable domain has three labels (bbc.co.uk, not co.uk). */
const SECOND_LEVEL = new Set(['co', 'com', 'org', 'net', 'gov', 'ac', 'edu']);

/**
 * The domain a publisher owns: `news.example.com` and `example.com` share
 * `example.com`. A heuristic in place of the public-suffix list, which would be
 * a new dependency; it errs towards "different", which only costs a fetch.
 */
export function registrableDomain(host: string): string {
  const labels = host.toLowerCase().replace(/\.$/, '').split('.');
  if (labels.length <= 2) return labels.join('.');
  const tld = labels[labels.length - 1];
  const second = labels[labels.length - 2];
  const keep = tld.length === 2 && SECOND_LEVEL.has(second) ? 3 : 2;
  return labels.slice(-keep).join('.');
}

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

  const ctx = newFetchContext();

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
        const outcome = await enrichOne(supabase, article, ctx);
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

/** What a run remembers about the hosts it has met: robots.txt, and when each was last asked. */
export interface FetchContext {
  robotsCache: Map<string, Promise<string[]>>;
  hostLastFetch: Map<string, number>;
}

export function newFetchContext(): FetchContext {
  return { robotsCache: new Map(), hostLastFetch: new Map() };
}

/** The reason strings are what `enrichment_error` holds; a few are matched by other code, so change them with care. */
export type BodyResult =
  | { ok: true; text: string }
  | { ok: false; outcome: 'skipped' | 'failed'; reason: string };

const skip = (reason: string): BodyResult => ({ ok: false, outcome: 'skipped', reason });

/**
 * Fetch one article page and return its text, or why there is none. The one
 * place the conduct rules above are applied, for the pending pass here and the
 * on-the-site pass in enrich-stories.ts.
 */
export async function fetchArticleBody(sourceUrl: string, ctx: FetchContext): Promise<BodyResult> {
  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    return skip('unparseable source url');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return skip('unsupported protocol');

  const host = url.hostname.replace(/^www\./, '');

  // Google News RSS items store a news.google.com redirect rather than the
  // publisher's URL. resolveGoogleNewsUrl in the ingest worker is meant to
  // convert these, but Google changed the scheme: the page is now ~591KB of
  // JavaScript with the destination behind a batchexecute POST, and none of the
  // three patterns that resolver matches (data-n-au, meta refresh,
  // location.replace) appear. It silently returns the original URL.
  //
  // Fetching one costs a 591KB download and yields a single <p> tag. Measured
  // 2026-08-09: 154 of 217 enrichment attempts — 71% of every cycle — were
  // spent this way. Skip them; they can never produce an article body.
  //
  // These stories still reach the newsletter, summarised from their headline.
  // The durable fix is a direct RSS feed for any publisher whose full text is
  // worth having, not reverse-engineering Google's redirect scheme.
  if (host === 'news.google.com') return skip('google news redirect — no article to fetch');

  if (isPaywalledHost(host)) return skip('paywalled publisher — not requested');

  if (isUnextractableHost(host)) return skip('known to yield no article text');

  const disallowed = await getDisallowedPaths(url.origin, ctx.robotsCache);
  if (disallowed.some((p) => url.pathname.startsWith(p))) return skip('disallowed by robots.txt');

  await waitForHost(host, ctx.hostLastFetch);

  const page = await fetchHtml(url.toString());
  if ('error' in page) {
    return { ok: false, outcome: page.error === OFF_DOMAIN ? 'skipped' : 'failed', reason: page.error };
  }

  if (PAYWALL_MARKERS.some((m) => m.test(page.html))) return skip('paywall wall detected');

  const text = extractArticleText(page.html);
  if (text.length < MIN_EXTRACTED_CHARS) return skip(`extracted only ${text.length} chars`);

  return { ok: true, text: text.slice(0, MAX_STORED_CHARS) };
}

async function enrichOne(
  supabase: DbClient,
  article: { id: string; title: string; description: string | null; source_url: string; full_text: string | null },
  ctx: FetchContext
): Promise<Outcome> {
  // Already have enough to work with — the RSS feed carried a real body
  // (content:encoded). No reason to spend a request.
  const existing = article.full_text ?? article.description ?? '';
  if (existing.length >= THIN_TEXT_THRESHOLD) {
    await markEnriched(supabase, article.id, null, 'rss body already sufficient');
    return 'skipped';
  }

  const body = await fetchArticleBody(article.source_url, ctx);
  if (!body.ok) {
    await markEnriched(supabase, article.id, null, body.reason);
    return body.outcome;
  }

  await markEnriched(supabase, article.id, body.text, null);
  return 'enriched';
}

/** Record that a row was looked at, with the text or the reason there is none. */
export async function markEnriched(
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

const OFF_DOMAIN = "redirected off the publisher's domain";

/**
 * One GET, with the rules a polite crawler keeps: a timeout over the whole
 * transfer, at most MAX_PAGE_BYTES read, and redirects followed by hand so that
 * none leaves the publisher's registrable domain. (A redirect elsewhere would
 * fetch a site whose robots.txt we never read.)
 */
async function fetchHtml(startUrl: string, kind: 'html' | 'robots' = 'html'): Promise<{ html: string } | { error: string }> {
  const origin = registrableDomain(new URL(startUrl).hostname);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    let url = startUrl;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: kind === 'robots' ? 'text/plain,*/*;q=0.1' : 'text/html,application/xhtml+xml',
        },
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) return { error: 'fetch failed' };
        const next = new URL(location, url);
        if (next.protocol !== 'https:' && next.protocol !== 'http:') return { error: 'fetch failed' };
        if (registrableDomain(next.hostname) !== origin) return { error: OFF_DOMAIN };
        url = next.toString();
        continue;
      }

      if (!res.ok) return { error: 'fetch failed' };
      const type = res.headers.get('content-type') ?? '';
      // robots.txt is plain text. (Until 2026-10-08 it was refused here as "not
      // html", so no robots.txt was ever read and none was ever honoured.)
      if (kind === 'robots' ? !/^text\//i.test(type) : !type.includes('html')) return { error: 'fetch failed' };
      return { html: await readCapped(res) };
    }
    return { error: 'fetch failed' };
  } catch {
    return { error: 'fetch failed' };
  } finally {
    clearTimeout(timer);
  }
}

/** The body as text, stopping at MAX_PAGE_BYTES. */
async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader?.();
  if (!reader) return (await res.text()).slice(0, MAX_PAGE_BYTES);
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_PAGE_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    total += value.length;
  }
  await reader.cancel().catch(() => {});
  const bytes = new Uint8Array(Math.min(total, MAX_PAGE_BYTES));
  let at = 0;
  for (const c of chunks) {
    const room = bytes.length - at;
    if (room <= 0) break;
    bytes.set(c.length > room ? c.subarray(0, room) : c, at);
    at += Math.min(c.length, room);
  }
  return new TextDecoder().decode(bytes);
}

async function fetchRobots(url: string): Promise<string | null> {
  const page = await fetchHtml(url, 'robots');
  return 'html' in page ? page.html : null;
}

/**
 * Claim the next free slot for a host and sleep until it. The slot is taken
 * before sleeping, so workers asking for the same host at the same moment
 * queue one second apart instead of all waking together.
 */
async function waitForHost(
  host: string,
  hostLastFetch: Map<string, number>
): Promise<void> {
  const now = Date.now();
  const slot = Math.max(now, (hostLastFetch.get(host) ?? 0) + PER_HOST_DELAY_MS);
  hostLastFetch.set(host, slot);
  if (slot > now) await new Promise((r) => setTimeout(r, slot - now));
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
    const body = await fetchRobots(`${origin}/robots.txt`).catch(() => null);
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
