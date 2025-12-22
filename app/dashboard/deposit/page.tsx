"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { TransactionProgressBar } from "@/components/transaction/progress-bar"
import { ConfirmationDialog } from "@/components/transaction/confirmation-dialog"
import { PlatformStep } from "@/components/transaction/steps/platform-step"
import { BetIdStep } from "@/components/transaction/steps/bet-id-step"
import { NetworkStep } from "@/components/transaction/steps/network-step"
import { PhoneStep } from "@/components/transaction/steps/phone-step"
import { AmountStep } from "@/components/transaction/steps/amount-step"
import { transactionApi, settingsApi } from "@/lib/api-client"
import type { Platform, UserAppId, Network, UserPhone } from "@/lib/types"
import { toast } from "react-hot-toast"
import { extractTimeErrorMessage } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Copy, ArrowDownToLine, ArrowLeft } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function DepositPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5
  
  // Form data
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedBetId, setSelectedBetId] = useState<UserAppId | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [selectedPhone, setSelectedPhone] = useState<UserPhone | null>(null)
  const [amount, setAmount] = useState(0)
  
  // Confirmation dialog
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Transaction link modal
  const [isTransactionLinkModalOpen, setIsTransactionLinkModalOpen] = useState(false)
  const [transactionLink, setTransactionLink] = useState<string | null>(null)
  const [isMoovUssdModalOpen, setIsMoovUssdModalOpen] = useState(false)
  const [moovUssdCode, setMoovUssdCode] = useState<string | null>(null)
  const [moovMerchantPhone, setMoovMerchantPhone] = useState<string | null>(null)
  // const [isOrangeUssdModalOpen, setIsOrangeUssdModalOpen] = useState(false)
  // const [orangeUssdCode, setOrangeUssdCode] = useState<string | null>(null)
  // const [orangeMerchantPhone, setOrangeMerchantPhone] = useState<string | null>(null)
  const [isMtnUssdModalOpen, setIsMtnUssdModalOpen] = useState(false)
  const [mtnUssdCode, setMtnUssdCode] = useState<string | null>(null)
  const [mtnMerchantPhone, setMtnMerchantPhone] = useState<string | null>(null)

  // Redirect if not authenticated
  if (!user) {
    router.push("/login")
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
      const link = document.createElement("a")
      link.href = `tel:${ussdCode}`
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link)
        }
      }, 100)
    } catch (error) {
      console.error("Impossible d'ouvrir automatiquement le composeur:", error)
    }
  }

  const handleMoovUssdFlow = async (amountValue: number) => {
    if (!selectedNetwork || selectedNetwork.name?.toLowerCase() !== "moov") {
      return false
    }

    // Check if deposit_api is "connect"
    if (!selectedNetwork.deposit_api || selectedNetwork.deposit_api.toLowerCase() !== "connect") {
      return false
    }

    try {
      const settings = await settingsApi.get()
      const moovPhone = settings.moov_merchant_phone || settings.moov_marchand_phone

      if (!moovPhone) {
        return false
      }

      const ussdAmount = Math.max(1, Math.floor(amountValue * 0.99))
      const ussdCode = `*155*2*1*${moovPhone}*${ussdAmount}#`

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

  // const handleOrangeUssdFlow = async (amountValue: number) => {
  //   if (!selectedNetwork || selectedNetwork.name?.toLowerCase() !== "orange") {
  //     return false
  //   }

  //   // Check if deposit_api is "connect"
  //   if (!selectedNetwork.deposit_api || selectedNetwork.deposit_api.toLowerCase() !== "connect") {
  //     return false
  //   }

  //   try {
  //     const settings = await settingsApi.get()
  //     const orangePhone = settings.moov_merchant_phone || settings.moov_marchand_phone

  //     if (!orangePhone) {
  //       return false
  //     }

  //     const ussdAmount = Math.max(1, Math.floor(amountValue))
  //     const ussdCode = `*144*2*1*${orangePhone}*${ussdAmount}#`

  //     setOrangeMerchantPhone(orangePhone)
  //     setOrangeUssdCode(ussdCode)
  //     setIsOrangeUssdModalOpen(true)

  //     attemptDialerRedirect(ussdCode)

  //     return true
  //   } catch (error) {
  //     console.error("Erreur lors de la récupération des paramètres Orange:", error)
  //     return false
  //   }
  // }

  const handleMtnUssdFlow = async (amountValue: number) => {
    if (!selectedNetwork || selectedNetwork.name?.toLowerCase() !== "mtn") {
      return false
    }

    // Check if deposit_api is "connect"
    if (!selectedNetwork.deposit_api || selectedNetwork.deposit_api.toLowerCase() !== "connect") {
      return false
    }

    try {
      const ussdCode = `*133*7*0544360901#`

      setMtnMerchantPhone("0544360901")
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

  // const handleCopyOrangeUssdCode = async () => {
  //   if (!orangeUssdCode) return

  //   try {
  //     await navigator.clipboard.writeText(orangeUssdCode)
  //     toast.success("Code USSD copié")
  //   } catch (error) {
  //     console.error("Impossible de copier le code USSD:", error)
  //     toast.error("Copie impossible, copiez manuellement le code.")
  //   }
  // }

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
      // Only navigate to dashboard when user closes the modal
      setIsMoovUssdModalOpen(false)
      router.push("/dashboard")
    } else {
      setIsMoovUssdModalOpen(true)
    }
  }

  // const handleOrangeModalClose = (open: boolean) => {
  //   if (!open) {
  //     // Only navigate to dashboard when user closes the modal
  //     setIsOrangeUssdModalOpen(false)
  //     router.push("/dashboard")
  //   } else {
  //     setIsOrangeUssdModalOpen(true)
  //   }
  // }

  const handleMtnModalClose = (open: boolean) => {
    if (!open) {
      // Only navigate to dashboard when user closes the modal
      setIsMtnUssdModalOpen(false)
      router.push("/dashboard")
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
      const response = await transactionApi.createDeposit({
        amount,
        phone_number: selectedPhone.phone,
        app: selectedPlatform.id,
        user_app_id: selectedBetId.user_app_id,
        network: selectedNetwork.id,
        source: "web"
      })
      
      toast.success("Dépôt initié avec succès!")

      // Check if transaction_link exists in the response
      if (response.transaction_link) {
        setTransactionLink(response.transaction_link)
        setIsTransactionLinkModalOpen(true)
        setIsConfirmationOpen(false)
      } else {
        // Handle Orange network logic - COMMENTED OUT
        // if (selectedNetwork?.name?.toLowerCase() === "orange" &&
        //     selectedNetwork.deposit_api?.toLowerCase() === "connect") {
        //   if (selectedNetwork.payment_by_link === false) {
        //     // Use USSD code for Orange when payment_by_link is false
        //     const handled = await handleOrangeUssdFlow(amount)
        //     if (!handled) {
        //       router.push("/dashboard")
        //     }
        //   } else {
        //     // payment_by_link is true, but no transaction_link in response, redirect to dashboard
        //     router.push("/dashboard")
        //   }
        // } else
        if (selectedNetwork?.name?.toLowerCase() === "mtn" &&
                   selectedNetwork.deposit_api?.toLowerCase() === "connect") {
          if (selectedNetwork.payment_by_link === false) {
            // Use USSD code for MTN when payment_by_link is false
            const handled = await handleMtnUssdFlow(amount)
            if (!handled) {
              router.push("/dashboard")
            }
          } else {
            // payment_by_link is true, but no transaction_link in response, redirect to dashboard
            router.push("/dashboard")
          }
        } else {
          // Handle Moov network or other networks
          const handled = await handleMoovUssdFlow(amount)
          if (!handled) {
            router.push("/dashboard")
          }
        }
      }
    } catch (error: any) {
      // Check for rate limit error (error_time_message)
      const timeErrorMessage = extractTimeErrorMessage(error)
      if (timeErrorMessage) {
        toast.error(timeErrorMessage)
      } else {
        toast.error("Erreur lors de la création du dépôt")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContinueTransaction = async () => {
    if (transactionLink) {
      window.open(transactionLink, "_blank", "noopener,noreferrer")
      setIsTransactionLinkModalOpen(false)
      setTransactionLink(null)
      
      const handled = await handleMoovUssdFlow(amount)
      if (!handled) {
        router.push("/dashboard")
      }
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
               amount >= selectedPlatform.minimun_deposit && 
               amount <= selectedPlatform.max_deposit
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
            type="deposit"
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
            withdriwalCode=""
            setWithdriwalCode={() => {}}
            selectedPlatform={selectedPlatform}
            selectedBetId={selectedBetId}
            selectedNetwork={selectedNetwork}
            selectedPhone={selectedPhone}
            type="deposit"
            onNext={handleNext}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
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
            type="deposit"
          />
        </CardContent>
      </Card>

      {/* Current Step */}
      <Card className="glass-panel rounded-2xl sm:rounded-3xl min-h-[300px] sm:min-h-[350px] lg:min-h-[400px]">
        <CardContent className="p-5 sm:p-6">
          {renderCurrentStep()}
        </CardContent>
      </Card>

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
          }}
          type="deposit"
          platformName={selectedPlatform?.name || ""}
          networkName={selectedNetwork?.public_name || ""}
          isLoading={isSubmitting}
        />

        {/* Transaction Link Modal */}
        <Dialog open={isTransactionLinkModalOpen} onOpenChange={setIsTransactionLinkModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Continuer la transaction</DialogTitle>
              <DialogDescription>
                Cliquez sur continuer pour continuer la transaction
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsTransactionLinkModalOpen(false)
                  setTransactionLink(null)
                  router.push("/dashboard")
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleContinueTransaction}>
                Continuer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Moov USSD fallback modal */}
        <Dialog open={isMoovUssdModalOpen} onOpenChange={handleMoovModalClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Finaliser la transaction Moov</DialogTitle>
              <DialogDescription asChild>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Nous n&apos;avons pas pu ouvrir automatiquement le composeur téléphonique. Copiez le code ci-dessous et collez-le dans l&apos;application Téléphone pour terminer votre transaction Moov.
                  </p>
                  {moovMerchantPhone && (
                    <p>
                      <span className="font-semibold text-foreground">Numéro marchand&nbsp;:</span> {moovMerchantPhone}
                    </p>
                  )}
                  {moovUssdCode ? (
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">Code USSD à composer :</p>
                      <div className="flex items-center gap-2">
                        <Input value={moovUssdCode} readOnly className="font-mono text-sm" />
                        <Button variant="outline" size="icon" onClick={handleCopyUssdCode}>
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Copier le code</span>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Collez ce code dans votre composeur téléphonique et validez pour poursuivre.
                      </p>
                    </div>
                  ) : (
                    <p className="text-destructive text-sm">
                      Impossible de générer le code USSD automatiquement. Veuillez réessayer ou contacter le support.
                    </p>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => handleMoovModalClose(false)}>J&apos;ai compris</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Orange USSD fallback modal - COMMENTED OUT */}
        {/* <Dialog open={isOrangeUssdModalOpen} onOpenChange={handleOrangeModalClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Finaliser la transaction Orange</DialogTitle>
              <DialogDescription asChild>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Nous n&apos;avons pas pu ouvrir automatiquement le composeur téléphonique. Copiez le code ci-dessous et collez-le dans l&apos;application Téléphone pour terminer votre transaction Orange.
                  </p>
                  {orangeMerchantPhone && (
                    <p>
                      <span className="font-semibold text-foreground">Numéro marchand&nbsp;:</span> {orangeMerchantPhone}
                    </p>
                  )}
                  {orangeUssdCode ? (
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">Code USSD à composer :</p>
                      <div className="flex items-center gap-2">
                        <Input value={orangeUssdCode} readOnly className="font-mono text-sm" />
                        <Button variant="outline" size="icon" onClick={handleCopyOrangeUssdCode}>
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Copier le code</span>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Collez ce code dans votre composeur téléphonique et validez pour poursuivre.
                      </p>
                    </div>
                  ) : (
                    <p className="text-destructive text-sm">
                      Impossible de générer le code USSD automatiquement. Veuillez réessayer ou contacter le support.
                    </p>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => handleOrangeModalClose(false)}>J&apos;ai compris</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog> */}

        {/* MTN USSD fallback modal */}
        <Dialog open={isMtnUssdModalOpen} onOpenChange={handleMtnModalClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Finaliser la transaction MTN</DialogTitle>
              <DialogDescription asChild>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Nous n&apos;avons pas pu ouvrir automatiquement le composeur téléphonique. Copiez le code ci-dessous et collez-le dans l&apos;application Téléphone pour terminer votre transaction MTN.
                  </p>
                  {mtnMerchantPhone && (
                    <p>
                      <span className="font-semibold text-foreground">Numéro marchand&nbsp;:</span> {mtnMerchantPhone}
                    </p>
                  )}
                  {mtnUssdCode ? (
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">Code USSD à composer :</p>
                      <div className="flex items-center gap-2">
                        <Input value={mtnUssdCode} readOnly className="font-mono text-sm" />
                        <Button variant="outline" size="icon" onClick={handleCopyMtnUssdCode}>
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Copier le code</span>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Collez ce code dans votre composeur téléphonique et validez pour poursuivre.
                      </p>
                    </div>
                  ) : (
                    <p className="text-destructive text-sm">
                      Impossible de générer le code USSD automatiquement. Veuillez réessayer ou contacter le support.
                    </p>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => handleMtnModalClose(false)}>J&apos;ai compris</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  )
}