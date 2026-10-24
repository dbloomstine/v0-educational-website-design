import type { Metadata } from 'next'
import { FirmView, firmMetadata } from '@/components/directory/FirmView'
import { CATEGORIES } from '@/lib/directory/taxonomy'

// /fund-finance-bankers/firms/<firm>: a firm inside the directory (components/directory/FirmView.tsx). ?page=n for a long list.

const CATEGORY = CATEGORIES.fund_finance_banker
type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string | string[] }> }

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const [{ slug }, { page }] = await Promise.all([params, searchParams])
  return firmMetadata(CATEGORY, slug, page)
}

export default async function Page({ params, searchParams }: Params) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams])
  return <FirmView category={CATEGORY} slug={slug} page={page} />
}
