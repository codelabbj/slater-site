"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Gift, ArrowLeft } from "lucide-react"
import { bonusApi, settingsApi } from "@/lib/api-client"
import type { Bonus } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function BonusPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [referralBonusEnabled, setReferralBonusEnabled] = useState(false)

  useEffect(() => {
    const checkSettings = async () => {
      try {
        const settings = await settingsApi.get()
        const enabled = settings?.referral_bonus === true
        setReferralBonusEnabled(enabled)
        
        if (!enabled) {
          // Redirect to dashboard if referral bonus is disabled
          router.push("/dashboard")
          return
        }
        
        // If enabled, fetch bonuses
        fetchBonuses()
      } catch (error) {
        console.error("Error fetching settings:", error)
        setReferralBonusEnabled(false)
        router.push("/dashboard")
      } finally {
        setIsLoadingSettings(false)
      }
    }
    
    if (user) {
      checkSettings()
    }
  }, [user, router])

  const fetchBonuses = async () => {
    setIsLoading(true)
    try {
      const data = await bonusApi.getAll(1)
      setBonuses(data.results)
    } catch (error) {
      console.error("Error fetching bonuses:", error)
      toast.error("Erreur lors du chargement des bonus")
    } finally {
      setIsLoading(false)
    }
  }

  // Refetch data when the page gains focus
  useEffect(() => {
    if (!referralBonusEnabled) return
    
    const handleFocus = () => {
      fetchBonuses()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [referralBonusEnabled])

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!referralBonusEnabled) {
    return null // Will redirect
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Section */}
      <Card className="border-0 floating-card overflow-hidden rounded-2xl sm:rounded-3xl">
        <CardContent className="p-5 sm:p-6 relative z-10">
          <div className="absolute -top-10 right-2 h-28 w-28 rounded-full bg-primary/20 blur-3xl" />
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 h-10 w-10  hover:bg-primary/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
      <div>
                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:w-14 rounded-2xl bg-primary/15 text-primary glow-primary">
                      <Gift className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
          Mes bonus
        </h1>
                  <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl">
                    Suivez vos récompenses de parrainage et bonus exclusifs.
                  </p>
                </div>
              </div>
            </div>
      </div>
        </CardContent>
      </Card>

      {/* Bonus History */}
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold section-title flex items-center gap-2">
          <div className="w-1.5 h-6 bg-primary rounded-full" />
          Historique des bonus
        </h2>

          {isLoading ? (
          <Card className="glass-panel rounded-2xl sm:rounded-3xl">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
          ) : bonuses.length === 0 ? (
          <Card className="glass-panel rounded-2xl sm:rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                <Gift className="h-8 w-8 text-primary" />
            </div>
              <p className="text-foreground font-semibold">Aucun bonus enregistré</p>
              <p className="text-sm text-muted-foreground mt-1">Vos récompenses apparaîtront ici</p>
            </CardContent>
          </Card>
          ) : (
          <div className="space-y-3 sm:space-y-4">
              {bonuses.map((bonus) => (
              <Card key={bonus.id} className="glass-panel hover:shadow-lg transition-all duration-200 border-primary/10 rounded-2xl sm:rounded-3xl overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-12 h-12  bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30">
                          <Gift className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/15 border border-green-500/20 text-sm font-semibold px-3 py-1">
                            {parseFloat(bonus.amount).toLocaleString("fr-FR", {
                              style: "currency",
                              currency: "XOF",
                              minimumFractionDigits: 0,
                            })}
                          </Badge>
                        </div>
                        <p className="text-sm sm:text-base font-semibold text-foreground mb-1">
                          {bonus.reason_bonus || "Bonus de parrainage"}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {format(new Date(bonus.created_at), "dd MMMM yyyy à HH:mm", {
                            locale: fr,
                          })}
                        </p>
                      </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}

