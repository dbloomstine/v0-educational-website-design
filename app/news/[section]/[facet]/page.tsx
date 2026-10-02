import type { Metadata } from 'next'
import { SectionFront, sectionMetadata } from '../section-front'

// A cut of a section (/news/private-equity/deals). Static like its parent, but
// built on first request rather than at deploy: there are some ninety of them.
export const revalidate = 600

export function generateStaticParams() {
  return []
}

type Params = { params: Promise<{ section: string; facet: string }> }

// The cut shares its section's title and canonical address: it is a view of
// that page, not a page of its own for a search engine to rank.
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return sectionMetadata((await params).section)
}

export default async function SectionFacetPage({ params }: Params) {
  const { section, facet } = await params
  return <SectionFront slug={section} facetKey={facet} />
}
