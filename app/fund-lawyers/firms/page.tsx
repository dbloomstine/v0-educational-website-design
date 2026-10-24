import type { Metadata } from 'next'
import { FirmListView, firmListMetadata } from '@/components/directory/FirmListView'
import { hasQuery } from '@/components/directory/LandingView'
import { CATEGORIES } from '@/lib/directory/taxonomy'

// /fund-lawyers/firms: every firm, ranked by partners listed (components/directory/FirmListView.tsx, lib/directory/firm-lists.ts).

// Rendered on request, never at build time (2026-10-24 night: a build that prerendered directory pages failed on
// database timeouts). The data is one cached read (lib/directory/data.ts); the edge keeps the page (next.config.mjs).
export const dynamic = 'force-dynamic'

const category = CATEGORIES.fund_lawyer
type Params = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Params): Promise<Metadata> {
  return firmListMetadata({ segments: [], category, query: hasQuery(await searchParams) })
}

export default async function Page() {
  return <FirmListView segments={[]} category={category} />
}
