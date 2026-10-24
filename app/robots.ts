import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Not /_next/ (2026-10-22 SEO audit): it holds the CSS, scripts and images Google needs to render a page.
      disallow: ['/api/', '/admin/', '/desk/', '/directory/'],
    },
    sitemap: 'https://fundopshq.com/sitemap.xml',
  }
}
