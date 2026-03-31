"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { TransactionProgressBar } from "@/components/transaction/progress-bar"
import { ConfirmationDialog } from "@/components/transaction/confirmation-dialog"
import { PlatformStep } from "@/components/transaction/steps/platform-step"
import { BetIdStep } from "@/components/transaction/steps/bet-id-step"
import { NetworkStep } from "@/components/transaction/steps/network-step"
import { PhoneStep } from "@/components/transaction/steps/phone-step"
import { AmountStep } from "@/components/transaction/steps/amount-step"
import { TutoStep } from "@/components/transaction/steps/tuto-step"
import { transactionApi } from "@/lib/api-client"
import type { Platform, UserAppId, Network, UserPhone } from "@/lib/types"
import { toast } from "react-hot-toast"
import { extractTimeErrorMessage } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ArrowUpFromLine, ArrowLeft } from "lucide-react"
import { useLastPendingTransaction } from "@/hooks/use-last-pending-transaction"
import { LastTransactionSummary } from "@/components/transaction/last-transaction-summary"

export default function WithdrawalPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { lastTransaction, actionType, cancel, finalize } = useLastPendingTransaction()

  // Form data
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedBetId, setSelectedBetId] = useState<UserAppId | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [selectedPhone, setSelectedPhone] = useState<UserPhone | null>(null)
  const [amount, setAmount] = useState(0)
  const [withdriwalCode, setWithdriwalCode] = useState("")

  // Step management
  const [currentStep, setCurrentStep] = useState(1)
  const hasHelpStep = !!(selectedPlatform?.withdrawal_tuto_link || selectedPlatform?.why_withdrawal_fail)
  const totalSteps = hasHelpStep ? 6 : 5

  // Confirmation dialog
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if not authenticated
  if (!user) {
    router.push("/login")
    return null
  }

  const handleNext = () => {
    if (lastTransaction) {
      toast.error(
        `Vous avez déjà une transaction de ${lastTransaction.type_trans === "deposit" ? "dépôt" : "retrait"} en cours. Veuillez la finaliser ou l'annuler avant d'en créer une nouvelle.`,
      )
      return
    }

    if (currentStep === 4) {
      if (!selectedPhone) {
        toast.error("Veuillez sélectionner un numéro de téléphone")
        return
      }
      if (hasHelpStep) {
        setCurrentStep(5)
      } else {
        setCurrentStep(6) // Set to amount step (final step)
      }
      return
    }

    if (currentStep === 5) {
      setCurrentStep(6)
      return
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsConfirmationOpen(true)
    }
  }

  const handlePrevious = () => {
    if (currentStep === 6 && !hasHelpStep) {
      setCurrentStep(4)
      return
    }
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleConfirmTransaction = async () => {
    if (!selectedPlatform || !selectedBetId || !selectedNetwork || !selectedPhone) {
      toast.error("Données manquantes pour la transaction")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await transactionApi.createWithdrawal({
        amount,
        phone_number: selectedPhone.phone,
        app: selectedPlatform.id,
        user_app_id: selectedBetId.user_app_id,
        network: selectedNetwork.id,
        withdriwal_code: withdriwalCode,
        source: "web"
      })

      toast.success("Retrait initié avec succès!")

      // Navigate to the transaction detail page if we have an ID
      if (response && response.id) {
        router.push(`/dashboard/history/${response.id}`)
      } else {
        router.push("/dashboard")
      }
    } catch (error: any) {
      // Check for rate limit error (error_time_message)
      const timeErrorMessage = extractTimeErrorMessage(error)
      if (timeErrorMessage) {
        toast.error(timeErrorMessage)
      } else {
        toast.error("Erreur lors de la création du retrait")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return selectedPlatform !== null
      case 2:
        return selectedBetId !== null
      case 3:
        return selectedNetwork !== null
      case 4:
        return selectedPhone !== null
      case 5:
        return amount > 0 && selectedPlatform &&
          withdriwalCode.length >= 4 &&
          amount >= selectedPlatform.minimun_with &&
          amount <= selectedPlatform.max_win
      default:
        return false
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PlatformStep
            selectedPlatform={selectedPlatform}
            onSelect={setSelectedPlatform}
            onNext={handleNext}
            type="withdrawal"
          />
        )
      case 2:
        return (
          <BetIdStep
            selectedPlatform={selectedPlatform}
            selectedBetId={selectedBetId}
            onSelect={setSelectedBetId}
            onNext={handleNext}
          />
        )
      case 3:
        return (
          <NetworkStep
            selectedNetwork={selectedNetwork}
            onSelect={setSelectedNetwork}
            onNext={handleNext}
            type="withdrawal"
          />
        )
      case 4:
        return (
          <PhoneStep
            selectedNetwork={selectedNetwork}
            selectedPhone={selectedPhone}
            onSelect={setSelectedPhone}
            onNext={handleNext}
          />
        )
      case 5:
        if (hasHelpStep) {
          return (
            <TutoStep
              selectedPlatform={selectedPlatform}
              onNext={handleNext}
              type="withdrawal"
            />
          )
        }
        return (
          <AmountStep
            amount={amount}
            setAmount={setAmount}
            withdriwalCode={withdriwalCode}
            setWithdriwalCode={setWithdriwalCode}
            selectedPlatform={selectedPlatform}
            selectedBetId={selectedBetId}
            selectedNetwork={selectedNetwork}
            selectedPhone={selectedPhone}
            type="withdrawal"
            onNext={handleNext}
          />
        )
      case 6:
        return (
          <AmountStep
            amount={amount}
            setAmount={setAmount}
            withdriwalCode={withdriwalCode}
            setWithdriwalCode={setWithdriwalCode}
            selectedPlatform={selectedPlatform}
            selectedBetId={selectedBetId}
            selectedNetwork={selectedNetwork}
            selectedPhone={selectedPhone}
            type="withdrawal"
            onNext={handleNext}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {lastTransaction ? (
        <LastTransactionSummary
          transaction={lastTransaction}
          expectedType="withdrawal"
          actionType={actionType}
          onCancel={cancel}
          onFinalize={async (reference) => {
            await finalize(reference)
          }}
          afterFinalizeHref="/dashboard/history"
        />
      ) : null}

      {/* Back Button */}
      <div className="flex items-center justify-start">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 h-10 px-4  hover:bg-primary/10 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Button>
      </div>

      {/* Progress Section */}
      <Card className="glass-panel rounded-2xl sm:rounded-3xl">
        <CardContent className="p-5 sm:p-6">
          <TransactionProgressBar
            currentStep={currentStep}
            totalSteps={totalSteps}
            type="withdrawal"
          />
        </CardContent>
      </Card>

      {/* Current Step */}
      <div className="min-h-[300px] sm:min-h-[350px] lg:min-h-[400px]">
        {renderCurrentStep()}
      </div>

      {/* Navigation - Show Previous button for steps 2-5 */}
      {currentStep > 1 && currentStep <= 5 && (
        <div className="flex justify-start">
          <Button
            variant="outline"
            onClick={handlePrevious}
            className="flex items-center gap-2 h-11 sm:h-12 px-6 border-primary/30 bg-primary/5 hover:bg-primary/10 text-sm sm:text-base font-semibold"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        onConfirm={handleConfirmTransaction}
        transactionData={{
          amount,
          phone_number: selectedPhone?.phone || "",
          app: selectedPlatform?.id || "",
          user_app_id: selectedBetId?.user_app_id || "",
          network: selectedNetwork?.id || 0,
          withdriwal_code: withdriwalCode,
        }}
        type="withdrawal"
        platformName={selectedPlatform?.name || ""}
        networkName={selectedNetwork?.public_name || ""}
        isLoading={isSubmitting}
      />
    </div>
  )
}