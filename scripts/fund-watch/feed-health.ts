/**
 * Fund Watch Automation System - Feed Health
 *
 * Tracks feed status and auto-disables failing feeds.
 */

import type { FeedHealth, FeedConfig } from './types';
import { FEED_HEALTH_CONFIG } from './config';

/**
 * Update feed health after a fetch attempt
 */
export function updateFeedHealth(
  existing: FeedHealth | undefined,
  feedConfig: FeedConfig,
  success: boolean,
  articleCount: number,
  error?: string
): FeedHealth {
  const now = new Date().toISOString();

  if (success) {
    return {
      feed_name: feedConfig.name,
      feed_url: feedConfig.url,
      last_fetch: now,
      last_success: now,
      error_count: 0,
      article_count: articleCount,
      last_error: '',
      enabled: true,
    };
  }

  // Error case
  const newErrorCount = (existing?.error_count || 0) + 1;
  const shouldDisable = newErrorCount >= FEED_HEALTH_CONFIG.MAX_ERROR_COUNT;

  return {
    feed_name: feedConfig.name,
    feed_url: feedConfig.url,
    last_fetch: now,
    last_success: existing?.last_success || null,
    error_count: newErrorCount,
    article_count: existing?.article_count || 0,
    last_error: error || 'Unknown error',
    enabled: !shouldDisable,
  };
}

/**
 * Check if a feed is stale (no successful fetch in threshold period)
 */
export function isFeedStale(health: FeedHealth): boolean {
  if (!health.last_success) return true;

  const lastSuccess = new Date(health.last_success);
  const now = new Date();
  const hoursSinceSuccess =
    (now.getTime() - lastSuccess.getTime()) / (1000 * 60 * 60);

  return hoursSinceSuccess > FEED_HEALTH_CONFIG.STALE_THRESHOLD_HOURS;
}

/**
 * Get feeds that should be re-enabled (manual intervention needed)
 */
export function getDisabledFeeds(healthList: FeedHealth[]): FeedHealth[] {
  return healthList.filter((h) => !h.enabled);
}

/**
 * Get feeds with warnings (stale or high error count)
 */
export function getFeedsWithWarnings(healthList: FeedHealth[]): Array<{
  health: FeedHealth;
  warning: string;
}> {
  const warnings: Array<{ health: FeedHealth; warning: string }> = [];

  for (const health of healthList) {
    if (!health.enabled) {
      warnings.push({
        health,
        warning: `Disabled after ${health.error_count} consecutive failures`,
      });
    } else if (isFeedStale(health)) {
      warnings.push({
        health,
        warning: `No successful fetch in ${FEED_HEALTH_CONFIG.STALE_THRESHOLD_HOURS}+ hours`,
      });
    } else if (health.error_count > 0) {
      warnings.push({
        health,
        warning: `${health.error_count} consecutive errors (will disable at ${FEED_HEALTH_CONFIG.MAX_ERROR_COUNT})`,
      });
    }
  }

  return warnings;
}

/**
 * Reset error count for a feed (for manual re-enabling)
 */
export function resetFeedHealth(health: FeedHealth): FeedHealth {
  return {
    ...health,
    error_count: 0,
    last_error: '',
    enabled: true,
  };
}

/**
 * Merge new health data with existing health list
 */
export function mergeHealthLists(
  existing: FeedHealth[],
  updates: FeedHealth[]
): FeedHealth[] {
  const healthMap = new Map<string, FeedHealth>();

  // Start with existing
  for (const h of existing) {
    healthMap.set(h.feed_url, h);
  }

  // Apply updates
  for (const h of updates) {
    healthMap.set(h.feed_url, h);
  }

  return Array.from(healthMap.values());
}

/**
 * Generate health report summary
 */
export function generateHealthReport(healthList: FeedHealth[]): string {
  const total = healthList.length;
  const enabled = healthList.filter((h) => h.enabled).length;
  const disabled = total - enabled;
  const stale = healthList.filter((h) => h.enabled && isFeedStale(h)).length;
  const healthy = enabled - stale;

  const lines = [
    `Feed Health Report`,
    `==================`,
    `Total Feeds: ${total}`,
    `  Healthy: ${healthy}`,
    `  Stale: ${stale}`,
    `  Disabled: ${disabled}`,
    ``,
  ];

  const warnings = getFeedsWithWarnings(healthList);
  if (warnings.length > 0) {
    lines.push('Warnings:');
    for (const { health, warning } of warnings) {
      lines.push(`  - ${health.feed_name}: ${warning}`);
    }
  }

  return lines.join('\n');
}

/**
 * Get enabled feeds from health list
 */
export function getEnabledFeeds(
  feeds: FeedConfig[],
  healthList: FeedHealth[]
): FeedConfig[] {
  const disabledUrls = new Set(
    healthList.filter((h) => !h.enabled).map((h) => h.feed_url)
  );

  return feeds.filter((f) => f.enabled && !disabledUrls.has(f.url));
}
