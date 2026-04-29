import { ArrowRight } from "lucide-react"
import { CHROME_EXTENSION_URL } from "@/lib/chrome-extension"

/**
 * Slim top-of-page banner that surfaces the Chrome extension above the
 * sticky site header. Not sticky — sits at the top of the document and
 * scrolls away with the rest of the page. The sticky SiteHeader takes
 * over on scroll. One-impression-per-visit pattern: visible to everyone
 * landing fresh, out of the way once they engage.
 */
export function TopAnnouncementBar() {
  return (
    <a
      href={CHROME_EXTENSION_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block w-full border-b border-foreground/15 bg-foreground text-background"
      aria-label="Get the FundOpsHQ Chrome extension"
    >
      <div className="container mx-auto flex items-center justify-center gap-3 px-4 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-[0.18em] sm:text-[11px]">
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
        </span>
        <span className="hidden sm:inline">
          New &nbsp;·&nbsp; FundOpsHQ Chrome extension is live
        </span>
        <span className="inline sm:hidden">New &nbsp;·&nbsp; Chrome extension</span>
        <span className="inline-flex items-center gap-1 text-amber-400 transition-colors group-hover:text-amber-300">
          Install
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </a>
  )
}
