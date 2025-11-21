import { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, MessageSquare, HelpCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact FundOps - Get Help with Fund Operations',
  description: 'Get in touch with FundOps for tailored guidance on your fund operations challenges. We provide expert consultation for CFOs, COOs, and operations professionals.',
  openGraph: {
    title: 'Contact FundOps - Get Help with Fund Operations',
    description: 'Get expert guidance on your fund operations challenges across all asset classes.',
    type: 'website',
    url: 'https://fundops.com/contact',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact FundOps',
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
                Get Help with Your Fund Operations
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                Whether you're facing a specific operational challenge or looking to optimize your processes,
                we're here to provide tailored guidance.
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

        {/* Contact Form Section */}
        <section className="border-y border-border bg-accent/20 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl">
              <div className="mb-8 text-center">
                <h2 className="mb-4 text-3xl font-bold">Schedule a Consultation</h2>
                <p className="text-muted-foreground text-balance">
                  Fill out the form below and we'll get back to you within 24 hours to discuss your needs.
                </p>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <p className="mb-6 text-center text-sm text-muted-foreground">
                    Contact form coming soon - email integration in progress
                  </p>

                  <form className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="firstName" className="text-sm font-medium">
                          First Name
                        </label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          disabled
                          className="disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="lastName" className="text-sm font-medium">
                          Last Name
                        </label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          disabled
                          className="disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@fundexample.com"
                        disabled
                        className="disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="fundType" className="text-sm font-medium">
                        Fund Type
                      </label>
                      <select
                        id="fundType"
                        disabled
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select fund type</option>
                        <option value="private-equity">Private Equity</option>
                        <option value="private-credit">Private Credit</option>
                        <option value="venture-capital">Venture Capital</option>
                        <option value="hedge-funds">Hedge Funds</option>
                        <option value="real-estate">Real Estate</option>
                        <option value="infrastructure">Infrastructure</option>
                        <option value="secondaries">Secondaries</option>
                        <option value="gp-stakes">GP-Stakes</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="area" className="text-sm font-medium">
                        Area of Interest
                      </label>
                      <select
                        id="area"
                        disabled
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select area</option>
                        <option value="cfo">CFO / Financial Management</option>
                        <option value="compliance">Compliance</option>
                        <option value="fund-admin">Fund Administration</option>
                        <option value="investor-relations">Investor Relations</option>
                        <option value="tax">Tax</option>
                        <option value="banking">Banking / Treasury</option>
                        <option value="fundraising">Fundraising</option>
                        <option value="insurance">Insurance / Risk</option>
                        <option value="audit">Audit</option>
                        <option value="cyber-it">Cyber / IT</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium">
                        How can we help?
                      </label>
                      <textarea
                        id="message"
                        rows={4}
                        placeholder="Describe your operational challenge or question..."
                        disabled
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled>
                      Coming Soon
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Alternative Contact Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-2xl font-bold">In the Meantime</h2>
              <p className="text-muted-foreground leading-relaxed">
                While we set up our contact form, explore our comprehensive library of fund operations resources
                organized by fund type and operational pillar. Each article provides detailed guidance on specific
                operational challenges.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
