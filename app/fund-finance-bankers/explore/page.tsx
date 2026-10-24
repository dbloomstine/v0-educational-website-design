import type { Metadata } from 'next'
import { ExploreView, exploreMetadata, type ExploreSearchParams } from '@/components/directory/ExploreView'
import { CATEGORIES } from '@/lib/directory/taxonomy'

// /fund-finance-bankers/explore: the table explorer (components/directory/ExploreView.tsx; every trade shares it).

const CATEGORY = CATEGORIES.fund_finance_banker
type Params = { searchParams: Promise<ExploreSearchParams> }

export async function generateMetadata(): Promise<Metadata> {
  return exploreMetadata(CATEGORY)
}

export default async function Page({ searchParams }: Params) {
  return <ExploreView category={CATEGORY} searchParams={await searchParams} />
}
