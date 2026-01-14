'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, ChevronRight, BookOpen, HelpCircle } from 'lucide-react'

// Glossary terms
const GLOSSARY_TERMS = [
  {
    term: 'Distribution Waterfall',
    definition: 'The contractual structure defining how fund proceeds are divided between LPs (limited partners) and the GP (general partner). Named for the way proceeds "cascade" through sequential priority tiers.'
  },
  {
    term: 'European Waterfall',
    definition: 'Also called "whole-fund" waterfall. The GP cannot receive carried interest until all LPs have received their full capital back plus preferred return across the entire fund. More LP-friendly.'
  },
  {
    term: 'American Waterfall',
    definition: 'Also called "deal-by-deal" waterfall. The GP can receive carry on individual profitable investments even before LPs have been made whole on the entire fund. More GP-friendly.'
  },
  {
    term: 'Preferred Return (Hurdle)',
    definition: 'The minimum annual return that LPs must receive on their capital before the GP participates in profits. Typically 8% for PE funds. Acts as a performance threshold.'
  },
  {
    term: 'Carried Interest (Carry)',
    definition: 'The GP\'s share of fund profits after all capital and preferred returns have been distributed. Standard is 20%, meaning an 80/20 LP/GP split of profits.'
  },
  {
    term: 'GP Catch-Up',
    definition: 'After LPs receive their capital and preferred return, the GP receives 100% of distributions (or a partial percentage) until they "catch up" to their entitled carry percentage. Allows GP to achieve their target carry faster.'
  },
  {
    term: 'LP Multiple (MOIC)',
    definition: 'Multiple on Invested Capital. Calculated as total distributions to LP divided by LP\'s contributed capital. A 2.0x multiple means the LP doubled their investment.'
  },
  {
    term: 'Effective Carry Rate',
    definition: 'The GP\'s actual share of total fund profits, which may differ from the stated carry rate due to the waterfall structure and catch-up provisions.'
  },
  {
    term: 'GP Commitment',
    definition: 'Capital contributed by the GP as an LP investor in the fund. Typically 1-5% of fund size. Creates alignment between GP and LP interests.'
  },
  {
    term: 'Clawback',
    definition: 'A provision requiring the GP to return excess carry if, at the end of fund life, they have received more than entitled. Common in American waterfalls to protect LP interests.'
  }
]

// FAQ items
const FAQ_ITEMS = [
  {
    question: 'What\'s the difference between European and American waterfalls?',
    answer: 'European (whole-fund) waterfalls require all LP capital plus preferred return to be returned before GP receives any carry. American (deal-by-deal) waterfalls allow GP to receive carry on individual profitable deals before the entire fund returns capital. European is more LP-protective; American gives GP earlier carry access.'
  },
  {
    question: 'What is a typical preferred return rate?',
    answer: 'Most PE and buyout funds use an 8% preferred return. VC funds often have no preferred return (0%), allowing GP to share in profits immediately. Some credit and real estate funds use higher rates (9-12%).'
  },
  {
    question: 'Why do GPs want a catch-up provision?',
    answer: 'Without catch-up, after LPs receive their pref, the GP would only get 20% of remaining profits (with 20% carry). The catch-up allows GP to receive 100% of distributions temporarily until they\'ve "caught up" to their 20% share of all profits. This accelerates GP compensation while maintaining the same ultimate economics.'
  },
  {
    question: 'How does GP commitment affect the waterfall?',
    answer: 'GP commitment is treated as an LP investment for waterfall purposes. The GP receives distributions on their commitment like any LP (capital return, pref, profit share) in addition to their carried interest. Higher GP commitment means more aligned incentives but also more GP capital at risk.'
  },
  {
    question: 'What happens if the fund loses money?',
    answer: 'If gross proceeds are less than contributed capital, there are no profits and thus no preferred return or carry. The GP earns nothing from carry in this scenario. All proceeds go to returning capital to LPs (and the GP for their LP commitment).'
  },
  {
    question: 'How does compounding affect preferred return?',
    answer: 'Simple interest: pref = capital × rate × years. Compound interest: pref = capital × (1 + rate)^years - capital. Compounding results in higher preferred return hurdles, especially over longer hold periods, making it harder for GP to reach carry.'
  },
  {
    question: 'Can I negotiate waterfall terms as an LP?',
    answer: 'Larger LPs (anchor investors, institutions) often negotiate better terms including lower carry, higher pref, or removal of catch-up. Smaller LPs typically receive standard terms. Side letters may document LP-specific modifications.'
  }
]

// Collapsible glossary term
function GlossaryTerm({ term, definition }: { term: string; definition: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-3 text-left hover:bg-accent/30 px-2 rounded"
      >
        <span className="font-medium">{term}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="pb-3 px-2 text-sm text-muted-foreground">
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
        className="flex items-center justify-between w-full py-3 text-left hover:bg-accent/30 px-2 rounded"
      >
        <span className="font-medium">{question}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="pb-3 px-2 text-sm text-muted-foreground">
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
            Glossary
          </CardTitle>
          <CardDescription>
            Key terms in distribution waterfall mechanics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
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
            FAQ
          </CardTitle>
          <CardDescription>
            Common questions about waterfall structures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {FAQ_ITEMS.map((item) => (
              <FAQItem key={item.question} question={item.question} answer={item.answer} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
