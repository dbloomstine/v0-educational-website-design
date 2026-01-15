import { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { FundLaunchGuide } from '@/components/tools/fund-launch-guide'

export const metadata: Metadata = {
  title: 'Fund Launch Guide | FundOpsHQ',
  description: 'Interactive checklist and guide for launching a private fund. Customize for your strategy, track progress, and never miss a critical step.',
  openGraph: {
    title: 'Fund Launch Guide | FundOpsHQ',
    description: 'Interactive checklist and guide for launching a private fund. Customize for your strategy, track progress, and never miss a critical step.',
    type: 'website',
    url: 'https://fundops.com/tools/fund-launch-guide',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fund Launch Guide | FundOpsHQ',
    description: 'Interactive checklist and guide for launching a private fund.',
  },
  alternates: {
    canonical: 'https://fundops.com/tools/fund-launch-guide',
  },
}

export default function FundLaunchGuidePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="relative border-b border-border overflow-hidden py-12">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-violet-500/5 to-emerald-500/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/40 via-transparent to-transparent" />

          <div className="container relative mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-foreground/5 border border-border px-4 py-1.5 text-sm font-medium text-foreground mb-4">
                Interactive Guide
              </div>
              <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                Fund Launch Guide
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                A comprehensive, interactive checklist for launching your fund. Customize for your
                strategy, track your progress, and make sure you don&apos;t miss anything critical.
              </p>
            </div>
          </div>
        </section>

        {/* Tool Section */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-7xl">
              <FundLaunchGuide />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
