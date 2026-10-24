import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

/** The narrow page the directory's forms sit on: claim, confirm, edit, correction or removal. */
export function FormShell({ kicker, title, intro, children }: { kicker?: string; title: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="paper flex-1">
        <div className="mx-auto max-w-[640px] px-4 pb-14 pt-8 lg:px-6">
          {kicker && <p className="font-ui text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-400">{kicker}</p>}
          <h1 className="mt-1 font-news text-[30px] font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[36px]">{title}</h1>
          {intro && <div className="mt-2 font-news text-[16.5px] leading-snug text-foreground/75">{intro}</div>}
          <div className="panel panel-lead mt-5">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
