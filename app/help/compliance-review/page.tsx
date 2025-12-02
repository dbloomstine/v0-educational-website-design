import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Calendar, ArrowLeft, ClipboardCheck, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Compliance Gut Check | FundOpsHQ',
  description: 'Want a second opinion on your compliance approach? Need to talk through policies or procedures? I\'m happy to be a sounding board.',
  openGraph: {
    title: 'Compliance Gut Check | FundOpsHQ',
    description: 'Want a second opinion on your compliance approach? I\'m happy to be a sounding board.',
    type: 'website',
    url: 'https://fundops.com/help/compliance-review',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compliance Gut Check | FundOpsHQ',
    description: 'Want a second opinion on your compliance approach? I\'m happy to be a sounding board.',
  },
  alternates: {
    canonical: 'https://fundops.com/help/compliance-review',
  },
}

const whatWeCanDiscuss = [
  'Reviewing your compliance manual or specific policies',
  'Thinking through whether your procedures actually work in practice',
  'Annual review preparation and documentation',
  'Code of ethics questions and personal trading policies',
  'Marketing and advertising compliance considerations',
  'Form ADV updates and disclosure questions',
]

export default function ComplianceReviewPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
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
                  <ClipboardCheck className="h-7 w-7 text-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  Peace of mind
                </span>
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance lg:text-5xl">
                Need a Compliance Gut Check?
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                Sometimes you just need someone to bounce ideas off. Whether you're questioning a policy,
                preparing for your annual review, or wondering if your procedures actually make sense,
                I'm happy to talk through it.
              </p>
            </div>
          </div>
        </section>

        {/* Context Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 text-2xl font-bold">The value of a second opinion</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Compliance can feel isolating. CCOs and operations leads often work without anyone to
                  sanity-check their thinking. You inherit a compliance manual that's been copy-pasted
                  for years, or you're building something from scratch and wondering if you're missing something obvious.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The challenge is that "compliance" varies so much by firm type, strategy, and size.
                  What works for a large multi-strategy hedge fund doesn't make sense for an emerging
                  manager. But it's hard to know what to scale back without someone to talk it through with.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  This isn't formal compliance consulting—it's just a conversation. Sometimes that's
                  exactly what you need to feel confident in your approach or identify what needs work.
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
                A 20-30 minute conversation can help you think through what's on your mind.
                No formal engagement, no pitch—just a discussion.
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
                      Grab a time on my calendar. Come with your questions or just talk through what's on your mind.
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
                      If you have a specific question or want to share context ahead of time, email works well.
                    </p>
                    <Button asChild variant="outline" size="lg" className="w-full">
                      <a href="mailto:danny.bloomstine@iqeq.com?subject=Compliance%20Question">
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
                While you're here, these articles might be helpful:
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/funds/private-equity/compliance"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  PE Compliance Guide
                </Link>
                <span className="text-muted-foreground">|</span>
                <Link
                  href="/funds/hedge-funds/compliance"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  Hedge Fund Compliance
                </Link>
                <span className="text-muted-foreground">|</span>
                <Link
                  href="/funds/venture-capital/compliance"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  VC Compliance
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
