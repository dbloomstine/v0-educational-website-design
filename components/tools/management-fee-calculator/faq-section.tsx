'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  X,
  MessageCircle
} from 'lucide-react'

interface FAQ {
  id: string
  question: string
  answer: string
  category: 'basics' | 'calculation' | 'negotiation' | 'strategy'
}

export const FAQS: FAQ[] = [
  // Basics
  {
    id: 'faq-1',
    question: 'What is a typical management fee for an emerging manager fund?',
    answer: 'Most emerging managers charge 2% on committed capital during the investment period, stepping down to 1.5-2% on invested capital afterward. This follows the traditional "2 and 20" model. However, larger institutional LPs may negotiate discounts of 25-50 basis points, especially for larger commitments ($25M+).',
    category: 'basics'
  },
  {
    id: 'faq-2',
    question: 'How do management fees differ from carried interest?',
    answer: 'Management fees are paid annually regardless of fund performance - they cover operational costs. Carried interest (typically 20% of profits) is only earned when the fund generates returns above a hurdle rate. Management fees are predictable income for the GP, while carry is performance-based upside.',
    category: 'basics'
  },
  {
    id: 'faq-3',
    question: 'When are management fees typically paid?',
    answer: 'Management fees are usually paid quarterly in advance, though some funds pay semi-annually or annually. The LPA specifies the payment schedule. Fees are often drawn from LP capital calls or netted against distributions.',
    category: 'basics'
  },

  // Calculation
  {
    id: 'faq-4',
    question: 'Why do some funds charge fees on commitments while others use invested capital?',
    answer: 'Fees on committed capital provide predictable revenue for GPs during the investment period when capital isn\'t fully deployed but operations are at full capacity. Switching to invested capital post-investment period is LP-friendly since LPs only pay fees on working capital. Some sophisticated LPs negotiate invested capital basis from day one, though this creates GP budget uncertainty.',
    category: 'calculation'
  },
  {
    id: 'faq-5',
    question: 'How do I calculate total fees over the life of my fund?',
    answer: 'Multiply your fee basis by your fee rate for each year, then sum across all years. For example: $50M fund × 2% × 5 years (investment period) + $50M × 1.5% × 5 years (harvest) = $5M + $3.75M = $8.75M total. Our calculator handles complex step-downs and basis changes automatically.',
    category: 'calculation'
  },
  {
    id: 'faq-6',
    question: 'What is a reasonable fee as a percentage of fund size?',
    answer: 'Total management fees over a 10-year fund life typically range from 15-20% of committed capital. For a $50M fund with 2% fees during a 4-year investment period and 1.5% thereafter, total fees would be about $11M (22% of commitments). Lower percentages are generally more LP-friendly.',
    category: 'calculation'
  },

  // Negotiation
  {
    id: 'faq-7',
    question: 'Can LPs negotiate lower management fees?',
    answer: 'Yes, especially for larger commitments. Common negotiating points include: lower fee rates (1.75% vs 2%), earlier step-downs, invested capital basis from inception, fee holidays for first-close investors, and fee offsets for transaction/monitoring fees. Most large institutional LPs ($25M+) receive some fee concessions.',
    category: 'negotiation'
  },
  {
    id: 'faq-8',
    question: 'What is a "fee offset" and should I include one?',
    answer: 'Fee offsets reduce management fees based on other GP income (transaction fees, monitoring fees, director fees from portfolio companies). A 100% offset means all such fees reduce management fees dollar-for-dollar. Most institutional LPs expect 100% offsets; anything less should be clearly justified in the LPA.',
    category: 'negotiation'
  },
  {
    id: 'faq-9',
    question: 'What is an MFN clause and why does it matter for fees?',
    answer: 'Most Favored Nation (MFN) clauses guarantee an LP receives fee terms at least as good as any other LP in the fund. If you offer one LP a 25bp fee discount via side letter, all MFN-holders automatically get the same discount. Be careful about granting MFN to large LPs, as it limits future negotiating flexibility.',
    category: 'negotiation'
  },

  // Strategy
  {
    id: 'faq-10',
    question: 'How should I set fees as a first-time fund manager?',
    answer: 'First-time managers typically need standard 2% fees to cover operational costs, especially with smaller fund sizes. Focus on demonstrating value rather than competing on fees. As your track record develops and fund sizes grow, you can consider fee concessions for anchor LPs. Ensure fees cover: salaries, office, legal, compliance, fund admin, travel, and reserves.',
    category: 'strategy'
  },
  {
    id: 'faq-11',
    question: 'What operational costs should management fees cover?',
    answer: 'Key costs include: team salaries and benefits (usually 40-60% of fees), office and overhead (10-15%), legal and compliance (10-15%), fund administration (5-10%), travel and due diligence (5-10%), and reserves for unexpected expenses. For a $50M fund at 2%, that\'s $1M/year - often tight for a 3-4 person team in major markets.',
    category: 'strategy'
  },
  {
    id: 'faq-12',
    question: 'How do step-downs affect my economics as a GP?',
    answer: 'Step-downs reduce fee income during the harvest period when the team is still actively managing portfolio companies. A step from 2% to 1.5% on a $50M fund reduces annual fees by $250K. This is manageable if you\'re raising a successor fund (which generates new fees) or if the fund is producing carry. Be cautious about aggressive step-downs that leave you underfunded.',
    category: 'strategy'
  }
]

const categoryLabels: Record<string, string> = {
  'basics': 'Getting Started',
  'calculation': 'Fee Calculations',
  'negotiation': 'LP Negotiations',
  'strategy': 'GP Strategy'
}

interface FAQSectionProps {
  onFaqRead?: (faqId: string) => void
  onClose?: () => void
}

export function FAQSection({ onFaqRead, onClose }: FAQSectionProps) {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredFaqs = selectedCategory
    ? FAQS.filter(faq => faq.category === selectedCategory)
    : FAQS

  const categories = Array.from(new Set(FAQS.map(f => f.category)))

  const handleFaqClick = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId)
    if (expandedFaq !== faqId) {
      onFaqRead?.(faqId)
    }
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <CardTitle>Frequently Asked Questions</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All Questions
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
            >
              {categoryLabels[category]}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="max-h-[500px] overflow-y-auto space-y-2">
        {filteredFaqs.map((faq) => (
          <motion.div
            key={faq.id}
            layout
            className="border rounded-lg overflow-hidden"
          >
            <button
              onClick={() => handleFaqClick(faq.id)}
              className="w-full p-4 flex items-start justify-between hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-start gap-3 flex-1">
                <MessageCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="font-medium">{faq.question}</span>
              </div>
              <div className="flex-shrink-0 ml-2">
                {expandedFaq === faq.id ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {expandedFaq === faq.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4"
                >
                  <div className="pl-8">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>

                    {/* XP indicator */}
                    <div className="flex items-center gap-1 mt-3 text-xs text-amber-600 dark:text-amber-400">
                      <Sparkles className="h-3 w-3" />
                      <span>+10 XP for reading this answer!</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
}
