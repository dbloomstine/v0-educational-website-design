import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Calendar, MessageCircle, Compass, Users, Lightbulb } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact | FundOpsHQ',
  description: 'Have a question about fund operations? Want to think through a challenge? I\'m happy to chat, offer guidance, or point you in the right direction. No obligation, no pressure.',
  openGraph: {
    title: 'Contact | FundOpsHQ',
    description: 'Have a question about fund operations? I\'m happy to chat and help however I can.',
    type: 'website',
    url: 'https://fundops.com/contact',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact | FundOpsHQ',
    description: 'Have a question about fund operations? I\'m happy to chat and help however I can.',
  },
  alternates: {
    canonical: 'https://fundops.com/contact',
  },
}

const topicsToDiscuss = [
  {
    icon: Compass,
    title: "Fund operations questions",
    description: "Thinking through a process, evaluating options, or just need a second opinion"
  },
  {
    icon: Lightbulb,
    title: "Launching a fund",
    description: "Early-stage questions about standing up operations, choosing vendors, or getting organized"
  },
  {
    icon: Users,
    title: "Career & industry",
    description: "Breaking into fund ops, growing in the field, or understanding the landscape"
  },
  {
    icon: MessageCircle,
    title: "Something else entirely",
    description: "If you're not sure whether to reach out—go ahead. Happy to help or point you in the right direction"
  },
]

export default function ContactPage() {
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
                Contact
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                I'm Danny—the person behind FundOpsHQ. If you have a question, want to think through a challenge,
                or just want to talk shop about fund operations, I'm happy to chat.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Options - Moved up */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-4 text-3xl font-bold text-center">How to reach me</h2>
              <p className="mb-12 text-center text-muted-foreground text-balance">
                Pick whichever works best for you. I try to respond within a day or two.
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
                      Grab a time on my calendar. Usually 20-30 minutes is plenty to talk through most things.
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
                      If you prefer to write it out or have something quick, email works great.
                    </p>
                    <Button asChild variant="outline" size="lg" className="w-full">
                      <a href="mailto:danny.bloomstine@iqeq.com">
                        Send Email
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Brief context */}
              <div className="mt-12 text-center">
                <p className="text-sm text-muted-foreground">
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
                  But FundOpsHQ is a personal project—when you reach out here, you're talking to me, not a sales team.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Topics Section */}
        <section className="py-16 border-t border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <h2 className="mb-8 text-2xl font-bold text-center">Things I'm happy to discuss</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {topicsToDiscuss.map((topic) => (
                  <div
                    key={topic.title}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border/60 bg-card"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                      <topic.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{topic.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Closing */}
        <section className="py-12 border-t border-border bg-accent/10">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Not sure if your question is "worth" reaching out about? It is.
                I'd rather have a quick conversation than have you stuck on something.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
