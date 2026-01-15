import { Article } from './types'

// Article registry - populated by imports below
export const articles: Record<string, Article> = {}

// Helper function to register articles
const registerArticle = (article: Article) => {
  articles[article.id] = article
}

// Import and register all articles
// Private Equity (12 articles)
import peArticleCfo from './articles/private-equity-cfo'
import peArticleCompliance from './articles/private-equity-compliance'
import peArticleFundAdmin from './articles/private-equity-fund-administration'
import peArticleIR from './articles/private-equity-investor-relations'
import peArticleTax from './articles/private-equity-tax'
import peArticleBanking from './articles/private-equity-banking'
import peArticleFundraising from './articles/private-equity-fundraising'
import peArticleInsurance from './articles/private-equity-insurance'
import peArticleAudit from './articles/private-equity-audit'
import peArticleCyber from './articles/private-equity-cyber-it'
import peArticleLegal from './articles/private-equity-legal'
import peArticleHR from './articles/private-equity-hr'

// Venture Capital (12 articles)
import vcArticleCfo from './articles/venture-capital-cfo'
import vcArticleCompliance from './articles/venture-capital-compliance'
import vcArticleFundAdmin from './articles/venture-capital-fund-administration'
import vcArticleIR from './articles/venture-capital-investor-relations'
import vcArticleTax from './articles/venture-capital-tax'
import vcArticleBanking from './articles/venture-capital-banking'
import vcArticleFundraising from './articles/venture-capital-fundraising'
import vcArticleInsurance from './articles/venture-capital-insurance'
import vcArticleAudit from './articles/venture-capital-audit'
import vcArticleCyber from './articles/venture-capital-cyber-it'
import vcArticleLegal from './articles/venture-capital-legal'
import vcArticleHR from './articles/venture-capital-hr'

// Private Credit (13 articles)
import pcArticleCfo from './articles/private-credit-cfo'
import pcArticleCompliance from './articles/private-credit-compliance'
import pcArticleFundAdmin from './articles/private-credit-fund-administration'
import pcArticleIR from './articles/private-credit-investor-relations'
import pcArticleTax from './articles/private-credit-tax'
import pcArticleBanking from './articles/private-credit-banking'
import pcArticleFundraising from './articles/private-credit-fundraising'
import pcArticleInsurance from './articles/private-credit-insurance'
import pcArticleAudit from './articles/private-credit-audit'
import pcArticleCyber from './articles/private-credit-cyber-it'
import pcArticleLoanAdmin from './articles/private-credit-loan-administration'
import pcArticleLegal from './articles/private-credit-legal'
import pcArticleHR from './articles/private-credit-hr'

// Hedge Funds (13 articles)
import hfArticleCfo from './articles/hedge-funds-cfo'
import hfArticleCompliance from './articles/hedge-funds-compliance'
import hfArticleFundAdmin from './articles/hedge-funds-fund-administration'
import hfArticleIR from './articles/hedge-funds-investor-relations'
import hfArticleTax from './articles/hedge-funds-tax'
import hfArticleBanking from './articles/hedge-funds-banking'
import hfArticleFundraising from './articles/hedge-funds-fundraising'
import hfArticleInsurance from './articles/hedge-funds-insurance'
import hfArticleAudit from './articles/hedge-funds-audit'
import hfArticleCyber from './articles/hedge-funds-cyber-it'
import hfArticlePrimeBrokerage from './articles/hedge-funds-prime-brokerage'
import hfArticleLegal from './articles/hedge-funds-legal'
import hfArticleHR from './articles/hedge-funds-hr'

// Real Estate (12 articles)
import reArticleCfo from './articles/real-estate-cfo'
import reArticleCompliance from './articles/real-estate-compliance'
import reArticleFundAdmin from './articles/real-estate-fund-administration'
import reArticleIR from './articles/real-estate-investor-relations'
import reArticleTax from './articles/real-estate-tax'
import reArticleBanking from './articles/real-estate-banking'
import reArticleFundraising from './articles/real-estate-fundraising'
import reArticleInsurance from './articles/real-estate-insurance'
import reArticleAudit from './articles/real-estate-audit'
import reArticleCyber from './articles/real-estate-cyber-it'
import reArticleLegal from './articles/real-estate-legal'
import reArticleHR from './articles/real-estate-hr'

// Infrastructure (12 articles)
import infraArticleCfo from './articles/infrastructure-cfo'
import infraArticleCompliance from './articles/infrastructure-compliance'
import infraArticleFundAdmin from './articles/infrastructure-fund-administration'
import infraArticleIR from './articles/infrastructure-investor-relations'
import infraArticleTax from './articles/infrastructure-tax'
import infraArticleBanking from './articles/infrastructure-banking'
import infraArticleFundraising from './articles/infrastructure-fundraising'
import infraArticleInsurance from './articles/infrastructure-insurance'
import infraArticleAudit from './articles/infrastructure-audit'
import infraArticleCyber from './articles/infrastructure-cyber-it'
import infraArticleLegal from './articles/infrastructure-legal'
import infraArticleHR from './articles/infrastructure-hr'

// Secondaries (12 articles)
import secArticleCfo from './articles/secondaries-cfo'
import secArticleCompliance from './articles/secondaries-compliance'
import secArticleFundAdmin from './articles/secondaries-fund-administration'
import secArticleIR from './articles/secondaries-investor-relations'
import secArticleTax from './articles/secondaries-tax'
import secArticleBanking from './articles/secondaries-banking'
import secArticleFundraising from './articles/secondaries-fundraising'
import secArticleInsurance from './articles/secondaries-insurance'
import secArticleAudit from './articles/secondaries-audit'
import secArticleCyber from './articles/secondaries-cyber-it'
import secArticleLegal from './articles/secondaries-legal'
import secArticleHR from './articles/secondaries-hr'

// GP-Stakes (12 articles)
import gpsArticleCfo from './articles/gp-stakes-cfo'
import gpsArticleCompliance from './articles/gp-stakes-compliance'
import gpsArticleFundAdmin from './articles/gp-stakes-fund-administration'
import gpsArticleIR from './articles/gp-stakes-investor-relations'
import gpsArticleTax from './articles/gp-stakes-tax'
import gpsArticleBanking from './articles/gp-stakes-banking'
import gpsArticleFundraising from './articles/gp-stakes-fundraising'
import gpsArticleInsurance from './articles/gp-stakes-insurance'
import gpsArticleAudit from './articles/gp-stakes-audit'
import gpsArticleCyber from './articles/gp-stakes-cyber-it'
import gpsArticleLegal from './articles/gp-stakes-legal'
import gpsArticleHR from './articles/gp-stakes-hr'

// Register all articles
const allArticles = [
  // Private Equity
  peArticleCfo, peArticleCompliance, peArticleFundAdmin, peArticleIR,
  peArticleTax, peArticleBanking, peArticleFundraising, peArticleInsurance,
  peArticleAudit, peArticleCyber, peArticleLegal, peArticleHR,
  // Venture Capital
  vcArticleCfo, vcArticleCompliance, vcArticleFundAdmin, vcArticleIR,
  vcArticleTax, vcArticleBanking, vcArticleFundraising, vcArticleInsurance,
  vcArticleAudit, vcArticleCyber, vcArticleLegal, vcArticleHR,
  // Private Credit
  pcArticleCfo, pcArticleCompliance, pcArticleFundAdmin, pcArticleIR,
  pcArticleTax, pcArticleBanking, pcArticleFundraising, pcArticleInsurance,
  pcArticleAudit, pcArticleCyber, pcArticleLoanAdmin, pcArticleLegal, pcArticleHR,
  // Hedge Funds
  hfArticleCfo, hfArticleCompliance, hfArticleFundAdmin, hfArticleIR,
  hfArticleTax, hfArticleBanking, hfArticleFundraising, hfArticleInsurance,
  hfArticleAudit, hfArticleCyber, hfArticlePrimeBrokerage, hfArticleLegal, hfArticleHR,
  // Real Estate
  reArticleCfo, reArticleCompliance, reArticleFundAdmin, reArticleIR,
  reArticleTax, reArticleBanking, reArticleFundraising, reArticleInsurance,
  reArticleAudit, reArticleCyber, reArticleLegal, reArticleHR,
  // Infrastructure
  infraArticleCfo, infraArticleCompliance, infraArticleFundAdmin, infraArticleIR,
  infraArticleTax, infraArticleBanking, infraArticleFundraising, infraArticleInsurance,
  infraArticleAudit, infraArticleCyber, infraArticleLegal, infraArticleHR,
  // Secondaries
  secArticleCfo, secArticleCompliance, secArticleFundAdmin, secArticleIR,
  secArticleTax, secArticleBanking, secArticleFundraising, secArticleInsurance,
  secArticleAudit, secArticleCyber, secArticleLegal, secArticleHR,
  // GP-Stakes
  gpsArticleCfo, gpsArticleCompliance, gpsArticleFundAdmin, gpsArticleIR,
  gpsArticleTax, gpsArticleBanking, gpsArticleFundraising, gpsArticleInsurance,
  gpsArticleAudit, gpsArticleCyber, gpsArticleLegal, gpsArticleHR,
]

allArticles.forEach(registerArticle)

// Utility functions
export const getArticle = (fundType: string, pillar: string, slug: string): Article | undefined => {
  const articleId = `${fundType}-${pillar}-${slug}`
  return articles[articleId]
}

export const getArticlesByFundType = (fundType: string): Article[] => {
  return Object.values(articles).filter(a => a.fundType === fundType)
}

export const getArticlesByPillar = (fundType: string, pillar: string): Article[] => {
  return Object.values(articles).filter(a => a.fundType === fundType && a.pillar === pillar)
}

export const getArticleByPillar = (fundType: string, pillar: string): Article | undefined => {
  return Object.values(articles).find(a => a.fundType === fundType && a.pillar === pillar)
}

export const getRelatedArticles = (article: Article, limit: number = 5): Article[] => {
  const related: Article[] = []

  // Same fund type, different pillar
  const sameFundType = Object.values(articles).filter(
    a => a.fundType === article.fundType && a.pillar !== article.pillar
  )
  related.push(...sameFundType.slice(0, 3))

  // Same pillar, different fund type
  const samePillar = Object.values(articles).filter(
    a => a.fundType !== article.fundType && a.pillar === article.pillar
  )
  related.push(...samePillar.slice(0, 2))

  return related.slice(0, limit)
}

export { registerArticle }
