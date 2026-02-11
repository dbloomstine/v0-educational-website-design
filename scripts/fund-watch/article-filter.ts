/**
 * Fund Watch Automation System - Article Filter
 *
 * Uses Claude Haiku to determine if an article is about fund news.
 */

import type { RawArticle, FilteredArticle, ClaudeFilterResponse } from './types';
import { PIPELINE_CONFIG } from './config';
import { withRetry } from './retry';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const FILTER_PROMPT = `You are a fund news classifier. Analyze the article title and snippet to determine if this is news about a fund vehicle close or launch.

INCLUDE (is_fund_news: true):
- Private equity fund closes/launches
- Venture capital fund closes/launches
- Private credit/direct lending fund closes/launches
- Real estate fund closes/launches
- Infrastructure fund closes/launches
- Secondaries fund closes/launches
- GP-stakes fund closes/launches
- Continuation vehicle closes
- Fund of funds closes/launches

EXCLUDE (is_fund_news: false):
- Startup funding rounds (Series A/B/C, seed round for a company)
- Company acquisitions by PE firms (the deal, not the fund)
- Hedge fund performance news
- ETF/mutual fund news
- Stock market news
- General investment news without specific fund vehicle
- LP allocations to funds (the LP's decision, not the fund's close)

Respond in JSON format only:
{
  "is_fund_news": boolean,
  "confidence": number (0-1),
  "reason": "brief explanation"
}`;

/**
 * Call Claude API for filtering
 */
async function callClaudeFilter(
  article: RawArticle
): Promise<ClaudeFilterResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable not set');
  }

  const userContent = `Title: ${article.title}
Source: ${article.source_name}
Date: ${article.published_date}
Snippet: ${article.content_snippet.slice(0, 500)}`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: PIPELINE_CONFIG.FILTER_MODEL,
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `${FILTER_PROMPT}\n\n${userContent}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = data.content[0]?.text || '';

  // Parse JSON from response
  try {
    // Extract JSON from response (might have markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]) as ClaudeFilterResponse;
  } catch {
    console.error(`[Filter] Failed to parse response: ${text}`);
    return {
      is_fund_news: false,
      confidence: 0,
      reason: 'Failed to parse response',
    };
  }
}

/**
 * Filter a single article with retry logic
 */
export async function filterArticle(
  article: RawArticle
): Promise<FilteredArticle> {
  try {
    const result = await withRetry(
      () => callClaudeFilter(article),
      { maxRetries: 3, initialDelayMs: 1000 }
    );

    return {
      ...article,
      is_fund_news: result.is_fund_news,
      confidence: result.confidence,
      reason: result.reason,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Filter] Error for "${article.title}": ${errorMessage}`);

    return {
      ...article,
      is_fund_news: false,
      confidence: 0,
      reason: `Error: ${errorMessage}`,
    };
  }
}

/**
 * Filter articles in batches
 */
export async function filterArticles(
  articles: RawArticle[],
  options: { verbose?: boolean } = {}
): Promise<FilteredArticle[]> {
  const { verbose = false } = options;
  const results: FilteredArticle[] = [];

  console.log(`[Filter] Processing ${articles.length} articles...`);

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const filtered = await filterArticle(article);
    results.push(filtered);

    if (verbose) {
      const status = filtered.is_fund_news ? '✓' : '✗';
      console.log(
        `[Filter] ${i + 1}/${articles.length} ${status} ${article.title.slice(0, 60)}...`
      );
    }

    // Rate limiting
    await new Promise((resolve) =>
      setTimeout(resolve, PIPELINE_CONFIG.API_DELAY_MS)
    );
  }

  const fundNews = results.filter((r) => r.is_fund_news);
  console.log(
    `[Filter] Result: ${fundNews.length}/${articles.length} articles are fund news`
  );

  return results;
}

/**
 * Pre-filter articles using simple heuristics before Claude
 * This reduces API calls by filtering obvious non-fund news
 *
 * STRATEGY: REQUIRE a fund-related signal to pass. Articles must match at least
 * one include pattern to be sent to Claude. This keeps volume manageable (~100-200
 * articles) while catching legitimate fund news.
 */
export function preFilterArticles(articles: RawArticle[]): RawArticle[] {
  // Exclude patterns - remove even if they match include patterns
  const excludePatterns = [
    // Startup funding rounds (Series A/B/C for companies, not fund vehicles)
    /\braises?\s+\$?\d+.*\bseries\s+[a-z]\b/i,
    /\bseries\s+[a-z]\b.*\bfunding\b/i,
    /\bseed\s+(round|funding)\b/i,
    // Performance/returns news (about existing fund results, not closes)
    /\breturns?\s+\d+%/i,
    /\bperformance\b.*\b(quarter|annual|year)\b/i,
    /\bhedge fund\b.*\b(gains?|losses?|returns?|beats?|trails?)\b/i,
    // Stock/market news
    /\bipo\b/i,
    /\bstock\s+price\b/i,
    /\bmarket\s+cap\b/i,
    /\bshares?\s+(fall|rise|drop|surge|plunge)\b/i,
    /\bearnings?\s+(report|miss|beat)\b/i,
    // ETF/mutual fund (not PE/VC)
    /\betf\b/i,
    /\bmutual fund\b/i,
    /\bindex fund\b/i,
  ];

  // Include patterns - MUST match at least one to pass to Claude
  const includePatterns = [
    // Core fund close/launch patterns
    /\bfund\b.*\b(close[ds]?|launch(es|ed)?|raise[ds]?|debut)\b/i,
    /\b(final|first|interim|initial)\s+close\b/i,
    /\boversubscribed\b/i,
    /\bhard cap\b/i,
    // Amount + fund patterns
    /\b\$\d+(\.\d+)?\s*(billion|bn|b|million|mn|m)\b.*\bfund\b/i,
    /\bfund\b.*\b\$\d+(\.\d+)?\s*(billion|bn|b|million|mn|m)\b/i,
    // Fund type patterns (these are specific enough)
    /\bprivate (equity|credit|debt)\s+fund\b/i,
    /\bventure (capital|fund)\b.*\b(close|raise|launch|target)\b/i,
    /\binfrastructure fund\b/i,
    /\breal estate fund\b/i,
    /\bsecondaries?\s+fund\b/i,
    /\bcontinuation\s+(fund|vehicle)\b/i,
    /\bgp[- ]?stakes?\b/i,
    /\bcredit fund\b/i,
    /\bdirect lending\b.*\bfund\b/i,
    // Fundraising completion patterns
    /\b(completes?|closes?|reaches?)\s+(fundrais|its\s+fund|the\s+fund)/i,
    /\bfundraising\b.*\b(complete[ds]?|close[ds]?)\b/i,
    /\bcommitments?\b.*\b(billion|million)\b/i,
  ];

  return articles.filter((a) => {
    const text = `${a.title} ${a.content_snippet}`.toLowerCase();

    // First check excludes - these are definite rejections
    if (excludePatterns.some((p) => p.test(text))) {
      return false;
    }

    // MUST match at least one include pattern to pass
    // This is the key change - no more "default: keep"
    return includePatterns.some((p) => p.test(text));
  });
}
