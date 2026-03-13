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
}

// ─── Constants ──────────────────────────────────────────────────────────────

const BATCH_SIZE = 10;
const MAX_ARTICLES_PER_RUN = 100;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are classifying news articles about investment funds and financial services for a professional database.

For each article, return a JSON object with exactly these fields:
{
  "fund_categories": string[],     // subset of: ["PE","VC","credit","hedge","real_estate","infrastructure","secondaries","gp_stakes"] - include all that apply
  "article_type": string,          // one of: fund_launch, fund_close, capital_raise, executive_hire, executive_departure, executive_change, acquisition, merger, regulatory_action, legal_alert, market_commentary, press_release, industry_analysis, award, other
  "source_type": string,           // one of: press_release, trade_press, news_wire, law_firm, regulatory, blog
  "is_high_signal": boolean,       // true if: fund launch/close, executive change at named firm, regulatory action, M&A
  "signal_reason": string | null,  // brief reason if is_high_signal is true
  "relevance_score": number,       // 0.0 to 1.0 - how relevant to fund operations professionals
  "summary_ai": string,            // 2-sentence summary focused on what matters to BD professionals
  "entities": [                    // extract named entities
    { "name": string, "type": "firm"|"fund"|"person", "role": string | null, "confidence": number }
  ],
  "fund_size_usd_millions": number | null,  // if article mentions a specific fund size, extract it in millions
  "close_type": string | null      // "final_close"|"first_close"|"target"|"launch" if mentioned
}

IMPORTANT:
- Startup Series A/B/C funding rounds are NOT fund launches — classify as "other" with low relevance
- Hedge fund performance reports are market_commentary, not fund events
- Focus on LP fund vehicles: private equity funds, venture funds, credit funds, real estate funds, infrastructure funds, secondaries
- For summary_ai: be specific, include dollar amounts, firm names, fund names. Write for a BD professional.
- Stock purchase/sale reports (e.g. "shares purchased by LLC", "shares sold by advisor") are market_commentary, NOT executive_hire or executive_change — give low relevance (0.1-0.2)
- Inventor/patent/product announcements unrelated to fund operations are "other" with relevance 0.0-0.1
- Non-English articles should get relevance_score 0.0
- Medical/pharma research, clinical trials, health tips, chiropractic, dental — "other" with 0.0 relevance
- Sports news (FIFA, NFL, NBA, Olympics), entertainment, movie/music reviews — "other" with 0.0 relevance
- Podcast episode summaries, editorial opinion pieces, listicles ("top 10 tips") — "other" with 0.0 relevance
- Spanish-language or other non-English press releases — "other" with 0.0 relevance
- If the article is NOT about a fund launch, fund close, capital raise, LP commitment, GP transaction, M&A involving investment firms, or notable executive move at a fund/investment firm, it is almost certainly "other" with relevance below 0.2

Return ONLY a JSON array of objects in the same order as input. No other text.`;

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
    body_snippet: (a.full_text ?? a.description ?? '').slice(0, 600),
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
