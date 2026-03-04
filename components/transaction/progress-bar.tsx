"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  type?: "deposit" | "withdrawal"
  className?: string
}

export function TransactionProgressBar({ currentStep, totalSteps, type, className }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100

  const getStepIcon = (stepNumber: number) => {
    if (stepNumber < currentStep) {
      return <Check className="h-3 w-3" />
    }
    return <span className="text-[10px] font-semibold">{stepNumber}</span>
  }

  const getStepColor = (stepNumber: number) => {
    if (stepNumber < currentStep) {
      return "bg-primary text-primary-foreground border-primary"
    } else if (stepNumber === currentStep) {
      return "bg-primary text-primary-foreground border-primary ring-2 ring-primary/30"
    } else {
      return "bg-background text-muted-foreground border-border"
    }
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-3">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep

          return (
            <div key={stepNumber} className="flex flex-col items-center flex-1">
              <div className={cn(
                "flex items-center justify-center w-7 h-7 rounded-full border-2 transition-all duration-300",
                getStepColor(stepNumber)
              )}>
                {getStepIcon(stepNumber)}
              </div>
              {isCurrent && (
                <div className="mt-1.5 text-center">
                  <p className="text-[10px] font-medium text-foreground">
                    Étape {currentStep}/{totalSteps}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
