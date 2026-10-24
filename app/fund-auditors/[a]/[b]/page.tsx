import type { Metadata } from 'next'
import { LandingView, hasQuery, landingMetadata } from '@/components/directory/LandingView'
import { CATEGORIES } from '@/lib/directory/taxonomy'

// /fund-auditors/<topic>/<place> (lib/directory/landing.ts).

const category = CATEGORIES.fund_auditor
type Params = { params: Promise<{ a: string; b: string }>; searchParams: Promise<{ page?: string | string[]; [k: string]: string | string[] | undefined }> }

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const [{ a, b }, sp] = await Promise.all([params, searchParams])
  const { page } = sp
  return landingMetadata({ segments: [a, b], page, category, query: hasQuery(sp) })
}

export default async function Page({ params, searchParams }: Params) {
  const [{ a, b }, sp] = await Promise.all([params, searchParams])
  const { page } = sp
  return <LandingView segments={[a, b]} page={page} category={category} />
}
