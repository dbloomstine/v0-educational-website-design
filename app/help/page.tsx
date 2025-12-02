import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Building2, Rocket, ClipboardCheck, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'How I Can Help | FundOpsHQ',
  description: 'Facing a specific fund operations challenge? Whether it\'s SEC exam prep, vendor selection, or launching your first fund, I\'m happy to talk through it.',
  openGraph: {
    title: 'How I Can Help | FundOpsHQ',
    description: 'Facing a specific fund operations challenge? I\'m happy to talk through it.',
    type: 'website',
    url: 'https://fundops.com/help',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How I Can Help | FundOpsHQ',
    description: 'Facing a specific fund operations challenge? I\'m happy to talk through it.',
  },
  alternates: {
    canonical: 'https://fundops.com/help',
  },
}

const helpTopics = [
  {
    slug: 'sec-exam-prep',
    icon: Shield,
    title: 'SEC Exam Preparation',
    description: 'Got an exam notice or overdue for one? I can help you think through what to expect and how to prepare.',
    urgency: 'Time-sensitive'
  },
  {
    slug: 'fund-admin-selection',
    icon: Building2,
    title: 'Fund Administrator Selection',
    description: 'Running an RFP or evaluating options? I can help you think through what matters for your situation.',
    urgency: 'Major decision'
  },
  {
    slug: 'launching-a-fund',
    icon: Rocket,
    title: 'Launching a Fund',
    description: 'First-time manager or spinning out? There\'s a lot to figure out operationally. Happy to help you get oriented.',
    urgency: 'Getting started'
  },
  {
    slug: 'compliance-review',
    icon: ClipboardCheck,
    title: 'Compliance Gut Check',
    description: 'Want a second opinion on your policies, procedures, or approach? Sometimes it helps to talk it through.',
    urgency: 'Peace of mind'
  },
]

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative border-b border-border overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/20" />

          <div className="container relative mx-auto px-4 py-24 lg:py-32">
            <div className="mx-auto max-w-3xl">
              <h1 className="mb-6 text-5xl font-bold tracking-tight text-balance lg:text-6xl">
                How I Can Help
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                Fund operations challenges rarely come one at a time. If you're dealing with something specific,
                I'm happy to talk through it—no pitch, just a conversation.
              </p>
            </div>
          </div>
        </section>

        {/* Help Topics Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="grid gap-6 sm:grid-cols-2">
                {helpTopics.map((topic) => (
                  <Link key={topic.slug} href={`/help/${topic.slug}`} className="group">
                    <Card className="h-full border-border/60 transition-all hover:border-accent hover:shadow-md">
                      <CardContent className="pt-6 pb-6">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent">
                            <topic.icon className="h-6 w-6 text-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground group-hover:text-accent-foreground">
                                {topic.title}
                              </h3>
                            </div>
                            <span className="inline-block text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded mb-2">
                              {topic.urgency}
                            </span>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {topic.description}
                            </p>
                            <div className="mt-3 flex items-center text-sm font-medium text-foreground group-hover:text-accent-foreground">
                              Learn more
                              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Something Else Section */}
        <section className="py-16 border-t border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-2xl font-bold">Something else on your mind?</h2>
              <p className="mb-8 text-muted-foreground leading-relaxed">
                These aren't the only things I can help with. If you're working through an operations challenge
                that doesn't fit neatly into one of these categories, reach out anyway. I'm happy to chat.
              </p>
              <Button asChild size="lg">
                <Link href="/contact">
                  Get in Touch
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Context Section */}
        <section className="py-12 border-t border-border bg-accent/10">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm text-muted-foreground leading-relaxed">
                By day, I'm a Managing Director at{' '}
                <a
                  href="https://iqeq.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:underline"
                >
                  IQ-EQ
                </a>
                , where I work with fund managers on administration, compliance, and operations.
                FundOpsHQ is a personal project—these conversations are about helping you think through
                challenges, not selling services.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
