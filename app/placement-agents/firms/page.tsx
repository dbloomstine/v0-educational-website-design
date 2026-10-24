import type { Metadata } from 'next'
import { FirmsIndexView, firmsIndexMetadata } from '@/components/directory/FirmView'
import { CATEGORIES } from '@/lib/directory/taxonomy'

// /placement-agents/firms: every firm with two or more people listed (components/directory/FirmView.tsx).

// Rendered on request, never at build time (2026-10-24 night: a build that prerendered directory pages failed on
// database timeouts). The data is one cached read (lib/directory/data.ts); the edge keeps the page (next.config.mjs).
export const dynamic = 'force-dynamic'

const CATEGORY = CATEGORIES.placement_agent

export async function generateMetadata(): Promise<Metadata> {
  return firmsIndexMetadata(CATEGORY)
}

export default async function Page() {
  return <FirmsIndexView category={CATEGORY} />
}
