import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-xl mx-auto text-center">
              <div className="mb-8">
                <span className="font-display text-8xl font-bold text-muted-foreground/20">404</span>
              </div>

              <h1 className="font-display text-4xl font-bold tracking-tight mb-4">
                Page not found
              </h1>

              <p className="text-lg text-muted-foreground mb-10">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Back to the news feed
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/#subscribe">
                    Subscribe to FundOps Daily
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
