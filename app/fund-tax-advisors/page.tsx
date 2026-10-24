import type { Metadata } from 'next'
import { HubView, hubMetadata, type HubSearchParams } from '@/components/directory/HubView'
import { CATEGORIES } from '@/lib/directory/taxonomy'

// /fund-tax-advisors: the hub (components/directory/HubView.tsx; every trade shares it).

const CATEGORY = CATEGORIES.fund_tax_advisor
type Params = { searchParams: Promise<HubSearchParams> }

export async function generateMetadata({ searchParams }: Params): Promise<Metadata> {
  return hubMetadata(CATEGORY, await searchParams)
}

export default async function Page({ searchParams }: Params) {
  return <HubView category={CATEGORY} searchParams={await searchParams} />
}
