import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { classifyPendingArticles } from '@/lib/news/classify-articles'

export const maxDuration = 120

export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Recovery: reset stuck articles that have been "processing" for >10 min
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    await supabaseAdmin
      .from('news_items')
      .update({ classification_status: 'pending' })
      .eq('classification_status', 'processing')
      .lt('updated_at', tenMinAgo)

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
    }

    const result = await classifyPendingArticles(supabaseAdmin, apiKey)

    return NextResponse.json({
      ok: true,
      ...result,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    )
  }
}
