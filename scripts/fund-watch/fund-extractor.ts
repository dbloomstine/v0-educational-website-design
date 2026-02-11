/**
 * Fund Watch Automation System - Fund Extractor
 *
 * Uses Claude Sonnet to extract structured fund data from articles.
 */

import type {
  FilteredArticle,
  ExtractedFund,
  ClaudeExtractResponse,
  FundCategory,
  FundStage,
  FundStrategy,
  TargetGeography,
} from './types';
import {
  PIPELINE_CONFIG,
  CATEGORY_KEYWORDS,
  STAGE_PATTERNS,
  AMOUNT_PATTERNS,
} from './config';
import { withRetry } from './retry';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const EXTRACT_PROMPT = `Extract structured fund data from this article. Return JSON only.

CRITICAL - FUND NAME RULES:
- The fund_name MUST be the actual name of the fund vehicle (e.g., "Apollo Credit Fund IX", "Blackstone Real Estate Partners X")
- NEVER use the article headline as the fund name
- NEVER include phrases like "commits to", "launches", "targets", "closes", "eyes", "mulls" in the fund name
- If the exact fund name is not stated, construct it from: [Firm Name] + [Strategy/Type] + [Fund Number if applicable]
- Examples of WRONG fund names: "Louisiana Teachers commits $100m to Crow Holdings fund", "Oaktree makes global credit fund available"
- Examples of CORRECT fund names: "Crow Holdings Real Estate Fund", "Oaktree Global Credit Fund"

CATEGORIES (pick exactly one):
- Venture Capital
- Private Equity
- Credit Funds
- Real Estate
- Infrastructure
- Secondaries & GP-Stakes
- Hedge Funds

STRATEGIES (pick the most specific one that applies, or null if unclear):
Venture Capital: Seed/Pre-Seed, Early Stage, Growth Stage, Late Stage, Sector-Specific
Private Equity: Buyout, Growth Equity, Lower Middle Market, Middle Market, Large Cap
Credit Funds: Direct Lending, Mezzanine, Distressed, Specialty Finance, Asset-Based
Real Estate: Core, Core-Plus, Value-Add, Opportunistic, Development
Infrastructure: Core Infrastructure, Infrastructure Equity, Energy Transition, Digital Infrastructure
Secondaries: LP Secondaries, GP-Led, Direct Secondaries, Continuation Fund
Hedge Funds: Long-Short Equity, Multi-Strategy, Global Macro, Event Driven, Quantitative, Arbitrage, Market Neutral

TARGET GEOGRAPHY (pick exactly one, or null if unclear):
- North America
- Europe
- Asia-Pacific
- Latin America
- Middle East & Africa
- Global (if multi-region or worldwide focus)

STAGES (pick exactly one):
- Final Close
- First Close
- Interim Close
- Launch
- Other

For amount_usd_millions:
- Convert billions to millions (e.g., $2.5B = 2500)
- Convert EUR/GBP to USD using rough 1.1x multiplier
- Return null if amount is unknown/undisclosed

For location:
- Use city-based location (e.g., "New York", "London", "Singapore")
- If city not mentioned, use firm HQ city if known
- Split into city, state (if US), country

For firm_website:
- Extract the fund manager's official website if mentioned in the article
- If not mentioned, infer from firm name (e.g., "blackstone.com" for Blackstone)
- Return just the domain without protocol (e.g., "blackstone.com" not "https://www.blackstone.com")
- Return null if unknown

JSON Format:
{
  "fund_name": "Actual fund vehicle name (NOT the article headline) - e.g., 'Apollo Credit Fund IX'",
  "firm": "Firm name (without 'LLC', 'LP', etc.)",
  "firm_website": "Firm's website domain (e.g., 'blackstone.com') or null",
  "amount": "Original amount string (e.g., '$2.5B', '€500M', 'Undisclosed')",
  "amount_usd_millions": number or null,
  "category": "Category from list above",
  "strategy": "Strategy from list above or null",
  "target_geography": "Geography from list above or null",
  "location": "City, State/Country",
  "city": "City name",
  "state": "State code if US (e.g., 'NY', 'CA'), empty otherwise",
  "country": "Country code (e.g., 'US', 'UK', 'Singapore')",
  "stage": "Stage from list above",
  "description": "1-2 sentence summary of the fund's strategy, focus, and any notable LP details"
}`;

/**
 * Call Claude API for extraction
 */
async function callClaudeExtract(
  article: FilteredArticle
): Promise<ClaudeExtractResponse | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable not set');
  }

  const userContent = `Title: ${article.title}
Source: ${article.source_name}
Date: ${article.published_date}
URL: ${article.url}
Content: ${article.content_snippet.slice(0, 1500)}`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: PIPELINE_CONFIG.EXTRACT_MODEL,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `${EXTRACT_PROMPT}\n\n${userContent}`,
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
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]) as ClaudeExtractResponse;
  } catch {
    console.error(`[Extract] Failed to parse response: ${text}`);
    return null;
  }
}

/**
 * Generate firm slug from name
 */
function generateFirmSlug(firm: string): string {
  return firm
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Validate and normalize category
 */
function normalizeCategory(category: string): FundCategory {
  const validCategories: FundCategory[] = [
    'Venture Capital',
    'Private Equity',
    'Credit Funds',
    'Real Estate',
    'Infrastructure',
    'Secondaries & GP-Stakes',
    'Hedge Funds',
  ];

  // Exact match
  if (validCategories.includes(category as FundCategory)) {
    return category as FundCategory;
  }

  // Fuzzy match by keywords
  const lowerCategory = category.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lowerCategory.includes(kw))) {
      return cat as FundCategory;
    }
  }

  // Default
  return 'Private Equity';
}

/**
 * Validate and normalize stage
 */
function normalizeStage(stage: string): FundStage {
  const validStages: FundStage[] = [
    'Final Close',
    'First Close',
    'Interim Close',
    'Launch',
    'Other',
  ];

  // Exact match
  if (validStages.includes(stage as FundStage)) {
    return stage as FundStage;
  }

  // Pattern match
  const lowerStage = stage.toLowerCase();
  for (const [stageName, pattern] of Object.entries(STAGE_PATTERNS)) {
    if (stageName !== 'Other' && pattern.test(lowerStage)) {
      return stageName as FundStage;
    }
  }

  return 'Other';
}

/**
 * Validate and normalize strategy
 */
function normalizeStrategy(strategy: string | undefined): FundStrategy | null {
  if (!strategy) return null;

  const validStrategies: FundStrategy[] = [
    // VC
    'Seed/Pre-Seed', 'Early Stage', 'Growth Stage', 'Late Stage', 'Sector-Specific',
    // PE
    'Buyout', 'Growth Equity', 'Lower Middle Market', 'Middle Market', 'Large Cap',
    // Credit
    'Direct Lending', 'Mezzanine', 'Distressed', 'Specialty Finance', 'Asset-Based',
    // Real Estate
    'Core', 'Core-Plus', 'Value-Add', 'Opportunistic', 'Development',
    // Infrastructure
    'Core Infrastructure', 'Infrastructure Equity', 'Energy Transition', 'Digital Infrastructure',
    // Secondaries
    'LP Secondaries', 'GP-Led', 'Direct Secondaries', 'Continuation Fund',
    // Hedge Funds
    'Long-Short Equity', 'Multi-Strategy', 'Global Macro', 'Event Driven', 'Quantitative', 'Arbitrage', 'Market Neutral',
    'Other',
  ];

  // Exact match
  if (validStrategies.includes(strategy as FundStrategy)) {
    return strategy as FundStrategy;
  }

  // Fuzzy match
  const lowerStrategy = strategy.toLowerCase();
  const strategyMap: Record<string, FundStrategy> = {
    'seed': 'Seed/Pre-Seed',
    'pre-seed': 'Seed/Pre-Seed',
    'early': 'Early Stage',
    'early-stage': 'Early Stage',
    'growth': 'Growth Stage',
    'late': 'Late Stage',
    'late-stage': 'Late Stage',
    'buyout': 'Buyout',
    'lbo': 'Buyout',
    'leveraged buyout': 'Buyout',
    'lower middle': 'Lower Middle Market',
    'middle market': 'Middle Market',
    'large cap': 'Large Cap',
    'mega cap': 'Large Cap',
    'direct lending': 'Direct Lending',
    'mezzanine': 'Mezzanine',
    'distressed': 'Distressed',
    'special situations': 'Distressed',
    'specialty finance': 'Specialty Finance',
    'asset-based': 'Asset-Based',
    'core': 'Core',
    'core-plus': 'Core-Plus',
    'core plus': 'Core-Plus',
    'value-add': 'Value-Add',
    'value add': 'Value-Add',
    'opportunistic': 'Opportunistic',
    'development': 'Development',
    'energy transition': 'Energy Transition',
    'renewables': 'Energy Transition',
    'digital infrastructure': 'Digital Infrastructure',
    'data center': 'Digital Infrastructure',
    'lp secondaries': 'LP Secondaries',
    'gp-led': 'GP-Led',
    'gp led': 'GP-Led',
    'continuation': 'Continuation Fund',
    // Hedge Fund strategies
    'long-short': 'Long-Short Equity',
    'long short': 'Long-Short Equity',
    'long/short': 'Long-Short Equity',
    'multi-strategy': 'Multi-Strategy',
    'multistrategy': 'Multi-Strategy',
    'global macro': 'Global Macro',
    'macro': 'Global Macro',
    'event driven': 'Event Driven',
    'event-driven': 'Event Driven',
    'quantitative': 'Quantitative',
    'quant': 'Quantitative',
    'systematic': 'Quantitative',
    'arbitrage': 'Arbitrage',
    'relative value': 'Arbitrage',
    'market neutral': 'Market Neutral',
    'market-neutral': 'Market Neutral',
  };

  for (const [key, value] of Object.entries(strategyMap)) {
    if (lowerStrategy.includes(key)) {
      return value;
    }
  }

  return null;
}

/**
 * Validate and normalize target geography
 */
function normalizeGeography(geography: string | undefined): TargetGeography | null {
  if (!geography) return null;

  const validGeographies: TargetGeography[] = [
    'North America',
    'Europe',
    'Asia-Pacific',
    'Latin America',
    'Middle East & Africa',
    'Global',
  ];

  // Exact match
  if (validGeographies.includes(geography as TargetGeography)) {
    return geography as TargetGeography;
  }

  // Fuzzy match
  const lowerGeo = geography.toLowerCase();
  const geoMap: Record<string, TargetGeography> = {
    'north america': 'North America',
    'us': 'North America',
    'united states': 'North America',
    'canada': 'North America',
    'europe': 'Europe',
    'eu': 'Europe',
    'european': 'Europe',
    'asia': 'Asia-Pacific',
    'asia-pacific': 'Asia-Pacific',
    'apac': 'Asia-Pacific',
    'pacific': 'Asia-Pacific',
    'latin america': 'Latin America',
    'latam': 'Latin America',
    'south america': 'Latin America',
    'middle east': 'Middle East & Africa',
    'mena': 'Middle East & Africa',
    'africa': 'Middle East & Africa',
    'global': 'Global',
    'worldwide': 'Global',
    'multi-region': 'Global',
  };

  for (const [key, value] of Object.entries(geoMap)) {
    if (lowerGeo.includes(key)) {
      return value;
    }
  }

  return null;
}

/**
 * Parse amount string to USD millions
 */
function parseAmountToMillions(amount: string): number | null {
  if (!amount || amount.toLowerCase().includes('undisclosed')) {
    return null;
  }

  for (const { regex, multiplier } of AMOUNT_PATTERNS) {
    const match = amount.match(regex);
    if (match) {
      const value = parseFloat(match[1]);
      return Math.round(value * multiplier);
    }
  }

  return null;
}

/**
 * Extract a single fund from article with retry logic
 */
export async function extractFund(
  article: FilteredArticle
): Promise<ExtractedFund | null> {
  try {
    const result = await withRetry(
      () => callClaudeExtract(article),
      { maxRetries: 3, initialDelayMs: 1000 }
    );
    if (!result) {
      return null;
    }

    // Normalize and validate extracted data
    const fund: ExtractedFund = {
      fund_name: result.fund_name || article.title.split(' - ')[0],
      firm: result.firm || 'Unknown',
      firm_website: result.firm_website || null,
      amount: result.amount || 'Undisclosed',
      amount_usd_millions:
        result.amount_usd_millions ?? parseAmountToMillions(result.amount),
      category: normalizeCategory(result.category),
      strategy: normalizeStrategy(result.strategy),
      target_geography: normalizeGeography(result.target_geography),
      location: result.location || 'N/A',
      city: result.city || 'N/A',
      state: result.state || '',
      country: result.country || 'N/A',
      stage: normalizeStage(result.stage),
      announcement_date: article.published_date,
      source_url: article.url,
      source_name: article.source_name,
      description_notes: result.description || '',
    };

    return fund;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Extract] Error for "${article.title}": ${errorMessage}`);
    return null;
  }
}

/**
 * Extract funds from multiple articles
 */
export async function extractFunds(
  articles: FilteredArticle[],
  options: { verbose?: boolean } = {}
): Promise<ExtractedFund[]> {
  const { verbose = false } = options;
  const fundArticles = articles.filter((a) => a.is_fund_news);
  const results: ExtractedFund[] = [];

  console.log(`[Extract] Processing ${fundArticles.length} fund articles...`);

  for (let i = 0; i < fundArticles.length; i++) {
    const article = fundArticles[i];
    const fund = await extractFund(article);

    if (fund) {
      results.push(fund);
      if (verbose) {
        console.log(
          `[Extract] ${i + 1}/${fundArticles.length} ✓ ${fund.fund_name} (${fund.amount})`
        );
      }
    } else if (verbose) {
      console.log(
        `[Extract] ${i + 1}/${fundArticles.length} ✗ Failed: ${article.title.slice(0, 50)}...`
      );
    }

    // Rate limiting
    await new Promise((resolve) =>
      setTimeout(resolve, PIPELINE_CONFIG.API_DELAY_MS)
    );
  }

  console.log(`[Extract] Result: ${results.length} funds extracted`);
  return results;
}

/**
 * Enrich extracted fund with firm slug
 */
export function enrichFund(fund: ExtractedFund): ExtractedFund & { firm_slug: string } {
  return {
    ...fund,
    firm_slug: generateFirmSlug(fund.firm),
  };
}
