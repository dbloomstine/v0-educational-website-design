import type { Metadata } from 'next'
import { LandingView, landingMetadata } from '@/components/directory/LandingView'

// /fund-lawyers/<topic> or /fund-lawyers/<place>: one template, closed lists (lib/directory/landing.ts).
// Profiles are at /fund-lawyers/people/<slug>, a static segment, so they never reach this route.

type Params = { params: Promise<{ a: string }>; searchParams: Promise<{ page?: string | string[] }> }

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const [{ a }, { page }] = await Promise.all([params, searchParams])
  return landingMetadata({ segments: [a], page })
}

export default async function Page({ params, searchParams }: Params) {
  const [{ a }, { page }] = await Promise.all([params, searchParams])
  return <LandingView segments={[a]} page={page} />
}
