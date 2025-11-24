import { MetadataRoute } from 'next'
import { getAllFundTypes } from '@/lib/content/fund-types'
import { articles } from '@/lib/content/articles'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://fundops.com'

  // Homepage
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]

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
