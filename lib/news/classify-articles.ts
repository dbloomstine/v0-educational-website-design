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
  close_type: string | null;
  firm_name: string | null;
  fund_name: string | null;
  fund_strategy: string | null;
  geography: string[] | null;
  person_name: string | null;
  person_title: string | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const BATCH_SIZE = 10;
const MAX_ARTICLES_PER_RUN = 100;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are classifying news articles about investment funds and alternative asset management for a professional intelligence database used by business development professionals.

For each article, return a JSON object with exactly these fields:
{
  "fund_categories": string[],     // subset of: ["PE","VC","credit","hedge","real_estate","infrastructure","secondaries","gp_stakes"] — all that apply
  "article_type": string,          // one of: fund_launch, fund_close, capital_raise, executive_hire, executive_departure, executive_change, acquisition, regulatory_action, legal_alert, market_commentary, press_release, industry_analysis, award, other. Use "acquisition" for BOTH acquisitions and mergers.
  "source_type": string,           // one of: press_release, trade_press, news_wire, law_firm, regulatory, blog
  "is_high_signal": boolean,       // true for: fund launch/close with named firm, C-suite/partner hire at fund manager, regulatory enforcement, M&A between GPs or service providers
  "signal_reason": string | null,  // brief reason if is_high_signal
  "relevance_score": number,       // 0.0–1.0 — use scoring guide below
  "summary_ai": string,            // 2-sentence summary. Include firm names, fund names, dollar amounts, people names. Write for a BD professional selling services to fund managers.
  "entities": [
    { "name": string, "type": "firm"|"fund"|"person", "role": string | null, "confidence": number }
  ],
  "firm_name": string | null,      // primary fund manager / GP / investment firm. For exec moves, the firm they joined or left. For M&A, the acquirer.
  "fund_name": string | null,      // specific fund vehicle name (e.g. "Apollo Fund X", "Blackstone Real Estate Partners IX"). null if no specific fund named.
  "fund_size_usd_millions": number | null,  // fund size in USD millions. Convert: $3B = 3000, €500M ≈ 550, £200M ≈ 255. null if not mentioned.
  "close_type": string | null,     // "final_close" | "first_close" | "interim_close" | "hard_cap" | "target" | "launch" if mentioned
  "fund_strategy": string | null,  // e.g. "buyout", "growth equity", "venture", "direct lending", "distressed", "mezzanine", "opportunistic", "core-plus", "value-add", "multi-strategy", "secondaries", "co-investment", "fund-of-funds", "continuation vehicle", "NAV lending"
  "geography": string[],           // where the fund invests or firm is headquartered: ["North America"], ["Europe"], ["Asia-Pacific"], ["Global"], ["Middle East"], ["Latin America"]. Empty array if unclear.
  "person_name": string | null,    // for executive hires/departures/changes: full name
  "person_title": string | null    // for executive moves: their title (e.g. "Managing Director", "Partner", "CFO", "Head of Investor Relations", "CIO")
}

RELEVANCE SCORING (follow strictly):
0.8–1.0  Named fund launch/close WITH dollar amount or target size. Major M&A between fund managers or fund service providers. C-suite appointment at a top-50 GP.
0.6–0.7  Fund launch/close without size. Executive move (MD+ level) at a known fund manager. Regulatory enforcement action naming a fund/GP. LP commitment announcement with amount.
0.4–0.5  Industry analysis from a credible source about fund trends. Partnership or JV between fund-related firms. Capital raise progress update. New office/geography expansion by a GP.
0.2–0.3  General market commentary about PE/VC/credit markets. Awards/rankings. Conference recaps. Thought leadership from a fund manager.
0.0–0.1  Not about investment funds, GPs, LPs, or fund service providers.

CLASSIFICATION RULES:
1. CORE TEST: Is this about an investment fund vehicle (LP fund), a fund manager (GP), an institutional investor (LP), or a fund service provider? If NO → "other" with relevance 0.0.
2. Startup fundraising (Series A/B/C/D, seed rounds) = portfolio company investment, NOT a fund launch. → "other", relevance 0.0.
3. Public stock purchases/sales, 13F filings, "shares purchased by LLC" reports → "market_commentary", relevance 0.1.
4. Hedge fund performance reports, monthly returns → "market_commentary", relevance 0.2.
5. Non-English articles → "other", relevance 0.0.
6. Medical, pharma, biotech, clinical trials, health/wellness → "other", relevance 0.0.
7. Sports, entertainment, politics (unless fund regulation), weather, crypto token launches → "other", relevance 0.0.
8. Podcast summaries, listicles, generic opinion pieces, self-help → "other", relevance 0.0.
9. Patent/invention/product announcements unrelated to financial services → "other", relevance 0.0.
10. For fund_categories: only tag categories with a DIRECT connection. A PE firm launching a credit fund = ["PE","credit"]. A general article mentioning PE once in passing = [].

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
              close_type: classification.close_type,
              entities: classification.entities,
              source_type: classification.source_type,
              firm_name: classification.firm_name,
              fund_name: classification.fund_name,
              fund_strategy: classification.fund_strategy,
              geography: classification.geography,
              person_name: classification.person_name,
              person_title: classification.person_title,
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
