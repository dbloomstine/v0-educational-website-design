import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Calendar, ArrowLeft, Rocket, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Launching Your First Fund | FundOpsHQ',
  description: 'First-time fund manager? Spinning out from a larger firm? I can help you think through the operational setup and get organized.',
  openGraph: {
    title: 'Launching Your First Fund | FundOpsHQ',
    description: 'First-time fund manager? I can help you think through the operational setup.',
    type: 'website',
    url: 'https://fundops.com/help/launching-a-fund',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Launching Your First Fund | FundOpsHQ',
    description: 'First-time fund manager? I can help you think through the operational setup.',
  },
  alternates: {
    canonical: 'https://fundops.com/help/launching-a-fund',
  },
}

const whatWeCanDiscuss = [
  'Building your operational checklist and timeline',
  'Understanding what vendors you actually need (and when)',
  'Thinking through in-house vs. outsourced for different functions',
  'Budgeting for operations and administration',
  'Setting up your compliance program from scratch',
  'What LPs will expect to see operationally during due diligence',
]

export default function LaunchingFundPage() {
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
                  <Rocket className="h-7 w-7 text-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  Getting started
                </span>
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance lg:text-5xl">
                Launching Your First Fund?
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                There's a lot to figure out operationally when you're launching a fund. Whether you're a
                first-time manager or spinning out from a larger firm, it helps to talk through the
                operational side with someone who's seen it before.
              </p>
            </div>
          </div>
        </section>

        {/* Context Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 text-2xl font-bold">The operational side of launching</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Most first-time managers come from investment roles where someone else handled operations.
                  Now you need to make decisions about fund administration, compliance, banking, insurance,
                  technology—all while trying to raise capital and source deals.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The challenge is knowing what actually matters at your stage versus what can wait.
                  You don't need enterprise-grade everything on day one, but you do need to get certain
                  things right from the start—and LPs will be looking at your operational setup during due diligence.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  I've helped managers work through this process across private equity, venture capital,
                  and credit strategies. Happy to share what tends to work and what doesn't.
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
                Whether you're just starting to think about operations or you're deep in vendor selection,
                I'm happy to help you think through it. No pitch, just practical guidance.
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
                      Grab a time on my calendar. Tell me about your fund and where you are in the process.
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
                      If you'd like to lay out your situation first, email works great. Include your strategy and timeline.
                    </p>
                    <Button asChild variant="outline" size="lg" className="w-full">
                      <a href="mailto:danny.bloomstine@iqeq.com?subject=Launching%20a%20Fund">
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
                  href="/funds/private-equity/cfo"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  PE CFO Guide
                </Link>
                <span className="text-muted-foreground">|</span>
                <Link
                  href="/tools/management-company-budget"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  Management Company Budget Calculator
                </Link>
                <span className="text-muted-foreground">|</span>
                <Link
                  href="/funds/venture-capital/fundraising"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  VC Fundraising Guide
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
