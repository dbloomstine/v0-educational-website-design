/**
 * AI Article Classification
 *
 * Processes articles with classification_status = 'pending':
 * - Fund category tagging (PE, VC, credit, hedge, etc.)
 * - Article type classification (fund_launch, fund_close, etc.)
 * - High-signal detection
 * - Relevance scoring (0-1)
 * - Entity extraction (raw)
 * - 2-sentence AI summary
 *
 * Uses Claude Haiku in batches of 10 articles per API call.
 * Budget: ~$0.50/run max.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveFirmDomain } from './resolve-firm-logo';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any>;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ClassificationResult {
  articlesProcessed: number;
  articlesFailed: number;
  errors: string[];
}

interface ArticleForClassification {
  id: string;
  title: string;
  description: string | null;
  full_text: string | null;
  source_name: string | null;
}

interface ClassificationOutput {
  fund_categories: string[];
  article_type: string;
  source_type: string;
  is_high_signal: boolean;
  signal_reason: string | null;
  relevance_score: number;
  summary_ai: string;
  entities: Array<{
    name: string;
    type: 'firm' | 'fund' | 'person';
    role: string | null;
    confidence: number;
  }>;
  fund_size_usd_millions: number | null;
  original_currency: string | null;
  original_amount_millions: number | null;
  close_type: string | null;
  firm_name: string | null;
  fund_name: string | null;
  fund_strategy: string | null;
  geography: string[] | null;
  person_name: string | null;
  person_title: string | null;
  city: string | null;
  fund_number: string | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const BATCH_SIZE = 10;
const MAX_ARTICLES_PER_RUN = 100;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are classifying news articles about investment funds and alternative asset management for a professional intelligence database used by business development professionals.

For each article, return a JSON object with exactly these fields:
{
  "fund_categories": string[],     // subset of: ["PE","VC","credit","hedge","real_estate","infrastructure","secondaries","gp_stakes"] — all that apply. Use UPPERCASE for PE and VC.
  "article_type": string,          // one of: fund_launch, fund_close, capital_raise, executive_hire, executive_departure, executive_change, acquisition, regulatory_action, legal_alert, market_commentary, press_release, industry_analysis, award, other. Use "acquisition" for BOTH acquisitions and mergers.
  "source_type": string,           // one of: press_release, trade_press, news_wire, law_firm, regulatory, blog
  "is_high_signal": boolean,       // true for: fund launch/close with named firm, C-suite/partner hire at fund manager, regulatory enforcement, M&A between GPs or service providers
  "signal_reason": string | null,  // brief reason if is_high_signal
  "relevance_score": number,       // 0.0–1.0 — use scoring guide below
  "summary_ai": string,            // 1-2 sentence data-forward summary. Lead with specific facts: fund size, strategy, LP base, close type, key terms. NO filler phrases like "demonstrates", "represents a significant", "marks the firm's entry", "reflects institutional investor confidence". If the article lacks specific details beyond the headline, write ONE short sentence. Write for a senior BD professional who reads 50 of these a day — every word must earn its place.
  "entities": [
    { "name": string, "type": "firm"|"fund"|"person", "role": string | null, "confidence": number }
  ],
  "firm_name": string | null,      // ALWAYS extract the primary fund manager / GP / investment firm mentioned. For exec moves, the firm they joined or left. For M&A, the acquirer. For market commentary, the most prominent fund manager discussed. Extract aggressively — if ANY fund manager is named in the headline, extract it.
  "fund_name": string | null,      // specific fund vehicle name (e.g. "Apollo Fund X", "Blackstone Real Estate Partners IX"). null if no specific fund named.
  "fund_size_usd_millions": number | null,  // size of the SPECIFIC fund vehicle being raised, launched, or closed — in USD millions. Convert: $3B = 3000, €500M ≈ 550, £200M ≈ 255. null if not mentioned, OR if the article is not announcing a specific named fund's capital raise. See FUND SIZE RULES below — this field is frequently confused with firm AUM or sector aggregates, which must be null.
  "original_currency": string | null,      // if fund size was NOT originally in USD, the original currency code (e.g. "EUR", "GBP", "JPY", "CHF"). null if USD or no size mentioned.
  "original_amount_millions": number | null, // the original amount in millions BEFORE USD conversion. e.g. if article says "€500M", this is 500. null if USD or no size.
  "close_type": string | null,     // "final_close" | "first_close" | "interim_close" | "hard_cap" | "target" | "launch" if mentioned
  "fund_strategy": string | null,  // e.g. "buyout", "growth equity", "venture", "direct lending", "distressed", "mezzanine", "opportunistic", "core-plus", "value-add", "multi-strategy", "secondaries", "co-investment", "fund-of-funds", "continuation vehicle", "NAV lending"
  "geography": string[],           // where the fund invests or firm is headquartered: ["North America"], ["Europe"], ["Asia-Pacific"], ["Global"], ["Middle East"], ["Latin America"]. Empty array if unclear.
  "person_name": string | null,    // for executive hires/departures/changes: full name
  "person_title": string | null,   // for executive moves: their title (e.g. "Managing Director", "Partner", "CFO", "Head of Investor Relations", "CIO")
  "city": string | null,           // firm HQ city (e.g. "New York", "London", "Hong Kong", "San Francisco"). Extract from article text or known firm info. null if unclear.
  "fund_number": string | null     // fund series number if mentioned (e.g. "Fund VII", "Fund X", "Fund III", "Fund I"). Extract the roman or arabic numeral designation. null if not mentioned.
}

RELEVANCE SCORING (follow strictly):
0.8–1.0  Named fund launch/close WITH dollar amount or target size. Major M&A between fund managers or fund service providers. C-suite appointment at a top-50 GP.
0.6–0.7  Fund launch/close without size. Executive move (MD+ level) at a known fund manager. Regulatory enforcement action naming a fund/GP. LP commitment announcement with amount.
0.4–0.5  Industry analysis from a credible source about fund trends. Partnership or JV between fund-related firms. Capital raise progress update. New office/geography expansion by a GP.
0.2–0.3  General market commentary about PE/VC/credit markets that specifically discusses fund vehicles, LP allocations, or GP strategy. Awards/rankings of fund managers. Conference recaps focused on fund industry.
0.0–0.1  EVERYTHING ELSE. If it is not DIRECTLY about investment funds, GPs, LPs, or fund service providers → 0.0. There is NO middle ground.

CRITICAL CLASSIFICATION RULES:
1. BINARY CORE TEST: Is this article DIRECTLY about an investment fund vehicle (LP fund), a fund manager (GP), an institutional investor (LP), or a fund service provider performing fund-related work? If NO → "other" with relevance 0.0. Do NOT give 0.2 to articles that tangentially mention a fund or real estate firm but are really about something else.
2. Startup fundraising (Series A/B/C/D, seed rounds) = portfolio company investment, NOT a fund launch. → "other", relevance 0.0.
3. Public stock purchases/sales, 13F filings, "shares purchased by LLC" reports → "other", relevance 0.0.
4. Hedge fund performance reports, monthly returns → "market_commentary", relevance 0.3.
5. Non-English articles (German, French, Spanish, etc.) → "other", relevance 0.0.
6. Medical, pharma, biotech, clinical trials, health/wellness → "other", relevance 0.0.
7. Sports, entertainment, politics (unless fund regulation), weather, crypto token launches → "other", relevance 0.0.
8. Podcast summaries, listicles, generic opinion pieces, self-help → "other", relevance 0.0.
9. Patent/invention/product announcements unrelated to financial services → "other", relevance 0.0.
10. For fund_categories: only tag categories with a DIRECT connection. A PE firm launching a credit fund = ["PE","credit"]. A general article mentioning PE once in passing = [].
11. Real estate PROPERTY SALES, brokerage listings, individual building transactions, disaster relief, construction projects → "other", relevance 0.0. Only tag "real_estate" when the article is about a real estate INVESTMENT FUND or fund manager.
12. Securities fraud class actions, shareholder lawsuit solicitations, "Investors Have Opportunity to Lead" → "other", relevance 0.0. These are ambulance-chaser ads, not real legal news.
13. FIRM NAME EXTRACTION — THIS IS CRITICAL, DO NOT RETURN NULL WHEN A FIRM IS NAMED: Always extract firm_name when ANY fund manager, GP, investment firm, or financial sponsor is mentioned in the headline or first paragraph. The first proper noun in a fund headline is almost always the firm. Examples: "BNP Paribas bets on European private credit" → firm_name: "BNP Paribas". "Jana Partners presses Six Flags" → firm_name: "Jana Partners". "Charlesbank to acquire stake in Overbay Capital" → firm_name: "Charlesbank". "Samaipata launches €110m Fund III" → firm_name: "Samaipata". "Silvercourt closes oversubscribed Fund II" → firm_name: "Silvercourt". For LP commitment articles (e.g. "Kentucky Teachers assigns $280M to PE"), firm_name should be the LP (e.g. "Kentucky Teachers"). NEVER return firm_name: null when the headline contains a named organization doing a fund-related action.
14. ETF LAUNCHES ARE NOT HEDGE FUND LAUNCHES: UCITS ETFs, liquid-alt ETFs, interval funds, mutual funds, and other '40 Act wrappers do NOT belong in fund_categories: ["hedge"]. Only tag "hedge" when the article is about an actual private hedge fund vehicle raising from institutional/qualified investors. If the headline mentions "ETF", "UCITS", "interval fund", "mutual fund", or "'40 Act", tag it as "other" category with relevance ≤ 0.3 unless it is clearly about the underlying strategy being a classic hedge fund.
15. DEAL-FINANCING DEBT IS NOT A CAPITAL RAISE: If the article is about a BANK arranging a LOAN or FACILITY for a PE-backed acquisition (e.g. "RBC leads $1.1bn loan for Energy Capital Partners' deal"), that is NOT article_type: "capital_raise". It is "other" with relevance ≤ 0.2. A "capital raise" means an LP fund vehicle raising commitments from limited partners.
16. SINGLE-PROPERTY REAL ESTATE FINANCINGS ARE NOT FUND ACTIVITY: "X Capital lends $80M for Baltimore apartment portfolio" is a one-off commercial real estate loan, NOT a fund launch/close/raise. → "other", relevance ≤ 0.1.
17. GOVERNMENT / MUNICIPAL / NGO FUND ANNOUNCEMENTS: Articles about government ministry fund launches (e.g. "Ministry of Finance launches Regional Connectivity Fund"), municipal programs (e.g. "FCM welcomes launch of Build Communities Strong Fund"), or federation/association announcements about public infrastructure programs are NOT private fund activity. → "other", relevance ≤ 0.1.

FUND SIZE RULES (CRITICAL — the classifier has historically leaked firm AUM and sector totals into this field, which then ran as newsletter subject lines):
A. fund_size_usd_millions must describe a SPECIFIC named fund vehicle raising, launching, or closing capital. If the article is not about a specific fund's capital event, return null — even if a dollar figure is mentioned.
B. Firm AUM is NEVER a fund size. "Ares has $623B in AUM", "Nest manages £60bn", "BlackRock's $10T platform" → fund_size_usd_millions: null. The total assets a firm manages is not the size of any one fund.
C. Sector / market aggregates are NEVER a fund size. "$1.8T private credit market", "$86B in hedge fund inflows", "$400B BDC sector", "$200bn of private debt raised this year" → fund_size_usd_millions: null. These are industry-wide totals, not a single fund.
D. LP / pension fund total AUM is NEVER a fund size. "NYC's $316B system", "CalPERS' $500B portfolio" → fund_size_usd_millions: null. An LP's total pool is not a fund vehicle.
E. By event type — for these article_types, fund_size_usd_millions should almost always be null:
   - market_commentary, industry_analysis, press_release, award, other: null unless the article is ALSO announcing a specific named fund close/launch.
   - regulatory_action, legal_alert: null unless the action targets a specific named fund vehicle with a stated size.
   - executive_hire, executive_change, executive_departure: null. Do NOT put the firm's AUM here. A person joining Ares does not "have" Ares' $623B.
F. Acquisitions / M&A — fund_size_usd_millions holds the DEAL VALUE (purchase price), which is acceptable for our pipeline. "EQT $11bn takeover of Intertek" → 11000.
G. LP commitments (article_type: capital_raise where firm_name is a pension/LP) — fund_size_usd_millions is the COMMITMENT AMOUNT, not the LP's total AUM. "Arkansas Teachers commits $900M to alternatives" → 900.

Return ONLY a JSON array in the same order as input. No markdown, no explanation.`;

// ─── Main ───────────────────────────────────────────────────────────────────

/**
 * Classify pending articles using Claude Haiku.
 * Processes up to MAX_ARTICLES_PER_RUN articles per invocation.
 */
export async function classifyPendingArticles(
  supabase: DbClient,
  claudeApiKey: string
): Promise<ClassificationResult> {
  const result: ClassificationResult = {
    articlesProcessed: 0,
    articlesFailed: 0,
    errors: [],
  };

  // Fetch pending articles
  const { data: pending, error: fetchError } = await supabase
    .from('news_items')
    .select('id, title, description, full_text, source_name')
    .eq('classification_status', 'pending')
    .order('created_at', { ascending: true })
    .limit(MAX_ARTICLES_PER_RUN);

  if (fetchError || !pending || pending.length === 0) {
    return result;
  }

  // Process in batches
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE) as ArticleForClassification[];

    // Mark batch as processing
    const batchIds = batch.map((a) => a.id);
    await supabase
      .from('news_items')
      .update({ classification_status: 'processing' })
      .in('id', batchIds);

    try {
      const classifications = await classifyBatch(batch, claudeApiKey);

      // Apply classifications
      for (let j = 0; j < batch.length; j++) {
        const article = batch[j];
        const classification = classifications[j];

        if (!classification) {
          await markFailed(supabase, article.id);
          result.articlesFailed++;
          continue;
        }

        // Resolve firm domain for logo display (non-blocking — null on failure)
        const firmDomain = await resolveFirmDomain(classification.firm_name ?? '');

        const { error: updateError } = await supabase
          .from('news_items')
          .update({
            classification_status: 'complete',
            fund_categories: classification.fund_categories,
            article_type: classification.article_type,
            is_high_signal: classification.is_high_signal,
            signal_reason: classification.signal_reason,
            relevance_score: classification.relevance_score,
            tldr: classification.summary_ai,
            entities_raw: classification.entities,
            confidence_score: classification.relevance_score,
            event_type: classification.article_type,
            processing_attempts: 1,
            updated_at: new Date().toISOString(),
            // Store extracted fund data in existing extracted_data column
            extracted_data: {
              fund_size_usd_millions: classification.fund_size_usd_millions,
              original_currency: classification.original_currency,
              original_amount_millions: classification.original_amount_millions,
              close_type: classification.close_type,
              entities: classification.entities,
              source_type: classification.source_type,
              firm_name: classification.firm_name,
              fund_name: classification.fund_name,
              fund_strategy: classification.fund_strategy,
              geography: classification.geography,
              person_name: classification.person_name,
              person_title: classification.person_title,
              city: classification.city,
              fund_number: classification.fund_number,
              firm_domain: firmDomain,
            },
          })
          .eq('id', article.id);

        if (updateError) {
          result.errors.push(`Update ${article.id}: ${updateError.message}`);
          result.articlesFailed++;
        } else {
          result.articlesProcessed++;
        }
      }
    } catch (error) {
      // Batch failed — mark all as failed but increment attempts (allow retry)
      for (const article of batch) {
        await markFailed(supabase, article.id);
      }
      result.articlesFailed += batch.length;
      result.errors.push(
        `Batch ${i}-${i + batch.length}: ${error instanceof Error ? error.message : 'Unknown'}`
      );
    }
  }

  // ─── Post-classification cleanup: reset stuck 'processing' articles ──────
  // Articles stuck in 'processing' for >10 min were likely from a crashed run
  await supabase
    .from('news_items')
    .update({ classification_status: 'pending', updated_at: new Date().toISOString() })
    .eq('classification_status', 'processing')
    .lt('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

  // ─── Cleanup: mark old 'complete' articles with NULL event_type as 'other' ─
  // These passed classification but got a null event_type — set them to 'other'
  // so they don't accumulate and pollute queries
  await supabase
    .from('news_items')
    .update({
      event_type: 'other',
      article_type: 'other',
      relevance_score: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('classification_status', 'complete')
    .is('event_type', null)
    .lt('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());

  return result;
}

// ─── Batch classification ────────────────────────────────────────────────────

async function classifyBatch(
  articles: ArticleForClassification[],
  apiKey: string
): Promise<(ClassificationOutput | null)[]> {
  const input = articles.map((a, i) => ({
    id: i,
    title: a.title,
    body_snippet: (a.full_text ?? a.description ?? '').slice(0, 1500),
    source: a.source_name,
  }));

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Classify these ${articles.length} articles:\n${JSON.stringify(input, null, 2)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Claude API ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    content: { text: string }[];
  };

  const text = data.content?.[0]?.text ?? '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Could not parse classification response as JSON array');
  }

  const parsed = JSON.parse(jsonMatch[0]) as ClassificationOutput[];
  if (!Array.isArray(parsed)) {
    throw new Error('Classification response was not an array');
  }

  // Map back by index, filling nulls for missing items
  const results: (ClassificationOutput | null)[] = [];
  for (let i = 0; i < articles.length; i++) {
    results.push(parsed[i] ?? null);
  }

  return results;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function markFailed(supabase: DbClient, articleId: string): Promise<void> {
  // Get current attempts
  const { data } = await supabase
    .from('news_items')
    .select('processing_attempts')
    .eq('id', articleId)
    .single();

  const attempts = ((data?.processing_attempts as number) ?? 0) + 1;

  await supabase
    .from('news_items')
    .update({
      classification_status: attempts >= 3 ? 'failed' : 'pending',
      processing_attempts: attempts,
      updated_at: new Date().toISOString(),
    })
    .eq('id', articleId);
}
