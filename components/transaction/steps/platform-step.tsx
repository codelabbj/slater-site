"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { SafeImage } from "@/components/ui/safe-image"
import { Loader2, Plus, Check } from "lucide-react"
import { platformApi } from "@/lib/api-client"
import type { Platform } from "@/lib/types"
import { toast } from "react-hot-toast"

interface PlatformStepProps {
  selectedPlatform: Platform | null
  onSelect: (platform: Platform) => void
  onNext: () => void
  type: "deposit" | "withdrawal"
}

export function PlatformStep({ selectedPlatform, onSelect, onNext, type }: PlatformStepProps) {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const data = await platformApi.getAll(type)
        // Filter only enabled platforms
        const enabledPlatforms = data.filter(platform => platform.enable)
        setPlatforms(enabledPlatforms)
      } catch (error) {
        toast.error("Erreur lors du chargement des plateformes")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlatforms()
  }, [type])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Chargement des plateformes...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">
          Choisir une plateforme
        </h2>
        <p className="text-xs text-muted-foreground">
          Sélectionnez la plateforme de jeu pour votre transaction
        </p>
      </div>

      <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={`cursor-pointer transition-all duration-200 rounded-lg border overflow-hidden group ${selectedPlatform?.id === platform.id
              ? "ring-2 ring-primary bg-primary/5 border-primary"
              : "hover:bg-muted/50 hover:border-primary/50 border-border"
              }`}
            onClick={() => {
              onSelect(platform)
              setTimeout(() => {
                onNext()
              }, 300)
            }}
          >
            <div className="p-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <SafeImage
                    src={platform.image}
                    alt={platform.name}
                    className="w-12 h-12 object-cover rounded border border-border group-hover:border-primary/30 transition-colors"
                    fallbackText={platform.name.charAt(0).toUpperCase()}
                  />
                  {selectedPlatform?.id === platform.id && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {platform.name}
                  </h3>
                  {(platform.city || platform.street) && (
                    <div className="text-[10px] text-muted-foreground mt-0.5 space-y-0.5">
                      {platform.city && (
                        <p className="truncate">{platform.city}</p>
                      )}
                      {platform.street && (
                        <p className="truncate">{platform.street}</p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="inline-flex items-center bg-green-500/10 text-green-700 border border-green-500/20 text-[10px] font-medium px-1.5 py-0.5 rounded">
                      Min: {platform.minimun_deposit.toLocaleString()}
                    </span>
                    {platform.max_deposit && (
                      <span className="inline-flex items-center bg-blue-500/10 text-blue-700 border border-blue-500/20 text-[10px] font-medium px-1.5 py-0.5 rounded">
                        Max: {platform.max_deposit.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {platforms.length === 0 && (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-muted mb-3">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Aucune plateforme disponible</p>
          <p className="text-xs text-muted-foreground mt-1">
            Les plateformes seront bientôt disponibles
          </p>
        </div>
      )}
    </div>
  )
}
