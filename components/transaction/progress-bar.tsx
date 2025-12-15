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
      return <Check className="h-3 w-3 sm:h-4 sm:w-4" />
    }
    return <span className="text-xs sm:text-sm font-semibold">{stepNumber}</span>
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
      <div className="flex items-center justify-between mb-4">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep

          return (
            <div key={stepNumber} className="flex flex-col items-center flex-1">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-300",
                getStepColor(stepNumber)
              )}>
                {getStepIcon(stepNumber)}
              </div>
              {isCurrent && (
                <div className="mt-2 text-center">
                  <p className="text-xs sm:text-sm font-medium text-foreground">
                    Étape {currentStep}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {Math.round(progress)}% complété
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Animated pulse effect */}
        <div
          className="absolute top-0 h-2 bg-primary/50 rounded-full animate-pulse"
        style={{
            width: `${progress}%`,
            animation: progress === 100 ? 'none' : 'pulse 2s ease-in-out infinite'
          }}
      />
      </div>
    </div>
  )
}
