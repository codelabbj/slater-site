"use client"

import { useState, useEffect } from "react"
import { SafeImage } from "@/components/ui/safe-image"
import { Loader2 } from "lucide-react"
import { networkApi } from "@/lib/api-client"
import type { Network } from "@/lib/types"
import { TRANSACTION_TYPES, getTransactionTypeLabel } from "@/lib/constants"

interface NetworkStepProps {
  selectedNetwork: Network | null
  onSelect: (network: Network) => void
  onNext: () => void
  type: "deposit" | "withdrawal"
}

export function NetworkStep({ selectedNetwork, onSelect, onNext, type }: NetworkStepProps) {
  const [networks, setNetworks] = useState<Network[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await networkApi.getAll(type)
        // Filter networks based on transaction type
        const activeNetworks = data.filter(network =>
          type === TRANSACTION_TYPES.DEPOSIT ? network.active_for_deposit : network.active_for_with
        )
        setNetworks(activeNetworks)
      } catch (error) {
        console.error("Error fetching networks:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNetworks()
  }, [type])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Choisir un réseau</h2>
        <p className="text-xs text-muted-foreground">
          Sélectionnez votre réseau mobile
        </p>
      </div>

      <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {networks.map((network) => (
          <div
            key={network.id}
            className={`cursor-pointer transition-all duration-200 rounded-lg border overflow-hidden ${selectedNetwork?.id === network.id
                ? "ring-2 ring-primary bg-primary/5 border-primary"
                : "hover:bg-muted/50 hover:border-primary/50 border-border"
              }`}
            onClick={() => {
              onSelect(network)
              setTimeout(() => {
                onNext()
              }, 300)
            }}
          >
            <div className="p-3">
              <div className="flex flex-col items-center gap-2 text-center">
                <SafeImage
                  src={network.image}
                  alt={network.name}
                  className="w-12 h-12 object-cover rounded border border-border"
                  fallbackText={network.public_name.charAt(0).toUpperCase()}
                />
                <div className="w-full">
                  <h3 className="font-semibold text-sm truncate">{network.public_name}</h3>
                  <p className="text-[10px] text-muted-foreground truncate">{network.name}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {networks.length === 0 && (
        <div className="text-center py-8">
          <p className="text-xs text-muted-foreground">
            Aucun réseau disponible pour {type === TRANSACTION_TYPES.DEPOSIT ? "les dépôts" : "les retraits"}
          </p>
        </div>
      )}
    </div>
  )
}
