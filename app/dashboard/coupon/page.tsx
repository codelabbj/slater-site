"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Ticket, Copy, Check, ArrowLeft } from "lucide-react"
import { couponApi, platformApi } from "@/lib/api-client"
import type { Coupon, Platform } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function CouponPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    fetchCoupons()
    fetchPlatforms()
  }, [])

  // Refetch data when the page gains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchCoupons()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const fetchPlatforms = async () => {
    try {
      const data = await platformApi.getAll()
      setPlatforms(data)
    } catch (error) {
      console.error("Error fetching platforms:", error)
    }
  }

  const fetchCoupons = async () => {
    setIsLoading(true)
    try {
      const data = await couponApi.getAll(1)
      setCoupons(data.results)
    } catch (error) {
      console.error("Error fetching coupons:", error)
      toast.error("Erreur lors du chargement des coupons")
    } finally {
      setIsLoading(false)
    }
  }

  const getPlatformName = (betAppId: string) => {
    const platform = platforms.find((p) => p.id === betAppId)
    return platform?.name || "Plateforme inconnue"
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success("Code copié dans le presse-papiers")
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Veuillez vous connecter pour voir vos coupons</p>
      </div>
    )
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
                  className="flex items-center gap-2 h-10 w-10 rounded-xl hover:bg-primary/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
        <div>
                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/15 text-primary glow-primary">
                      <Ticket className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
            Mes Coupons
          </h1>
                  <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl">
                    Gérez vos codes promotionnels et coupons exclusifs.
          </p>
        </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Loading State */}
        {isLoading ? (
        <Card className="glass-panel rounded-2xl sm:rounded-3xl">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Coupons List */}
            {coupons.length > 0 ? (
              <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold section-title flex items-center gap-2">
                <div className="w-1.5 h-6 bg-primary rounded-full" />
                Mes coupons
              </h2>
              <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {coupons.map((coupon) => (
                  <Card key={coupon.id} className="glass-panel hover:shadow-xl transition-all duration-300 border-primary/10 rounded-2xl sm:rounded-3xl overflow-hidden group">
                    <CardHeader className="p-5 sm:p-6 relative">
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs font-semibold px-2 py-1">
                          Coupon
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0 mt-2">
                        <CardTitle className="text-lg sm:text-xl break-words font-mono font-bold text-foreground mb-2">
                              {coupon.code}
                            </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                              {getPlatformName(coupon.bet_app)}
                            </CardDescription>
                        </div>
                      </CardHeader>
                    <CardContent className="p-5 sm:p-6 pt-0 space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Créé le:</span>
                          <span className="font-medium">
                            {format(new Date(coupon.created_at), "dd MMM yyyy", { locale: fr })}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                        className="w-full h-10 text-sm font-semibold border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-colors"
                          onClick={() => copyToClipboard(coupon.code)}
                        >
                          {copiedCode === coupon.code ? (
                            <>
                            <Check className="mr-2 h-4 w-4 text-green-600" />
                              Copié
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Copier le code
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
            <Card className="glass-panel rounded-2xl sm:rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                  <Ticket className="h-8 w-8 text-primary" />
                </div>
                <p className="text-foreground font-semibold">Aucun coupon disponible</p>
                <p className="text-sm text-muted-foreground mt-1">
                    Vos coupons apparaîtront ici
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
    </div>
  )
}

