import { MetadataRoute } from 'next'
import { getAllFundTypes } from '@/lib/content/fund-types'
import { articles } from '@/lib/content/articles'
import { getAllTools } from '@/lib/content/tools'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://fundopshq.com'

  // Homepage
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]

  // Static pages
  const staticPages = [
    { path: '/about', priority: 0.8 },
    { path: '/contact', priority: 0.8 },
    { path: '/tools', priority: 0.9 },
    { path: '/newsletter', priority: 0.8 },
    { path: '/blog', priority: 0.8 },
  ]

  staticPages.forEach(({ path, priority }) => {
    routes.push({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority,
    })
  })

  // Tools pages
  const tools = getAllTools().filter(tool => tool.status === 'active')
  tools.forEach((tool) => {
    routes.push({
      url: `${baseUrl}/tools/${tool.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  })

  // Newsletter pages
  const newsletters = [
    'fundopshq-insights',
    'fundwatch-briefing',
  ]

  newsletters.forEach((slug) => {
    routes.push({
      url: `${baseUrl}/newsletter/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  })

  // Fund type pages
  const fundTypes = getAllFundTypes()
  fundTypes.forEach((fundType) => {
    routes.push({
      url: `${baseUrl}/funds/${fundType.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  })

  // Article pages
  Object.values(articles).forEach((article) => {
    // Safely parse date with fallback to current date
    const publishedDate = article.publishedDate ? new Date(article.publishedDate) : new Date()
    const isValidDate = publishedDate instanceof Date && !isNaN(publishedDate.getTime())

    routes.push({
      url: `${baseUrl}/funds/${article.fundType}/${article.pillar}`,
      lastModified: isValidDate ? publishedDate : new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  })

  return routes
}
