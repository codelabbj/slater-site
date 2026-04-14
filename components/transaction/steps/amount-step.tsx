"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Youtube } from "lucide-react"
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
      <div className="flex items-center justify-center py-12">
        <p className="text-xs text-muted-foreground">Veuillez compléter les étapes précédentes</p>
      </div>
    )
  }

  const minAmount = type === "deposit" ? selectedPlatform.minimun_deposit : selectedPlatform.minimun_with
  const maxAmount = type === "deposit" ? selectedPlatform.max_deposit : selectedPlatform.max_win

  return (
    <div className="space-y-3">
      {/* Transaction Summary */}
      <div className="rounded-lg border border-border bg-card p-3">
        <h3 className="text-sm font-semibold mb-2">Résumé</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center gap-2">
            <span className="text-muted-foreground">Type</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${type === "deposit" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              {type === "deposit" ? "Dépôt" : "Retrait"}
            </span>
          </div>

          <div className="h-px bg-border" />

          <div className="flex justify-between items-center gap-2">
            <span className="text-muted-foreground">Plateforme</span>
            <span className="font-medium text-right break-words">{selectedPlatform.name}</span>
          </div>

          {selectedPlatform.city && (
            <div className="flex justify-between items-center gap-2">
              <span className="text-muted-foreground">Ville</span>
              <span className="font-medium text-right break-words">{selectedPlatform.city}</span>
            </div>
          )}

          {selectedPlatform.street && (
            <div className="flex justify-between items-center gap-2">
              <span className="text-muted-foreground">Rue</span>
              <span className="font-medium text-right break-words">{selectedPlatform.street}</span>
            </div>
          )}

          <div className="flex justify-between items-center gap-2">
            <span className="text-muted-foreground">ID de pari</span>
            <span className="font-medium text-right break-all">{selectedBetId.user_app_id}</span>
          </div>

          <div className="flex justify-between items-center gap-2">
            <span className="text-muted-foreground">Réseau</span>
            <span className="font-medium text-right break-words">{selectedNetwork.public_name}</span>
          </div>

          <div className="flex justify-between items-center gap-2">
            <span className="text-muted-foreground">Téléphone</span>
            <span className="font-medium text-right break-all">{formatPhoneNumberForDisplay(selectedPhone.phone)}</span>
          </div>
        </div>
      </div>

      {/* Network Message */}
      {selectedNetwork && (() => {
        const message = type === "deposit"
          ? selectedNetwork.deposit_message
          : selectedNetwork.withdrawal_message

        if (!message || message.trim() === "") return null

        return (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs text-foreground whitespace-pre-wrap break-words">
              {message}
            </p>
          </div>
        )
      })()}

      {/* Amount Input */}
      <div className="rounded-lg border border-border bg-card p-3">
        <h3 className="text-sm font-semibold mb-2">Montant</h3>
        <div className="space-y-2">
          <div>
            <Input
              id="amount"
              type="number"
              value={amount || ""}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Entrez le montant"
              className={`h-9 text-sm ${errors.amount ? "border-red-500" : ""}`}
            />
            {errors.amount && (
              <p className="text-[10px] text-red-500 mt-1 break-words">{errors.amount}</p>
            )}
          </div>

          {amount > 0 && (
            <div className="p-2 bg-muted rounded">
              <p className="text-[10px] text-muted-foreground">Montant saisi:</p>
              <p className="text-sm font-semibold break-words">
                {amount.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "XOF",
                  minimumFractionDigits: 0,
                })}
              </p>
            </div>
          )}

          {type === "deposit" && selectedPlatform?.deposit_tuto_link && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full border-primary/20 hover:bg-primary/5"
            >
              <a href={selectedPlatform.deposit_tuto_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5">
                <Youtube className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs">Comment déposer ?</span>
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Withdrawal Code (only for withdrawals) */}
      {type === "withdrawal" && (
        <div className="rounded-lg border border-border bg-card p-3">
          <h3 className="text-sm font-semibold mb-2">Code de retrait</h3>
          <div className="space-y-2">
            <div>
              <Input
                id="withdriwalCode"
                type="text"
                value={withdriwalCode}
                onChange={(e) => handleWithdriwalCodeChange(e.target.value)}
                placeholder="Entrez votre code de retrait"
                className={`h-9 text-sm ${errors.withdriwalCode ? "border-red-500" : ""}`}
              />
              {errors.withdriwalCode && (
                <p className="text-[10px] text-red-500 mt-1 break-words">{errors.withdriwalCode}</p>
              )}
            </div>

            {selectedPlatform && (
              <div className="flex flex-col gap-1.5">
                {selectedPlatform.withdrawal_tuto_link && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full border-primary/20 hover:bg-primary/5"
                  >
                    <a href={selectedPlatform.withdrawal_tuto_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5">
                      <Youtube className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-xs">Comment retirer ?</span>
                    </a>
                  </Button>
                )}
                {selectedPlatform.why_withdrawal_fail && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full border-primary/20 hover:bg-primary/5"
                  >
                    <a href={selectedPlatform.why_withdrawal_fail} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5">
                      <Youtube className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-xs">Pourquoi le retrait échoue ?</span>
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Terms and Conditions Checkbox */}
      <div className="flex items-start space-x-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
        <Checkbox
          id="terms"
          checked={isAccepted}
          onCheckedChange={(checked) => setIsAccepted(checked === true)}
          className="mt-0.5"
        />
        <label
          htmlFor="terms"
          className="text-xs leading-relaxed text-muted-foreground cursor-pointer select-none"
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
      <div className="flex justify-end pt-1">
        <Button
          onClick={onNext}
          disabled={!isFormValid()}
          size="sm"
          className="w-full sm:w-auto min-w-[100px] font-semibold"
        >
          Continuer
        </Button>
      </div>
    </div>
  )
}
