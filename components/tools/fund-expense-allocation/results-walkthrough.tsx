'use client'

import {
  DollarSign,
  Scale,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Target,
  Sparkles,
  Shield,
  TrendingUp,
  FileText,
} from 'lucide-react'
import type { ClassificationResult, ClassificationInput } from './expenseData'
import { expenseCategories, fundTypes, fundStages, beneficiaries } from './expenseData'
import {
  ResultsWalkthroughBase,
  WalkthroughStep,
  WalkthroughTipBox,
} from '@/components/tools/shared'

interface ResultsWalkthroughProps {
  result: ClassificationResult
  input: ClassificationInput
  onClose: () => void
  onXPEarned?: (xp: number) => void
}

export function ResultsWalkthrough({
  result,
  input,
  onClose,
  onXPEarned
}: ResultsWalkthroughProps) {
  // Get the expense category name
  const categoryInfo = expenseCategories.find(cat => cat.id === input.expenseCategory)
  const expenseName = categoryInfo?.name || input.customDescription || 'Custom Expense'
  const fundTypeInfo = fundTypes[input.fundType]
  const fundStageInfo = fundStages[input.fundStage]
  const beneficiaryInfo = beneficiaries[input.primaryBeneficiary]

  // Determine classification display info
  const classificationDisplay = {
    'fund-expense': {
      label: 'Fund Expense',
      color: 'emerald',
      icon: DollarSign,
      description: 'This expense should typically be borne by the fund and charged to LP capital.'
    },
    'management-expense': {
      label: 'Management Expense',
      color: 'blue',
      icon: Shield,
      description: 'This expense should typically be borne by the management company from fee income.'
    },
    'case-by-case': {
      label: 'Case-by-Case',
      color: 'amber',
      icon: Scale,
      description: 'This expense requires careful analysis and may depend on your specific LPA terms.'
    }
  }

  const classInfo = classificationDisplay[result.classification]

  // Generate takeaways based on the result
  const takeaways: { type: 'success' | 'warning' | 'info'; text: string }[] = []

  if (result.confidenceLevel === 'high') {
    takeaways.push({
      type: 'success',
      text: 'High confidence classification based on clear market practice and industry standards.'
    })
  } else if (result.confidenceLevel === 'depends-on-lpa') {
    takeaways.push({
      type: 'info',
      text: 'Classification depends on your specific LPA language. Review governing documents carefully.'
    })
  }

  if (result.lpSensitivityLevel === 'high') {
    takeaways.push({
      type: 'warning',
      text: 'This expense type receives heightened LP scrutiny. Ensure documentation and transparency.'
    })
  }

  if (result.marketPractice === 'lp-focus-item') {
    takeaways.push({
      type: 'warning',
      text: 'Institutional LPs often negotiate special terms for this expense category.'
    })
  }

  if (result.sampleLanguage) {
    takeaways.push({
      type: 'info',
      text: 'Sample LPA language is available for this expense type. Consider using it as a template.'
    })
  }

  if (result.similarExpenses.length > 0) {
    takeaways.push({
      type: 'info',
      text: `Consider also reviewing ${result.similarExpenses.length} related expense categories for consistency.`
    })
  }

  const handleComplete = () => {
    onXPEarned?.(25)
    onClose()
  }

  const steps: WalkthroughStep[] = [
    {
      id: 'classification',
      title: 'Classification Result',
      subtitle: expenseName,
      icon: classInfo.icon,
      iconColor: result.classification === 'fund-expense'
        ? 'from-emerald-400 to-green-500'
        : result.classification === 'management-expense'
        ? 'from-blue-400 to-cyan-500'
        : 'from-amber-400 to-orange-500',
      content: (
        <div className="space-y-6">
          <div className={`p-6 rounded-xl text-center ${
            result.classification === 'fund-expense'
              ? 'bg-emerald-500/10 border border-emerald-500/30'
              : result.classification === 'management-expense'
              ? 'bg-blue-500/10 border border-blue-500/30'
              : 'bg-amber-500/10 border border-amber-500/30'
          }`}>
            <p className={`text-3xl font-bold mb-2 ${
              result.classification === 'fund-expense'
                ? 'text-emerald-400'
                : result.classification === 'management-expense'
                ? 'text-blue-400'
                : 'text-amber-400'
            }`}>
              {classInfo.label}
            </p>
            <p className="text-white/80">{result.headline}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-lg font-semibold text-white capitalize">
                {result.confidenceLevel.replace(/-/g, ' ')}
              </p>
              <p className="text-white/80">Confidence</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-lg font-semibold text-white capitalize">
                {result.lpSensitivityLevel}
              </p>
              <p className="text-white/80">LP Sensitivity</p>
            </div>
          </div>

          <WalkthroughTipBox icon={Lightbulb} title="What this means">
            {classInfo.description}
          </WalkthroughTipBox>
        </div>
      )
    },
    {
      id: 'context',
      title: 'Your Fund Context',
      subtitle: 'Factors that influenced this classification',
      icon: Target,
      iconColor: 'from-violet-400 to-purple-500',
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-400 text-slate-900">
                Fund Type
              </span>
            </div>
            <p className="text-xl font-semibold text-white">{fundTypeInfo.name}</p>
            <p className="text-white/80">{fundTypeInfo.description}</p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                Fund Stage
              </span>
            </div>
            <p className="text-xl font-semibold text-white">{fundStageInfo.name}</p>
            <p className="text-white/80">{fundStageInfo.description}</p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                Primary Beneficiary
              </span>
            </div>
            <p className="text-xl font-semibold text-white">{beneficiaryInfo.name}</p>
            <p className="text-white/80">{beneficiaryInfo.description}</p>
          </div>

          {input.lpaContext && (
            <WalkthroughTipBox icon={FileText} variant="info" title="LPA Context Provided">
              Your governing documents will take precedence over general market practice.
            </WalkthroughTipBox>
          )}
        </div>
      )
    },
    {
      id: 'lp-sensitivity',
      title: 'LP Perspective',
      subtitle: 'How LPs view this expense type',
      icon: AlertTriangle,
      iconColor: result.lpSensitivityLevel === 'high'
        ? 'from-amber-400 to-orange-500'
        : 'from-blue-400 to-cyan-500',
      content: (
        <div className="space-y-6">
          <div className={`p-4 rounded-xl ${
            result.lpSensitivityLevel === 'high'
              ? 'bg-amber-500/10 border border-amber-500/30'
              : 'bg-blue-500/10 border border-blue-500/30'
          }`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                result.lpSensitivityLevel === 'high' ? 'text-amber-400' : 'text-blue-400'
              }`} />
              <div>
                <p className="font-medium text-white mb-2">
                  {result.lpSensitivityLevel === 'high' ? 'High LP Scrutiny' : 'Standard LP Expectations'}
                </p>
                <p className="text-sm text-white/90">
                  {result.lpSensitivities}
                </p>
              </div>
            </div>
          </div>

          {/* Market Practice Badge */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-white/70 mb-2">Market Practice</p>
            <p className={`text-lg font-semibold ${
              result.marketPractice === 'common-fund' ? 'text-emerald-400' :
              result.marketPractice === 'common-mgmt' ? 'text-blue-400' :
              result.marketPractice === 'lp-focus-item' ? 'text-amber-400' :
              'text-violet-400'
            }`}>
              {result.marketPractice === 'common-fund' ? 'Common Fund Expense' :
               result.marketPractice === 'common-mgmt' ? 'Common Management Expense' :
               result.marketPractice === 'lp-focus-item' ? 'LP Focus Item' :
               'Often Negotiated'}
            </p>
          </div>

          {result.flags.length > 0 && (
            <div className="space-y-2">
              <p className="text-white/80">Important Considerations:</p>
              {result.flags.slice(0, 3).map((flag, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <span className="text-amber-400">!</span>
                  <p className="text-white/80">{flag}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'logic',
      title: 'Classification Logic',
      subtitle: 'How we reached this conclusion',
      icon: Sparkles,
      iconColor: 'from-cyan-400 to-blue-500',
      content: (
        <div className="space-y-4">
          {result.logicExplanation.map((logic, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${
                idx === 0
                  ? 'border-cyan-400/50 bg-cyan-500/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  idx === 0 ? 'bg-cyan-400 text-slate-900' : 'bg-white/20 text-white'
                }`}>
                  {idx + 1}
                </span>
                <p className="text-white/80">{logic}</p>
              </div>
            </div>
          ))}

          <WalkthroughTipBox icon={Lightbulb} title="Pro Tip">
            Document your classification rationale in case LPs or auditors ask. Clear logic = fewer disputes.
          </WalkthroughTipBox>
        </div>
      )
    },
    {
      id: 'related',
      title: 'Related Expenses',
      subtitle: result.similarExpenses.length > 0
        ? `${result.similarExpenses.length} similar categories to review`
        : 'Sample LPA language',
      icon: TrendingUp,
      iconColor: 'from-indigo-400 to-violet-500',
      content: (
        <div className="space-y-6">
          {result.similarExpenses.length > 0 && (
            <div className="space-y-3">
              <p className="text-white/80">Commonly reviewed together:</p>
              <div className="flex flex-wrap gap-2">
                {result.similarExpenses.map((expense, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-full text-sm bg-indigo-500/20 border border-indigo-500/30 text-indigo-300"
                  >
                    {expense}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.sampleLanguage && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white/80 mb-3">Sample LPA Language</p>
              <p className="text-white/80 font-mono leading-relaxed italic">
                "{result.sampleLanguage}"
              </p>
            </div>
          )}

          {result.examples.length > 0 && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white/80 mb-3">Common Examples</p>
              <ul className="space-y-2">
                {result.examples.slice(0, 3).map((example, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-white/80">
                    <span className="text-indigo-400">-</span>
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'takeaways',
      title: 'Key Takeaways',
      subtitle: 'Summary and next steps',
      icon: CheckCircle2,
      iconColor: 'from-emerald-400 to-teal-500',
      content: (
        <div className="space-y-4">
          {takeaways.map((takeaway, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-xl ${
                takeaway.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : takeaway.type === 'warning'
                  ? 'bg-amber-500/10 border border-amber-500/30'
                  : 'bg-blue-500/10 border border-blue-500/30'
              }`}
            >
              {takeaway.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" />}
              {takeaway.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />}
              {takeaway.type === 'info' && <Lightbulb className="h-5 w-5 text-blue-400 mt-0.5" />}
              <p className="text-white/80">{takeaway.text}</p>
            </div>
          ))}

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 mt-6">
            <p className="text-white/80">
              <strong className="text-white">Important:</strong> This classification is educational guidance only. Your fund's governing documents (LPA, side letters) and legal counsel's advice take precedence over general market practice.
            </p>
          </div>

          <WalkthroughTipBox icon={Lightbulb} variant="success" title="Next Step">
            Export your results or analyze another expense category to build a complete allocation policy.
          </WalkthroughTipBox>
        </div>
      )
    }
  ]

  return (
    <ResultsWalkthroughBase
      steps={steps}
      onComplete={handleComplete}
      onSkip={onClose}
      badgeLabel="Expense Guide"
      completeButtonText="View Full Results"
      primaryColor={
        result.classification === 'fund-expense' ? 'emerald' :
        result.classification === 'management-expense' ? 'blue' : 'amber'
      }
    />
  )
}
