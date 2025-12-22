'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lightbulb,
  Trophy,
  ChevronRight,
  Sparkles,
  Star,
  Zap,
  X
} from 'lucide-react'

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  topic: string
}

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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showStreakBonus, setShowStreakBonus] = useState(false)

  const question = questions[currentIndex]
  const isCorrect = selectedAnswer === question.correctIndex
  const isLastQuestion = currentIndex === questions.length - 1
  const progress = ((currentIndex + 1) / questions.length) * 100

  const handleAnswer = (index: number) => {
    if (showResult) return
    setSelectedAnswer(index)
    setShowResult(true)

    if (index === question.correctIndex) {
      setScore(prev => prev + 1)
      setStreak(prev => prev + 1)

      // Show streak bonus for 3+ correct in a row
      if (streak >= 2) {
        setShowStreakBonus(true)
        setTimeout(() => setShowStreakBonus(false), 2000)
      }
    } else {
      setStreak(0)
    }
  }

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete(score, questions.length)
    } else {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
      case 'hard':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      default:
        return ''
    }
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <span className="font-semibold">Fee Knowledge Quiz</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="font-medium">{score}/{questions.length}</span>
            </div>
            {streak >= 2 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 text-sm text-orange-500"
              >
                <Zap className="h-4 w-4" />
                <span className="font-medium">{streak} streak!</span>
              </motion.div>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          Question {currentIndex + 1} of {questions.length}
        </p>
      </div>

      <CardContent className="p-6 space-y-6 relative">
        {/* Streak Bonus Animation */}
        <AnimatePresence>
          {showStreakBonus && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-10"
            >
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                {streak} in a row!
                <Sparkles className="h-5 w-5" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(question.difficulty)}`}>
              {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              {question.topic.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-foreground">{question.question}</h3>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index
            const isCorrectOption = index === question.correctIndex

            let optionClass = 'border-border bg-background hover:bg-muted/50 hover:border-primary/50'
            if (showResult) {
              if (isCorrectOption) {
                optionClass = 'border-green-500 bg-green-50 dark:bg-green-950/30'
              } else if (isSelected && !isCorrectOption) {
                optionClass = 'border-red-500 bg-red-50 dark:bg-red-950/30'
              }
            } else if (isSelected) {
              optionClass = 'border-primary bg-primary/5'
            }

            return (
              <motion.button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showResult}
                whileHover={!showResult ? { scale: 1.01 } : {}}
                whileTap={!showResult ? { scale: 0.99 } : {}}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${optionClass}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        showResult && isCorrectOption
                          ? 'bg-green-500 text-white'
                          : showResult && isSelected && !isCorrectOption
                          ? 'bg-red-500 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className={showResult && isCorrectOption ? 'font-medium' : ''}>
                      {option}
                    </span>
                  </div>
                  {showResult && isCorrectOption && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {showResult && isSelected && !isCorrectOption && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Result & Explanation */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  isCorrect
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                }`}
              >
                {isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-semibold ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {isCorrect ? 'Correct!' : 'Not quite!'}
                    {isCorrect && streak >= 3 && ' 🔥'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">Explanation</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">{question.explanation}</p>
                  </div>
                </div>
              </div>

              <Button onClick={handleNext} className="w-full gap-2">
                {isLastQuestion ? (
                  <>
                    <Trophy className="h-4 w-4" />
                    See Results
                  </>
                ) : (
                  <>
                    Next Question
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

// Quiz Results Component
export function QuizResults({
  score,
  total,
  onRetry,
  onClose
}: {
  score: number
  total: number
  onRetry: () => void
  onClose: () => void
}) {
  const percentage = (score / total) * 100
  const isPerfect = score === total
  const isGreat = percentage >= 80
  const isGood = percentage >= 60

  return (
    <Card className="border-2 border-primary/20 overflow-hidden">
      <CardContent className="p-8 text-center space-y-6">
        {/* Trophy animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 150 }}
          className={`inline-block rounded-full p-6 ${
            isPerfect
              ? 'bg-gradient-to-br from-amber-400 to-yellow-500'
              : isGreat
              ? 'bg-gradient-to-br from-green-400 to-emerald-500'
              : isGood
              ? 'bg-gradient-to-br from-blue-400 to-cyan-500'
              : 'bg-gradient-to-br from-gray-400 to-slate-500'
          }`}
        >
          {isPerfect ? (
            <Trophy className="h-12 w-12 text-white" />
          ) : isGreat ? (
            <Star className="h-12 w-12 text-white" />
          ) : (
            <CheckCircle2 className="h-12 w-12 text-white" />
          )}
        </motion.div>

        <div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-muted-foreground uppercase tracking-wide"
          >
            Quiz Complete
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold mt-2"
          >
            {score}/{total}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`text-xl font-semibold mt-2 ${
              isPerfect
                ? 'text-amber-500'
                : isGreat
                ? 'text-green-500'
                : isGood
                ? 'text-blue-500'
                : 'text-muted-foreground'
            }`}
          >
            {isPerfect
              ? '🏆 Perfect Score!'
              : isGreat
              ? '⭐ Excellent!'
              : isGood
              ? '👍 Good Job!'
              : 'Keep Learning!'}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-lg bg-muted/50"
        >
          <p className="text-sm text-muted-foreground">
            {isPerfect
              ? "You've mastered management fee concepts! You're ready to structure any fund."
              : isGreat
              ? "Great understanding! Review the glossary to perfect your knowledge."
              : isGood
              ? "You're on the right track. Try the tutorial again to strengthen your understanding."
              : "Management fees can be tricky. Explore the glossary and FAQs for more context."}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3"
        >
          <Button variant="outline" onClick={onRetry} className="flex-1">
            Try Again
          </Button>
          <Button onClick={onClose} className="flex-1">
            Continue
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  )
}
