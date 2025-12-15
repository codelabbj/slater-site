"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SafeImage } from "@/components/ui/safe-image"
import { Loader2, Plus, Check } from "lucide-react"
import { platformApi } from "@/lib/api-client"
import type { Platform } from "@/lib/types"
import { toast } from "react-hot-toast"

interface PlatformStepProps {
  selectedPlatform: Platform | null
  onSelect: (platform: Platform) => void
  onNext: () => void
}

export function PlatformStep({ selectedPlatform, onSelect, onNext }: PlatformStepProps) {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const data = await platformApi.getAll()
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
  }, [])

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
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          Choisir une plateforme
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Sélectionnez la plateforme de jeu où vous souhaitez effectuer votre transaction
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          {platforms.map((platform) => (
            <Card
              key={platform.id}
            className={`cursor-pointer transition-all duration-300 hover:shadow-xl overflow-hidden group ${
                selectedPlatform?.id === platform.id
                ? "ring-2 ring-primary bg-primary/5 shadow-lg shadow-primary/20"
                : "hover:bg-primary/5 hover:ring-1 hover:ring-primary/30"
              }`}
              onClick={() => {
                onSelect(platform)
                // Auto-advance to next step after a short delay
                setTimeout(() => {
                  onNext()
                }, 300)
              }}
            >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <SafeImage
                    src={platform.image}
                    alt={platform.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border-2 border-border group-hover:border-primary/30 transition-colors"
                    fallbackText={platform.name.charAt(0).toUpperCase()}
                  />
                  {selectedPlatform?.id === platform.id && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors">
                      {platform.name}
                    </h3>
                    {(platform.city || platform.street) && (
                      <div className="text-xs sm:text-sm text-muted-foreground space-y-0.5">
                        {platform.city && (
                          <p className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                            {platform.city}
                          </p>
                        )}
                        {platform.street && (
                          <p className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                            {platform.street}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-green-500/10 text-green-700 border border-green-500/20 text-xs font-semibold px-2 py-1">
                        Min: {platform.minimun_deposit.toLocaleString()} FCFA
                      </Badge>
                    {platform.maximum_deposit && (
                      <Badge className="bg-blue-500/10 text-blue-700 border border-blue-500/20 text-xs font-semibold px-2 py-1">
                        Max: {platform.maximum_deposit.toLocaleString()} FCFA
                      </Badge>
                    )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {platforms.length === 0 && (
          <div className="text-center py-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <p className="text-foreground font-semibold">Aucune plateforme disponible</p>
          <p className="text-sm text-muted-foreground mt-1">
            Les plateformes seront bientôt disponibles
          </p>
          </div>
        )}
    </div>
  )
}
