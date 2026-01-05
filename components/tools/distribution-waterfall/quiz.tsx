'use client'

import {
  QuizBase,
  QuizResults,
  type QuizQuestion,
  type QuizResultMessages
} from '@/components/tools/shared'

/**
 * Quiz questions for Distribution Waterfall Calculator
 */
export const WATERFALL_QUIZ_QUESTIONS: QuizQuestion[] = [
  // Easy questions
  {
    id: 'q1',
    question: 'What is the first tier in a standard distribution waterfall?',
    options: ['Preferred Return', 'Return of Capital', 'GP Catch-Up', 'Profit Split'],
    correctIndex: 1,
    explanation: 'Return of Capital is always the first tier. LPs must get their invested capital back before any profits are distributed.',
    difficulty: 'easy',
    topic: 'basics'
  },
  {
    id: 'q2',
    question: 'What does "LP" stand for in fund terminology?',
    options: ['Leverage Provider', 'Limited Partner', 'Loan Principal', 'Liquidity Pool'],
    correctIndex: 1,
    explanation: 'LP stands for Limited Partner - the investors who provide capital to the fund but have limited liability and no management control.',
    difficulty: 'easy',
    topic: 'basics'
  },
  {
    id: 'q3',
    question: 'What is the standard carried interest percentage in private equity?',
    options: ['10%', '15%', '20%', '25%'],
    correctIndex: 2,
    explanation: '20% is the industry standard, part of the famous "2 and 20" model (2% management fee + 20% carry).',
    difficulty: 'easy',
    topic: 'carry'
  },
  {
    id: 'q4',
    question: 'Who manages the fund and makes investment decisions?',
    options: ['Limited Partners (LPs)', 'General Partner (GP)', 'Fund Administrator', 'Auditor'],
    correctIndex: 1,
    explanation: 'The General Partner (GP) is responsible for managing the fund, making investment decisions, and earning carried interest.',
    difficulty: 'easy',
    topic: 'basics'
  },

  // Medium questions
  {
    id: 'q5',
    question: 'What is the typical preferred return (hurdle rate) in PE funds?',
    options: ['4%', '6%', '8%', '12%'],
    correctIndex: 2,
    explanation: '8% is the most common preferred return in private equity and credit funds. This is the minimum annual return LPs must receive before GP earns carry.',
    difficulty: 'medium',
    topic: 'preferred-return'
  },
  {
    id: 'q6',
    question: 'Which waterfall structure is more LP-friendly?',
    options: ['American (Deal-by-Deal)', 'European (Whole-Fund)', 'Both are equal', 'It depends on returns'],
    correctIndex: 1,
    explanation: 'European (whole-fund) waterfalls are more LP-friendly because GP only receives carry after ALL capital and pref is returned to ALL LPs, not just on individual profitable deals.',
    difficulty: 'medium',
    topic: 'structure'
  },
  {
    id: 'q7',
    question: 'What is the purpose of the GP catch-up provision?',
    options: [
      'To delay GP compensation',
      'To ensure GP gets their target carry % of total profits',
      'To penalize poor performance',
      'To speed up distributions'
    ],
    correctIndex: 1,
    explanation: 'The catch-up ensures GP receives their full carry percentage of TOTAL profits, not just profits above the preferred return. Without catch-up, GP would receive less than their stated carry rate.',
    difficulty: 'medium',
    topic: 'catch-up'
  },
  {
    id: 'q8',
    question: 'If a fund has 20% carry and 100% catch-up, what happens during the catch-up tier?',
    options: [
      'GP gets 20% of distributions',
      'LP gets 100% of distributions',
      'GP gets 100% of distributions until caught up',
      'Profits are split 50/50'
    ],
    correctIndex: 2,
    explanation: 'With 100% catch-up, after LPs receive their preferred return, GP gets 100% of the next distributions until they have received 20% of all profits. Then it reverts to 80/20 split.',
    difficulty: 'medium',
    topic: 'catch-up'
  },
  {
    id: 'q9',
    question: 'What is "compound" preferred return?',
    options: [
      'Pref is calculated on multiple funds',
      'Pref accumulates like compound interest',
      'Pref is paid more frequently',
      'Pref applies to both LP and GP'
    ],
    correctIndex: 1,
    explanation: 'Compound pref means the preferred return accumulates like compound interest each year, resulting in a higher hurdle amount than simple (linear) pref over time.',
    difficulty: 'medium',
    topic: 'preferred-return'
  },

  // Hard questions
  {
    id: 'q10',
    question: 'What is a "clawback" provision?',
    options: [
      'GP taking back LP distributions',
      'GP returning previously received carry if fund underperforms',
      'LPs reclaiming management fees',
      'Fund recycling capital from exits'
    ],
    correctIndex: 1,
    explanation: 'A clawback requires the GP to return previously received carried interest if the fund\'s final performance doesn\'t justify it. This is especially important in American (deal-by-deal) waterfalls.',
    difficulty: 'hard',
    topic: 'provisions'
  },
  {
    id: 'q11',
    question: 'If a fund has $100M committed capital, 8% pref, and 5-year hold, what is the simple preferred return?',
    options: ['$8M', '$20M', '$40M', '$46.9M'],
    correctIndex: 2,
    explanation: 'Simple pref = Capital × Rate × Years = $100M × 8% × 5 = $40M. LPs need to receive $140M total ($100M capital + $40M pref) before GP earns carry.',
    difficulty: 'hard',
    topic: 'preferred-return'
  },
  {
    id: 'q12',
    question: 'Why might a GP\'s "effective carry rate" differ from their stated 20% carry?',
    options: [
      'Tax considerations',
      'No catch-up provision or low returns',
      'Fund size differences',
      'LP negotiations'
    ],
    correctIndex: 1,
    explanation: 'Without a catch-up provision, GP only earns carry on profits ABOVE the preferred return, not on the pref itself. This means their effective carry rate (share of total profits) is less than 20%.',
    difficulty: 'hard',
    topic: 'carry'
  },
  {
    id: 'q13',
    question: 'In an American waterfall, when can the GP start receiving carry?',
    options: [
      'Only after the entire fund returns capital',
      'On individual profitable deals before fund return',
      'After the investment period ends',
      'Only at fund liquidation'
    ],
    correctIndex: 1,
    explanation: 'In American (deal-by-deal) waterfalls, GP can receive carry on individual profitable investments before the entire fund has returned capital, subject to clawback provisions.',
    difficulty: 'hard',
    topic: 'structure'
  },
  {
    id: 'q14',
    question: 'What is typically held in escrow for GP clawback obligations?',
    options: ['5-10% of carry', '10-30% of carry', '50% of carry', '100% of carry'],
    correctIndex: 1,
    explanation: 'Escrow provisions typically hold back 10-30% of carried interest to cover potential clawback obligations. The specific amount is negotiated in the LPA.',
    difficulty: 'hard',
    topic: 'provisions'
  }
]

/**
 * Custom result messages for waterfall quiz
 */
const WATERFALL_RESULT_MESSAGES: QuizResultMessages = {
  perfect: "You've mastered waterfall distributions! You're ready to analyze any fund structure.",
  great: "Great understanding! Review the missed questions to perfect your knowledge.",
  good: "You're on the right track. Keep exploring the glossary and FAQs to deepen your understanding.",
  needsWork: "Waterfall mechanics can be tricky. Try the tutorial again and explore the glossary for more context."
}

interface QuizProps {
  questions?: QuizQuestion[]
  onComplete: (score: number, total: number) => void
  onCorrectAnswer: () => void
  onClose: () => void
}

export function Quiz({
  questions = WATERFALL_QUIZ_QUESTIONS.slice(0, 5),
  onComplete,
  onCorrectAnswer,
  onClose
}: QuizProps) {
  return (
    <QuizBase
      questions={questions}
      title="Knowledge Check"
      onComplete={onComplete}
      onClose={onClose}
      onCorrectAnswer={onCorrectAnswer}
      showStreak
      showCloseButton
      resultMessages={WATERFALL_RESULT_MESSAGES}
    />
  )
}

export { QuizResults }
