'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lightbulb,
  Trophy,
  ChevronRight,
  Sparkles,
  Star,
  Zap
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
      onCorrectAnswer()

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
            <span className="font-semibold">Knowledge Check</span>
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
          </div>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          Question {currentIndex + 1} of {questions.length}
        </p>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Streak Bonus Animation */}
        <AnimatePresence>
          {showStreakBonus && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -20 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
            >
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                {streak} in a row! +Bonus XP
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

        {/* Confetti for perfect score */}
        {isPerfect && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, y: -20, x: Math.random() * 100 - 50 + '%' }}
                animate={{
                  opacity: 0,
                  y: '100vh',
                  rotate: Math.random() * 360
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: Math.random() * 0.5
                }}
                className={`absolute top-0 w-2 h-2 ${
                  ['bg-amber-400', 'bg-yellow-400', 'bg-orange-400', 'bg-red-400', 'bg-purple-400', 'bg-blue-400'][i % 6]
                } rounded-sm`}
                style={{ left: `${Math.random() * 100}%` }}
              />
            ))}
          </div>
        )}

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
              ? "You've mastered waterfall distributions! You're ready to analyze any fund structure."
              : isGreat
              ? "Great understanding! Review the missed questions to perfect your knowledge."
              : isGood
              ? "You're on the right track. Keep exploring the glossary and FAQs to deepen your understanding."
              : "Waterfall mechanics can be tricky. Try the tutorial again and explore the glossary for more context."}
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
