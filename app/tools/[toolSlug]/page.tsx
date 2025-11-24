import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Breadcrumb } from '@/components/breadcrumb'
import { getToolBySlug, getAllTools } from '@/lib/content/tools'
import { ToolPlaceholder } from '@/components/tools/tool-placeholder'

interface ToolPageProps {
  params: Promise<{
    toolSlug: string
  }>
}

export async function generateStaticParams() {
  const tools = getAllTools()
  return tools.map((tool) => ({
    toolSlug: tool.slug,
  }))
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { toolSlug } = await params
  const tool = getToolBySlug(toolSlug)

  if (!tool) {
    return {
      title: 'Tool Not Found - FundOpsHQ',
    }
  }

  return {
    title: `${tool.title} - FundOpsHQ`,
    description: tool.shortDescription,
    openGraph: {
      title: `${tool.title} - FundOpsHQ`,
      description: tool.shortDescription,
      type: 'website',
      url: `https://fundops.com/tools/${tool.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: tool.title,
      description: tool.shortDescription,
    },
    alternates: {
      canonical: `https://fundops.com/tools/${tool.slug}`,
    },
  }
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { toolSlug } = await params
  const tool = getToolBySlug(toolSlug)

  if (!tool) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-background">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'Tools & Calculators', href: '/tools' },
                { label: tool.title, href: `/tools/${tool.slug}` },
              ]}
            />
          </div>
        </div>

        {/* Tool Content */}
        <ToolPlaceholder tool={tool} />
      </main>

      <SiteFooter />
    </div>
  )
}
