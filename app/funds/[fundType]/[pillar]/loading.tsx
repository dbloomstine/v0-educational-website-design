import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Skeleton } from "@/components/ui/skeleton"

export default function ArticleLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <article className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="max-w-4xl">
                {/* Breadcrumb skeleton */}
                <div className="flex items-center gap-2 mb-8">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </div>

                {/* Category indicator skeleton */}
                <div className="mt-8 mb-4 flex items-center gap-3">
                  <Skeleton className="h-1.5 w-12 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>

                {/* Title skeleton */}
                <Skeleton className="h-14 w-full mb-4" />
                <Skeleton className="h-14 w-3/4 mb-4" />

                {/* Subtitle skeleton */}
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-6 w-2/3 mb-6" />

                {/* Meta info skeleton */}
                <div className="flex items-center gap-4 border-b border-border pb-6">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>

              {/* Content skeleton */}
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-12 mt-12">
                <div className="max-w-4xl space-y-6">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-5/6" />

                  <Skeleton className="h-8 w-56 mt-8" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-2/3" />
                </div>

                {/* TOC skeleton */}
                <div className="hidden xl:block">
                  <div className="sticky top-24 space-y-3">
                    <Skeleton className="h-5 w-32 mb-4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}
