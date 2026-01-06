import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Building2, Rocket, ClipboardCheck, ArrowRight, FileCheck, FileText, BarChart3, Calculator, Clock } from 'lucide-react'
import { PageHero, SectionCTA } from '@/components/layout'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'How I Can Help | FundOpsHQ',
  description: 'Facing a specific fund operations challenge? Whether it\'s SEC exam prep, vendor selection, or launching your first fund, I\'m happy to talk through it.',
  path: '/help',
  ogDescription: 'Facing a specific fund operations challenge? I\'m happy to talk through it.',
})

const helpTopics = [
  {
    slug: 'sec-exam-prep',
    icon: Shield,
    title: 'SEC Exam Preparation',
    description: 'Got an exam notice or overdue for one? I can help you think through what to expect and how to prepare.',
    urgency: 'Time-sensitive'
  },
  {
    slug: 'annual-audit-prep',
    icon: FileCheck,
    title: 'Annual Audit Preparation',
    description: 'Audit season approaching? I can help you organize your PBC list, understand what auditors focus on, and avoid common findings.',
    urgency: 'Year-end critical'
  },
  {
    slug: 'k1-tax-season',
    icon: FileText,
    title: 'K-1 Tax Season',
    description: 'Managing K-1 delivery timelines? I can help with investor communication, extension strategies, and coordinating the process.',
    urgency: 'Tax deadline'
  },
  {
    slug: 'fund-admin-selection',
    icon: Building2,
    title: 'Fund Administrator Selection',
    description: 'Running an RFP or evaluating options? I can help you think through what matters for your situation.',
    urgency: 'Major decision'
  },
  {
    slug: 'waterfall-calculations',
    icon: Calculator,
    title: 'Waterfall & Distribution Calculations',
    description: 'Working through waterfall mechanics? I can help you understand structures, validate calculations, and avoid common errors.',
    urgency: 'High stakes'
  },
  {
    slug: 'investor-reporting',
    icon: BarChart3,
    title: 'Investor Reporting Setup',
    description: 'Building or improving your reporting package? I can share what LPs actually want to see and how to deliver it efficiently.',
    urgency: 'Ongoing operations'
  },
  {
    slug: 'regulatory-filings',
    icon: Clock,
    title: 'Regulatory Filing Deadlines',
    description: 'Form PF, Form ADV, state filings—there\'s a lot to track. I can help you build a calendar and stay compliant.',
    urgency: 'Compliance critical'
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

      <main id="main-content" className="flex-1">
        <PageHero
          title="How I Can Help"
          subtitle="Fund operations challenges rarely come one at a time. If you&apos;re dealing with something specific, I&apos;m happy to talk through it—no pitch, just a conversation."
          titleSize="large"
          align="left"
        />

        {/* Help Topics Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

        <SectionCTA
          title="Something else on your mind?"
          description="These aren&apos;t the only things I can help with. If you&apos;re working through an operations challenge that doesn&apos;t fit neatly into one of these categories, reach out anyway. I&apos;m happy to chat."
          className="bg-card/30"
        >
          <Button asChild size="lg">
            <Link href="/contact">
              Get in Touch
            </Link>
          </Button>
        </SectionCTA>

        {/* Context Section */}
        <section className="py-12 border-t border-border bg-accent/10">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm text-muted-foreground leading-relaxed">
                By day, I&apos;m a Managing Director at{' '}
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
