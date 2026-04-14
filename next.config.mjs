/** @type {import('next').NextConfig} */
const nextConfig = {
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
      { source: '/news', destination: '/#news', permanent: true },
      { source: '/news/:path*', destination: '/#news', permanent: true },
      { source: '/blog', destination: '/#news', permanent: true },
      { source: '/blog/:path*', destination: '/#news', permanent: true },
      { source: '/articles', destination: '/#news', permanent: true },
      { source: '/articles/:path*', destination: '/#news', permanent: true },
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
    ]
  },
  async headers() {
    return [
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
