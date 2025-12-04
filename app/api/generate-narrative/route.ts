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
  fundType: string // Free-form fund type
  reportingPeriod: string
  tone: 'conservative' | 'neutral' | 'optimistic'
  format: 'executive-summary' | 'full-letter'
  userContext?: string // Optional user-provided context, notes, or instructions
  sections: {
    performanceOverview: boolean
    attributionAnalysis: boolean
    keyEvents: boolean
    forwardOutlook: boolean
  }
}

interface GenerateRequest {
  parsedData: ParsedData[]
  settings: GenerationSettings
  regenerateSection?: string
}

const TONE_INSTRUCTIONS = {
  conservative: 'Use measured, risk-aware language. Acknowledge challenges honestly while maintaining professionalism. Avoid overly optimistic projections.',
  neutral: 'Use balanced, factual language. Present data objectively without excessive optimism or pessimism. Let the numbers speak for themselves.',
  optimistic: 'Use confident, forward-looking language. Emphasize opportunities and positive developments while remaining credible and professional.',
}

const FORMAT_INSTRUCTIONS = {
  'executive-summary': 'Keep each section to 1-2 concise paragraphs. Focus on key takeaways. Use clear, direct language.',
  'full-letter': 'Provide comprehensive coverage with 3-4 paragraphs per section. Include detailed analysis and context. Maintain a professional narrative flow.',
}

function getFundTypeContext(fundType: string): string {
  const normalizedType = fundType.toLowerCase()

  if (normalizedType.includes('hedge') || normalizedType.includes('long') || normalizedType.includes('short')) {
    return 'This is a hedge fund investor letter. Focus on risk-adjusted returns, market exposure, volatility management, and alpha generation. Use terminology appropriate for sophisticated institutional investors.'
  }
  if (normalizedType.includes('private equity') || normalizedType.includes('buyout') || normalizedType.includes('pe ')) {
    return 'This is a private equity investor letter. Focus on portfolio company performance, value creation, exit opportunities, and deployment pace. Use terminology appropriate for LP communications.'
  }
  if (normalizedType.includes('venture') || normalizedType.includes('vc ') || normalizedType.includes('seed') || normalizedType.includes('early stage')) {
    return 'This is a venture capital investor letter. Focus on portfolio company milestones, follow-on investments, graduation rates, and market opportunity. Use terminology appropriate for VC LP communications.'
  }
  if (normalizedType.includes('real estate') || normalizedType.includes('reit') || normalizedType.includes('property')) {
    return 'This is a real estate fund investor letter. Focus on property acquisitions, occupancy rates, NOI growth, cap rates, and market fundamentals. Use terminology appropriate for real estate LP communications.'
  }
  if (normalizedType.includes('credit') || normalizedType.includes('debt') || normalizedType.includes('lending')) {
    return 'This is a private credit investor letter. Focus on yield, credit quality, portfolio diversification, default rates, and deal pipeline. Use terminology appropriate for credit fund LP communications.'
  }
  if (normalizedType.includes('infrastructure') || normalizedType.includes('infra')) {
    return 'This is an infrastructure fund investor letter. Focus on asset performance, contracted cash flows, regulatory environment, and long-term value creation. Use terminology appropriate for infrastructure LP communications.'
  }
  // Default for any other fund type
  return `This is a ${fundType || 'fund'} investor letter. Focus on performance, portfolio updates, and forward outlook. Use professional terminology appropriate for institutional LP communications.`
}

function buildPrompt(data: ParsedData[], settings: GenerationSettings, sectionToGenerate?: string): string {
  // Aggregate data from all files
  const performanceData = data.find(d => d.performance)?.performance
  const attributionData = data.find(d => d.attribution)?.attribution
  const commentary = data.filter(d => d.commentary).map(d => d.commentary).join('\n\n')

  const sections = sectionToGenerate
    ? { [sectionToGenerate]: true }
    : settings.sections

  let prompt = `You are an expert investor relations professional writing a quarterly investor letter.

CONTEXT:
- Fund Name: ${settings.fundName || 'The Fund'}
- Fund Type: ${settings.fundType || 'Investment Fund'}
- Reporting Period: ${settings.reportingPeriod || 'Current Quarter'}
- ${getFundTypeContext(settings.fundType)}

TONE: ${TONE_INSTRUCTIONS[settings.tone]}

FORMAT: ${FORMAT_INSTRUCTIONS[settings.format]}
${settings.userContext ? `
USER INSTRUCTIONS & CONTEXT:
The user has provided the following additional context and instructions. Incorporate this guidance into the letter:
---
${settings.userContext}
---
` : ''}
AVAILABLE DATA:
`

  if (performanceData) {
    prompt += `
PERFORMANCE DATA:
- Period: ${performanceData.period}
- Fund Return: ${performanceData.fundReturn.toFixed(2)}%
- Benchmark Return: ${performanceData.benchmarkReturn.toFixed(2)}%
- Alpha (Excess Return): ${performanceData.alpha.toFixed(2)}%
${performanceData.volatility ? `- Volatility: ${performanceData.volatility.toFixed(2)}%` : ''}
${performanceData.sharpeRatio ? `- Sharpe Ratio: ${performanceData.sharpeRatio.toFixed(2)}` : ''}
${performanceData.maxDrawdown ? `- Max Drawdown: ${performanceData.maxDrawdown.toFixed(2)}%` : ''}
`
  }

  if (attributionData) {
    prompt += `
ATTRIBUTION DATA:
Top Contributors:
${attributionData.contributors.map(c => `- ${c.name}: +${c.contribution.toFixed(2)}%`).join('\n')}

Top Detractors:
${attributionData.detractors.map(d => `- ${d.name}: ${d.contribution.toFixed(2)}%`).join('\n')}
`
  }

  if (commentary) {
    prompt += `
MANAGER COMMENTARY/NOTES:
${commentary}
`
  }

  prompt += `
INSTRUCTIONS:
Generate the following sections of an investor letter. Use rich markdown formatting:
- Use ## for main section headers
- Use ### for subsection headers where appropriate
- Use **bold** for key metrics, percentages, and important figures
- Use *italic* for emphasis on key terms or concepts
- Use bullet points (- or *) for lists of items, contributors, detractors
- Use > blockquotes for notable highlights or key takeaways
- Keep paragraphs well-structured and readable

`

  if (sections.performanceOverview) {
    prompt += `## Performance Overview
Write a section discussing the fund's performance for the period. Compare to benchmark, explain the context of returns, and provide perspective on the results.

`
  }

  if (sections.attributionAnalysis) {
    prompt += `## Attribution Analysis
Write a section analyzing the key contributors and detractors to performance. Explain why certain positions performed well or poorly. Provide investment thesis context where appropriate.

`
  }

  if (sections.keyEvents) {
    prompt += `## Key Events & Market Commentary
Write a section covering significant market events, portfolio activity (new positions, exits, adjustments), and how the fund navigated the market environment.

`
  }

  if (sections.forwardOutlook) {
    prompt += `## Forward-Looking Outlook
Write a section on the fund's positioning, market views, and outlook for the coming period. Discuss opportunities and risks being monitored.

`
  }

  prompt += `
IMPORTANT:
- Write in first person plural ("we", "our fund")
- Be specific with numbers when data is provided
- Maintain professional institutional quality
- Do not invent specific numbers not provided in the data
- If data is limited, write more generally while staying professional
- Start directly with the first section header, no preamble
`

  return prompt
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json()
    const { parsedData, settings, regenerateSection } = body

    // Validate input
    if (!parsedData || parsedData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data provided' },
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
    const prompt = buildPrompt(parsedData, settings, regenerateSection)

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
        { success: false, error: 'Failed to generate narrative' },
        { status: 500 }
      )
    }

    const result = await response.json()
    const generatedText = result.content[0]?.text || ''

    // Parse sections from the generated text
    const sections = parseSections(generatedText, settings)

    return NextResponse.json({
      success: true,
      narrative: {
        sections,
        fullText: generatedText,
        generatedAt: new Date().toISOString(),
        settings,
      },
    })
  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function parseSections(text: string, settings: GenerationSettings) {
  const sectionTitles = {
    performanceOverview: 'Performance Overview',
    attributionAnalysis: 'Attribution Analysis',
    keyEvents: 'Key Events & Market Commentary',
    forwardOutlook: 'Forward-Looking Outlook',
  }

  const sections: Array<{ id: string; title: string; content: string }> = []

  // Split by ## headers (main sections only, preserve ### subsections in content)
  const parts = text.split(/^## /m).filter(Boolean)

  for (const part of parts) {
    const lines = part.split('\n')
    const title = lines[0]?.trim() || ''
    // Keep all markdown formatting in content (including ### subsections)
    const content = lines.slice(1).join('\n').trim()

    // Match to section IDs
    let sectionId = ''
    for (const [id, expectedTitle] of Object.entries(sectionTitles)) {
      if (title.toLowerCase().includes(expectedTitle.toLowerCase().split(' ')[0])) {
        sectionId = id
        break
      }
    }

    if (sectionId && settings.sections[sectionId as keyof typeof settings.sections]) {
      sections.push({
        id: sectionId,
        title,
        content, // Content now preserves all markdown formatting
      })
    }
  }

  return sections
}
