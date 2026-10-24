const SECTION_SLUGS = [
  'fundraising', 'deals', 'people', 'private-equity', 'venture-capital',
  'private-credit', 'real-estate', 'infrastructure', 'secondaries',
  'hedge-funds', 'lps', 'regulation', 'service-providers',
]

// The directory's five hubs (lib/directory/taxonomy.ts CATEGORIES[*].slug).
const DIRECTORY_SLUGS = ['fund-lawyers', 'fund-auditors', 'fund-tax-advisors', 'placement-agents', 'fund-finance-bankers']

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The directory's switch (lib/directory/taxonomy.ts), read by the header and menus in the browser too.
  // Inlined at build: turning it on or off takes a redeploy, as any Vercel env change does.
  env: {
    DIRECTORY_ENABLED: process.env.DIRECTORY_ENABLED ?? '',
  },
  images: {
    unoptimized: true,
  },
  // Old slugs that were removed in the 2026-04-10 site cleanup. These redirects
  // exist so inbound links from email, LinkedIn, old RSS items, or the Wayback
  // Machine land on the right section of the consolidated homepage instead of
  // 404-ing. Do not add a page under any of these paths without also removing
  // the matching redirect — Next.js serves redirects before routes.
  async redirects() {
    return [
      // /news is a real page again as of 2026-08-30 (the news archive), so its
      // redirect is gone and the legacy article paths now point AT it rather
      // than at the homepage anchor. NOTE: `:path+`, not `:path*` — the star
      // form also matches the bare `/news`, which redirects the page to itself.
      // Section fronts live at /news/<section> (2026-10 redesign), so the
      // legacy-article redirect must step around them. Keep SECTION_SLUGS in
      // step with lib/news/sections.ts — a test checks the two agree.
      // "Send us your news" lives at /submit (2026-10-22). The other names people
      // guess go there too; /news/submit must come before the legacy /news/<slug>
      // redirect below, which would otherwise send it to /news. Temporary
      // redirects, so ?firm= passes through and the route can still move.
      { source: '/news/submit', destination: '/submit', permanent: false },
      { source: '/submit-news', destination: '/submit', permanent: false },
      { source: `/news/:slug((?!(?:${SECTION_SLUGS.join('|')})$)[^/]+)`, destination: '/news', permanent: true },
      // A cut of a section lives one level down (/news/private-equity/deals,
      // 2026-10-02), so the two-level legacy redirect steps around sections too.
      { source: `/news/:slug((?!(?:${SECTION_SLUGS.join('|')})/)[^/]+)/:rest+`, destination: '/news', permanent: true },
      // The cut used to be a query string. Reading one makes a page render on
      // every request; as a path it is built once and served from the edge.
      {
        source: `/news/:section(${SECTION_SLUGS.join('|')})`,
        has: [{ type: 'query', key: 'f', value: '(?<facet>[a-z0-9-]+)' }],
        destination: '/news/:section/:facet',
        permanent: true,
      },
      { source: '/blog', destination: '/news', permanent: true },
      { source: '/blog/:path*', destination: '/news', permanent: true },
      { source: '/articles', destination: '/news', permanent: true },
      { source: '/articles/:path*', destination: '/news', permanent: true },
      { source: '/interviews', destination: '/#show', permanent: true },
      { source: '/interviews/:path*', destination: '/#show', permanent: true },
      { source: '/guests', destination: '/#show', permanent: true },
      { source: '/guests/:path*', destination: '/#show', permanent: true },
      { source: '/episodes', destination: '/#show', permanent: true },
      { source: '/episodes/:path*', destination: '/#show', permanent: true },
      { source: '/fund-watch', destination: '/#news', permanent: true },
      { source: '/fund-watch/:path*', destination: '/#news', permanent: true },
      { source: '/funds', destination: '/#news', permanent: true },
      { source: '/funds/:path*', destination: '/#news', permanent: true },
      { source: '/tools', destination: '/', permanent: true },
      { source: '/tools/:path*', destination: '/', permanent: true },
      { source: '/roles', destination: '/about', permanent: true },
      { source: '/roles/:path*', destination: '/about', permanent: true },
      { source: '/contact', destination: '/about', permanent: true },
      { source: '/newsletter', destination: '/#subscribe', permanent: true },
      // Short addresses for the social profiles' link fields (2026-10-12), so a visit from a profile is counted
      // as one (lib/newsletter/signup-source.ts reads the utm) and the signup box knows where the reader came from.
      // Not permanent: where they land may change. Since 2026-10-22 the profiles land on /join, the one-field signup
      // page (social sent 4 signups in 45 days to the homepage, against thousands of views a day). LinkedIn stays on
      // the homepage: its readers come to read.
      { source: '/tiktok', destination: '/join?utm_source=tiktok&utm_medium=bio', permanent: false },
      { source: '/linkedin', destination: '/?utm_source=linkedin&utm_medium=page', permanent: false },
      { source: '/instagram', destination: '/join?utm_source=instagram&utm_medium=bio', permanent: false },
      { source: '/youtube', destination: '/join?utm_source=youtube&utm_medium=bio', permanent: false },
    ]
  },
  async headers() {
    return [
      // Latest, the league tables and the firm directory read a query string
      // (search, filters, paging), so they are rendered on request. They carry
      // nothing personal, so the edge may keep each URL: five minutes fresh,
      // then served stale for up to an hour while one request refreshes it.
      // The browser still gets Next's own no-store header. (Section, story and
      // firm pages are static and need none of this.)
      // The directory's hubs and landing pages read ?q / ?page the same way (2026-10-24; all five trades
      // since that night, lib/directory/taxonomy.ts).
      ...[
        '/news',
        '/league-tables',
        '/firms',
        ...DIRECTORY_SLUGS.flatMap((d) => [`/${d}`, `/${d}/:a((?!people$)[^/]+)`, `/${d}/:a((?!people$)[^/]+)/:b`]),
      ].map((source) => ({
        source,
        headers: [{ key: 'Vercel-CDN-Cache-Control', value: 'max-age=300, stale-while-revalidate=3600' }],
      })),
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
