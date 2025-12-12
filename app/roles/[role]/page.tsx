import { notFound } from "next/navigation"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { AnimateOnScroll } from "@/components/animate-on-scroll"
import { Breadcrumb } from "@/components/breadcrumb"
import { ToolCard } from "@/components/tools/tool-card"
import { getRoleBySlug, getAllRoles, getToolsForRole } from "@/lib/content/roles"
import { getAllTools } from "@/lib/content/tools"
import { getAllFundTypes } from "@/lib/content/fund-types"
import { getPillarsByFundType } from "@/lib/content/pillars"
import { ArrowRight } from "lucide-react"

interface RolePageProps {
  params: {
    role: string
  }
}

export default async function RolePage({ params }: RolePageProps) {
  const { role: roleSlug } = await params
  const role = getRoleBySlug(roleSlug)

  if (!role) {
    notFound()
  }

  const allTools = getAllTools().filter(tool => tool.status === 'active')
  const roleTools = getToolsForRole(role, allTools)
  const fundTypes = getAllFundTypes()

  // Get relevant pillars based on role
  const relevantPillarSlugs = getRolePillars(role.slug)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border bg-background py-12">
          <div className="container mx-auto px-4">
            <Breadcrumb
              items={[
                { label: "Roles", href: "/" },
                { label: role.title },
              ]}
            />

            <AnimateOnScroll>
              <p className="mt-6 mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                Role
              </p>
              <h1 className="mb-3 text-3xl font-bold" style={{ letterSpacing: '-0.01em' }}>{role.title}</h1>
              <p className="text-base text-muted-foreground max-w-2xl">
                {role.description}
              </p>
            </AnimateOnScroll>
          </div>
        </section>

        {/* Tools Section */}
        {roleTools.length > 0 && (
          <section className="py-8">
            <div className="container mx-auto px-4">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h2 className="mb-1 text-xl font-bold">Tools for {role.shortTitle}s</h2>
                  <p className="text-sm text-muted-foreground">
                    Relevant calculators and planning tools
                  </p>
                </div>
                <Link
                  href="/tools"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  All Tools <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {roleTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Relevant Articles by Fund Type */}
        <section className="py-12 border-t border-border bg-accent/5">
          <div className="container mx-auto px-4">
            <div className="mb-6">
              <h2 className="mb-1 text-xl font-bold">Articles by Fund Type</h2>
              <p className="text-sm text-muted-foreground">
                Relevant resources organized by asset class
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {fundTypes.map((fundType) => {
                const pillars = getPillarsByFundType(fundType.slug)
                const relevantPillars = pillars.filter(p => relevantPillarSlugs.includes(p.slug))

                if (relevantPillars.length === 0) return null

                return (
                  <div key={fundType.slug} className="rounded-lg border border-border/40 bg-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: fundType.color }} />
                      <span className="text-sm font-semibold">{fundType.name}</span>
                    </div>
                    <div className="space-y-1.5">
                      {relevantPillars.map((pillar) => (
                        <Link
                          key={pillar.slug}
                          href={`/funds/${fundType.slug}/${pillar.slug}`}
                          className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5"
                        >
                          {pillar.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

// Map roles to relevant pillar slugs
function getRolePillars(roleSlug: string): string[] {
  const mapping: Record<string, string[]> = {
    'cfo-controller': ['cfo', 'tax', 'audit', 'banking', 'fund-administration'],
    'coo-operations': ['fund-administration', 'cyber-it', 'banking', 'insurance'],
    'compliance': ['compliance', 'cyber-it'],
    'investor-relations': ['investor-relations', 'fundraising'],
    'gp-principal': ['cfo', 'fundraising', 'investor-relations', 'compliance'],
    'lp-investor': ['investor-relations', 'fund-administration', 'tax'],
  }
  return mapping[roleSlug] || []
}

export async function generateStaticParams() {
  const roles = getAllRoles()
  return roles.map((role) => ({
    role: role.slug,
  }))
}

export async function generateMetadata({ params }: RolePageProps) {
  const { role: roleSlug } = await params
  const role = getRoleBySlug(roleSlug)

  if (!role) {
    return {
      title: 'Role Not Found',
    }
  }

  const title = `${role.title} Resources | FundOpsHQ`
  const description = `Fund operations resources for ${role.title}s: ${role.description}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://fundops.com/roles/${role.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://fundops.com/roles/${role.slug}`,
    },
  }
}
