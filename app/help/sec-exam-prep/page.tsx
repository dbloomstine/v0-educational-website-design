import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Calendar, ArrowLeft, Shield, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'SEC Exam Preparation Guide | FundOpsHQ',
  description: 'Got an SEC examination notice? Need help preparing? Learn what to expect, how to organize your documents, and prepare for examiner interviews.',
  openGraph: {
    title: 'SEC Exam Preparation Guide | FundOpsHQ',
    description: 'Got an SEC examination notice? Learn what to expect and how to prepare for your fund examination.',
    type: 'website',
    url: 'https://fundops.com/help/sec-exam-prep',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEC Exam Preparation Guide | FundOpsHQ',
    description: 'Got an SEC examination notice? Learn what to expect and how to prepare for your fund examination.',
  },
  alternates: {
    canonical: 'https://fundops.com/help/sec-exam-prep',
  },
}

// FAQ Schema for rich snippets
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What should I expect during an SEC examination?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'SEC examinations typically involve document production requests, on-site or remote interviews with key personnel, and a review of your compliance policies and procedures. The examination process can take several weeks to months, and examiners will focus on areas like fee and expense calculations, off-channel communications, and cybersecurity practices.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I prepare for an SEC fund examination?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Preparation involves organizing your documentation, understanding current SEC examination priorities, preparing your team for examiner interviews, reviewing your compliance policies for gaps, and identifying potential areas of focus. Working with experienced professionals can help you prepare systematically.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are common SEC examination deficiencies for private funds?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Common deficiencies include inadequate compliance policies, fee and expense allocation issues, incomplete books and records, cybersecurity gaps, marketing and advertising violations, and off-channel communications. Addressing these proactively can help avoid enforcement actions.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does an SEC examination take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'SEC examinations vary in length but typically take 2-6 months from the initial document request to the examination closing letter. The timeline depends on the scope of the examination, firm size, and how quickly you can respond to document requests.',
      },
    },
  ],
}

// Breadcrumb Schema
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://fundops.com',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'How I Can Help',
      item: 'https://fundops.com/help',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'SEC Exam Preparation',
      item: 'https://fundops.com/help/sec-exam-prep',
    },
  ],
}

// Author/Article Schema
const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'SEC Exam Preparation Guide for Private Fund Managers',
  description: 'Comprehensive guide to preparing for SEC examinations, including document organization, interview preparation, and understanding examination priorities.',
  author: {
    '@type': 'Person',
    name: 'Danny Bloomstine',
    url: 'https://www.linkedin.com/in/danny-bloomstine/',
    jobTitle: 'Managing Director',
    worksFor: {
      '@type': 'Organization',
      name: 'IQ-EQ',
    },
  },
  publisher: {
    '@type': 'Organization',
    name: 'FundOpsHQ',
    url: 'https://fundops.com',
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://fundops.com/help/sec-exam-prep',
  },
}

const whatWeCanDiscuss = [
  'Understanding the examination process and timeline',
  'Organizing your document production',
  'Identifying potential areas of focus based on current SEC priorities',
  'Mock interviews and what to expect from examiner conversations',
  'Common deficiencies and how to address them proactively',
  'Post-exam follow-up and remediation planning',
]

export default function SECExamPrepPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
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
                  <Shield className="h-7 w-7 text-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  Time-sensitive
                </span>
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance lg:text-5xl">
                Preparing for an SEC Examination?
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                Getting that examination notice can feel overwhelming. Whether it's your first exam or you haven't
                had one in years, there's a lot to organize and prepare. I've helped managers work through
                this process, and I'm happy to talk through it with you.
              </p>
            </div>
          </div>
        </section>

        {/* Context Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 text-2xl font-bold">The reality of SEC exams</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  SEC examinations have evolved significantly in recent years. The Division of Examinations
                  continues to focus on private fund advisers, with particular attention to fee and expense
                  calculations, off-channel communications, and cybersecurity practices.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Even with potential regulatory shifts, examiners are still actively conducting examinations
                  and identifying deficiencies. The key is preparation—understanding what they're looking for,
                  getting your documentation organized, and making sure your team knows what to expect.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  This isn't about gaming the system. It's about being ready to demonstrate that your
                  operations are sound and your compliance program is working as intended.
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
                A 20-30 minute conversation is usually enough to get you oriented and thinking about the
                right things. No pitch, just practical discussion.
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
                      Grab a time on my calendar. We can talk through where you are and what you're facing.
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
                      If you prefer to write it out first, that works too. Include some context and I'll get back to you.
                    </p>
                    <Button asChild variant="outline" size="lg" className="w-full">
                      <a href="mailto:danny.bloomstine@iqeq.com?subject=SEC%20Exam%20Preparation">
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
                  href="/funds/private-credit/compliance"
                  className="text-sm text-foreground hover:text-accent-foreground underline"
                >
                  Private Credit Compliance
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
