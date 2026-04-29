import { ArrowRight } from "lucide-react"
import { CHROME_EXTENSION_URL } from "@/lib/chrome-extension"

/**
 * Slim top-of-page wire strip that surfaces the Chrome extension above
 * the sticky site header. Styled to match the editorial "VOL. I · …"
 * eyebrow strip — same dark-navy background, monospace tracking, and
 * amber accent — so it reads as part of the publication chrome rather
 * than a SaaS alert banner.
 *
 * Not sticky — sits at the top of the document and scrolls away. The
 * sticky SiteHeader takes over on scroll.
 */
export function TopAnnouncementBar() {
  return (
    <a
      href={CHROME_EXTENSION_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block w-full border-b border-foreground/10 bg-background transition-colors hover:bg-foreground/[0.025]"
      aria-label="Get the FundOpsHQ Chrome extension"
    >
      <div className="container mx-auto flex items-center justify-center gap-2.5 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] sm:gap-3 sm:text-[11px]">
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
        </span>
        <span className="text-amber-400/95">New</span>
        <span aria-hidden="true" className="text-foreground/25">·</span>
        <span className="hidden text-foreground/75 sm:inline">
          FundOpsHQ Chrome extension is live
        </span>
        <span className="inline text-foreground/75 sm:hidden">Chrome extension is live</span>
        <span aria-hidden="true" className="text-foreground/25">·</span>
        <span className="inline-flex items-center gap-1 text-amber-400 transition-colors group-hover:text-amber-300">
          Install
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </a>
  )
}
