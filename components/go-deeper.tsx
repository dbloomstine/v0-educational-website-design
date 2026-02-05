import { AnimateOnScroll } from "@/components/animate-on-scroll"

export function GoDeeper() {
  return (
    <section className="py-12 border-b border-border">
      <div className="container mx-auto px-4">
        <AnimateOnScroll>
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-12 bg-border" />
              <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                Go Deeper
              </span>
              <div className="h-px w-12 bg-border" />
            </div>
            <p className="text-muted-foreground max-w-lg mx-auto">
              When you&apos;re ready to dive into the details, explore our library of articles, tools, and guides organized by fund type and role.
            </p>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
