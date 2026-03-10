"use client"

import { useState } from "react"
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
import { ConfirmationDialog } from "@/components/transaction/confirmation-dialog"
import { transactionApi, settingsApi } from "@/lib/api-client"
import type { Platform, UserAppId, Network, UserPhone } from "@/lib/types"
import { toast } from "react-hot-toast"
import { extractTimeErrorMessage } from "@/lib/utils"
import { ArrowLeft, Copy, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function WithdrawalV2Page() {
  const router = useRouter()
  const { user } = useAuth()

  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5

  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedBetId, setSelectedBetId] = useState<UserAppId | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [selectedPhone, setSelectedPhone] = useState<UserPhone | null>(null)
  const [amount, setAmount] = useState(0)
  const [withdriwalCode, setWithdriwalCode] = useState("")

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isMoovUssdModalOpen, setIsMoovUssdModalOpen] = useState(false)
  const [moovUssdCode, setMoovUssdCode] = useState<string | null>(null)
  const [moovMerchantPhone, setMoovMerchantPhone] = useState<string | null>(null)
  const [isMtnUssdModalOpen, setIsMtnUssdModalOpen] = useState(false)
  const [mtnUssdCode, setMtnUssdCode] = useState<string | null>(null)
  const [mtnMerchantPhone, setMtnMerchantPhone] = useState<string | null>(null)

  if (!user) {
    router.push("/loginv2")
    return null
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsConfirmationOpen(true)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const attemptDialerRedirect = (ussdCode: string) => {
    try {
      console.log("Attempting to dial USSD code:", ussdCode)

      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        console.log("Using mobile dialing method")
        window.location.href = `tel:${ussdCode}`
      } else {
        console.log("Using desktop dialing method")
        const link = document.createElement("a")
        link.href = `tel:${ussdCode}`
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

  const handleMoovUssdFlow = async () => {
    if (!selectedNetwork || selectedNetwork.name?.toLowerCase() !== "moov") {
      return false
    }

    if (!selectedNetwork.withdrawal_api || selectedNetwork.withdrawal_api.toLowerCase() !== "connect") {
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

  const handleMtnUssdFlow = async () => {
    if (!selectedNetwork || selectedNetwork.name?.toLowerCase() !== "mtn") {
      return false
    }

    if (!selectedNetwork.withdrawal_api || selectedNetwork.withdrawal_api.toLowerCase() !== "connect") {
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
      await transactionApi.createWithdrawal({
        amount,
        phone_number: selectedPhone.phone,
        app: selectedPlatform.id,
        user_app_id: selectedBetId.user_app_id,
        network: selectedNetwork.id,
        withdriwal_code: withdriwalCode,
        source: "web"
      })

      toast.success("Retrait initié avec succès!")

      if (selectedNetwork?.name?.toLowerCase() === "mtn" &&
        selectedNetwork.withdrawal_api?.toLowerCase() === "connect") {
        if (selectedNetwork.payment_by_link === false) {
          const handled = await handleMtnUssdFlow()
          if (!handled) {
            router.push("/dashboardv2")
          }
        } else {
          router.push("/dashboardv2")
        }
      } else {
        const handled = await handleMoovUssdFlow()
        if (!handled) {
          router.push("/dashboardv2")
        }
      }
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
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/dashboardv2")}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Retrait</h1>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Étape {currentStep}/{totalSteps}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
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
