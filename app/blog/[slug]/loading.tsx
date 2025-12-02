import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Skeleton } from "@/components/ui/skeleton"

export default function BlogPostLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <article className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              {/* Back link skeleton */}
              <div className="flex items-center gap-2 mb-8">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-36" />
              </div>

              {/* Category skeleton */}
              <Skeleton className="h-4 w-32 mb-4" />

              {/* Title skeleton */}
              <Skeleton className="h-12 w-full mb-4" />
              <Skeleton className="h-12 w-2/3 mb-8" />

              {/* Content skeleton */}
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-5/6" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
              </div>

              <div className="my-8">
                <Skeleton className="h-8 w-48" />
              </div>

              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}
