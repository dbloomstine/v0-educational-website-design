import type { Metadata } from 'next'
import { FirmsIndexView, firmsIndexMetadata } from '@/components/directory/FirmView'
import { CATEGORIES } from '@/lib/directory/taxonomy'

// /fund-finance-bankers/firms: every firm with two or more people listed (components/directory/FirmView.tsx). Built on first request, kept an hour.

export const revalidate = 3600

const CATEGORY = CATEGORIES.fund_finance_banker

export async function generateMetadata(): Promise<Metadata> {
  return firmsIndexMetadata(CATEGORY)
}

export default async function Page() {
  return <FirmsIndexView category={CATEGORY} />
}
