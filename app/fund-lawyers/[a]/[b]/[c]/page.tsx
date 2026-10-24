import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FirmListView, firmListMetadata } from '@/components/directory/FirmListView'
import { CATEGORIES } from '@/lib/directory/taxonomy'

// /fund-lawyers/<topic>/<place>/firms: the firms on that page, ranked (lib/directory/firm-lists.ts). Nothing else is
// three segments deep.

const category = CATEGORIES.fund_lawyer
type Params = { params: Promise<{ a: string; b: string; c: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const [{ a, b, c }, sp] = await Promise.all([params, searchParams])
  if (c !== 'firms') return { title: 'Not found', robots: { index: false } }
  return firmListMetadata({ segments: [a, b], category, query: Object.keys(sp).length > 0 })
}

export default async function Page({ params }: Params) {
  const { a, b, c } = await params
  if (c !== 'firms') notFound()
  return <FirmListView segments={[a, b]} category={category} />
}
