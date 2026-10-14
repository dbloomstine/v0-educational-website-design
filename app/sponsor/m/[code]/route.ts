import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

/**
 * /sponsor/m/<code>: the short mock-up link in a sponsor pitch (lib/outreach-v2/compose.ts mockupShortUrl). The code
 * is the first eight hex characters of the pitch's id; it redirects to the ad builder with that firm's ad drawn
 * (outreach_v2_messages.mockup_url). Anything unknown goes to /sponsor. Nothing is recorded.
 */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const fallback = new URL('/sponsor', req.url)
  if (!/^[0-9a-f]{8}$/.test(code)) return NextResponse.redirect(fallback, 302)
  const { data } = await getSupabaseAdmin()
    .from('outreach_v2_messages')
    .select('mockup_url')
    .eq('program', 'sponsor_pitch')
    .eq('kind', 'initial')
    .gte('id', `${code}-0000-0000-0000-000000000000`)
    .lte('id', `${code}-ffff-ffff-ffff-ffffffffffff`)
    .not('mockup_url', 'is', null)
    .limit(1)
  const target = data?.[0]?.mockup_url as string | undefined
  if (!target || !target.startsWith('https://fundopshq.com/sponsor?')) return NextResponse.redirect(fallback, 302)
  return NextResponse.redirect(target, 302)
}
