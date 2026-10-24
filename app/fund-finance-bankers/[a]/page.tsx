import type { Metadata } from 'next'
import { LandingView, hasQuery, landingMetadata } from '@/components/directory/LandingView'
import { CATEGORIES } from '@/lib/directory/taxonomy'

// /fund-finance-bankers/<topic> or /fund-finance-bankers/<place>: one template, closed lists (lib/directory/landing.ts).
// Profiles are at /fund-finance-bankers/people/<slug>, a static segment, so they never reach this route.

const category = CATEGORIES.fund_finance_banker
type Params = { params: Promise<{ a: string }>; searchParams: Promise<{ page?: string | string[]; [k: string]: string | string[] | undefined }> }

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const [{ a }, sp] = await Promise.all([params, searchParams])
  const { page } = sp
  return landingMetadata({ segments: [a], page, category, query: hasQuery(sp) })
}

export default async function Page({ params, searchParams }: Params) {
  const [{ a }, sp] = await Promise.all([params, searchParams])
  const { page } = sp
  return <LandingView segments={[a]} page={page} category={category} />
}
