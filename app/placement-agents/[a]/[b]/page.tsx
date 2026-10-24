import type { Metadata } from 'next'
import { LandingView, landingMetadata } from '@/components/directory/LandingView'
import { CATEGORIES } from '@/lib/directory/taxonomy'

// /placement-agents/<topic>/<place> (lib/directory/landing.ts).

const category = CATEGORIES.placement_agent
type Params = { params: Promise<{ a: string; b: string }>; searchParams: Promise<{ page?: string | string[] }> }

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const [{ a, b }, { page }] = await Promise.all([params, searchParams])
  return landingMetadata({ segments: [a, b], page, category })
}

export default async function Page({ params, searchParams }: Params) {
  const [{ a, b }, { page }] = await Promise.all([params, searchParams])
  return <LandingView segments={[a, b]} page={page} category={category} />
}
