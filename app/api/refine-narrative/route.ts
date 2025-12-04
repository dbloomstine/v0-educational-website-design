import { NextRequest, NextResponse } from 'next/server'

// Types matching the frontend
interface PerformanceData {
  period: string
  fundReturn: number
  benchmarkReturn: number
  alpha: number
  volatility?: number
  sharpeRatio?: number
  maxDrawdown?: number
  ytdReturn?: number
  inceptionReturn?: number
}

interface AttributionItem {
  name: string
  contribution: number
  weight?: number
  sector?: string
  isContributor: boolean
}

interface ParsedData {
  performance?: PerformanceData
  attribution?: {
    contributors: AttributionItem[]
    detractors: AttributionItem[]
  }
  commentary?: string
  rawText?: string
  fileName: string
  fileType: string
}

interface GenerationSettings {
  fundName: string
  fundType: 'hedge-fund' | 'private-equity' | 'venture-capital'
  reportingPeriod: string
  tone: 'conservative' | 'neutral' | 'optimistic'
  format: 'executive-summary' | 'full-letter'
  sections: {
    performanceOverview: boolean
    attributionAnalysis: boolean
    keyEvents: boolean
    forwardOutlook: boolean
  }
}

interface GeneratedSection {
  id: string
  title: string
  content: string
}

interface GeneratedNarrative {
  sections: GeneratedSection[]
  fullText: string
  generatedAt: Date | string
  settings: GenerationSettings
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date | string
  affectedSections?: string[]
}

interface RefineRequest {
  currentNarrative: GeneratedNarrative
  chatHistory: ChatMessage[]
  userMessage: string
  parsedData: ParsedData[]
  settings: GenerationSettings
}

const SECTION_TITLES: Record<string, string> = {
  performanceOverview: 'Performance Overview',
  attributionAnalysis: 'Attribution Analysis',
  keyEvents: 'Key Events & Market Commentary',
  forwardOutlook: 'Forward-Looking Outlook',
}

function buildRefinePrompt(
  currentNarrative: GeneratedNarrative,
  chatHistory: ChatMessage[],
  userMessage: string,
  parsedData: ParsedData[],
  settings: GenerationSettings
): string {
  // Build the current narrative content
  const currentContent = currentNarrative.sections
    .map(s => `## ${s.title}\n\n${s.content}`)
    .join('\n\n')

  // Build chat history context
  const historyContext = chatHistory.length > 0
    ? chatHistory
        .slice(-6) // Keep last 6 messages for context
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n')
    : ''

  // Get available data summary
  const performanceData = parsedData.find(d => d.performance)?.performance
  const attributionData = parsedData.find(d => d.attribution)?.attribution

  let prompt = `You are an AI assistant helping to refine an investor letter. Your task is to make specific edits based on user feedback.

CONTEXT:
- Fund Name: ${settings.fundName || 'The Fund'}
- Reporting Period: ${settings.reportingPeriod || 'Current Quarter'}
- Tone: ${settings.tone}
- Format: ${settings.format === 'executive-summary' ? 'Executive Summary (concise)' : 'Full Letter (comprehensive)'}

CURRENT LETTER:
${currentContent}

`

  if (performanceData || attributionData) {
    prompt += `AVAILABLE DATA FOR REFERENCE:
`
    if (performanceData) {
      prompt += `- Fund Return: ${performanceData.fundReturn.toFixed(2)}%
- Benchmark Return: ${performanceData.benchmarkReturn.toFixed(2)}%
- Alpha: ${performanceData.alpha.toFixed(2)}%
`
    }
    if (attributionData) {
      prompt += `- Top Contributors: ${attributionData.contributors.slice(0, 3).map(c => c.name).join(', ')}
- Top Detractors: ${attributionData.detractors.slice(0, 3).map(d => d.name).join(', ')}
`
    }
    prompt += '\n'
  }

  if (historyContext) {
    prompt += `PREVIOUS CONVERSATION:
${historyContext}

`
  }

  prompt += `USER REQUEST:
${userMessage}

INSTRUCTIONS:
1. Carefully analyze the user's request and determine which sections need to be modified.
2. Make the requested changes while maintaining professional quality and consistency.
3. Keep sections that don't need changes exactly as they are.
4. Respond with a JSON object containing:
   - "message": A brief response to the user explaining what you changed (1-2 sentences)
   - "affectedSections": An array of section IDs that were modified (e.g., ["performanceOverview", "forwardOutlook"])
   - "updatedSections": An object mapping section IDs to their new content

Available section IDs: performanceOverview, attributionAnalysis, keyEvents, forwardOutlook

IMPORTANT:
- Only include sections in "updatedSections" if they were actually changed
- Maintain the same professional tone unless the user specifically requests a tone change
- Do not add new sections or remove existing ones
- Preserve any data/numbers from the original unless user asks to change them
- Respond ONLY with valid JSON, no additional text

Example response format:
{
  "message": "I've made the tone more optimistic in the Performance Overview and added emphasis on the growth opportunities in the Forward-Looking Outlook.",
  "affectedSections": ["performanceOverview", "forwardOutlook"],
  "updatedSections": {
    "performanceOverview": "Updated content here...",
    "forwardOutlook": "Updated content here..."
  }
}
`

  return prompt
}

export async function POST(request: NextRequest) {
  try {
    const body: RefineRequest = await request.json()
    const { currentNarrative, chatHistory, userMessage, parsedData, settings } = body

    // Validate input
    if (!currentNarrative || !userMessage) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      )
    }

    // Build the prompt
    const prompt = buildRefinePrompt(
      currentNarrative,
      chatHistory,
      userMessage,
      parsedData,
      settings
    )

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Claude API error:', errorData)
      return NextResponse.json(
        { success: false, error: 'Failed to refine narrative' },
        { status: 500 }
      )
    }

    const result = await response.json()
    const generatedText = result.content[0]?.text || ''

    // Parse the JSON response
    let refinementResult: { updatedSections?: Record<string, string>; message?: string; explanation?: string; affectedSections?: string[] } | null = null
    try {
      // Try to extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        refinementResult = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse refinement response:', parseError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse AI response. Please try again.',
          assistantMessage: 'I apologize, but I encountered an error processing your request. Please try rephrasing your feedback.'
        },
        { status: 500 }
      )
    }

    // Ensure refinementResult is not null after parsing
    if (!refinementResult) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse AI response.',
          assistantMessage: 'I apologize, but I could not process the response. Please try again.'
        },
        { status: 500 }
      )
    }

    // Build the updated narrative
    const parsedResult = refinementResult // TypeScript now knows this is not null
    const updatedSections = currentNarrative.sections.map(section => {
      if (parsedResult.updatedSections?.[section.id]) {
        return {
          ...section,
          content: parsedResult.updatedSections[section.id],
        }
      }
      return section
    })

    const updatedFullText = updatedSections
      .map(s => `## ${s.title}\n\n${s.content}`)
      .join('\n\n')

    return NextResponse.json({
      success: true,
      updatedNarrative: {
        ...currentNarrative,
        sections: updatedSections,
        fullText: updatedFullText,
        generatedAt: new Date().toISOString(),
      },
      assistantMessage: parsedResult.message || 'Changes applied successfully.',
      affectedSections: parsedResult.affectedSections || [],
    })
  } catch (error) {
    console.error('Refinement error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        assistantMessage: 'An unexpected error occurred. Please try again.'
      },
      { status: 500 }
    )
  }
}
