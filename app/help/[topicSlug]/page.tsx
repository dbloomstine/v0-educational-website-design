import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Mail,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  Rocket,
  FileText,
  ClipboardCheck,
  FileCheck,
  Building2,
  BarChart3,
  Shield,
  Calculator,
  Clock,
  LucideIcon
} from 'lucide-react'
import { getHelpTopic, getAllHelpTopicSlugs, type HelpTopic } from '@/lib/content/help-topics'

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Rocket,
  FileText,
  ClipboardCheck,
  FileCheck,
  Building2,
  BarChart3,
  Shield,
  Calculator,
  Clock,
}

interface PageProps {
  params: Promise<{ topicSlug: string }>
}

// Generate static params for all help topics
export async function generateStaticParams() {
  const slugs = getAllHelpTopicSlugs()
  return slugs.map((topicSlug) => ({ topicSlug }))
}

// Generate metadata for each topic
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { topicSlug } = await params
  const topic = getHelpTopic(topicSlug)

  if (!topic) {
    return {
      title: 'Not Found | FundOpsHQ',
    }
  }

  return {
    title: topic.pageTitle,
    description: topic.description,
    openGraph: {
      title: topic.pageTitle,
      description: topic.shortDescription,
      type: 'website',
      url: `https://fundops.com/help/${topic.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: topic.pageTitle,
      description: topic.shortDescription,
    },
    alternates: {
      canonical: `https://fundops.com/help/${topic.slug}`,
    },
  }
}

// Generate JSON-LD schemas
function generateFAQSchema(topic: HelpTopic) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: topic.faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

function generateBreadcrumbSchema(topic: HelpTopic) {
  return {
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
        name: topic.breadcrumbName,
        item: `https://fundops.com/help/${topic.slug}`,
      },
    ],
  }
}

function generateArticleSchema(topic: HelpTopic) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: topic.articleHeadline,
    description: topic.articleDescription,
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
      '@id': `https://fundops.com/help/${topic.slug}`,
    },
  }
}

export default async function HelpTopicPage({ params }: PageProps) {
  const { topicSlug } = await params
  const topic = getHelpTopic(topicSlug)

  if (!topic) {
    notFound()
  }

  const Icon = iconMap[topic.icon] || FileText
  const faqSchema = generateFAQSchema(topic)
  const breadcrumbSchema = generateBreadcrumbSchema(topic)
  const articleSchema = generateArticleSchema(topic)

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
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
                  <Icon className="h-7 w-7 text-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {topic.urgencyBadge}
                </span>
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance lg:text-5xl">
                {topic.title}?
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                {topic.description}
              </p>
            </div>
          </div>
        </section>

        {/* Context Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 text-2xl font-bold">What this involves</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                {topic.contextParagraphs.map((paragraph, index) => (
                  <p key={index} className="text-muted-foreground leading-relaxed mb-4">
                    {paragraph}
                  </p>
                ))}
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
                {topic.whatWeCanDiscuss.map((item, index) => (
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
                {topic.ctaDescription}
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
                      Grab a time on my calendar. We can discuss your specific situation and questions.
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
                      If you'd prefer to outline your situation first, email works great.
                    </p>
                    <Button asChild variant="outline" size="lg" className="w-full">
                      <a href={`mailto:danny.bloomstine@iqeq.com?subject=${topic.emailSubject}`}>
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
                While you're here, these resources might be helpful:
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {topic.relatedLinks.map((link, index) => (
                  <span key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground hover:text-accent-foreground underline"
                    >
                      {link.label}
                    </Link>
                    {index < topic.relatedLinks.length - 1 && (
                      <span className="text-muted-foreground ml-3">|</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
