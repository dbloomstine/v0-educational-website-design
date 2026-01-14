import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Linkedin } from 'lucide-react'
import { PageHero } from '@/components/layout'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Contact | FundOpsHQ',
  description: 'Have feedback or suggestions about FundOpsHQ? Found an error in an article? Let me know.',
  path: '/contact',
  ogDescription: 'Have feedback or suggestions about FundOpsHQ? Let me know.',
})

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <PageHero
          title="Contact"
          subtitle="Have feedback about the site? Found an error? Have a suggestion for a topic to cover? I'd love to hear from you."
          titleSize="large"
          align="left"
        />

        {/* Contact Options */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl">
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Send an Email */}
                <Card className="border-border/60">
                  <CardContent className="pt-8 pb-8 text-center">
                    <div className="mb-4 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                      <Mail className="h-7 w-7 text-foreground" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">Send an email</h3>
                    <p className="mb-6 text-muted-foreground text-sm">
                      Questions, corrections, or suggestions about the site.
                    </p>
                    <Button asChild size="lg" className="w-full">
                      <a href="mailto:danny.bloomstine@iqeq.com?subject=FundOpsHQ%20Feedback">
                        Send Email
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                {/* LinkedIn */}
                <Card className="border-border/60">
                  <CardContent className="pt-8 pb-8 text-center">
                    <div className="mb-4 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                      <Linkedin className="h-7 w-7 text-foreground" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">Connect on LinkedIn</h3>
                    <p className="mb-6 text-muted-foreground text-sm">
                      Follow along or send a message.
                    </p>
                    <Button asChild variant="outline" size="lg" className="w-full">
                      <a
                        href="https://www.linkedin.com/in/danny-bloomstine/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Profile
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
