import { NextResponse } from 'next/server'
import { fetchContactLog } from '@/lib/crm/queries'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const firmId = new URL(req.url).searchParams.get('firmId')
  if (!firmId) return NextResponse.json({ error: 'firmId required' }, { status: 400 })
  try {
    return NextResponse.json({ entries: await fetchContactLog(firmId) })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Query failed' },
      { status: 500 }
    )
  }
}
