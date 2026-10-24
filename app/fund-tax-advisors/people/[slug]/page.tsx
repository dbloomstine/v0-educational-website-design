import type { Metadata } from 'next'
import { ProfileView, profileMetadata } from '@/components/directory/ProfileView'
import { CATEGORIES } from '@/lib/directory/taxonomy'

// /fund-tax-advisors/people/<slug>: a profile (components/directory/ProfileView.tsx). Built on first request, kept an hour.

export const revalidate = 3600
export function generateStaticParams() {
  return []
}

const CATEGORY = CATEGORIES.fund_tax_advisor
type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return profileMetadata(CATEGORY, (await params).slug)
}

export default async function Page({ params }: Params) {
  return <ProfileView category={CATEGORY} slug={(await params).slug} />
}
