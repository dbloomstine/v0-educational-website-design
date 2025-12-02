import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Calendar, ArrowLeft, Building2, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Choosing a Fund Administrator | FundOpsHQ',
  description: 'Evaluating fund administrators? Running an RFP? I can help you think through what matters for your specific situation and strategy.',
  openGraph: {
    title: 'Choosing a Fund Administrator | FundOpsHQ',
    description: 'Evaluating fund administrators? I can help you think through what matters for your situation.',
    type: 'website',
    url: 'https://fundops.com/help/fund-admin-selection',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Choosing a Fund Administrator | FundOpsHQ',
    description: 'Evaluating fund administrators? I can help you think through what matters for your situation.',
  },
  alternates: {
    canonical: 'https://fundops.com/help/fund-admin-selection',
  },
}

const whatWeCanDiscuss = [
  'Understanding what questions to ask (and what the answers really mean)',
  'Structuring an RFP process that gets you useful responses',
  'Evaluating proposals beyond just pricing',
  'Thinking through the build vs. buy decision for specific functions',
  'Transition planning and what to expect',
  'Red flags and what to look for in references',
]

export default function FundAdminSelectionPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative border-b border-border overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/20" />

          <div className="container relative mx-auto px-4 py-24 lg:py-32">
            <div className="mx-auto max-w-3xl">
              <Link
                href="/help"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to How I Can Help
              </Link>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-accent">
                  <Building2 className="h-7 w-7 text-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  Major decision
                </span>
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance lg:text-5xl">
                Choosing a Fund Administrator?
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                Selecting a fund administrator is one of the more consequential operational decisions you'll make.
                It's hard to reverse, and the right fit depends heavily on your strategy, size, and complexity.
                I'm happy to help you think through it.
              </p>
            </div>
          </div>
        </section>

        {/* Context Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 text-2xl font-bold">Why this decision matters</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The fund administration landscape has gotten more complex. There are more options than ever,
                  from large global platforms to specialized boutiques, and the right choice depends on factors
                  that aren't always obvious from an RFP response.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  What works for a large, multi-strategy hedge fund is very different from what works for
                  a first-time private equity manager. Technology capabilities, investor reporting flexibility,
                  team depth, and cultural fit all matter—but pricing often dominates the conversation.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  I've seen these relationships from both sides. I know what questions to ask, what the answers
                  actually mean, and what tends to matter most over time. Happy to share that perspective.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What We Can Discuss */}
        <section className="py-16 border-t border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-8 text-2xl font-bold">What we can talk through</h2>
              <div className="grid gap-3">
                {whatWeCanDiscuss.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-lg border border-border/60 bg-card">
                    <CheckCircle2 className="h-5 w-5 text-accent-foreground mt-0.5 shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-4 text-2xl font-bold text-center">Let's talk through it</h2>
              <p className="mb-8 text-center text-muted-foreground text-balance">
                Whether you're early in the process or evaluating final candidates, I'm happy to be a
                sounding board. No pitch, just practical perspective.
              </p>

              <div className="grid gap-6 sm:grid-cols-2">
                {/* Book a Conversation */}
                <Card className="border-border/60">
                  <CardContent className="pt-8 pb-8 text-center">
                    <div className="mb-4 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                      <Calendar className="h-7 w-7 text-foreground" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">Book a conversation</h3>
                    <p className="mb-6 text-muted-foreground text-sm">
                      Grab a time on my calendar. We can talk through your situation and what you're looking for.
                    </p>
                    <Button asChild size="lg" className="w-full">
                      <a
                        href="https://outlook.office.com/bookwithme/user/64e88c9063b2407fb03a67e5c3df844d@iqeq.com/meetingtype/2GfPzbwFuEiKymGSplU9ZQ2?anonymous&ismsaljsauthenabled&ep=mcard"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Pick a Time
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                {/* Send an Email */}
                <Card className="border-border/60">
                  <CardContent className="pt-8 pb-8 text-center">
                    <div className="mb-4 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                      <Mail className="h-7 w-7 text-foreground" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">Send me an email</h3>
                    <p className="mb-6 text-muted-foreground text-sm">
                      If you'd like to lay out some context first, email works great. Tell me about your fund and what you're evaluating.
                    </p>
                    <Button asChild variant="outline" size="lg" className="w-full">
                      <a href="mailto:danny.bloomstine@iqeq.com?subject=Fund%20Administrator%20Selection">
                        Send Email
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Related Resources */}
        <section className="py-12 border-t border-border bg-accent/10">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h3 className="mb-4 text-lg font-semibold">Related Resources</h3>
              <p className="text-sm text-muted-foreground mb-4">
                While you're here, these articles and tools might be helpful:
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/funds/private-equity/fund-administration"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  PE Fund Administration
                </Link>
                <span className="text-muted-foreground">|</span>
                <Link
                  href="/tools/fund-admin-pricing"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  Fund Admin Pricing Calculator
                </Link>
                <span className="text-muted-foreground">|</span>
                <Link
                  href="/funds/hedge-funds/fund-administration"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  Hedge Fund Administration
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
