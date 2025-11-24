import { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Mail, MessageSquare, HelpCircle, Lightbulb, FileText, AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact FundOpsHQ - Get Help with Fund Operations',
  description: 'Get in touch with FundOpsHQ for tailored guidance on your fund operations challenges. We provide expert consultation for CFOs, COOs, and operations professionals.',
  openGraph: {
    title: 'Contact FundOpsHQ - Get Help with Fund Operations',
    description: 'Get expert guidance on your fund operations challenges across all asset classes.',
    type: 'website',
    url: 'https://fundops.com/contact',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact FundOpsHQ',
    description: 'Get expert guidance on your fund operations challenges.',
  },
  alternates: {
    canonical: 'https://fundops.com/contact',
  },
}

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border bg-gradient-to-b from-background to-accent/20 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-6 text-5xl font-bold tracking-tight text-balance">
                Let's Talk Fund Operations
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                Have questions about fund ops? Want to discuss a specific challenge? Book a time to chat—no sales pitch, just helpful conversation.
              </p>
            </div>
          </div>
        </section>

        {/* How We Can Help Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <h2 className="mb-12 text-center text-3xl font-bold">How We Can Help</h2>

              <div className="grid gap-8 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                      <HelpCircle className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">Operational Guidance</CardTitle>
                    <CardDescription className="leading-relaxed">
                      Expert advice on fund operations challenges across all functional areas including CFO,
                      compliance, fund administration, and investor relations.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">Process Optimization</CardTitle>
                    <CardDescription className="leading-relaxed">
                      Recommendations for streamlining operations, improving efficiency, and implementing
                      industry best practices.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                      <Mail className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">Custom Consultation</CardTitle>
                    <CardDescription className="leading-relaxed">
                      Tailored support for your specific fund type, whether Private Equity, Hedge Funds,
                      Real Estate, or other asset classes.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Booking Section */}
        <section className="border-y border-border bg-accent/20 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="mb-8 text-center">
                <h2 className="mb-4 text-3xl font-bold">Book a Time to Chat</h2>
                <p className="text-muted-foreground text-balance">
                  Pick a time that works for you. We can discuss your specific operational challenges, answer questions, or just talk shop about fund operations.
                </p>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-6">
                    <p className="text-lg text-muted-foreground">
                      Click below to see available times and book directly on my calendar.
                    </p>
                    <Button asChild size="lg" className="text-lg px-8">
                      <a href="https://outlook.office.com/bookwithme/user/64e88c9063b2407fb03a67e5c3df844d@iqeq.com/meetingtype/2GfPzbwFuEiKymGSplU9ZQ2?anonymous&ismsaljsauthenabled&ep=mcard" target="_blank" rel="noopener noreferrer">
                        View Available Times
                      </a>
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Or connect with me on <a href="https://www.linkedin.com/in/danny-bloomstine/" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary underline">LinkedIn</a>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Feedback & Requests Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold">Request Content, Tools, or Share Feedback</h2>
                <p className="text-muted-foreground text-balance">
                  Help us improve FundOpsHQ. Request new content topics, suggest tool ideas, submit corrections, or share insights from your experience.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3 mb-12">
                <Card>
                  <CardHeader>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                      <FileText className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">Request Content</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      Missing a topic? Let us know what fund operations content you'd like to see.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                      <Lightbulb className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">Suggest Tools</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      Need a specific template or tool? Share your ideas with us.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">Submit Corrections</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      Spot an error or have additional insights? Help us keep content accurate.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Send Us Your Feedback</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    action="mailto:dbloomstine@gmail.com"
                    method="post"
                    encType="text/plain"
                    className="space-y-6"
                  >
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" placeholder="Your name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="your.email@fund.com" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Request Type</Label>
                      <select
                        id="type"
                        name="type"
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select a type...</option>
                        <option value="Request Content">Request Content</option>
                        <option value="Request Tool/Template">Request Tool/Template</option>
                        <option value="Suggest Update">Suggest Update/Improvement</option>
                        <option value="Submit Correction">Submit Correction/Insight</option>
                        <option value="General Feedback">General Feedback</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell us more about your request or feedback..."
                        rows={6}
                        required
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full sm:w-auto">
                      Send Feedback
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
