import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AnimateOnScroll } from '@/components/animate-on-scroll'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic2, Users, Lightbulb, ArrowRight } from 'lucide-react'
import { SectionCTA } from '@/components/layout'
import { createPageMetadata } from '@/lib/seo'
import { Logo } from '@/components/logo'

export const metadata = createPageMetadata({
  title: 'FundOpsHQ Interviews | Coming Soon',
  description: 'Conversations with fund operations professionals, CFOs, COOs, and industry experts. Coming soon to FundOpsHQ.',
  path: '/interviews',
  ogDescription: 'Conversations with fund operations professionals, CFOs, COOs, and industry experts.',
})

const highlights = [
  {
    icon: Mic2,
    title: 'Real Conversations',
    description: 'Candid discussions with practitioners who navigate fund operations daily.',
  },
  {
    icon: Users,
    title: 'Diverse Perspectives',
    description: 'CFOs, COOs, fund admins, compliance officers, and service providers.',
  },
  {
    icon: Lightbulb,
    title: 'Practical Insights',
    description: 'Lessons learned, best practices, and hard-won wisdom from the field.',
  },
]

export default function InterviewsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="relative border-b border-border overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/30" />

          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="container relative mx-auto px-4 py-20 lg:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <AnimateOnScroll delay={0}>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
                  Coming Soon
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll delay={100}>
                {/* Logo - FundOpsHQ wordmark, centered */}
                <div className="mb-8 flex justify-center">
                  <Logo height={48} />
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll delay={200}>
                <p className="text-xl text-muted-foreground leading-relaxed text-balance mb-8">
                  Conversations with fund operations professionals who share their experiences,
                  challenges, and insights from the front lines of PE, VC, hedge funds, and beyond.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll delay={300}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild variant="outline" size="lg">
                    <Link href="/about">
                      Learn About FundOpsHQ
                    </Link>
                  </Button>
                  <Button asChild size="lg">
                    <Link href="/contact">
                      Get in Touch
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* What to Expect Section */}
        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <AnimateOnScroll>
                <div className="text-center mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">What to Expect</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    FundOpsHQ Interviews will feature in-depth conversations with the people
                    who make fund operations work.
                  </p>
                </div>
              </AnimateOnScroll>

              <div className="grid gap-6 sm:grid-cols-3">
                {highlights.map((highlight, index) => (
                  <AnimateOnScroll key={highlight.title} delay={index * 100}>
                    <Card className="h-full border-border/60 bg-card/50">
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                            <highlight.icon className="h-6 w-6 text-foreground" />
                          </div>
                          <h3 className="font-semibold mb-2">{highlight.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {highlight.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </AnimateOnScroll>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Topics We'll Cover */}
        <section className="py-16 border-t border-border bg-accent/5">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <AnimateOnScroll>
                <div className="text-center mb-10">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Topics We&apos;ll Cover</h2>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll delay={100}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    'Career paths in fund ops',
                    'Building ops from scratch',
                    'Tech stack decisions',
                    'Vendor relationships',
                    'Scaling operations',
                    'Regulatory challenges',
                    'Team building',
                    'Cross-border complexity',
                    'Lessons from failures',
                  ].map((topic) => (
                    <div
                      key={topic}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        <SectionCTA
          title="Know someone with a great story?"
          description="If you or someone you know has interesting experiences in fund operations and would like to share them, I&apos;d love to hear from you."
        >
          <Button asChild size="lg">
            <Link href="/contact">
              Get in Touch
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </SectionCTA>

        {/* Explore Other Content */}
        <section className="py-12 border-t border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm text-muted-foreground mb-4">
                While you wait, explore our existing resources
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/#fund-types">Fund Types</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/tools">Tools</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/newsletter">Newsletters</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
