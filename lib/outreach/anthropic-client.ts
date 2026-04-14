/**
 * Anthropic API client for outreach hook generation.
 *
 * Narrow use: one call per candidate, generates a single-sentence news hook
 * from structured article facts. The full email body is static template
 * substitution in lib/outreach/template.ts — we only use the LLM for the
 * one piece of the email that needs interpretive personalization.
 *
 * Model choice: Haiku 4.5 for speed + cost. The task is narrow enough that
 * Opus is overkill; Haiku is <1s latency and pennies per call.
 *
 * Raw fetch (no SDK) to match the existing codebase convention — the
 * newsletter-send route uses raw fetch to Resend.
 */

import type { Article } from './types'

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>
  error?: { message: string }
}

const HOOK_SYSTEM_PROMPT = `You generate one-sentence news hooks for a "we covered your firm" outreach email from Danny Bloomstine (founder of FundOpsHQ).

Rules:
- Start with "Saw"
- Reference a specific concrete fact from the article (dollar amount, fund name, named person, role)
- One sentence, 15-25 words
- No em dashes — use commas or periods
- No en dashes
- No superlatives or opinion words ("big", "impressive", "huge", "massive", "great")
- No quotes around the output
- Past tense, plain declarative

Output only the sentence. No preamble, no quotes, no markdown, no trailing period variants — end with a single period.`

function formatArticleFacts(article: Article): string {
  const parts: string[] = []
  parts.push(`Firm: ${article.firmName ?? 'unknown'}`)
  parts.push(`Event type: ${article.eventType ?? article.articleType ?? 'unknown'}`)
  if (article.fundName) parts.push(`Fund name: ${article.fundName}`)
  if (article.fundNumber) parts.push(`Fund number: ${article.fundNumber}`)
  if (article.fundSizeUsdMillions != null) {
    const sizeBn = article.fundSizeUsdMillions / 1000
    const sizeStr =
      sizeBn >= 1
        ? `$${sizeBn.toFixed(1).replace(/\.0$/, '')}B`
        : `$${article.fundSizeUsdMillions}M`
    parts.push(`Fund size: ${sizeStr}`)
  }
  if (article.closeType) parts.push(`Close type: ${article.closeType}`)
  if (article.fundStrategy) parts.push(`Strategy: ${article.fundStrategy}`)
  if (article.personName) parts.push(`Person: ${article.personName}`)
  if (article.personTitle) parts.push(`Title: ${article.personTitle}`)
  parts.push(`Headline: ${article.title}`)
  if (article.tldr) parts.push(`TLDR: ${article.tldr}`)
  return parts.join('\n')
}

/**
 * Generate a one-sentence news hook for the outreach email.
 * Throws on API errors — caller catches and skips that candidate.
 */
export async function generateHook(article: Article): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY')

  const userMessage: AnthropicMessage = {
    role: 'user',
    content: formatArticleFacts(article),
  }

  const res = await fetch(ANTHROPIC_BASE, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 100,
      system: HOOK_SYSTEM_PROMPT,
      messages: [userMessage],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Anthropic API failed ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as AnthropicResponse
  if (data.error) throw new Error(`Anthropic error: ${data.error.message}`)

  const text = data.content?.find((c) => c.type === 'text')?.text?.trim()
  if (!text) throw new Error('Anthropic returned empty hook')

  // Strip any wrapping quotes or trailing whitespace the model might add.
  return text
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/[—–]/g, ',') // belt-and-suspenders: strip any em/en dashes that slipped through
    .trim()
}
