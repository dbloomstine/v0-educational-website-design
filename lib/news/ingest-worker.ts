/**
 * News Ingestion Worker
 *
 * Fetches articles from feed_sources that are due for a fetch,
 * deduplicates via url_hash and content_hash, and inserts new
 * articles into news_items with classification_status = 'pending'.
 *
 * Rate limiting:
 * - Max 5 concurrent feed fetches
 * - 100ms delay between requests to the same domain
 *
 * Called by cron routes with tier filters:
 * - Every 15 min: tiers [1, 2]
 * - Every hour: tiers [3, 4, 5]
 * - Every 6 hours: tier [6]
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchFeed } from './rss-client';
import { createHash } from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any>;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface IngestionConfig {
  supabase: DbClient;
  /** Only fetch feeds in these tiers. If empty, fetch all due feeds. */
  tiers?: number[];
  /** Max concurrent feed fetches (default 5) */
  concurrency?: number;
}

export interface IngestionResult {
  feedsFetched: number;
  feedsFailed: number;
  articlesFound: number;
  articlesInserted: number;
  articlesDuplicate: number;
  errors: string[];
  durationMs: number;
}

interface FeedSourceRow {
  id: string;
  name: string;
  url: string;
  tier: number;
  category: string[] | null;
  fetch_interval_minutes: number;
  last_fetched_at: string | null;
  source_type: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_CONCURRENCY = 5;
const DOMAIN_DELAY_MS = 100;

// ─── Main ───────────────────────────────────────────────────────────────────

export async function runIngestion(config: IngestionConfig): Promise<IngestionResult> {
  const start = Date.now();
  const concurrency = config.concurrency ?? DEFAULT_CONCURRENCY;

  const result: IngestionResult = {
    feedsFetched: 0,
    feedsFailed: 0,
    articlesFound: 0,
    articlesInserted: 0,
    articlesDuplicate: 0,
    errors: [],
    durationMs: 0,
  };

  // 1. Get feeds that are due for fetching
  const feeds = await getDueFeeds(config.supabase, config.tiers);
  if (feeds.length === 0) {
    result.durationMs = Date.now() - start;
    return result;
  }

  // 2. Process feeds in batches of `concurrency`
  const domainLastFetch = new Map<string, number>();

  for (let i = 0; i < feeds.length; i += concurrency) {
    const batch = feeds.slice(i, i + concurrency);

    const batchResults = await Promise.allSettled(
      batch.map(async (feed) => {
        // Domain-level rate limiting
        const domain = extractDomain(feed.url);
        if (domain) {
          const lastFetch = domainLastFetch.get(domain) ?? 0;
          const elapsed = Date.now() - lastFetch;
          if (elapsed < DOMAIN_DELAY_MS) {
            await sleep(DOMAIN_DELAY_MS - elapsed);
          }
          domainLastFetch.set(domain, Date.now());
        }

        return processFeed(config.supabase, feed);
      })
    );

    for (let j = 0; j < batchResults.length; j++) {
      const br = batchResults[j];
      const feed = batch[j];

      if (br.status === 'fulfilled') {
        const fr = br.value;
        result.feedsFetched++;
        result.articlesFound += fr.articlesFound;
        result.articlesInserted += fr.inserted;
        result.articlesDuplicate += fr.duplicate;

        // Update feed_sources with success
        await config.supabase
          .from('feed_sources')
          .update({
            last_fetched_at: new Date().toISOString(),
            last_success_at: new Date().toISOString(),
            consecutive_failures: 0,
            total_articles_ingested: fr.totalIngested,
          })
          .eq('id', feed.id);

        for (const err of fr.errors) {
          result.errors.push(`[${feed.name}] ${err}`);
        }
      } else {
        result.feedsFailed++;
        const errMsg = br.reason instanceof Error ? br.reason.message : String(br.reason);
        result.errors.push(`[${feed.name}] ${errMsg}`);

        // Update feed_sources with failure
        await updateFeedFailure(config.supabase, feed.id);
      }
    }
  }

  result.durationMs = Date.now() - start;
  return result;
}

// ─── Get due feeds ──────────────────────────────────────────────────────────

async function getDueFeeds(
  supabase: DbClient,
  tiers?: number[]
): Promise<FeedSourceRow[]> {
  let query = supabase
    .from('feed_sources')
    .select('id, name, url, tier, category, fetch_interval_minutes, last_fetched_at, source_type')
    .eq('is_active', true);

  if (tiers && tiers.length > 0) {
    query = query.in('tier', tiers);
  }

  const { data, error } = await query.order('last_fetched_at', { ascending: true, nullsFirst: true });

  if (error || !data) return [];

  const now = Date.now();
  return (data as FeedSourceRow[]).filter((feed) => {
    if (!feed.last_fetched_at) return true; // Never fetched
    const lastFetch = new Date(feed.last_fetched_at).getTime();
    const intervalMs = feed.fetch_interval_minutes * 60 * 1000;
    return now - lastFetch >= intervalMs;
  });
}

// ─── Process a single feed ──────────────────────────────────────────────────

interface FeedProcessResult {
  articlesFound: number;
  inserted: number;
  duplicate: number;
  totalIngested: number;
  errors: string[];
}

async function processFeed(
  supabase: DbClient,
  feed: FeedSourceRow
): Promise<FeedProcessResult> {
  const result: FeedProcessResult = {
    articlesFound: 0,
    inserted: 0,
    duplicate: 0,
    totalIngested: 0,
    errors: [],
  };

  // Fetch the feed
  const feedResult = await fetchFeed(feed.url, feed.name);
  if (feedResult.error) {
    throw new Error(feedResult.error);
  }

  result.articlesFound = feedResult.articles.length;

  // Get current total for incrementing
  const { data: currentFeed } = await supabase
    .from('feed_sources')
    .select('total_articles_ingested')
    .eq('id', feed.id)
    .single();

  let currentTotal = (currentFeed?.total_articles_ingested as number) ?? 0;

  // Pre-compute hashes for all articles
  const articlesWithHashes = feedResult.articles
    .filter((article) => !!article.link)
    .map((article) => {
      const normalizedUrl = normalizeUrl(article.link!);
      const urlHash = hashString(normalizedUrl);
      const contentText = `${article.title} ${(article.description || '').slice(0, 500)}`;
      const contentHash = hashString(normalizeText(contentText));
      return { article, urlHash, contentHash };
    });

  if (articlesWithHashes.length === 0) {
    result.totalIngested = currentTotal;
    return result;
  }

  // Batch dedup: fetch all existing url_hashes, content_hashes, and legacy source_urls in parallel
  const allUrlHashes = articlesWithHashes.map((a) => a.urlHash);
  const allContentHashes = articlesWithHashes.map((a) => a.contentHash);
  const allSourceUrls = articlesWithHashes.map((a) => a.article.link!);

  const [{ data: urlHashMatches }, { data: contentHashMatches }, { data: legacyMatches }] = await Promise.all([
    supabase
      .from('news_items')
      .select('url_hash')
      .in('url_hash', allUrlHashes),
    supabase
      .from('news_items')
      .select('content_hash')
      .in('content_hash', allContentHashes),
    supabase
      .from('news_items')
      .select('source_url')
      .in('source_url', allSourceUrls),
  ]);

  const existingUrlHashes = new Set(
    (urlHashMatches ?? []).map((m: { url_hash: string }) => m.url_hash)
  );
  const existingContentHashes = new Set(
    (contentHashMatches ?? []).map((m: { content_hash: string }) => m.content_hash)
  );
  const existingSourceUrls = new Set(
    (legacyMatches ?? []).map((m: { source_url: string }) => m.source_url)
  );

  // Process each article using pre-fetched dedup sets
  for (const { article, urlHash, contentHash } of articlesWithHashes) {
    // Check for duplicate using batch-loaded sets
    if (existingUrlHashes.has(urlHash) || existingContentHashes.has(contentHash)) {
      result.duplicate++;
      continue;
    }

    if (existingSourceUrls.has(article.link!)) {
      result.duplicate++;
      continue;
    }

    // Pre-filter obviously irrelevant content at ingest time to save classification costs
    const classificationStatus = isIrrelevantAtIngest(article.title)
      ? 'filtered'
      : 'pending';

    // Insert new article
    const { error: insertError } = await supabase.from('news_items').insert({
      title: article.title,
      source_url: article.link,
      source_name: article.sourceName,
      published_date: article.pubDate,
      description: article.description || null,
      url_hash: urlHash,
      content_hash: contentHash,
      feed_source_id: feed.id,
      classification_status: classificationStatus,
      source_type: 'rss',
      is_duplicate: false,
      processing_attempts: 0,
    });

    if (insertError) {
      // Likely unique constraint on source_url — treat as duplicate
      if (insertError.code === '23505') {
        result.duplicate++;
      } else {
        result.errors.push(`Insert failed for "${article.title.slice(0, 50)}": ${insertError.message}`);
      }
      continue;
    }

    result.inserted++;
    currentTotal++;
  }

  result.totalIngested = currentTotal;

  // Update avg_articles_per_fetch
  if (result.articlesFound > 0) {
    const { data: feedData } = await supabase
      .from('feed_sources')
      .select('avg_articles_per_fetch, total_articles_ingested')
      .eq('id', feed.id)
      .single();

    const currentAvg = (feedData?.avg_articles_per_fetch as number) ?? 0;
    // Running average: weighted toward recent (0.3 old, 0.7 new)
    const newAvg = currentAvg > 0
      ? currentAvg * 0.3 + result.articlesFound * 0.7
      : result.articlesFound;

    await supabase
      .from('feed_sources')
      .update({ avg_articles_per_fetch: Math.round(newAvg * 100) / 100 })
      .eq('id', feed.id);
  }

  return result;
}

// ─── Feed failure tracking ──────────────────────────────────────────────────

async function updateFeedFailure(supabase: DbClient, feedId: string): Promise<void> {
  // Get current failure count
  const { data } = await supabase
    .from('feed_sources')
    .select('consecutive_failures')
    .eq('id', feedId)
    .single();

  const failures = ((data?.consecutive_failures as number) ?? 0) + 1;

  const update: Record<string, unknown> = {
    last_fetched_at: new Date().toISOString(),
    last_failure_at: new Date().toISOString(),
    consecutive_failures: failures,
  };

  // Deactivate after 3 consecutive failures
  if (failures >= 3) {
    update.is_active = false;
  }

  await supabase
    .from('feed_sources')
    .update(update)
    .eq('id', feedId);
}

// ─── Utility functions ──────────────────────────────────────────────────────

/** Normalize a URL for deduplication: strip tracking params, utm_, fragment */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.toLowerCase().trim());
    // Remove common tracking params
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'ref', 'source', 'mc_cid', 'mc_eid',
    ];
    for (const param of trackingParams) {
      u.searchParams.delete(param);
    }
    u.hash = '';
    // Remove trailing slash
    let path = u.pathname.replace(/\/+$/, '');
    if (!path) path = '/';
    return `${u.protocol}//${u.host}${path}${u.search}`;
  } catch {
    return url.toLowerCase().trim().replace(/\/+$/, '');
  }
}

/** Normalize text for content hashing */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** SHA-256 hash of a string */
export function hashString(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/** Extract domain from URL */
function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Pre-filter obviously irrelevant articles at ingest time.
 * These are stored with classification_status='filtered' to skip
 * Claude Haiku classification, saving ~10-15% of API costs.
 * Articles are still stored for auditing.
 */
const INGEST_IRRELEVANT_PATTERNS = [
  /inventhelp/i,
  /patent.*publish/i,
  /inventor develops/i,
  /beauty brand|cosmetic|skincare|fragrance/i,
  /celebrity|reality tv|red carpet/i,
  /sports betting|fantasy sports|lottery/i,
  /restaurant (opens|closes|menu)/i,
  /recipe|cooking class|food truck/i,
  /wedding (plan|venue|dress)/i,
  /weight loss|diet pill|supplement/i,
  /horoscope|astrology|zodiac/i,
  /crypto.*price|bitcoin.*price|ethereum.*price/i,
  /nft.*launch|nft.*drop|nft.*collection/i,
  // Medical / health / pharma research (not fund ops)
  /\b(herpes|hiv vaccine|clinical trial|drug trial|fda approv|tumor|cancer treatment|gene therapy)\b/i,
  /\b(chiropractic|chiropractor|physical therapy|dental|optometry)\b/i,
  // Sports / entertainment
  /\b(fifa|uefa|nfl draft|nba|mlb|nhl|world cup|olympic|esports|gaming tournament)\b/i,
  /\b(movie review|film festival|box office|album release|concert tour)\b/i,
  // Podcasts / opinion / editorial (not news)
  /\b(podcast episode|podcast recap|opinion:|editorial:|op-ed)\b/i,
  // Non-business press releases
  /\b(church|parish|congregation|sermon|worship)\b/i,
  /\b(high school|elementary school|middle school|prom|homecoming)\b/i,
  // Spam / SEO content
  /\b(best \d+ tips|top \d+ ways|you won't believe|click here)\b/i,
];

function isIrrelevantAtIngest(title: string): boolean {
  // Non-English detection: >30% non-Latin characters
  // eslint-disable-next-line no-control-regex
  const nonLatin = title.replace(/[\x00-\x7F\u00C0-\u024F\u1E00-\u1EFF]/g, '').length;
  if (nonLatin > title.length * 0.3) return true;

  return INGEST_IRRELEVANT_PATTERNS.some((pat) => pat.test(title));
}
