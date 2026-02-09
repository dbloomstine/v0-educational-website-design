/**
 * Fund Watch Automation System - Normalizer
 *
 * Normalizes fund data (categories, stages, locations, amounts).
 */

import type { ExtractedFund, FundCategory, FundStage } from './types';
import {
  CATEGORY_KEYWORDS,
  STAGE_PATTERNS,
  AMOUNT_PATTERNS,
} from './config';

// ============================================================================
// Category Normalization
// ============================================================================

/**
 * Infer category from fund name and description
 */
export function inferCategory(
  fundName: string,
  description: string,
  existingCategory?: string
): FundCategory {
  const text = `${fundName} ${description}`.toLowerCase();

  // Priority order for category detection
  const categoryPriority: FundCategory[] = [
    'Secondaries & GP-Stakes',
    'Infrastructure',
    'Real Estate',
    'Credit Funds',
    'Venture Capital',
    'Private Equity',
  ];

  for (const category of categoryPriority) {
    const keywords = CATEGORY_KEYWORDS[category];
    if (keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      return category;
    }
  }

  // If existing category is valid, keep it
  const validCategories: FundCategory[] = [
    'Venture Capital',
    'Private Equity',
    'Credit Funds',
    'Real Estate',
    'Infrastructure',
    'Secondaries & GP-Stakes',
  ];

  if (existingCategory && validCategories.includes(existingCategory as FundCategory)) {
    return existingCategory as FundCategory;
  }

  return 'Private Equity'; // Default
}

/**
 * Normalize category string to valid FundCategory
 */
export function normalizeCategory(category: string): FundCategory {
  const validCategories: FundCategory[] = [
    'Venture Capital',
    'Private Equity',
    'Credit Funds',
    'Real Estate',
    'Infrastructure',
    'Secondaries & GP-Stakes',
  ];

  // Exact match
  if (validCategories.includes(category as FundCategory)) {
    return category as FundCategory;
  }

  // Common variations
  const categoryMap: Record<string, FundCategory> = {
    'vc': 'Venture Capital',
    'venture': 'Venture Capital',
    'pe': 'Private Equity',
    'buyout': 'Private Equity',
    'credit': 'Credit Funds',
    'debt': 'Credit Funds',
    'lending': 'Credit Funds',
    'realestate': 'Real Estate',
    'property': 'Real Estate',
    'infra': 'Infrastructure',
    'secondaries': 'Secondaries & GP-Stakes',
    'gpstakes': 'Secondaries & GP-Stakes',
    'gp-stakes': 'Secondaries & GP-Stakes',
  };

  const lowerCategory = category.toLowerCase().replace(/[^a-z]/g, '');
  for (const [key, value] of Object.entries(categoryMap)) {
    if (lowerCategory.includes(key)) {
      return value;
    }
  }

  return 'Private Equity';
}

// ============================================================================
// Stage Normalization
// ============================================================================

/**
 * Infer stage from fund name and description
 */
export function inferStage(
  fundName: string,
  description: string,
  existingStage?: string
): FundStage {
  const text = `${fundName} ${description}`;

  // Check patterns in priority order
  const stagePriority: FundStage[] = [
    'Final Close',
    'Interim Close',
    'First Close',
    'Launch',
  ];

  for (const stage of stagePriority) {
    if (stage !== 'Other' && STAGE_PATTERNS[stage].test(text)) {
      return stage;
    }
  }

  // If existing stage is valid, keep it
  const validStages: FundStage[] = [
    'Final Close',
    'First Close',
    'Interim Close',
    'Launch',
    'Other',
  ];

  if (existingStage && validStages.includes(existingStage as FundStage)) {
    return existingStage as FundStage;
  }

  return 'Other';
}

/**
 * Normalize stage string to valid FundStage
 */
export function normalizeStage(stage: string): FundStage {
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

  // Pattern-based detection
  for (const [stageName, pattern] of Object.entries(STAGE_PATTERNS)) {
    if (stageName !== 'Other' && pattern.test(stage)) {
      return stageName as FundStage;
    }
  }

  return 'Other';
}

// ============================================================================
// Amount Normalization
// ============================================================================

/**
 * Parse amount string to USD millions
 */
export function parseAmountToMillions(amount: string): number | null {
  if (!amount) return null;

  const lowerAmount = amount.toLowerCase();
  if (lowerAmount.includes('undisclosed') || lowerAmount === 'n/a') {
    return null;
  }

  for (const { regex, multiplier } of AMOUNT_PATTERNS) {
    const match = amount.match(regex);
    if (match) {
      const value = parseFloat(match[1]);
      return Math.round(value * multiplier * 10) / 10; // Round to 1 decimal
    }
  }

  return null;
}

/**
 * Format amount in millions to display string
 */
export function formatAmount(amountMillions: number | null): string {
  if (amountMillions === null) return 'Undisclosed';

  if (amountMillions >= 1000) {
    const billions = amountMillions / 1000;
    return `$${billions.toFixed(1)}B`.replace('.0B', 'B');
  }

  return `$${amountMillions}M`;
}

// ============================================================================
// Firm Website Mapping
// ============================================================================

/**
 * Known firm websites for fallback when not extracted from article
 */
export const FIRM_WEBSITE_MAP: Record<string, string> = {
  'blackstone': 'blackstone.com',
  'kkr': 'kkr.com',
  'apollo': 'apollo.com',
  'carlyle': 'carlyle.com',
  'tpg': 'tpg.com',
  'warburg': 'warburgpincus.com',
  'advent': 'adventinternational.com',
  'bain capital': 'baincapital.com',
  'sequoia': 'sequoiacap.com',
  'andreessen': 'a16z.com',
  'a16z': 'a16z.com',
  'lightspeed': 'lsvp.com',
  'accel': 'accel.com',
  'benchmark': 'benchmark.com',
  'greylock': 'greylock.com',
  'general catalyst': 'generalcatalyst.com',
  'goldman': 'goldmansachs.com',
  'morgan stanley': 'morganstanley.com',
  'coller': 'collercapital.com',
  'cvc': 'cvc.com',
  'eqt': 'eqtgroup.com',
  'permira': 'permira.com',
  'thoma bravo': 'thomabravo.com',
  'vista equity': 'vistaequitypartners.com',
  'silver lake': 'silverlake.com',
  'brookfield': 'brookfield.com',
  'ares': 'aresmgmt.com',
  'oaktree': 'oaktreecapital.com',
  'blue owl': 'blueowl.com',
  'hps': 'hpspartners.com',
  'owl rock': 'blueowl.com',
  'golub': 'golubcapital.com',
  'monroe capital': 'monroecap.com',
  'antares': 'antares.com',
  'arcmont': 'arcmont.com',
  'adia': 'adia.ae',
  'mubadala': 'mubadala.com',
  'gic': 'gic.com.sg',
  'temasek': 'temasek.com.sg',
  'cppib': 'cppinvestments.com',
  'cdpq': 'cdpq.com',
  'psp': 'investpsp.com',
  'otpp': 'otpp.com',
  'calpers': 'calpers.ca.gov',
  'calstrs': 'calstrs.com',
};

/**
 * Infer firm website from firm name or use extracted value
 */
export function inferFirmWebsite(firm: string, extracted?: string | null): string | null {
  // If a valid website was extracted, use it
  if (extracted && extracted.trim()) {
    // Remove protocol prefix if present and validate it looks like a domain
    const cleaned = extracted.replace(/^https?:\/\//, '').replace(/^www\./, '');
    if (cleaned.includes('.')) {
      return cleaned;
    }
  }

  // Try to find a match in our known firms map
  const lowerFirm = firm.toLowerCase();
  for (const [key, website] of Object.entries(FIRM_WEBSITE_MAP)) {
    if (lowerFirm.includes(key)) {
      return website;
    }
  }

  return null;
}

// ============================================================================
// Location Normalization
// ============================================================================

/**
 * Known firm headquarters for fallback location
 */
const FIRM_HQ_MAP: Record<string, { city: string; state: string; country: string }> = {
  'blackstone': { city: 'New York', state: 'NY', country: 'US' },
  'kkr': { city: 'New York', state: 'NY', country: 'US' },
  'apollo': { city: 'New York', state: 'NY', country: 'US' },
  'carlyle': { city: 'Washington', state: 'DC', country: 'US' },
  'tpg': { city: 'Fort Worth', state: 'TX', country: 'US' },
  'warburg': { city: 'New York', state: 'NY', country: 'US' },
  'advent': { city: 'Boston', state: 'MA', country: 'US' },
  'bain capital': { city: 'Boston', state: 'MA', country: 'US' },
  'sequoia': { city: 'Menlo Park', state: 'CA', country: 'US' },
  'andreessen': { city: 'Menlo Park', state: 'CA', country: 'US' },
  'a16z': { city: 'Menlo Park', state: 'CA', country: 'US' },
  'lightspeed': { city: 'Menlo Park', state: 'CA', country: 'US' },
  'accel': { city: 'Palo Alto', state: 'CA', country: 'US' },
  'benchmark': { city: 'San Francisco', state: 'CA', country: 'US' },
  'greylock': { city: 'Menlo Park', state: 'CA', country: 'US' },
  'general catalyst': { city: 'Cambridge', state: 'MA', country: 'US' },
  'goldman': { city: 'New York', state: 'NY', country: 'US' },
  'morgan stanley': { city: 'New York', state: 'NY', country: 'US' },
  'coller': { city: 'London', state: '', country: 'UK' },
  'cvc': { city: 'London', state: '', country: 'UK' },
  'eqt': { city: 'Stockholm', state: '', country: 'Sweden' },
  'permira': { city: 'London', state: '', country: 'UK' },
};

/**
 * Normalize location from city, state, country
 */
export function normalizeLocation(
  city: string,
  state: string,
  country: string
): string {
  if (!city || city === 'N/A') {
    if (country && country !== 'N/A') {
      return country;
    }
    return 'N/A';
  }

  if (state && country === 'US') {
    return `${city}, ${state}`;
  }

  if (country && country !== 'N/A' && country !== 'US') {
    return `${city}, ${country}`;
  }

  return city;
}

/**
 * Try to infer location from firm name
 */
export function inferLocationFromFirm(
  firm: string
): { city: string; state: string; country: string } | null {
  const lowerFirm = firm.toLowerCase();

  for (const [key, hq] of Object.entries(FIRM_HQ_MAP)) {
    if (lowerFirm.includes(key)) {
      return hq;
    }
  }

  return null;
}

// ============================================================================
// Full Fund Normalization
// ============================================================================

/**
 * Normalize all fields of an extracted fund
 */
export function normalizeFund(fund: ExtractedFund): ExtractedFund {
  // Infer category if not set or invalid
  const category = inferCategory(
    fund.fund_name,
    fund.description_notes,
    fund.category
  );

  // Infer stage if not set or invalid
  const stage = inferStage(
    fund.fund_name,
    fund.description_notes,
    fund.stage
  );

  // Parse amount if not set
  const amountMillions =
    fund.amount_usd_millions ?? parseAmountToMillions(fund.amount);

  // Try to infer location from firm if not set
  let { city, state, country } = fund;
  if ((!city || city === 'N/A') && fund.firm) {
    const inferred = inferLocationFromFirm(fund.firm);
    if (inferred) {
      city = inferred.city;
      state = inferred.state;
      country = inferred.country;
    }
  }

  // Build normalized location string
  const location = normalizeLocation(city, state, country);

  return {
    ...fund,
    category,
    stage,
    amount_usd_millions: amountMillions,
    location,
    city: city || 'N/A',
    state: state || '',
    country: country || 'N/A',
  };
}

/**
 * Normalize multiple funds
 */
export function normalizeFunds(funds: ExtractedFund[]): ExtractedFund[] {
  console.log(`[Normalize] Processing ${funds.length} funds...`);
  const normalized = funds.map(normalizeFund);
  console.log(`[Normalize] Done normalizing ${normalized.length} funds`);
  return normalized;
}
