import Image from 'next/image'
import { Mail, Linkedin } from 'lucide-react'

/**
 * Personal CTA strip — warm, non-salesy "reach out" section.
 * Used on homepage, about, news, and other key pages.
 */
export function ReachOut() {
  return (
    <section className="border-t border-border/50 bg-card/30">
      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-2xl flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
          <Image
            src="/danny-headshot.png"
            alt="Danny Bloomstine"
            width={56}
            height={56}
            className="rounded-full border border-border/60 object-cover shrink-0"
          />
          <div className="text-center sm:text-left flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-relaxed">
              Have a question about fund ops? Want to be a guest on the show?
              I&apos;m always happy to chat.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="mailto:danny.bloomstine@iqeq.com"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:border-foreground/20"
            >
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Email me
            </a>
            <a
              href="https://www.linkedin.com/in/danny-bloomstine/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:border-foreground/20"
            >
              <Linkedin className="h-3.5 w-3.5 text-muted-foreground" />
              Connect
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
