/**
 * Fund Watch Automation System - Type Definitions
 *
 * Shared TypeScript interfaces for the fund watch automation pipeline.
 */

// ============================================================================
// Core Fund Types
// ============================================================================

export type FundCategory =
  | 'Venture Capital'
  | 'Private Equity'
  | 'Credit Funds'
  | 'Real Estate'
  | 'Infrastructure'
  | 'Secondaries & GP-Stakes'
  | 'Hedge Funds';

export type FundStage =
  | 'Launch'
  | 'First Close'
  | 'Interim Close'
  | 'Final Close'
  | 'Other';

export type FundStrategy =
  // Venture Capital strategies
  | 'Seed/Pre-Seed'
  | 'Early Stage'
  | 'Growth Stage'
  | 'Late Stage'
  | 'Sector-Specific'
  // Private Equity strategies
  | 'Buyout'
  | 'Growth Equity'
  | 'Lower Middle Market'
  | 'Middle Market'
  | 'Large Cap'
  // Credit strategies
  | 'Direct Lending'
  | 'Mezzanine'
  | 'Distressed'
  | 'Specialty Finance'
  | 'Asset-Based'
  // Real Estate strategies
  | 'Core'
  | 'Core-Plus'
  | 'Value-Add'
  | 'Opportunistic'
  | 'Development'
  // Infrastructure strategies
  | 'Core Infrastructure'
  | 'Infrastructure Equity'
  | 'Energy Transition'
  | 'Digital Infrastructure'
  // Secondaries strategies
  | 'LP Secondaries'
  | 'GP-Led'
  | 'Direct Secondaries'
  | 'Continuation Fund'
  // Hedge Fund strategies
  | 'Long-Short Equity'
  | 'Multi-Strategy'
  | 'Global Macro'
  | 'Event Driven'
  | 'Quantitative'
  | 'Arbitrage'
  | 'Market Neutral'
  | 'Other';

export type TargetGeography =
  | 'North America'
  | 'Europe'
  | 'Asia-Pacific'
  | 'Latin America'
  | 'Middle East & Africa'
  | 'Global';

// ============================================================================
// Fund Entities
// ============================================================================

export interface FundArticle {
  title: string;
  url: string;
  source_name: string;
  source_domain: string;
  published_date: string;
  summary: string;
  feed_name: string;
}

export interface Fund {
  fund_name: string;
  firm: string;
  firm_slug: string;
  firm_website: string | null;
  amount: string;
  amount_usd_millions: number | null;
  category: FundCategory;
  strategy: FundStrategy | null;
  target_geography: TargetGeography | null;
  location: string;
  city: string;
  state: string;
  country: string;
  stage: FundStage;
  announcement_date: string;
  source_url: string;
  source_name: string;
  description_notes: string;
  is_covered: boolean;
  covered_date: string | null;
  date_added: string;
  articles: FundArticle[];
}

export interface CoveredFund {
  fund_name: string;
  firm: string;
  amount: string;
  category: FundCategory;
  location: string;
  stage?: string;
  date_covered: string;
  announcement_date: string;
  source_url: string;
}

// ============================================================================
// Feed Health Tracking
// ============================================================================

export interface FeedHealth {
  feed_name: string;
  feed_url: string;
  last_fetch: string | null;
  last_success: string | null;
  error_count: number;
  article_count: number;
  last_error: string;
  enabled: boolean;
}

// ============================================================================
// Data Files
// ============================================================================

export interface FundDirectoryStats {
  total_funds: number;
  total_covered: number;
  total_uncovered: number;
  total_aum_millions: number;
  by_category: Record<FundCategory, number>;
  by_stage: Record<FundStage, number>;
  by_strategy: Record<string, number>;
  by_geography: Record<string, number>;
  article_count: number;
  feed_count: number;
  date_range: {
    earliest: string;
    latest: string;
  };
}

export interface FundDirectory {
  generated_at: string;
  funds: Fund[];
  strategies: FundStrategy[];
  geographies: TargetGeography[];
  feed_health: FeedHealth[];
  stats: FundDirectoryStats;
}

export interface CoveredFundsFile {
  last_updated: string;
  schema_version: string;
  covered_funds: CoveredFund[];
}

// ============================================================================
// RSS Feed Types
// ============================================================================

export interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  content?: string;
  contentSnippet?: string;
  creator?: string;
  isoDate?: string;
}

export interface RSSFeed {
  title: string;
  link: string;
  items: RSSItem[];
}

export interface FeedConfig {
  name: string;
  url: string;
  type: 'rss' | 'google-news';
  enabled: boolean;
}

// ============================================================================
// Article Processing
// ============================================================================

export interface RawArticle {
  title: string;
  url: string;
  published_date: string;
  content_snippet: string;
  source_name: string;
  source_domain: string;
  feed_name: string;
}

export interface FilteredArticle extends RawArticle {
  is_fund_news: boolean;
  confidence: number;
  reason?: string;
}

export interface ExtractedFund {
  fund_name: string;
  firm: string;
  firm_website?: string | null;
  amount: string;
  amount_usd_millions: number | null;
  category: FundCategory;
  strategy: FundStrategy | null;
  target_geography: TargetGeography | null;
  location: string;
  city: string;
  state: string;
  country: string;
  stage: FundStage;
  announcement_date: string;
  source_url: string;
  source_name: string;
  description_notes: string;
}

// ============================================================================
// Deduplication
// ============================================================================

export interface DedupeKey {
  normalized_firm: string;
  fund_number: string;
  key: string;
}

export interface DedupeResult {
  unique_funds: ExtractedFund[];
  duplicates: Array<{
    fund: ExtractedFund;
    matched_with: string;
    match_type: 'exact' | 'fuzzy';
  }>;
}

// ============================================================================
// Processing Pipeline
// ============================================================================

export interface PipelineContext {
  dry_run: boolean;
  verbose: boolean;
  start_time: Date;
  feeds_processed: number;
  articles_fetched: number;
  articles_filtered: number;
  funds_extracted: number;
  funds_deduplicated: number;
  funds_added: number;
  errors: Array<{
    stage: string;
    message: string;
    details?: unknown;
  }>;
}

export interface PipelineResult {
  success: boolean;
  context: PipelineContext;
  new_funds: Fund[];
  updated_feeds: FeedHealth[];
}

// ============================================================================
// Claude API Types
// ============================================================================

export interface ClaudeFilterResponse {
  is_fund_news: boolean;
  confidence: number;
  reason: string;
}

export interface ClaudeExtractResponse {
  fund_name: string;
  firm: string;
  firm_website?: string;
  amount: string;
  amount_usd_millions: number | null;
  category: string;
  strategy?: string;
  target_geography?: string;
  location: string;
  city: string;
  state: string;
  country: string;
  stage: string;
  description: string;
}
