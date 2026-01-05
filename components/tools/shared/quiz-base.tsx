'use client'

import { useState, useCallback } from 'react'
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
  Zap,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Quiz question interface
 */
export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  topic: string
}

/**
 * Result messages for different score ranges
 */
export interface QuizResultMessages {
  perfect: string
  great: string
  good: string
  needsWork: string
}

/**
 * Props for the Quiz component
 */
export interface QuizBaseProps {
  /** Array of quiz questions */
  questions: QuizQuestion[]
  /** Title shown in the quiz header */
  title?: string
  /** Called when quiz is completed */
  onComplete: (score: number, total: number) => void
  /** Called when user clicks close */
  onClose?: () => void
  /** Called when user answers correctly (for XP/gamification) */
  onCorrectAnswer?: () => void
  /** Enable streak tracking and display */
  showStreak?: boolean
  /** Show close button in header */
  showCloseButton?: boolean
  /** Custom result messages */
  resultMessages?: QuizResultMessages
  /** Additional class names */
  className?: string
}

const DEFAULT_RESULT_MESSAGES: QuizResultMessages = {
  perfect: "You've mastered this topic! You're ready for advanced concepts.",
  great: "Great understanding! Review the missed questions to perfect your knowledge.",
  good: "You're on the right track. Keep exploring to strengthen your understanding.",
  needsWork: "This can be tricky. Try reviewing the glossary and FAQs for more context."
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
}

/**
 * Reusable Quiz component with gamification features
 */
export function QuizBase({
  questions,
  title = 'Knowledge Check',
  onComplete,
  onClose,
  onCorrectAnswer,
  showStreak = true,
  showCloseButton = true,
  resultMessages = DEFAULT_RESULT_MESSAGES,
  className
}: QuizBaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showStreakBonus, setShowStreakBonus] = useState(false)

  const question = questions[currentIndex]
  const isCorrect = selectedAnswer === question?.correctIndex
  const isLastQuestion = currentIndex === questions.length - 1
  const progress = ((currentIndex + 1) / questions.length) * 100

  const handleAnswer = useCallback((index: number) => {
    if (showResult || !question) return
    setSelectedAnswer(index)
    setShowResult(true)

    if (index === question.correctIndex) {
      setScore(prev => prev + 1)
      setStreak(prev => prev + 1)
      onCorrectAnswer?.()

      // Show streak bonus for 3+ correct in a row
      if (showStreak && streak >= 2) {
        setShowStreakBonus(true)
        setTimeout(() => setShowStreakBonus(false), 2000)
      }
    } else {
      setStreak(0)
    }
  }, [showResult, question, onCorrectAnswer, showStreak, streak])

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      onComplete(score + (isCorrect ? 0 : 0), questions.length)
    } else {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    }
  }, [isLastQuestion, score, isCorrect, questions.length, onComplete])

  if (!question) return null

  return (
    <Card className={cn(
      'border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30 overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <span className="font-semibold">{title}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="font-medium">{score}/{questions.length}</span>
            </div>
            {showStreak && streak >= 2 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 text-sm text-orange-500"
              >
                <Zap className="h-4 w-4" />
                <span className="font-medium">{streak} streak!</span>
              </motion.div>
            )}
            {showCloseButton && onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
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
          {showStreak && showStreakBonus && (
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
            <span className={cn('text-xs px-2 py-1 rounded-full', difficultyColors[question.difficulty])}>
              {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              {question.topic.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                className={cn('w-full p-4 rounded-lg border-2 text-left transition-all', optionClass)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                        showResult && isCorrectOption && 'bg-green-500 text-white',
                        showResult && isSelected && !isCorrectOption && 'bg-red-500 text-white',
                        !(showResult && (isCorrectOption || (isSelected && !isCorrectOption))) && 'bg-muted text-muted-foreground'
                      )}
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
                className={cn(
                  'p-4 rounded-lg flex items-start gap-3',
                  isCorrect
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                )}
              >
                {isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={cn(
                    'font-semibold',
                    isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  )}>
                    {isCorrect ? 'Correct!' : 'Not quite!'}
                    {isCorrect && showStreak && streak >= 3 && ' 🔥'}
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

/**
 * Props for the Quiz Results component
 */
export interface QuizResultsProps {
  score: number
  total: number
  onRetry: () => void
  onClose: () => void
  /** Custom result messages */
  resultMessages?: QuizResultMessages
  /** Show confetti animation for perfect score */
  showConfetti?: boolean
  /** Additional class names */
  className?: string
}

/**
 * Quiz Results display component
 */
export function QuizResults({
  score,
  total,
  onRetry,
  onClose,
  resultMessages = DEFAULT_RESULT_MESSAGES,
  showConfetti = true,
  className
}: QuizResultsProps) {
  const percentage = (score / total) * 100
  const isPerfect = score === total
  const isGreat = percentage >= 80
  const isGood = percentage >= 60

  const getMessage = () => {
    if (isPerfect) return resultMessages.perfect
    if (isGreat) return resultMessages.great
    if (isGood) return resultMessages.good
    return resultMessages.needsWork
  }

  const getEmoji = () => {
    if (isPerfect) return '🏆 Perfect Score!'
    if (isGreat) return '⭐ Excellent!'
    if (isGood) return '👍 Good Job!'
    return 'Keep Learning!'
  }

  return (
    <Card className={cn('border-2 border-primary/20 overflow-hidden', className)}>
      <CardContent className="p-8 text-center space-y-6 relative">
        {/* Trophy animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 150 }}
          className={cn(
            'inline-block rounded-full p-6',
            isPerfect && 'bg-gradient-to-br from-amber-400 to-yellow-500',
            isGreat && !isPerfect && 'bg-gradient-to-br from-green-400 to-emerald-500',
            isGood && !isGreat && 'bg-gradient-to-br from-blue-400 to-cyan-500',
            !isGood && 'bg-gradient-to-br from-gray-400 to-slate-500'
          )}
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
        {showConfetti && isPerfect && (
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
                className={cn(
                  'absolute top-0 w-2 h-2 rounded-sm',
                  ['bg-amber-400', 'bg-yellow-400', 'bg-orange-400', 'bg-red-400', 'bg-purple-400', 'bg-blue-400'][i % 6]
                )}
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
            className={cn(
              'text-xl font-semibold mt-2',
              isPerfect && 'text-amber-500',
              isGreat && !isPerfect && 'text-green-500',
              isGood && !isGreat && 'text-blue-500',
              !isGood && 'text-muted-foreground'
            )}
          >
            {getEmoji()}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-lg bg-muted/50"
        >
          <p className="text-sm text-muted-foreground">{getMessage()}</p>
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

/**
 * Helper to shuffle quiz questions
 */
export function shuffleQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  const shuffled = [...questions]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Helper to get a subset of questions by difficulty
 */
export function getQuestionsByDifficulty(
  questions: QuizQuestion[],
  difficulty: 'easy' | 'medium' | 'hard'
): QuizQuestion[] {
  return questions.filter(q => q.difficulty === difficulty)
}

/**
 * Helper to get a balanced mix of questions
 */
export function getBalancedQuestionSet(
  questions: QuizQuestion[],
  count: number
): QuizQuestion[] {
  const easy = shuffleQuestions(getQuestionsByDifficulty(questions, 'easy'))
  const medium = shuffleQuestions(getQuestionsByDifficulty(questions, 'medium'))
  const hard = shuffleQuestions(getQuestionsByDifficulty(questions, 'hard'))

  const perDifficulty = Math.floor(count / 3)
  const result = [
    ...easy.slice(0, perDifficulty),
    ...medium.slice(0, perDifficulty),
    ...hard.slice(0, count - perDifficulty * 2)
  ]

  return shuffleQuestions(result)
}
