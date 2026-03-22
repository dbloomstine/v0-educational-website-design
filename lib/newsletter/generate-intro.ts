/**
 * Generate a 2-3 sentence newsletter intro using Claude Haiku.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

export async function generateNewsletterIntro(
  headlines: string[],
  apiKey: string
): Promise<string> {
  const FALLBACK = "Here's what's moving in fund operations today."

  if (headlines.length === 0) return FALLBACK

  try {
    const topHeadlines = headlines.slice(0, 8).map((h, i) => `${i + 1}. ${h}`).join('\n')

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `Write a 2-3 sentence intro for today's FundOps Daily newsletter. Summarize the day's themes based on these top headlines:\n\n${topHeadlines}\n\nWrite in a professional but conversational tone. Focus on the big picture themes, not individual stories. No greetings, no signoffs, no "today's edition" type phrasing — just jump straight into what's happening. Return only the intro text, nothing else.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error(`Claude API error ${response.status} for newsletter intro`)
      return FALLBACK
    }

    const data = (await response.json()) as {
      content: { text: string }[]
    }

    const text = data.content?.[0]?.text?.trim()
    return text || FALLBACK
  } catch (err) {
    console.error('Failed to generate newsletter intro:', err)
    return FALLBACK
  }
}
