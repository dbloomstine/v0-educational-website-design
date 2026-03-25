import { MetadataRoute } from 'next'

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
    { path: '/newsletter', priority: 0.8 },
    // { path: '/tools', priority: 0.9 },  // hidden until public
    // { path: '/blog', priority: 0.8 },    // hidden until public
  ]

  staticPages.forEach(({ path, priority }) => {
    routes.push({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority,
    })
  })

  // Tools pages — hidden until public
  // const tools = getAllTools().filter(tool => tool.status === 'active')
  // tools.forEach((tool) => {
  //   routes.push({
  //     url: `${baseUrl}/tools/${tool.slug}`,
  //     lastModified: new Date(),
  //     changeFrequency: 'monthly',
  //     priority: 0.7,
  //   })
  // })

  // Old newsletter pages removed — FundOps Daily is on /news

  // Fund type pages — hidden until articles are public
  // const fundTypes = getAllFundTypes()
  // fundTypes.forEach((fundType) => {
  //   routes.push({
  //     url: `${baseUrl}/funds/${fundType.slug}`,
  //     lastModified: new Date(),
  //     changeFrequency: 'weekly',
  //     priority: 0.8,
  //   })
  // })

  // Article pages — hidden until articles are public
  // Object.values(articles).forEach((article) => {
  //   const publishedDate = article.publishedDate ? new Date(article.publishedDate) : new Date()
  //   const isValidDate = publishedDate instanceof Date && !isNaN(publishedDate.getTime())
  //   routes.push({
  //     url: `${baseUrl}/funds/${article.fundType}/${article.pillar}`,
  //     lastModified: isValidDate ? publishedDate : new Date(),
  //     changeFrequency: 'monthly',
  //     priority: 0.7,
  //   })
  // })

  return routes
}
