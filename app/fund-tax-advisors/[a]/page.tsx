import type { Metadata } from 'next'
import { LandingView, landingMetadata } from '@/components/directory/LandingView'
import { CATEGORIES } from '@/lib/directory/taxonomy'

// /fund-tax-advisors/<topic> or /fund-tax-advisors/<place>: one template, closed lists (lib/directory/landing.ts).
// Profiles are at /fund-tax-advisors/people/<slug>, a static segment, so they never reach this route.

const category = CATEGORIES.fund_tax_advisor
type Params = { params: Promise<{ a: string }>; searchParams: Promise<{ page?: string | string[] }> }

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const [{ a }, { page }] = await Promise.all([params, searchParams])
  return landingMetadata({ segments: [a], page, category })
}

export default async function Page({ params, searchParams }: Params) {
  const [{ a }, { page }] = await Promise.all([params, searchParams])
  return <LandingView segments={[a]} page={page} category={category} />
}
