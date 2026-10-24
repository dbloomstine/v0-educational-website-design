import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // /directory/about is the directory's methodology page (2026-10-24): readable past the /directory/ block, which
      // keeps the claim, edit and request forms out of search. The longer rule wins.
      allow: ['/', '/directory/about'],
      // Not /_next/ (2026-10-22 SEO audit): it holds the CSS, scripts and images Google needs to render a page.
      disallow: ['/api/', '/admin/', '/desk/', '/directory/'],
    },
    sitemap: 'https://fundopshq.com/sitemap.xml',
  }
}
