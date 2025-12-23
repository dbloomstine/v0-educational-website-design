'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trophy,
  RotateCcw,
  ChevronRight,
  ArrowRight,
  Lightbulb,
  X,
  Star
} from 'lucide-react'

export interface QuizQuestion {
  id: string
  question: string
  scenario?: string
  options: {
    id: string
    text: string
    isCorrect: boolean
  }[]
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: 'basics' | 'fund-types' | 'stages' | 'gray-areas'
}

// Quiz questions
export const EXPENSE_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'A PE fund pays legal fees to form the limited partnership. Who bears this cost?',
    options: [
      { id: 'a', text: 'Management Company', isCorrect: false },
      { id: 'b', text: 'Fund (LPs)', isCorrect: true },
      { id: 'c', text: 'Split 50/50', isCorrect: false }
    ],
    explanation: 'Fund formation legal fees are almost universally treated as fund expenses because they directly create the investment vehicle that benefits LPs.',
    difficulty: 'easy',
    category: 'basics'
  },
  {
    id: 'q2',
    question: 'The GP hires a placement agent to help raise capital. Who typically pays?',
    options: [
      { id: 'a', text: 'Fund (LPs)', isCorrect: false },
      { id: 'b', text: 'Management Company', isCorrect: true },
      { id: 'c', text: 'The LPs who benefit from the placement', isCorrect: false }
    ],
    explanation: 'Placement agent fees are management company expenses. Fundraising is the GP\'s responsibility, and these costs help the GP build their business and future funds.',
    difficulty: 'easy',
    category: 'basics'
  },
  {
    id: 'q3',
    question: 'Annual fund audit and tax preparation costs are typically:',
    options: [
      { id: 'a', text: 'Management expenses', isCorrect: false },
      { id: 'b', text: 'Fund expenses', isCorrect: true },
      { id: 'c', text: 'Paid by individual LPs', isCorrect: false }
    ],
    explanation: 'Audit, tax, and fund administration costs are standard fund expenses. They\'re required for LP reporting and are directly related to fund operations.',
    difficulty: 'easy',
    category: 'basics'
  },
  {
    id: 'q4',
    question: 'A VC fund incurs costs traveling to conduct due diligence on a potential investment. This is:',
    options: [
      { id: 'a', text: 'Fund expense', isCorrect: true },
      { id: 'b', text: 'Management expense', isCorrect: false },
      { id: 'c', text: 'Not allowed under typical LPAs', isCorrect: false }
    ],
    explanation: 'Travel for investment due diligence is a fund expense because it directly supports the fund\'s investment activities and benefits LPs.',
    difficulty: 'medium',
    category: 'fund-types'
  },
  {
    id: 'q5',
    question: 'The GP travels to meet with prospective LPs during fundraising. Who pays?',
    options: [
      { id: 'a', text: 'Fund (LPs)', isCorrect: false },
      { id: 'b', text: 'Management Company', isCorrect: true },
      { id: 'c', text: 'The prospective LPs', isCorrect: false }
    ],
    explanation: 'Fundraising travel is a management expense. It benefits the GP\'s ability to raise capital and build their platform, not the existing fund.',
    difficulty: 'medium',
    category: 'stages'
  },
  {
    id: 'q6',
    question: 'D&O insurance covering fund directors is typically:',
    options: [
      { id: 'a', text: 'Always a fund expense', isCorrect: false },
      { id: 'b', text: 'Always a management expense', isCorrect: false },
      { id: 'c', text: 'Negotiated case-by-case', isCorrect: true }
    ],
    explanation: 'D&O insurance is often negotiated. If it covers fund-specific directors and activities, it may be a fund expense. If it covers the broader GP platform, it may be split or a management expense.',
    difficulty: 'hard',
    category: 'gray-areas'
  },
  {
    id: 'q7',
    question: 'A fund-of-funds has a deal fall through after spending on legal review of a target fund. This "broken deal" cost is:',
    options: [
      { id: 'a', text: 'Fund expense (like PE broken deals)', isCorrect: false },
      { id: 'b', text: 'Often a management expense for FoFs', isCorrect: true },
      { id: 'c', text: 'Paid by the target fund', isCorrect: false }
    ],
    explanation: 'Unlike direct investing, fund-of-funds broken deal costs (failed fund commitments) are often treated as management expenses because the diligence process is more about manager relationships.',
    difficulty: 'hard',
    category: 'fund-types'
  },
  {
    id: 'q8',
    question: 'Office rent for the GP\'s headquarters where they manage multiple funds is:',
    options: [
      { id: 'a', text: 'Fund expense', isCorrect: false },
      { id: 'b', text: 'Management expense', isCorrect: true },
      { id: 'c', text: 'Allocated pro-rata across funds', isCorrect: false }
    ],
    explanation: 'General office overhead is a classic management expense. It supports the GP\'s platform and ability to manage multiple funds, not any single fund\'s investments.',
    difficulty: 'easy',
    category: 'basics'
  },
  {
    id: 'q9',
    question: 'During the pre-launch phase, organizational costs for a new fund should be:',
    options: [
      { id: 'a', text: 'Fully paid by management company', isCorrect: false },
      { id: 'b', text: 'Fund expense with caps specified in LPA', isCorrect: true },
      { id: 'c', text: 'Deferred until first investment', isCorrect: false }
    ],
    explanation: 'Organizational costs are typically fund expenses but often capped in the LPA (e.g., "$500K cap on org costs"). Any excess is borne by the management company.',
    difficulty: 'medium',
    category: 'stages'
  },
  {
    id: 'q10',
    question: 'Portfolio monitoring software used to track portfolio company performance is:',
    options: [
      { id: 'a', text: 'Fund expense', isCorrect: false },
      { id: 'b', text: 'Management expense', isCorrect: false },
      { id: 'c', text: 'Depends on whether it\'s fund-specific or platform-wide', isCorrect: true }
    ],
    explanation: 'This is a gray area. If the tool is dedicated to one fund, it may be a fund expense. If it\'s a platform-wide system used across multiple funds, it\'s typically a management expense or allocated.',
    difficulty: 'hard',
    category: 'gray-areas'
  }
]

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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<Record<string, boolean>>({})

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100
  const isLastQuestion = currentIndex === questions.length - 1

  const handleSelectAnswer = (answerId: string) => {
    if (showExplanation) return
    setSelectedAnswer(answerId)
  }

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return

    const isCorrect = currentQuestion.options.find(o => o.id === selectedAnswer)?.isCorrect || false
    setShowExplanation(true)
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: isCorrect }))

    if (isCorrect) {
      setScore(prev => prev + 1)
    }
  }

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete(score, questions.length)
    } else {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-amber-100 text-amber-700'
      case 'hard': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Expense Allocation Quiz
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex-1">
            <Progress value={progress} className="h-2" />
          </div>
          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6">
        {/* Stats bar */}
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>{score} correct</span>
          </div>
          <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
            {currentQuestion.difficulty}
          </Badge>
        </div>

        {/* Question */}
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <p className="font-medium text-sm sm:text-base mb-4">{currentQuestion.question}</p>

          {/* Options */}
          <div className="space-y-2 sm:space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedAnswer === option.id
              const isCorrectAnswer = option.isCorrect
              const showResult = showExplanation

              let borderColor = 'border-muted'
              let bgColor = 'bg-transparent'

              if (showResult) {
                if (isCorrectAnswer) {
                  borderColor = 'border-green-500'
                  bgColor = 'bg-green-50 dark:bg-green-950/30'
                } else if (isSelected && !isCorrectAnswer) {
                  borderColor = 'border-red-500'
                  bgColor = 'bg-red-50 dark:bg-red-950/30'
                }
              } else if (isSelected) {
                borderColor = 'border-primary'
                bgColor = 'bg-primary/5'
              }

              return (
                <motion.button
                  key={option.id}
                  whileHover={!showExplanation ? { scale: 1.01 } : {}}
                  whileTap={!showExplanation ? { scale: 0.99 } : {}}
                  onClick={() => handleSelectAnswer(option.id)}
                  disabled={showExplanation}
                  className={`w-full p-3 sm:p-4 rounded-lg border-2 text-left transition-all ${borderColor} ${bgColor} ${
                    showExplanation ? 'cursor-default' : 'hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      showResult && isCorrectAnswer
                        ? 'border-green-500 bg-green-500 text-white'
                        : showResult && isSelected && !isCorrectAnswer
                        ? 'border-red-500 bg-red-500 text-white'
                        : isSelected
                        ? 'border-primary bg-primary text-white'
                        : 'border-muted-foreground/30'
                    }`}>
                      {showResult && isCorrectAnswer && <CheckCircle2 className="h-4 w-4" />}
                      {showResult && isSelected && !isCorrectAnswer && <XCircle className="h-4 w-4" />}
                      {!showResult && isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm sm:text-base">{option.text}</span>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Explanation */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 sm:p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-blue-800 dark:text-blue-200">Explanation</p>
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action button */}
        <div className="flex justify-end pt-2">
          {!showExplanation ? (
            <Button onClick={handleSubmitAnswer} disabled={!selectedAnswer} className="gap-2">
              Check Answer
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2">
              {isLastQuestion ? 'See Results' : 'Next Question'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Quiz Results Component
interface QuizResultsProps {
  score: number
  total: number
  onRetry: () => void
  onClose: () => void
}

export function QuizResults({ score, total, onRetry, onClose }: QuizResultsProps) {
  const percentage = Math.round((score / total) * 100)
  const isPerfect = score === total

  const getMessage = () => {
    if (percentage === 100) return { title: 'Perfect Score!', subtitle: 'You\'re an expense allocation expert!' }
    if (percentage >= 80) return { title: 'Excellent!', subtitle: 'You have a strong grasp of expense allocation.' }
    if (percentage >= 60) return { title: 'Good Job!', subtitle: 'You understand the basics well.' }
    if (percentage >= 40) return { title: 'Keep Learning!', subtitle: 'Review the explanations to improve.' }
    return { title: 'Don\'t Give Up!', subtitle: 'Try again after exploring more scenarios.' }
  }

  const message = getMessage()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6 sm:p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className={`inline-block rounded-full p-4 sm:p-6 mb-4 ${
              isPerfect ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary/10'
            }`}
          >
            {isPerfect ? (
              <Trophy className="h-10 w-10 sm:h-14 sm:w-14 text-amber-500" />
            ) : (
              <Star className="h-10 w-10 sm:h-14 sm:w-14 text-primary" />
            )}
          </motion.div>

          <h2 className="text-xl sm:text-2xl font-bold mb-1">{message.title}</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">{message.subtitle}</p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted mb-6">
            <span className="text-2xl sm:text-3xl font-bold">{score}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-xl sm:text-2xl text-muted-foreground">{total}</span>
            <span className="text-sm text-muted-foreground">({percentage}%)</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={onRetry} className="gap-2" title="Restart the quiz with new questions">
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={onClose} className="gap-2">
              Continue Learning
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
