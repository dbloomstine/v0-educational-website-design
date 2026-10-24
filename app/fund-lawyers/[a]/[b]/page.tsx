import type { Metadata } from 'next'
import { LandingView, landingMetadata } from '@/components/directory/LandingView'

// /fund-lawyers/<topic>/<place>: "Venture Fund Lawyers in San Francisco" (lib/directory/landing.ts).

type Params = { params: Promise<{ a: string; b: string }>; searchParams: Promise<{ page?: string | string[] }> }

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const [{ a, b }, { page }] = await Promise.all([params, searchParams])
  return landingMetadata({ segments: [a, b], page })
}

export default async function Page({ params, searchParams }: Params) {
  const [{ a, b }, { page }] = await Promise.all([params, searchParams])
  return <LandingView segments={[a, b]} page={page} />
}
