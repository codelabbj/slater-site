"use client"

import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "react-hot-toast"
import type { Transaction } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function LastTransactionSummary(props: {
  transaction: Transaction
  expectedType: Transaction["type_trans"]
  actionType: "cancel" | "finalize" | null
  onCancel: (reference: string) => Promise<any>
  onFinalize: (reference: string) => Promise<any>
  afterFinalizeHref: string
  onContinue?: (transaction: Transaction) => void
}) {
  const router = useRouter()

  const { transaction, expectedType, actionType, onCancel, onFinalize, afterFinalizeHref } = props

  if (transaction.type_trans !== expectedType) return null

  const isDeposit = transaction.type_trans === "deposit"

  return (
    <Card className="border-2 border-primary/20 bg-primary/5 shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 rounded-2xl sm:rounded-3xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Transaction en cours
            </CardTitle>
            <CardDescription>Vous avez une transaction en attente</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Référence</p>
            <p className="text-sm font-mono font-bold text-primary">#{transaction.reference}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Row 1 */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{isDeposit ? "Plateforme" : "Type"}</p>
            <div className="flex items-center gap-2">
              {isDeposit ? (
                <>
                  {transaction.app_details?.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={transaction.app_details.image} alt="" className="w-5 h-5 object-contain" />
                  )}
                  <p className="font-semibold text-sm">{transaction.app_details?.name || transaction.app}</p>
                </>
              ) : (
                <p className="font-semibold text-sm capitalize">Retrait</p>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Montant</p>
            <p className="font-bold text-base text-primary">
              {transaction.amount.toLocaleString()} <span className="text-xs">FCFA</span>
            </p>
          </div>

          {/* Row 2 */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{isDeposit ? "ID Utilisateur" : "Plateforme"}</p>
            {isDeposit ? (
              <p className="font-semibold text-sm font-mono">{transaction.user_app_id}</p>
            ) : (
              <div className="flex items-center gap-2">
                {transaction.app_details?.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={transaction.app_details.image} alt="" className="w-5 h-5 object-contain" />
                )}
                <p className="font-semibold text-sm">{transaction.app_details?.name || transaction.app}</p>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Téléphone</p>
            <p className="font-semibold text-sm">{transaction.phone_number}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10"
              onClick={async () => {
                try {
                  await onCancel(transaction.reference)
                  toast.success("Transaction annulée")
                } catch {
                  toast.error("Erreur lors de l'annulation")
                }
              }}
              disabled={actionType !== null}
            >
              {actionType === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Annuler"}
            </Button>
            <Button
              className="flex-1 h-12 rounded-xl bg-primary shadow-lg shadow-primary/20"
              onClick={async () => {
                try {
                  const result = await onFinalize(transaction.reference)
                  
                  // Navigate to the transaction detail page if we have an ID
                  if (result && result.id) {
                    const path = afterFinalizeHref.startsWith("/dashboardv2") 
                      ? `/dashboardv2/history/${result.id}` 
                      : `/dashboard/history/${result.id}`
                    router.push(path)
                  } else {
                    router.push(afterFinalizeHref)
                  }
                  toast.success("Transaction finalisée")
                } catch {
                  toast.error("Erreur lors de la finalisation")
                }
              }}
              disabled={actionType !== null}
            >
              {actionType === "finalize" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finaliser"}
            </Button>
          </div>

        </div>
      </CardContent>
    </Card>
  )
}
