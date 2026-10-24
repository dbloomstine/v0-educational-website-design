import type { Metadata } from 'next'
import { LandingView, landingMetadata } from '@/components/directory/LandingView'
import { CATEGORIES } from '@/lib/directory/taxonomy'

// /fund-finance-bankers/<topic>/<place> (lib/directory/landing.ts).

const category = CATEGORIES.fund_finance_banker
type Params = { params: Promise<{ a: string; b: string }>; searchParams: Promise<{ page?: string | string[] }> }

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const [{ a, b }, { page }] = await Promise.all([params, searchParams])
  return landingMetadata({ segments: [a, b], page, category })
}

export default async function Page({ params, searchParams }: Params) {
  const [{ a, b }, { page }] = await Promise.all([params, searchParams])
  return <LandingView segments={[a, b]} page={page} category={category} />
}
