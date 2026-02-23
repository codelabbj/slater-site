"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Youtube } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import type { Platform, UserAppId, Network, UserPhone } from "@/lib/types"
import { formatPhoneNumberForDisplay } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"

interface AmountStepProps {
  amount: number
  setAmount: (amount: number) => void
  withdriwalCode: string
  setWithdriwalCode: (code: string) => void
  selectedPlatform: Platform | null
  selectedBetId: UserAppId | null
  selectedNetwork: Network | null
  selectedPhone: UserPhone | null
  type: "deposit" | "withdrawal"
  onNext: () => void
}

export function AmountStep({
  amount,
  setAmount,
  withdriwalCode,
  setWithdriwalCode,
  selectedPlatform,
  selectedBetId,
  selectedNetwork,
  selectedPhone,
  type,
  onNext
}: AmountStepProps) {
  const [errors, setErrors] = useState<{ amount?: string; withdriwalCode?: string }>({})
  const [isAccepted, setIsAccepted] = useState(false)

  const validateAmount = (value: number) => {
    if (!selectedPlatform) return "Plateforme non sélectionnée"
    if (value <= 0) return "Le montant doit être supérieur à 0"

    const minAmount = type === "deposit" ? selectedPlatform.minimun_deposit : selectedPlatform.minimun_with
    const maxAmount = type === "deposit" ? selectedPlatform.max_deposit : selectedPlatform.max_win

    if (value < minAmount) return `Le montant minimum est ${minAmount.toLocaleString()} FCFA`
    if (value > maxAmount) return `Le montant maximum est ${maxAmount.toLocaleString()} FCFA`

    return null
  }

  const validateWithdriwalCode = (code: string) => {
    if (type === "withdrawal" && code.length < 4) {
      return "Le code de retrait doit contenir au moins 4 caractères"
    }
    return null
  }

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    setAmount(numValue)

    const error = validateAmount(numValue)
    setErrors(prev => ({ ...prev, amount: error || undefined }))
  }

  const handleWithdriwalCodeChange = (value: string) => {
    setWithdriwalCode(value)

    const error = validateWithdriwalCode(value)
    setErrors(prev => ({ ...prev, withdriwalCode: error || undefined }))
  }

  const isFormValid = () => {
    const amountError = validateAmount(amount)
    const withdriwalCodeError = type === "withdrawal" ? validateWithdriwalCode(withdriwalCode) : null

    return !amountError && !withdriwalCodeError &&
      selectedPlatform && selectedBetId && selectedNetwork && selectedPhone && isAccepted
  }

  if (!selectedPlatform || !selectedBetId || !selectedNetwork || !selectedPhone) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Veuillez compléter les étapes précédentes</p>
        </CardContent>
      </Card>
    )
  }

  const minAmount = type === "deposit" ? selectedPlatform.minimun_deposit : selectedPlatform.minimun_with
  const maxAmount = type === "deposit" ? selectedPlatform.max_deposit : selectedPlatform.max_win

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Transaction Summary */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Résumé de la transaction</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Type</span>
            <Badge variant={type === "deposit" ? "default" : "secondary"} className="text-xs sm:text-sm">
              {type === "deposit" ? "Dépôt" : "Retrait"}
            </Badge>
          </div>

          <Separator />

          <div className="flex justify-between items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Plateforme</span>
            <span className="font-medium text-xs sm:text-sm text-right break-words">{selectedPlatform.name}</span>
          </div>

          {selectedPlatform.city && (
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Ville</span>
              <span className="font-medium text-xs sm:text-sm text-right break-words">
                {selectedPlatform.city}
              </span>
            </div>
          )}

          {selectedPlatform.street && (
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Rue</span>
              <span className="font-medium text-xs sm:text-sm text-right break-words">
                {selectedPlatform.street}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">ID de pari</span>
            <span className="font-medium text-xs sm:text-sm text-right break-all">{selectedBetId.user_app_id}</span>
          </div>

          <div className="flex justify-between items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Réseau</span>
            <span className="font-medium text-xs sm:text-sm text-right break-words">{selectedNetwork.public_name}</span>
          </div>

          <div className="flex justify-between items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Téléphone</span>
            <span className="font-medium text-xs sm:text-sm text-right break-all">{formatPhoneNumberForDisplay(selectedPhone.phone)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Network Message */}
      {selectedNetwork && (() => {
        const message = type === "deposit"
          ? selectedNetwork.deposit_message
          : selectedNetwork.withdrawal_message

        if (!message || message.trim() === "") return null

        return (
          <Card className="overflow-hidden border-primary/20 bg-primary/5">
            <CardContent className="p-4 sm:p-6">
              <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap break-words">
                {message}
              </p>
            </CardContent>
          </Card>
        )
      })()}

      {/* Amount Input */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl">Montant de la transaction</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Input
                id="amount"
                type="number"
                value={amount || ""}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Entrez le montant"
                className={`h-11 sm:h-10 text-base sm:text-sm ${errors.amount ? "border-red-500" : ""}`}
              />
              {errors.amount && (
                <p className="text-xs sm:text-sm text-red-500 mt-1 break-words">{errors.amount}</p>
              )}
            </div>

            {amount > 0 && (
              <div className="p-3 bg-muted ">
                <p className="text-xs sm:text-sm text-muted-foreground">Montant saisi:</p>
                <p className="text-base sm:text-lg font-semibold break-words">
                  {amount.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "XOF",
                    minimumFractionDigits: 0,
                  })}
                </p>
              </div>
            )}

            {type === "deposit" && selectedPlatform?.deposit_tuto_link && (
              <div className="pt-2">
                <Button
                  asChild
                  variant="outline"
                  className="w-full sm:w-auto h-10 text-sm sm:text-base border-primary/20 hover:bg-primary/5"
                >
                  <a href={selectedPlatform.deposit_tuto_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                    <Youtube className="h-4 w-4 text-red-500" />
                    Comment déposer ?
                  </a>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Code (only for withdrawals) */}
      {type === "withdrawal" && (
        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Code de retrait</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div>
              <Input
                id="withdriwalCode"
                type="text"
                value={withdriwalCode}
                onChange={(e) => handleWithdriwalCodeChange(e.target.value)}
                placeholder="Entrez votre code de retrait"
                className={`h-11 sm:h-10 text-base sm:text-sm ${errors.withdriwalCode ? "border-red-500" : ""}`}
              />
              {errors.withdriwalCode && (
                <p className="text-xs sm:text-sm text-red-500 mt-1 break-words">{errors.withdriwalCode}</p>
              )}
            </div>

            {selectedPlatform && (
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                {selectedPlatform.withdrawal_tuto_link && (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full sm:w-auto flex-1 h-10 text-sm sm:text-base border-primary/20 hover:bg-primary/5"
                  >
                    <a href={selectedPlatform.withdrawal_tuto_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      <Youtube className="h-4 w-4 text-red-500" />
                      Comment retirer ?
                    </a>
                  </Button>
                )}
                {selectedPlatform.why_withdrawal_fail && (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full sm:w-auto flex-1 h-10 text-sm sm:text-base border-primary/20 hover:bg-primary/5"
                  >
                    <a href={selectedPlatform.why_withdrawal_fail} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      <Youtube className="h-4 w-4 text-red-500" />
                      Pourquoi le retrait échoue ?
                    </a>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Terms and Conditions Checkbox */}
      <div className="flex items-start space-x-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
        <Checkbox
          id="terms"
          checked={isAccepted}
          onCheckedChange={(checked) => setIsAccepted(checked === true)}
          className="mt-1"
        />
        <label
          htmlFor="terms"
          className="text-sm leading-relaxed text-muted-foreground cursor-pointer select-none"
        >
          En cliquant sur Suivant, vous acceptez nos{" "}
          <Link
            href="/privacy-policy"
            className="font-semibold text-primary hover:underline transition-all"
            target="_blank"
          >
            conditions d&apos;utilisation
          </Link>{" "}
          et confirmez que vous avez plus de 18 ans.
        </label>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={onNext}
          disabled={!isFormValid()}
          className="w-full sm:w-auto min-w-[120px] h-11 sm:h-10 text-sm sm:text-base font-semibold shadow-lg shadow-primary/20"
        >
          Continuer
        </Button>
      </div>
    </div>
  )
}
