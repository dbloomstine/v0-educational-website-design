import { Article } from './types'

// Import all articles
// Private Equity
import peCfoArticle from './articles/private-equity-cfo-responsibilities'
import peComplianceArticle from './articles/private-equity-compliance-compliance'
import peFundAdminArticle from './articles/private-equity-fund-administration'
import peBankingArticle from './articles/private-equity-banking-banking-treasury-management'
import peTaxArticle from './articles/private-equity-tax-k1-preparation-structuring'
import peFundraisingArticle from './articles/private-equity-fundraising-capital-raising-process'
import peInsuranceArticle from './articles/private-equity-insurance-do-coverage-risk-mitigation'
import peAuditArticle from './articles/private-equity-audit-financial-statement-audits'
import peCyberArticle from './articles/private-equity-cyber-it-cybersecurity-it-infrastructure'
import peIRArticle from './articles/private-equity-investor-relations-quarterly-reporting-lp-communications'

// Private Credit
import pcCfoArticle from './articles/private-credit-cfo-cfo-responsibilities'
import pcComplianceArticle from './articles/private-credit-compliance-compliance'
import pcFundAdminArticle from './articles/private-credit-fund-administration-fund-administration'
import pcIRArticle from './articles/private-credit-investor-relations-investor-communications'
import pcTaxArticle from './articles/private-credit-tax-tax-structuring'
import pcBankingArticle from './articles/private-credit-banking-banking-relationships'
import pcFundraisingArticle from './articles/private-credit-fundraising-capital-raising'
import pcInsuranceArticle from './articles/private-credit-insurance-risk-mitigation'
import pcAuditArticle from './articles/private-credit-audit-financial-audits'
import pcCyberArticle from './articles/private-credit-cyber-it-technology-infrastructure'
import pcLoanAdminArticle from './articles/private-credit-loan-administration-loan-administration'

// Venture Capital
import vcCfoArticle from './articles/venture-capital-cfo-cfo-responsibilities'
import vcComplianceArticle from './articles/venture-capital-compliance-compliance'
import vcFundAdminArticle from './articles/venture-capital-fund-administration-fund-administration'
import vcIRArticle from './articles/venture-capital-investor-relations-lp-communications'
import vcTaxArticle from './articles/venture-capital-tax-tax-considerations'
import vcBankingArticle from './articles/venture-capital-banking-treasury-management'
import vcFundraisingArticle from './articles/venture-capital-fundraising-fundraising-process'
import vcInsuranceArticle from './articles/venture-capital-insurance-risk-coverage'
import vcAuditArticle from './articles/venture-capital-audit-financial-audits'
import vcCyberArticle from './articles/venture-capital-cyber-it-technology-systems'

// Hedge Funds
import hfCfoArticle from './articles/hedge-funds-cfo-cfo-responsibilities'
import hfComplianceArticle from './articles/hedge-funds-compliance-compliance'
import hfFundAdminArticle from './articles/hedge-funds-fund-administration-fund-administration'
import hfIRArticle from './articles/hedge-funds-investor-relations-lp-communications'
import hfTaxArticle from './articles/hedge-funds-tax-tax-considerations'
import hfBankingArticle from './articles/hedge-funds-banking-treasury-operations'
import hfFundraisingArticle from './articles/hedge-funds-fundraising-capital-raising'
import hfInsuranceArticle from './articles/hedge-funds-insurance-risk-coverage'
import hfAuditArticle from './articles/hedge-funds-audit-financial-audits'
import hfCyberArticle from './articles/hedge-funds-cyber-it-technology-infrastructure'
import hfPrimeBrokerageArticle from './articles/hedge-funds-prime-brokerage-relationships'
import hfRiskManagementArticle from './articles/hedge-funds-risk-management-risk-oversight'

// Real Estate
import reCfoArticle from './articles/real-estate-cfo-cfo-responsibilities'
import reComplianceArticle from './articles/real-estate-compliance-compliance'
import reFundAdminArticle from './articles/real-estate-fund-administration-fund-administration'
import reIRArticle from './articles/real-estate-investor-relations-lp-communications'
import reTaxArticle from './articles/real-estate-tax-tax-compliance'
import reBankingArticle from './articles/real-estate-banking-treasury-management'
import reFundraisingArticle from './articles/real-estate-fundraising-capital-raising'
import reInsuranceArticle from './articles/real-estate-insurance-risk-coverage'
import reAuditArticle from './articles/real-estate-audit-financial-audits'
import rePropertyMgmtArticle from './articles/real-estate-property-management-operations'

// Infrastructure
import infraCfoArticle from './articles/infrastructure-cfo-cfo-responsibilities'
import infraComplianceArticle from './articles/infrastructure-compliance-compliance'
import infraFundAdminArticle from './articles/infrastructure-fund-administration-fund-administration'
import infraIRArticle from './articles/infrastructure-investor-relations-lp-communications'
import infraTaxArticle from './articles/infrastructure-tax-tax-compliance'
import infraBankingArticle from './articles/infrastructure-banking-treasury-management'
import infraFundraisingArticle from './articles/infrastructure-fundraising-capital-raising'
import infraInsuranceArticle from './articles/infrastructure-insurance-risk-coverage'
import infraAuditArticle from './articles/infrastructure-audit-financial-audits'
import infraCyberArticle from './articles/infrastructure-cyber-it-technology-systems'

// Secondaries
import secCfoArticle from './articles/secondaries-cfo-cfo-responsibilities'
import secComplianceArticle from './articles/secondaries-compliance-compliance'
import secFundAdminArticle from './articles/secondaries-fund-administration-fund-administration'
import secIRArticle from './articles/secondaries-investor-relations-lp-communications'
import secTaxArticle from './articles/secondaries-tax-tax-compliance'
import secBankingArticle from './articles/secondaries-banking-treasury-management'
import secFundraisingArticle from './articles/secondaries-fundraising-capital-raising'
import secInsuranceArticle from './articles/secondaries-insurance-risk-coverage'
import secAuditArticle from './articles/secondaries-audit-financial-audits'
import secCyberArticle from './articles/secondaries-cyber-it-technology-systems'

// GP-Stakes
import gpsCfoArticle from './articles/gp-stakes-cfo-cfo-responsibilities'
import gpsComplianceArticle from './articles/gp-stakes-compliance-compliance'
import gpsFundAdminArticle from './articles/gp-stakes-fund-administration-fund-administration'
import gpsIRArticle from './articles/gp-stakes-investor-relations-lp-communications'
import gpsTaxArticle from './articles/gp-stakes-tax-tax-compliance'
import gpsBankingArticle from './articles/gp-stakes-banking-treasury-management'
import gpsFundraisingArticle from './articles/gp-stakes-fundraising-capital-raising'
import gpsInsuranceArticle from './articles/gp-stakes-insurance-risk-coverage'
import gpsAuditArticle from './articles/gp-stakes-audit-financial-audits'
import gpsCyberArticle from './articles/gp-stakes-cyber-it-technology-systems'

// Article registry
export const articles: Record<string, Article> = {}

// Register all articles
const articlesToRegister = [
  // Private Equity
  peCfoArticle,
  peComplianceArticle,
  peFundAdminArticle,
  peBankingArticle,
  peTaxArticle,
  peFundraisingArticle,
  peInsuranceArticle,
  peAuditArticle,
  peCyberArticle,
  peIRArticle,

  // Private Credit
  pcCfoArticle,
  pcComplianceArticle,
  pcFundAdminArticle,
  pcIRArticle,
  pcTaxArticle,
  pcBankingArticle,
  pcFundraisingArticle,
  pcInsuranceArticle,
  pcAuditArticle,
  pcCyberArticle,
  pcLoanAdminArticle,

  // Venture Capital
  vcCfoArticle,
  vcComplianceArticle,
  vcFundAdminArticle,
  vcIRArticle,
  vcTaxArticle,
  vcBankingArticle,
  vcFundraisingArticle,
  vcInsuranceArticle,
  vcAuditArticle,
  vcCyberArticle,

  // Hedge Funds
  hfCfoArticle,
  hfComplianceArticle,
  hfFundAdminArticle,
  hfIRArticle,
  hfTaxArticle,
  hfBankingArticle,
  hfFundraisingArticle,
  hfInsuranceArticle,
  hfAuditArticle,
  hfCyberArticle,
  hfPrimeBrokerageArticle,
  hfRiskManagementArticle,

  // Real Estate
  reCfoArticle,
  reComplianceArticle,
  reFundAdminArticle,
  reIRArticle,
  reTaxArticle,
  reBankingArticle,
  reFundraisingArticle,
  reInsuranceArticle,
  reAuditArticle,
  rePropertyMgmtArticle,

  // Infrastructure
  infraCfoArticle,
  infraComplianceArticle,
  infraFundAdminArticle,
  infraIRArticle,
  infraTaxArticle,
  infraBankingArticle,
  infraFundraisingArticle,
  infraInsuranceArticle,
  infraAuditArticle,
  infraCyberArticle,

  // Secondaries
  secCfoArticle,
  secComplianceArticle,
  secFundAdminArticle,
  secIRArticle,
  secTaxArticle,
  secBankingArticle,
  secFundraisingArticle,
  secInsuranceArticle,
  secAuditArticle,
  secCyberArticle,

  // GP-Stakes
  gpsCfoArticle,
  gpsComplianceArticle,
  gpsFundAdminArticle,
  gpsIRArticle,
  gpsTaxArticle,
  gpsBankingArticle,
  gpsFundraisingArticle,
  gpsInsuranceArticle,
  gpsAuditArticle,
  gpsCyberArticle,
]

articlesToRegister.forEach(article => {
  articles[article.id] = article
})

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

export const getRelatedArticles = (article: Article, limit: number = 5): Article[] => {
  const related: Article[] = []

  // Same fund type, same pillar (exclude current article)
  const samePillar = Object.values(articles).filter(
    a => a.fundType === article.fundType &&
         a.pillar === article.pillar &&
         a.id !== article.id
  )
  related.push(...samePillar.slice(0, 3))

  // Other fund types, same pillar
  const otherFundTypes = Object.values(articles).filter(
    a => a.fundType !== article.fundType &&
         a.pillar === article.pillar
  )
  related.push(...otherFundTypes.slice(0, 2))

  return related.slice(0, limit)
}

export const registerArticle = (article: Article) => {
  articles[article.id] = article
}
