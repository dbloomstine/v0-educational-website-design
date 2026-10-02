import type { Metadata } from 'next'
import { SECTIONS } from '@/lib/news/sections'
import { SectionFront, sectionMetadata } from './section-front'

// Static: built for every section at deploy, rebuilt every ten minutes.
export const revalidate = 600
export const dynamicParams = false

export function generateStaticParams() {
  return SECTIONS.map((s) => ({ section: s.slug }))
}

type Params = { params: Promise<{ section: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return sectionMetadata((await params).section)
}

export default async function SectionPage({ params }: Params) {
  return <SectionFront slug={(await params).section} />
}
