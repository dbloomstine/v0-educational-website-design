import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { resolveFirmDomain } from '@/lib/news/resolve-firm-logo'

export const maxDuration = 120

/**
 * Backfill firm_domain for articles that have firm_name but no domain.
 * GET /api/pipeline/backfill-domains
 */
export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  // Find articles with firm_name in extracted_data but no firm_domain
  const { data: rows, error } = await supabase
    .from('news_items')
    .select('id, extracted_data')
    .eq('classification_status', 'complete')
    .not('extracted_data', 'is', null)
    .limit(500)

  if (error || !rows) {
    return NextResponse.json({ error: error?.message ?? 'No rows' }, { status: 500 })
  }

  // Filter to those missing firm_domain but having firm_name
  const needsDomain = rows.filter((r) => {
    const ed = r.extracted_data as Record<string, unknown> | null
    return ed && ed.firm_name && !ed.firm_domain
  })

  let updated = 0
  let failed = 0

  for (const row of needsDomain) {
    const ed = row.extracted_data as Record<string, unknown>
    const firmName = ed.firm_name as string

    const domain = await resolveFirmDomain(firmName)
    if (!domain) {
      failed++
      continue
    }

    const { error: updateError } = await supabase
      .from('news_items')
      .update({
        extracted_data: { ...ed, firm_domain: domain },
      })
      .eq('id', row.id)

    if (updateError) {
      failed++
    } else {
      updated++
    }
  }

  return NextResponse.json({
    ok: true,
    total: rows.length,
    needsDomain: needsDomain.length,
    updated,
    failed,
  })
}
