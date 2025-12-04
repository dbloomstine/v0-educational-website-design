"use client"

import { Check, Upload, Settings, Sparkles, MessageCircle, FileDown } from 'lucide-react'

export type WorkflowStep = 'upload' | 'configure' | 'generate' | 'refine' | 'export'

interface ProgressStepperProps {
  currentStep: WorkflowStep
  hasFiles: boolean
  hasGenerated: boolean
  compact?: boolean
}

const STEPS = [
  { id: 'upload', label: 'Upload', icon: Upload, description: 'Add your data' },
  { id: 'configure', label: 'Configure', icon: Settings, description: 'Set preferences' },
  { id: 'generate', label: 'Generate', icon: Sparkles, description: 'Create draft' },
  { id: 'refine', label: 'Refine', icon: MessageCircle, description: 'Chat with AI' },
  { id: 'export', label: 'Export', icon: FileDown, description: 'Download' },
] as const

export function ProgressStepper({ currentStep, hasFiles, hasGenerated, compact = false }: ProgressStepperProps) {
  const stepOrder: WorkflowStep[] = ['upload', 'configure', 'generate', 'refine', 'export']

  const getStepStatus = (stepId: WorkflowStep): 'completed' | 'current' | 'upcoming' => {
    const currentIndex = stepOrder.indexOf(currentStep)
    const stepIndex = stepOrder.indexOf(stepId)

    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'current'
    return 'upcoming'
  }

  // Determine actual step based on state
  const getActualStep = (): WorkflowStep => {
    if (hasGenerated) return 'refine' // After generation, we're in refine mode
    if (hasFiles) return 'configure'
    return 'upload'
  }

  const actualStep = getActualStep()

  return (
    <div className="w-full">
      {/* Desktop stepper */}
      <div className={`hidden md:flex items-center justify-between relative transition-all duration-300 ${compact ? 'gap-2' : ''}`}>
        {/* Progress line background */}
        <div className={`absolute left-0 right-0 h-0.5 bg-border transition-all duration-300 ${compact ? 'top-3' : 'top-5'}`} />

        {/* Progress line fill */}
        <div
          className={`absolute left-0 h-0.5 bg-primary transition-all duration-500 ease-out ${compact ? 'top-3' : 'top-5'}`}
          style={{
            width: actualStep === 'upload' ? '0%'
              : actualStep === 'configure' ? '25%'
              : actualStep === 'generate' ? '50%'
              : actualStep === 'refine' ? '75%'
              : '100%'
          }}
        />

        {STEPS.map((step, index) => {
          const status = getStepStatus(step.id)
          const isActual = step.id === actualStep
          const isPast = stepOrder.indexOf(step.id) < stepOrder.indexOf(actualStep)
          const Icon = step.icon

          return (
            <div key={step.id} className={`flex flex-col items-center relative z-10 flex-1 transition-all duration-300 ${compact ? 'py-0' : ''}`}>
              {/* Step circle */}
              <div
                className={`
                  rounded-full flex items-center justify-center
                  transition-all duration-300 ease-out
                  ${compact ? 'w-6 h-6' : 'w-10 h-10'}
                  ${isPast
                    ? 'bg-primary text-primary-foreground scale-100'
                    : isActual
                    ? `bg-primary text-primary-foreground ${compact ? 'scale-100' : 'scale-110 ring-4 ring-primary/20'}`
                    : 'bg-muted text-muted-foreground'
                  }
                `}
              >
                {isPast ? (
                  <Check className={`${compact ? 'w-3 h-3' : 'w-5 h-5'} animate-in zoom-in duration-200`} />
                ) : (
                  <Icon className={`${compact ? 'w-3 h-3' : 'w-5 h-5'} ${isActual && !compact ? 'animate-pulse' : ''}`} />
                )}
              </div>

              {/* Label - hidden in compact mode */}
              {!compact && (
                <span className={`
                  mt-3 text-sm font-medium transition-colors duration-200
                  ${isActual ? 'text-primary' : isPast ? 'text-foreground' : 'text-muted-foreground'}
                `}>
                  {step.label}
                </span>
              )}

              {/* Description - hidden in compact mode */}
              {!compact && (
                <span className="text-xs text-muted-foreground mt-0.5 hidden lg:block">
                  {step.description}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile stepper - compact */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            {STEPS.find(s => s.id === actualStep)?.label}
          </span>
          <span className="text-xs text-muted-foreground">
            Step {stepOrder.indexOf(actualStep) + 1} of 5
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{
              width: actualStep === 'upload' ? '20%'
                : actualStep === 'configure' ? '40%'
                : actualStep === 'generate' ? '60%'
                : actualStep === 'refine' ? '80%'
                : '100%'
            }}
          />
        </div>
      </div>
    </div>
  )
}
