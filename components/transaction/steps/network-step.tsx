"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl">Choisir un réseau</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {networks.map((network) => (
            <Card
              key={network.id}
              className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${selectedNetwork?.id === network.id
                  ? `ring-2 ${type === TRANSACTION_TYPES.DEPOSIT ? "ring-deposit bg-green-500/10" : "ring-withdrawal bg-blue-500/10"}`
                  : "hover:bg-muted/50"
                }`}
              onClick={() => {
                onSelect(network)
                // Auto-advance to next step after a short delay
                setTimeout(() => {
                  onNext()
                }, 300)
              }}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <SafeImage
                    src={network.image}
                    alt={network.name}
                    className="w-10 h-10 sm:w-12 sm:h-12  object-cover flex-shrink-0"
                    fallbackText={network.public_name.charAt(0).toUpperCase()}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{network.public_name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{network.name}</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
                      {network.active_for_deposit && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs whitespace-nowrap">
                          {getTransactionTypeLabel(TRANSACTION_TYPES.DEPOSIT)}
                        </Badge>
                      )}
                      {network.active_for_with && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs whitespace-nowrap">
                          {getTransactionTypeLabel(TRANSACTION_TYPES.WITHDRAWAL)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {networks.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground break-words">
              Aucun réseau disponible pour {type === TRANSACTION_TYPES.DEPOSIT ? "les dépôts" : "les retraits"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
