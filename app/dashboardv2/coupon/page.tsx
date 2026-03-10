"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AppBar } from "@/components/ui/app-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { couponApi, platformApi } from "@/lib/api-client"
import type { Coupon, Platform } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ArrowLeft, Copy, Check, Loader2, Ticket, Search } from "lucide-react"

export default function CouponV2Page() {
  const router = useRouter()
  const { user } = useAuth()

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([])

  if (!user) {
    router.push("/loginv2")
    return null
  }

  useEffect(() => {
    fetchCoupons()
    fetchPlatforms()
  }, [])

  useEffect(() => {
    const handleFocus = () => {
      fetchCoupons()
    }
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCoupons(coupons)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = coupons.filter(
        (coupon) =>
          coupon.code.toLowerCase().includes(query) ||
          getPlatformName(coupon.bet_app).toLowerCase().includes(query)
      )
      setFilteredCoupons(filtered)
    }
  }, [searchQuery, coupons])

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

  const getPlatformLogo = (betAppId: string) => {
    const platform = platforms.find((p) => p.id === betAppId)
    return platform?.image || null
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success("Code copié dans le presse-papiers")
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <>
      <AppBar />
      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 sm:pt-8 pb-4 sm:pb-2 ">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/dashboardv2")}
                  className="h-7 w-7 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Button>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Mes Coupons
                </h1>
              </div>
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 ring-1 ring-amber-400/30">
                <Ticket className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Gérez vos codes promotionnels et coupons exclusifs
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-6">
            <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5 opacity-50" />
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 bg-amber-500" />
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher par code ou plateforme..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="relative overflow-hidden rounded-xl p-8 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-lg flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5 opacity-50" />
              <Loader2 className="h-6 w-6 animate-spin text-amber-600 dark:text-amber-400" />
            </div>
          ) : filteredCoupons.length > 0 ? (
            <>
              <div className="mb-4">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {filteredCoupons.length} coupon{filteredCoupons.length > 1 ? "s" : ""} trouvé{filteredCoupons.length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCoupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="group relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-lg hover:shadow-md hover:ring-2 hover:ring-amber-500/50 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-xl opacity-10 bg-amber-500 group-hover:opacity-20 transition-opacity duration-300" />

                    <div className="relative space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {getPlatformLogo(coupon.bet_app) && (
                              <img
                                src={getPlatformLogo(coupon.bet_app)}
                                alt={getPlatformName(coupon.bet_app)}
                                className="h-5 w-5 rounded-md object-cover"
                              />
                            )}
                            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 truncate">
                              {getPlatformName(coupon.bet_app)}
                            </span>
                          </div>

                          <p className="text-base sm:text-lg font-mono font-bold text-slate-900 dark:text-white break-all">
                            {coupon.code}
                          </p>
                        </div>

                        <div className="shrink-0 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 to-amber-600/20 ring-1 ring-amber-400/30">
                          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                            Actif
                          </span>
                        </div>
                      </div>

                      <div className="h-px bg-gradient-to-r from-slate-200/0 via-slate-200 to-slate-200/0 dark:from-slate-700/0 dark:via-slate-700 dark:to-slate-700/0" />

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">Créé le</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {format(new Date(coupon.created_at), "dd MMM yyyy", { locale: fr })}
                        </span>
                      </div>

                      <Button
                        onClick={() => copyToClipboard(coupon.code)}
                        className={`w-full h-10 rounded-lg font-semibold transition-all duration-300 ${
                          copiedCode === coupon.code
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-md hover:shadow-emerald-500/50 text-white"
                            : "bg-gradient-to-r from-amber-500 to-amber-600 hover:shadow-md hover:shadow-amber-500/50 text-white"
                        }`}
                      >
                        {copiedCode === coupon.code ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1.5" />
                            Copié
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 mr-1.5" />
                            Copier le code
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="relative overflow-hidden rounded-xl p-8 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5 opacity-50" />
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-xl opacity-10 bg-amber-500" />

              <div className="relative flex flex-col items-center justify-center text-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 ring-1 ring-amber-400/30 mb-3">
                  <Ticket className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                  {searchQuery ? "Aucun coupon trouvé" : "Aucun coupon disponible"}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {searchQuery
                    ? "Essayez une autre recherche"
                    : "Vos coupons apparaîtront ici"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
