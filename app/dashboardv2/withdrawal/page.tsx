"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AppBar } from "@/components/ui/app-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlatformStep } from "@/components/transaction/steps/platform-step"
import { BetIdStep } from "@/components/transaction/steps/bet-id-step"
import { NetworkStep } from "@/components/transaction/steps/network-step"
import { PhoneStep } from "@/components/transaction/steps/phone-step"
import { AmountStep } from "@/components/transaction/steps/amount-step"
import { TutoStep } from "@/components/transaction/steps/tuto-step"
import { ConfirmationDialog } from "@/components/transaction/confirmation-dialog"
import { transactionApi, settingsApi, networkApi } from "@/lib/api-client"
import type { Platform, UserAppId, Network, UserPhone, Transaction } from "@/lib/types"
import { toast } from "react-hot-toast"
import { extractTimeErrorMessage } from "@/lib/utils"
import { ArrowLeft, Copy, Loader2 } from "lucide-react"
import { useLastPendingTransaction } from "@/hooks/use-last-pending-transaction"
import { LastTransactionSummary } from "@/components/transaction/last-transaction-summary"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TransactionProgressBar } from "@/components/transaction/progress-bar"

export default function WithdrawalV2Page() {
  const router = useRouter()
  const { user } = useAuth()
  const { lastTransaction, actionType, cancel, finalize } = useLastPendingTransaction()

  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedBetId, setSelectedBetId] = useState<UserAppId | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [selectedPhone, setSelectedPhone] = useState<UserPhone | null>(null)
  const [amount, setAmount] = useState(0)
  const [withdriwalCode, setWithdriwalCode] = useState("")
  const [networks, setNetworks] = useState<Network[]>([])

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await networkApi.getAll("withdrawal")
        setNetworks(data)
      } catch (error) {
        console.error("Error fetching networks:", error)
      }
    }
    fetchNetworks()
  }, [])

  // Step management
  const [currentStep, setCurrentStep] = useState(1)
  const hasHelpStep = !!(selectedPlatform?.withdrawal_tuto_link || selectedPlatform?.why_withdrawal_fail)
  const totalSteps = hasHelpStep ? 6 : 5

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isMoovUssdModalOpen, setIsMoovUssdModalOpen] = useState(false)
  const [moovUssdCode, setMoovUssdCode] = useState<string | null>(null)
  const [moovMerchantPhone, setMoovMerchantPhone] = useState<string | null>(null)
  const [isMtnUssdModalOpen, setIsMtnUssdModalOpen] = useState(false)
  const [mtnUssdCode, setMtnUssdCode] = useState<string | null>(null)
  const [mtnMerchantPhone, setMtnMerchantPhone] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/loginv2")
    }
  }, [user, router])

  if (!user) {
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

  const attemptDialerRedirect = (ussdCode: string) => {
    try {
      console.log("Attempting to dial USSD code:", ussdCode)
      const encodedUssd = ussdCode.replace(/#/g, "%23")

      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        console.log("Using mobile dialing method")
        window.location.href = `tel:${encodedUssd}`
      } else {
        console.log("Using desktop dialing method")
        const link = document.createElement("a")
        link.href = `tel:${encodedUssd}`
        link.style.display = "none"
        document.body.appendChild(link)

        setTimeout(() => {
          try {
            link.click()
            console.log("Dial link clicked successfully")
          } catch (clickError) {
            console.warn("Click failed:", clickError)
          }
          if (document.body.contains(link)) {
            document.body.removeChild(link)
          }
        }, 100)
      }
    } catch (error) {
      console.error("Impossible d'ouvrir automatiquement le composeur:", error)
      toast.error("Impossible d'ouvrir le composeur. Copiez le code manuellement.")
    }
  }

  const handleTransactionSuccess = async (data: Transaction, isFinalize: boolean = false) => {
    if (isFinalize) {
      toast.success("Transaction finalisée")
    } else {
      toast.success("Retrait initié avec succès!")
    }

    // 1. Direct USSD code from response
    if (data.ussd_code) {
      const ussdCode = data.ussd_code
      const lowerCode = ussdCode.toLowerCase()
      
      if (lowerCode.includes("*155*") || lowerCode.includes("moov")) {
        setMoovUssdCode(ussdCode)
        setIsMoovUssdModalOpen(true)
      } else if (lowerCode.includes("*133*") || lowerCode.includes("mtn")) {
        setMtnUssdCode(ussdCode)
        setIsMtnUssdModalOpen(true)
      }

      attemptDialerRedirect(ussdCode)
      return
    }

    // 2. Direct WhatsApp link from response
    if (data.whatsapp_link) {
      window.open(data.whatsapp_link, "_blank", "noopener,noreferrer")
      return
    }

    // 3. Direct Transaction link from response
    if (data.transaction_link) {
        window.open(data.transaction_link, "_blank", "noopener,noreferrer")
        return
    }

    // 4. Fallback Manual Logic for Connect API
    const txNetwork = networks?.find(n => n.id === data.network) || selectedNetwork
    if (txNetwork) {
        const networkName = txNetwork.name?.toLowerCase() || ""
        const isConnect = txNetwork.withdrawal_api?.toLowerCase() === "connect"
        const txAmount = data.amount || amount

        if (isConnect) {
            if (networkName.includes("moov")) {
                const handled = await handleMoovUssdFlow(txAmount, txNetwork)
                if (handled) return
            } else if (networkName.includes("mtn")) {
                const handled = await handleMtnUssdFlow(txNetwork)
                if (handled) return
            }
        }
    }

    // 5. Final fallback
    if (data.id) {
       router.push(`/dashboardv2/history/${data.id}`)
    } else {
       router.push("/dashboardv2")
    }
  }

  const handleMoovUssdFlow = async (amountValue?: number, network?: Network | null) => {
    const activeNetwork = network || selectedNetwork
    const activeAmount = amountValue ?? amount

    if (!activeNetwork || activeNetwork.name?.toLowerCase() !== "moov") {
      return false
    }

    if (!activeNetwork.withdrawal_api || activeNetwork.withdrawal_api.toLowerCase() !== "connect") {
      return false
    }

    try {
      const settings = await settingsApi.get()
      const moovPhone = settings.moov_merchant_phone || settings.moov_marchand_phone

      if (!moovPhone) {
        return false
      }

      const ussdAmount = Math.max(1, Math.floor(amount))
      const ussdCode = `*155*1*1*${moovPhone}*${ussdAmount}#`

      console.log("Generated Moov USSD code:", ussdCode)

      setMoovMerchantPhone(moovPhone)
      setMoovUssdCode(ussdCode)
      setIsMoovUssdModalOpen(true)

      attemptDialerRedirect(ussdCode)

      return true
    } catch (error) {
      console.error("Erreur lors de la récupération des paramètres Moov:", error)
      return false
    }
  }

  const handleMtnUssdFlow = async (network?: Network | null) => {
    const activeNetwork = network || selectedNetwork
    if (!activeNetwork || activeNetwork.name?.toLowerCase() !== "mtn") {
      return false
    }

    if (!activeNetwork.withdrawal_api || activeNetwork.withdrawal_api.toLowerCase() !== "connect") {
      return false
    }

    try {
      const settings = await settingsApi.get()
      const mtnPhone = settings.mtn_marchand_phone

      if (!mtnPhone) {
        return false
      }

      const ussdCode = `*133*7*${mtnPhone}#`

      console.log("Generated MTN USSD code:", ussdCode)

      setMtnMerchantPhone(mtnPhone)
      setMtnUssdCode(ussdCode)
      setIsMtnUssdModalOpen(true)

      attemptDialerRedirect(ussdCode)

      return true
    } catch (error) {
      console.error("Erreur lors de la génération du code USSD MTN:", error)
      return false
    }
  }

  const handleCopyUssdCode = async () => {
    if (!moovUssdCode) return

    try {
      await navigator.clipboard.writeText(moovUssdCode)
      toast.success("Code USSD copié")
    } catch (error) {
      console.error("Impossible de copier le code USSD:", error)
      toast.error("Copie impossible, copiez manuellement le code.")
    }
  }

  const handleCopyMtnUssdCode = async () => {
    if (!mtnUssdCode) return

    try {
      await navigator.clipboard.writeText(mtnUssdCode)
      toast.success("Code USSD copié")
    } catch (error) {
      console.error("Impossible de copier le code USSD:", error)
      toast.error("Copie impossible, copiez manuellement le code.")
    }
  }

  const handleMoovModalClose = (open: boolean) => {
    if (!open) {
      setIsMoovUssdModalOpen(false)
      router.push("/dashboardv2")
    } else {
      setIsMoovUssdModalOpen(true)
    }
  }

  const handleMtnModalClose = (open: boolean) => {
    if (!open) {
      setIsMtnUssdModalOpen(false)
      router.push("/dashboardv2")
    } else {
      setIsMtnUssdModalOpen(true)
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
        phone_number: selectedPhone!.phone,
        app: selectedPlatform!.id,
        user_app_id: selectedBetId!.user_app_id,
        network: selectedNetwork!.id,
        withdriwal_code: withdriwalCode,
        source: "web"
      })

      handleTransactionSuccess(response, false)
    } catch (error: any) {
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
        if (hasHelpStep) return true
        return amount > 0 && selectedPlatform &&
          withdriwalCode.length >= 4 &&
          amount >= selectedPlatform.minimun_with &&
          amount <= selectedPlatform.max_win
      case 6:
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
    <>
      <AppBar />
      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 sm:pt-8 pb-8 sm:pb-4">
        <div className="w-full max-w-md">
          {lastTransaction ? (
            <div className="mb-6">
              <LastTransactionSummary
                transaction={lastTransaction}
                expectedType="withdrawal"
                actionType={actionType}
                onCancel={cancel}
                onFinalize={async (reference) => {
                  const data = await finalize(reference)
                  if (data) {
                    handleTransactionSuccess(data, true)
                  }
                }}
                afterFinalizeHref="/dashboardv2/history"
                onContinue={undefined}
              />
            </div>
          ) : null}

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboardv2")}
                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Retrait</h1>
            </div>
            
            <TransactionProgressBar 
              currentStep={currentStep} 
              totalSteps={totalSteps} 
              type="withdrawal" 
            />
          </div>

          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-lg mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 bg-emerald-500" />
            <div className="relative">
              {renderCurrentStep()}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="flex-1 h-12 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition-all duration-300"
              >
                Précédent
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!isStepValid() || isSubmitting}
              className={`flex-1 h-12 rounded-xl font-semibold transition-all duration-300 ${
                currentStep === totalSteps
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-500/50 text-white"
                  : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-500/50 text-white"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Traitement...
                </>
              ) : currentStep === totalSteps ? (
                "Confirmer"
              ) : (
                "Suivant"
              )}
            </Button>
          </div>

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

          <Dialog open={isMoovUssdModalOpen} onOpenChange={handleMoovModalClose}>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Finaliser le retrait Moov</DialogTitle>
                <DialogDescription asChild>
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-3 mt-4">
                    <p>
                      Nous n&apos;avons pas pu ouvrir automatiquement le composeur téléphonique. Copiez le code ci-dessous et collez-le dans l&apos;application Téléphone.
                    </p>
                    {moovMerchantPhone && (
                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Numéro marchand</p>
                        <p className="font-mono font-semibold text-slate-900 dark:text-white">{moovMerchantPhone}</p>
                      </div>
                    )}
                    {moovUssdCode ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">Code USSD à composer :</p>
                        <div className="flex items-center gap-2">
                          <Input
                            value={moovUssdCode}
                            readOnly
                            className="font-mono text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleCopyUssdCode}
                            className="rounded-xl"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Impossible de générer le code USSD. Veuillez réessayer.
                      </p>
                    )}
                  </div>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  onClick={() => handleMoovModalClose(false)}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-500/50 text-white rounded-xl w-full"
                >
                  J&apos;ai compris
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isMtnUssdModalOpen} onOpenChange={handleMtnModalClose}>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Finaliser le retrait MTN</DialogTitle>
                <DialogDescription asChild>
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-3 mt-4">
                    <p>
                      Nous n&apos;avons pas pu ouvrir automatiquement le composeur téléphonique. Copiez le code ci-dessous et collez-le dans l&apos;application Téléphone.
                    </p>
                    {mtnMerchantPhone && (
                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Numéro marchand</p>
                        <p className="font-mono font-semibold text-slate-900 dark:text-white">{mtnMerchantPhone}</p>
                      </div>
                    )}
                    {mtnUssdCode ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">Code USSD à composer :</p>
                        <div className="flex items-center gap-2">
                          <Input
                            value={mtnUssdCode}
                            readOnly
                            className="font-mono text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleCopyMtnUssdCode}
                            className="rounded-xl"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Impossible de générer le code USSD. Veuillez réessayer.
                      </p>
                    )}
                  </div>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  onClick={() => handleMtnModalClose(false)}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-500/50 text-white rounded-xl w-full"
                >
                  J&apos;ai compris
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  )
}
