'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Confetti Celebration Effect
export function Confetti({ show, duration = 3000 }: { show: boolean; duration?: number }) {
  const [particles, setParticles] = useState<Array<{
    id: number
    x: number
    color: string
    delay: number
    rotation: number
  }>>([])

  useEffect(() => {
    if (show) {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: ['#f59e0b', '#fbbf24', '#f97316', '#ef4444', '#a855f7', '#3b82f6', '#10b981'][
          Math.floor(Math.random() * 7)
        ],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360
      }))
      setParticles(newParticles)

      const timer = setTimeout(() => setParticles([]), duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration])

  if (particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, y: -20, x: `${p.x}%`, rotate: 0 }}
          animate={{
            opacity: 0,
            y: '110vh',
            rotate: p.rotation * 2
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: p.delay,
            ease: 'easeIn'
          }}
          className="absolute top-0 w-3 h-3"
          style={{
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px'
          }}
        />
      ))}
    </div>
  )
}

// Animated Fee Flow Visualization
export function FeeFlowAnimation({
  fundSize,
  feeRate,
  isPlaying = true
}: {
  fundSize: number
  feeRate: number
  isPlaying?: boolean
}) {
  const [flowStep, setFlowStep] = useState(0)
  const annualFee = (fundSize * feeRate) / 100

  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setFlowStep((prev) => (prev + 1) % 4)
    }, 2000)

    return () => clearInterval(interval)
  }, [isPlaying])

  const steps = [
    { label: 'Fund Capital', value: `$${fundSize}M`, color: 'from-blue-400 to-blue-500' },
    { label: 'Fee Rate', value: `${feeRate}%`, color: 'from-purple-400 to-purple-500' },
    { label: 'Annual Fee', value: `$${annualFee.toFixed(2)}M`, color: 'from-green-400 to-green-500' },
    { label: 'GP Operations', value: 'Funded', color: 'from-amber-400 to-amber-500' }
  ]

  return (
    <div className="relative bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 rounded-xl p-6 overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => (
          <div key={index} className="flex-1 relative">
            <motion.div
              className={`p-4 rounded-lg text-center ${
                flowStep >= index
                  ? `bg-gradient-to-r ${step.color} text-white`
                  : 'bg-muted/50'
              }`}
              animate={{
                scale: flowStep === index ? 1.05 : 1,
                boxShadow: flowStep === index ? '0 4px 20px rgba(0,0,0,0.2)' : 'none'
              }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs font-medium opacity-80">{step.label}</p>
              <p className="text-lg font-bold">{step.value}</p>
            </motion.div>

            {/* Connecting arrow */}
            {index < steps.length - 1 && (
              <motion.div
                className="absolute top-1/2 -right-2 transform -translate-y-1/2 z-10"
                animate={{
                  opacity: flowStep > index ? 1 : 0.3,
                  x: flowStep === index ? [0, 5, 0] : 0
                }}
                transition={{ duration: 0.5, repeat: flowStep === index ? Infinity : 0 }}
              >
                <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">→</span>
                </div>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Flow line */}
      <div className="absolute bottom-2 left-6 right-6 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"
          animate={{ width: `${((flowStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  )
}

// Success Checkmark Animation
export function SuccessCheckmark({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center"
        >
          <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-10 h-10 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path d="M5 13l4 4L19 7" />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Sparkle Effect
export function SparkleEffect({ show }: { show: boolean }) {
  if (!show) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: Math.cos((i / 8) * Math.PI * 2) * 30,
            y: Math.sin((i / 8) * Math.PI * 2) * 30
          }}
          transition={{
            duration: 0.8,
            delay: i * 0.1
          }}
          className="absolute top-1/2 left-1/2 w-2 h-2 bg-amber-400 rounded-full"
          style={{ marginLeft: -4, marginTop: -4 }}
        />
      ))}
    </div>
  )
}

// Number Fly Animation (for XP gains)
export function FlyingNumber({
  value,
  show,
  onComplete
}: {
  value: string
  show: boolean
  onComplete: () => void
}) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 1500)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 1, 0], y: -50, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute top-0 left-1/2 -translate-x-1/2 text-amber-500 font-bold text-xl whitespace-nowrap"
        >
          {value}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Progress Ring Animation
export function ProgressRing({
  progress,
  size = 60,
  strokeWidth = 4,
  color = 'primary'
}: {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-muted stroke-current"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          className={`text-${color}-500 stroke-current`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}

// Pulsing Glow Effect
export function PulsingGlow({ active = true }: { active?: boolean }) {
  if (!active) return null

  return (
    <motion.div
      className="absolute inset-0 rounded-lg"
      animate={{
        boxShadow: [
          '0 0 0 0 rgba(var(--primary), 0.4)',
          '0 0 0 10px rgba(var(--primary), 0)',
          '0 0 0 0 rgba(var(--primary), 0)'
        ]
      }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  )
}

// Animated Counter
export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 1.5
}: {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
}) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const startValue = displayValue
    const diff = value - startValue

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)

      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3)

      setDisplayValue(Math.round(startValue + diff * eased))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return (
    <span>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  )
}

// Phase Timeline Animation
export function PhaseTimeline({
  phases,
  currentYear
}: {
  phases: Array<{ name: string; startYear: number; endYear: number; color: string }>
  currentYear: number
}) {
  const totalYears = Math.max(...phases.map(p => p.endYear))

  return (
    <div className="relative h-16 bg-muted/30 rounded-lg overflow-hidden">
      {phases.map((phase, index) => {
        const startPercent = ((phase.startYear - 1) / totalYears) * 100
        const widthPercent = ((phase.endYear - phase.startYear + 1) / totalYears) * 100

        return (
          <motion.div
            key={index}
            className={`absolute top-0 bottom-0 ${phase.color}`}
            initial={{ width: 0 }}
            animate={{ width: `${widthPercent}%` }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            style={{ left: `${startPercent}%` }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-white drop-shadow">
                {phase.name}
              </span>
            </div>
          </motion.div>
        )
      })}

      {/* Current year marker */}
      {currentYear > 0 && (
        <motion.div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground z-10"
          initial={{ left: 0 }}
          animate={{ left: `${((currentYear - 0.5) / totalYears) * 100}%` }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded">
            Year {currentYear}
          </div>
        </motion.div>
      )}
    </div>
  )
}
