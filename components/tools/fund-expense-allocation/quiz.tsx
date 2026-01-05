'use client'

import {
  QuizBase,
  QuizResults,
  type QuizQuestion,
  type QuizResultMessages
} from '@/components/tools/shared'

/**
 * Quiz questions for Fund Expense Allocation Tool
 */
export const EXPENSE_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'A PE fund pays legal fees to form the limited partnership. Who bears this cost?',
    options: ['Management Company', 'Fund (LPs)', 'Split 50/50'],
    correctIndex: 1,
    explanation: 'Fund formation legal fees are almost universally treated as fund expenses because they directly create the investment vehicle that benefits LPs.',
    difficulty: 'easy',
    topic: 'basics'
  },
  {
    id: 'q2',
    question: 'The GP hires a placement agent to help raise capital. Who typically pays?',
    options: ['Fund (LPs)', 'Management Company', 'The LPs who benefit from the placement'],
    correctIndex: 1,
    explanation: 'Placement agent fees are management company expenses. Fundraising is the GP\'s responsibility, and these costs help the GP build their business and future funds.',
    difficulty: 'easy',
    topic: 'basics'
  },
  {
    id: 'q3',
    question: 'Annual fund audit and tax preparation costs are typically:',
    options: ['Management expenses', 'Fund expenses', 'Paid by individual LPs'],
    correctIndex: 1,
    explanation: 'Audit, tax, and fund administration costs are standard fund expenses. They\'re required for LP reporting and are directly related to fund operations.',
    difficulty: 'easy',
    topic: 'basics'
  },
  {
    id: 'q4',
    question: 'A VC fund incurs costs traveling to conduct due diligence on a potential investment. This is:',
    options: ['Fund expense', 'Management expense', 'Not allowed under typical LPAs'],
    correctIndex: 0,
    explanation: 'Travel for investment due diligence is a fund expense because it directly supports the fund\'s investment activities and benefits LPs.',
    difficulty: 'medium',
    topic: 'fund-types'
  },
  {
    id: 'q5',
    question: 'The GP travels to meet with prospective LPs during fundraising. Who pays?',
    options: ['Fund (LPs)', 'Management Company', 'The prospective LPs'],
    correctIndex: 1,
    explanation: 'Fundraising travel is a management expense. It benefits the GP\'s ability to raise capital and build their platform, not the existing fund.',
    difficulty: 'medium',
    topic: 'stages'
  },
  {
    id: 'q6',
    question: 'D&O insurance covering fund directors is typically:',
    options: ['Always a fund expense', 'Always a management expense', 'Negotiated case-by-case'],
    correctIndex: 2,
    explanation: 'D&O insurance is often negotiated. If it covers fund-specific directors and activities, it may be a fund expense. If it covers the broader GP platform, it may be split or a management expense.',
    difficulty: 'hard',
    topic: 'gray-areas'
  },
  {
    id: 'q7',
    question: 'A fund-of-funds has a deal fall through after spending on legal review of a target fund. This "broken deal" cost is:',
    options: ['Fund expense (like PE broken deals)', 'Often a management expense for FoFs', 'Paid by the target fund'],
    correctIndex: 1,
    explanation: 'Unlike direct investing, fund-of-funds broken deal costs (failed fund commitments) are often treated as management expenses because the diligence process is more about manager relationships.',
    difficulty: 'hard',
    topic: 'fund-types'
  },
  {
    id: 'q8',
    question: 'Office rent for the GP\'s headquarters where they manage multiple funds is:',
    options: ['Fund expense', 'Management expense', 'Allocated pro-rata across funds'],
    correctIndex: 1,
    explanation: 'General office overhead is a classic management expense. It supports the GP\'s platform and ability to manage multiple funds, not any single fund\'s investments.',
    difficulty: 'easy',
    topic: 'basics'
  },
  {
    id: 'q9',
    question: 'During the pre-launch phase, organizational costs for a new fund should be:',
    options: ['Fully paid by management company', 'Fund expense with caps specified in LPA', 'Deferred until first investment'],
    correctIndex: 1,
    explanation: 'Organizational costs are typically fund expenses but often capped in the LPA (e.g., "$500K cap on org costs"). Any excess is borne by the management company.',
    difficulty: 'medium',
    topic: 'stages'
  },
  {
    id: 'q10',
    question: 'Portfolio monitoring software used to track portfolio company performance is:',
    options: ['Fund expense', 'Management expense', 'Depends on whether it\'s fund-specific or platform-wide'],
    correctIndex: 2,
    explanation: 'This is a gray area. If the tool is dedicated to one fund, it may be a fund expense. If it\'s a platform-wide system used across multiple funds, it\'s typically a management expense or allocated.',
    difficulty: 'hard',
    topic: 'gray-areas'
  }
]

/**
 * Custom result messages for expense allocation quiz
 */
const EXPENSE_RESULT_MESSAGES: QuizResultMessages = {
  perfect: 'You\'re an expense allocation expert!',
  great: 'You have a strong grasp of expense allocation.',
  good: 'You understand the basics well. Review the explanations to improve.',
  needsWork: 'Try again after exploring more scenarios.'
}

interface QuizProps {
  questions?: QuizQuestion[]
  onComplete: (score: number, total: number) => void
  onClose: () => void
}

export function Quiz({
  questions = EXPENSE_QUIZ_QUESTIONS.slice(0, 5),
  onComplete,
  onClose
}: QuizProps) {
  return (
    <QuizBase
      questions={questions}
      title="Expense Allocation Quiz"
      onComplete={onComplete}
      onClose={onClose}
      showStreak={false}
      showCloseButton
      resultMessages={EXPENSE_RESULT_MESSAGES}
    />
  )
}

export { QuizResults }
