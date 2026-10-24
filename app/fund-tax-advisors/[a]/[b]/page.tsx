import type { Metadata } from 'next'
import { LandingView, hasQuery, landingMetadata } from '@/components/directory/LandingView'
import { FirmListView, firmListMetadata } from '@/components/directory/FirmListView'
import { CATEGORIES } from '@/lib/directory/taxonomy'

// /fund-tax-advisors/<topic>/<place> (lib/directory/landing.ts), or /fund-tax-advisors/<topic or place>/firms, the firms on that page,
// ranked (lib/directory/firm-lists.ts).

const category = CATEGORIES.fund_tax_advisor
type Params = { params: Promise<{ a: string; b: string }>; searchParams: Promise<{ page?: string | string[]; [k: string]: string | string[] | undefined }> }

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const [{ a, b }, sp] = await Promise.all([params, searchParams])
  if (b === 'firms') return firmListMetadata({ segments: [a], category, query: Object.keys(sp).length > 0 })
  const { page } = sp
  return landingMetadata({ segments: [a, b], page, category, query: hasQuery(sp) })
}

export default async function Page({ params, searchParams }: Params) {
  const [{ a, b }, sp] = await Promise.all([params, searchParams])
  if (b === 'firms') return <FirmListView segments={[a]} category={category} />
  const { page } = sp
  return <LandingView segments={[a, b]} page={page} category={category} />
}
