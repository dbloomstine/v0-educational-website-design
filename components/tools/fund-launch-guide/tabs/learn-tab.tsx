'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, ChevronRight, BookOpen, HelpCircle } from 'lucide-react'

// Glossary terms specific to fund launch
const GLOSSARY_TERMS = [
  {
    term: 'General Partner (GP)',
    definition: 'The entity that manages the fund, makes investment decisions, and has unlimited liability. The GP is typically structured as an LLC and includes the fund managers and their carried interest economics.'
  },
  {
    term: 'Limited Partner (LP)',
    definition: 'Investors in the fund who provide capital but have limited liability and no management authority. LPs receive distributions based on their capital contribution and the fund\'s waterfall structure.'
  },
  {
    term: 'Limited Partnership Agreement (LPA)',
    definition: 'The primary legal document governing the fund, including terms like management fees, carried interest, investment restrictions, LP rights, and the distribution waterfall. Also known as the fund\'s operating agreement.'
  },
  {
    term: 'Private Placement Memorandum (PPM)',
    definition: 'A disclosure document provided to prospective investors describing the fund\'s strategy, risks, terms, and manager background. Required for securities compliance and investor protection.'
  },
  {
    term: 'Management Company',
    definition: 'A separate entity (usually an LLC) that employs the investment team and receives management fees. This structure protects the fund from employment-related liabilities and provides operational flexibility.'
  },
  {
    term: 'First Close',
    definition: 'The initial closing when the fund accepts commitments and begins operations. First close typically occurs when sufficient capital (often 30-50% of target) is committed to justify launching the fund.'
  },
  {
    term: 'Final Close',
    definition: 'The deadline by which all LP commitments must be made. Usually occurs 12-18 months after first close. After final close, no new investors can join except through secondary transactions.'
  },
  {
    term: 'Capital Call (Drawdown)',
    definition: 'A request to LPs to transfer a portion of their committed capital to the fund. LPs typically have 10-14 business days to fund. Capital calls are used for investments, fees, and expenses.'
  },
  {
    term: 'Subscription Agreement',
    definition: 'The document through which an investor commits capital to the fund, including representations about investor status, AML/KYC information, and acknowledgment of fund terms.'
  },
  {
    term: 'Side Letter',
    definition: 'A separate agreement between the GP and an LP modifying standard fund terms. Common modifications include fee discounts, co-investment rights, enhanced reporting, or specific investment restrictions.'
  },
  {
    term: 'Form ADV',
    definition: 'The SEC registration document for investment advisers. Part 1 covers business information filed electronically; Part 2 (the "brochure") is a narrative disclosure document provided to investors.'
  },
  {
    term: 'Investment Period',
    definition: 'The initial phase (typically 3-6 years) during which the fund actively deploys capital into new investments. After the investment period ends, the fund focuses on managing and exiting existing positions.'
  },
  {
    term: 'Hurdle Rate (Preferred Return)',
    definition: 'The minimum return LPs must receive before the GP earns carried interest. Typically 8% per year, compounded. Represents the GP\'s promise that LPs earn a baseline return before profit sharing.'
  },
  {
    term: 'Carried Interest (Carry)',
    definition: 'The GP\'s share of fund profits above the hurdle rate, typically 20%. Carry aligns manager incentives with investor returns and is the primary source of GP compensation beyond management fees.'
  },
  {
    term: 'GP Commitment',
    definition: 'The amount of capital the GP invests in their own fund, typically 1-3% of total fund size. Demonstrates alignment with LPs and is often a requirement for institutional investors.'
  },
  {
    term: 'Fund Administrator',
    definition: 'A third-party service provider handling fund accounting, investor reporting, capital call/distribution processing, and NAV calculations. Essential for operational integrity and LP confidence.'
  },
  {
    term: 'Due Diligence Questionnaire (DDQ)',
    definition: 'A standardized questionnaire used by institutional LPs to evaluate fund managers. Covers investment strategy, team, operations, compliance, and ESG practices. Completing DDQs is a key part of fundraising.'
  },
  {
    term: 'Anchor Investor',
    definition: 'A large early investor (typically 20-30% of the fund) who commits before or at first close. Anchors provide credibility, accelerate fundraising, and may receive preferential terms in exchange for early commitment.'
  }
]

// FAQ items specific to fund launch
const FAQ_ITEMS = [
  {
    question: 'How long does it typically take to launch a fund?',
    answer: 'For first-time managers, expect 9-15 months from initial planning to first close. This includes 2-3 months for legal entity formation and documentation, 3-6 months for regulatory filings and service provider selection, and 6-12 months for fundraising. Established managers may move faster due to existing relationships and track records.'
  },
  {
    question: 'What\'s the minimum fund size to be viable?',
    answer: 'Economic viability depends on strategy and fee structure. Most VC/PE funds need at least $25-50M to generate sufficient management fees (~$500K-1M annually at 2%) to cover operating costs. Larger strategies (buyouts, credit) may need $100M+ due to higher overhead. Consider your team size, target returns, and runway when setting minimums.'
  },
  {
    question: 'Do I need to register with the SEC?',
    answer: 'Most emerging managers qualify for an exemption under the Investment Advisers Act. The most common is the Private Fund Adviser Exemption (§203(m)) for managers with less than $150M in US private fund assets. Others may use the VC Adviser Exemption (§203(l)). Even exempt advisers must file Form ADV as "exempt reporting advisers." Consult legal counsel to determine your specific requirements.'
  },
  {
    question: 'Should I use Delaware or another jurisdiction?',
    answer: 'Delaware is the default choice for US funds due to its sophisticated corporate law, Court of Chancery expertise, and investor familiarity. For international LPs or tax-exempt investors, you may also need an offshore feeder (typically Cayman Islands) in a parallel fund structure. European managers should consider Luxembourg or Ireland for AIFMD compliance.'
  },
  {
    question: 'What service providers do I absolutely need?',
    answer: 'At minimum: (1) Fund counsel to draft documents and advise on regulatory matters, (2) Fund administrator for accounting and investor services, (3) Auditor for annual audits and K-1 preparation, (4) Bank for fund and management company accounts. Depending on your strategy, you may also need a prime broker, tax advisor, insurance broker, and compliance consultant.'
  },
  {
    question: 'How much GP commitment is expected?',
    answer: 'Institutional LPs typically expect 1-3% of fund size, with first-time managers often needing to commit on the higher end to demonstrate conviction. The commitment can be funded through capital calls over time (not upfront), and some managers use management fee waivers to meet their commitment. Discuss structuring options with your fund counsel.'
  },
  {
    question: 'What fees can I charge?',
    answer: 'Standard terms are 2% annual management fee during the investment period, stepping down to 1.5% or less after. Emerging managers may need to offer 1.75-2% to be competitive. Carried interest is typically 20% with an 8% hurdle. Some managers charge deal fees, monitoring fees, or broken deal expenses, but these are increasingly offset against management fees to protect LPs.'
  },
  {
    question: 'How do I find LPs for my first fund?',
    answer: 'Start with your network: former employers, co-investors, portfolio company executives, and high-net-worth individuals. Family offices are often more accessible than institutions for first-time managers. Consider working with placement agents (for a fee of 2-3%) if you lack direct LP relationships. Build your DDQ, pitch deck, and data room before active outreach.'
  },
  {
    question: 'What is a "most favored nations" (MFN) clause?',
    answer: 'An MFN clause in an LP\'s side letter entitles them to receive any better terms offered to other LPs. This is common for anchor or large investors and creates a "leveling up" effect where improvements to one LP flow to all MFN holders. Carefully track and disclose side letter provisions to ensure compliance.'
  },
  {
    question: 'Do I need insurance?',
    answer: 'Yes. Directors & Officers (D&O) insurance protects the GP and individuals from claims related to fund management. Errors & Omissions (E&O) covers professional liability. Cyber insurance is increasingly important. Some LPs require specific coverage minimums. Get quotes early as coverage can take weeks to bind.'
  },
  {
    question: 'What happens at first close?',
    answer: 'At first close, LPs execute subscription documents, the fund officially begins operations, and you can start making investments. Practical steps include: finalizing all legal documents, opening bank accounts, onboarding with the fund administrator, issuing initial capital calls, and filing any required regulatory notices. Celebrate, but stay focused on fundraising to subsequent closes.'
  },
  {
    question: 'Can I make investments before first close?',
    answer: 'Generally no - the fund doesn\'t exist until first close. However, you can use a GP entity or personal capital to make "warehoused" investments that are later sold to the fund at cost. This requires careful structuring to avoid conflicts of interest. Some managers use a "friends and family" close or founder shares to start investing earlier.'
  }
]

// Collapsible glossary term
function GlossaryTerm({ term, definition }: { term: string; definition: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-3 text-left hover:bg-accent/30 px-2 rounded transition-colors"
      >
        <span className="font-medium">{term}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-3 px-2 text-sm text-muted-foreground leading-relaxed animate-in slide-in-from-top-1 fade-in-0 duration-150">
          {definition}
        </div>
      )}
    </div>
  )
}

// Collapsible FAQ item
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-3 text-left hover:bg-accent/30 px-2 rounded transition-colors"
      >
        <span className="font-medium pr-4">{question}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-3 px-2 text-sm text-muted-foreground leading-relaxed animate-in slide-in-from-top-1 fade-in-0 duration-150">
          {answer}
        </div>
      )}
    </div>
  )
}

export function LearnTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Glossary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" />
            Fund Launch Glossary
          </CardTitle>
          <CardDescription>
            Key terms you&apos;ll encounter when launching a fund
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {GLOSSARY_TERMS.map((item) => (
              <GlossaryTerm key={item.term} term={item.term} definition={item.definition} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>
            Common questions about the fund launch process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {FAQ_ITEMS.map((item) => (
              <FAQItem key={item.question} question={item.question} answer={item.answer} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
