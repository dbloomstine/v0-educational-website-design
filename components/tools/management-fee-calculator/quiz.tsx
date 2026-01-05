'use client'

import {
  QuizBase,
  QuizResults,
  type QuizQuestion,
  type QuizResultMessages
} from '@/components/tools/shared'

/**
 * Quiz questions for Management Fee Calculator
 */
export const FEE_QUIZ_QUESTIONS: QuizQuestion[] = [
  // Easy questions
  {
    id: 'q1',
    question: 'What is the primary purpose of management fees?',
    options: [
      'To reward the GP for strong performance',
      'To cover the GP\'s operational costs',
      'To return capital to LPs',
      'To pay taxes'
    ],
    correctIndex: 1,
    explanation: 'Management fees cover the GP\'s operational costs including salaries, office space, legal, compliance, and travel. Unlike carried interest, they\'re paid regardless of fund performance.',
    difficulty: 'easy',
    topic: 'basics'
  },
  {
    id: 'q2',
    question: 'What is the typical management fee for PE/VC funds?',
    options: ['0.5%', '1.0%', '2.0%', '5.0%'],
    correctIndex: 2,
    explanation: '2% is the industry standard for PE/VC funds, part of the famous "2 and 20" model (2% management fee + 20% carried interest).',
    difficulty: 'easy',
    topic: 'basics'
  },
  {
    id: 'q3',
    question: 'During which period are management fees typically highest?',
    options: [
      'Harvest period',
      'Investment period',
      'Liquidation period',
      'Fees are always the same'
    ],
    correctIndex: 1,
    explanation: 'Fees are typically highest during the investment period when the GP is actively deploying capital. Many funds step down fees after the investment period ends.',
    difficulty: 'easy',
    topic: 'phases'
  },
  {
    id: 'q4',
    question: 'What does "committed capital" mean?',
    options: [
      'Capital that has been invested in companies',
      'Capital that LPs have promised to invest',
      'Capital returned to LPs',
      'The GP\'s personal investment'
    ],
    correctIndex: 1,
    explanation: 'Committed capital is the total amount LPs have legally committed to invest in the fund, whether or not it has been called yet.',
    difficulty: 'easy',
    topic: 'basis'
  },

  // Medium questions
  {
    id: 'q5',
    question: 'Why do many funds switch from "committed capital" to "invested cost" after the investment period?',
    options: [
      'Legal requirements',
      'To align fees with actual capital deployed',
      'To increase fee revenue',
      'Tax advantages'
    ],
    correctIndex: 1,
    explanation: 'Switching to invested cost after the investment period is LP-friendly because fees are based on actual capital deployed, not unused commitments. It also aligns GP incentives with active portfolio management.',
    difficulty: 'medium',
    topic: 'basis'
  },
  {
    id: 'q6',
    question: 'What is a "fee step-down"?',
    options: [
      'A one-time reduction in fees for large LPs',
      'Reducing the fee rate after a certain period',
      'Eliminating fees entirely',
      'Quarterly fee payments instead of annual'
    ],
    correctIndex: 1,
    explanation: 'A fee step-down is when the management fee rate decreases after a specified period (usually the end of the investment period). Common structures step down from 2% to 1.5%.',
    difficulty: 'medium',
    topic: 'phases'
  },
  {
    id: 'q7',
    question: 'For a $100M fund with 2% management fee over 10 years, approximately how much in total fees would be charged?',
    options: ['$2M', '$10M', '$20M', '$200M'],
    correctIndex: 2,
    explanation: '$100M × 2% = $2M per year. Over 10 years = $20M total. This is a simplified calculation; actual fees depend on the fee basis and step-downs.',
    difficulty: 'medium',
    topic: 'calculation'
  },
  {
    id: 'q8',
    question: 'What is "NAV" as a fee basis?',
    options: [
      'Net Annual Value',
      'Net Asset Value - current portfolio worth',
      'New Asset Valuation',
      'Nominal Assessed Value'
    ],
    correctIndex: 1,
    explanation: 'NAV (Net Asset Value) is the current fair market value of the fund\'s investments. Using NAV as a fee basis means fees increase/decrease with portfolio performance.',
    difficulty: 'medium',
    topic: 'basis'
  },

  // Hard questions
  {
    id: 'q9',
    question: 'Why might "lower of cost or fair value" be considered the most LP-friendly fee basis?',
    options: [
      'It always results in the lowest fees',
      'It limits fees when portfolio value declines below cost',
      'It\'s easier to calculate',
      'It\'s required by SEC regulations'
    ],
    correctIndex: 1,
    explanation: 'Lower of cost or fair value protects LPs by capping the fee base at cost if portfolio value drops. The GP can\'t charge fees on unrealized gains (like NAV basis) but also doesn\'t benefit if value drops (like cost basis).',
    difficulty: 'hard',
    topic: 'basis'
  },
  {
    id: 'q10',
    question: 'An emerging manager with a $50M fund needs at least $1M/year for operations. What minimum fee rate is required?',
    options: ['1.0%', '1.5%', '2.0%', '2.5%'],
    correctIndex: 2,
    explanation: '$50M × 2% = $1M per year. Many emerging managers underestimate operational costs and set fees too low, leading to financial stress during the investment period.',
    difficulty: 'hard',
    topic: 'calculation'
  },
  {
    id: 'q11',
    question: 'What is a "fee holiday" or "fee waiver"?',
    options: [
      'When GPs take vacation',
      'Period where management fees are reduced/eliminated',
      'Tax deduction for fees paid',
      'Bonus fees for strong performance'
    ],
    correctIndex: 1,
    explanation: 'A fee holiday is a period (often the first 6-12 months) where management fees are reduced or waived entirely, usually for first-close investors as an incentive for early commitment.',
    difficulty: 'hard',
    topic: 'special'
  },
  {
    id: 'q12',
    question: 'If fees are charged on "invested cost" and a portfolio company is written down to zero, what happens to the fee base?',
    options: [
      'Fee base stays the same',
      'Fee base decreases',
      'Fee base increases',
      'Fees are suspended'
    ],
    correctIndex: 0,
    explanation: 'Invested cost doesn\'t change based on portfolio performance - it\'s the original amount invested. This is different from NAV, which would decrease. This is one reason some LPs prefer "lower of cost or fair value."',
    difficulty: 'hard',
    topic: 'basis'
  }
]

/**
 * Custom result messages for fee quiz
 */
const FEE_RESULT_MESSAGES: QuizResultMessages = {
  perfect: "You've mastered management fee concepts! You're ready to structure any fund.",
  great: "Great understanding! Review the glossary to perfect your knowledge.",
  good: "You're on the right track. Try the tutorial again to strengthen your understanding.",
  needsWork: "Management fees can be tricky. Explore the glossary and FAQs for more context."
}

interface QuizProps {
  questions?: QuizQuestion[]
  onComplete: (score: number, total: number) => void
  onClose: () => void
}

export function Quiz({
  questions = FEE_QUIZ_QUESTIONS.slice(0, 5),
  onComplete,
  onClose
}: QuizProps) {
  return (
    <QuizBase
      questions={questions}
      title="Fee Knowledge Quiz"
      onComplete={onComplete}
      onClose={onClose}
      showStreak
      showCloseButton
      resultMessages={FEE_RESULT_MESSAGES}
    />
  )
}

export { QuizResults }
