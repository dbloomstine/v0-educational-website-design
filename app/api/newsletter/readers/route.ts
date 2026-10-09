import { NextResponse } from 'next/server'
import { getSponsorAudience } from '@/lib/sponsor/stats'

// The figure the site already prints in its house notice ("read each morning
// at N firms"), for the signup card. Counted twice a day at most (the cache in
// lib/sponsor/stats.ts) and held at the edge between counts, so the card
// costs the database nothing.
export const revalidate = 43_200

export async function GET() {
  try {
    const { firms } = await getSponsorAudience()
    return NextResponse.json({ firms: firms ?? null })
  } catch {
    return NextResponse.json({ firms: null })
  }
}
