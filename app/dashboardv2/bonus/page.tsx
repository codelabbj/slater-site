"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AppBar } from "@/components/ui/app-bar"
import { Button } from "@/components/ui/button"
import { bonusApi, authApi } from "@/lib/api-client"
import type { Bonus, User } from "@/lib/types"
import { toast } from "react-hot-toast"
import { ArrowLeft, Copy, Check, Loader2, Gift, Users, TrendingUp } from "lucide-react"

export default function BonusV2Page() {
  const router = useRouter()
  const { user } = useAuth()

  // State management
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [isLoadingBonuses, setIsLoadingBonuses] = useState(true)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [copiedReferralCode, setCopiedReferralCode] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Redirect if not authenticated
  if (!user) {
    router.push("/loginv2")
    return null
  }

  // Fetch bonuses
  const fetchBonuses = async (page = 1) => {
    try {
      setIsLoadingBonuses(true)
      const data = await bonusApi.getAll(page)
      setBonuses(data.results || [])
      setTotalPages(Math.ceil((data.count || 0) / 10))
      setCurrentPage(page)
    } catch (error) {
      console.error("Error fetching bonuses:", error)
      toast.error("Erreur lors du chargement des bonus")
      setBonuses([])
    } finally {
      setIsLoadingBonuses(false)
    }
  }

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      setIsLoadingProfile(true)
      const profileData = await authApi.getProfile()
      setUserProfile(profileData)
    } catch (error) {
      console.error("Error fetching user profile:", error)
      toast.error("Erreur lors du chargement du profil")
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (user) {
      fetchBonuses(1)
      fetchUserProfile()
    }
  }, [user])

  // Copy referral code
  const copyReferralCode = async () => {
    const referralCode = userProfile?.referral_code || user?.referral_code
    if (referralCode) {
      try {
        await navigator.clipboard.writeText(referralCode)
        setCopiedReferralCode(true)
        toast.success("Code de parrainage copié!")
        setTimeout(() => setCopiedReferralCode(false), 2000)
      } catch (error) {
        toast.error("Erreur lors de la copie")
      }
    }
  }

  // Calculate statistics
  const totalBonusEarned = bonuses.reduce((sum, bonus) => {
    return sum + (parseFloat(bonus.amount) || 0)
  }, 0)

  const referralCount = userProfile?.referral_code ? 1 : 0
  const availableBonus = userProfile?.bonus_available || 0

  return (
    <>
      <AppBar />
      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 sm:pt-8 pb-4 sm:pb-2">
        <div className="w-full max-w-2xl">
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
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Bonus</h1>
              </div>
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md ring-1 ring-purple-400/20">
                <Gift className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Gérez vos bonus et vos parrainages</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {/* Available Bonus Card */}
            <div className="group relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm hover:shadow-md transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple/5 via-transparent to-purple/5 opacity-50" />
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-xl opacity-10 bg-purple-500" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bonus disponible</p>
                  <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30">
                    <Gift className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                {isLoadingProfile ? (
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                ) : (
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {availableBonus.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "XOF",
                      minimumFractionDigits: 0,
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Total Earned Card */}
            <div className="group relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm hover:shadow-md transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple/5 via-transparent to-purple/5 opacity-50" />
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-xl opacity-10 bg-purple-500" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total gagné</p>
                  <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30">
                    <TrendingUp className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                {isLoadingBonuses ? (
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                ) : (
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {totalBonusEarned.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "XOF",
                      minimumFractionDigits: 0,
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Referral Count Card */}
            <div className="group relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm hover:shadow-md transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple/5 via-transparent to-purple/5 opacity-50" />
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-xl opacity-10 bg-purple-500" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Parrainages</p>
                  <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30">
                    <Users className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                {isLoadingProfile ? (
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                ) : (
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {referralCount}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Referral Code Card */}
          <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-md mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-purple/5 via-transparent to-purple/5 opacity-50" />
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-xl opacity-10 bg-purple-500" />
            
            <div className="relative">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30">
                  <Copy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </span>
                Code de parrainage
              </h2>
              
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {isLoadingProfile ? (
                      <span className="text-slate-400">Chargement...</span>
                    ) : (
                      userProfile?.referral_code || user?.referral_code || "N/A"
                    )}
                  </p>
                </div>
                <Button
                  onClick={copyReferralCode}
                  disabled={isLoadingProfile}
                  className="h-10 px-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:shadow-md hover:shadow-purple-500/50 text-white font-semibold transition-all duration-300"
                >
                  {copiedReferralCode ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Copier
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Bonus Transactions List */}
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30">
                <Gift className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </span>
              Historique des bonus
            </h2>

            {isLoadingBonuses ? (
              <div className="flex items-center justify-center py-8 rounded-xl border bg-gradient-to-br from-background to-muted/20">
                <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
              </div>
            ) : bonuses.length === 0 ? (
              <div className="relative overflow-hidden rounded-xl p-6 sm:p-8 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-purple/5 via-transparent to-purple/5 opacity-50" />
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-xl opacity-10 bg-purple-500" />
                
                <div className="relative flex flex-col items-center justify-center text-center">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 mb-3">
                    <Gift className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold mb-1">Aucun bonus</p>
                  <p className="text-xs text-muted-foreground">Vos bonus apparaîtront ici</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {bonuses.map((bonus) => (
                  <div
                    key={bonus.id}
                    className="group relative overflow-hidden rounded-lg p-3 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm hover:shadow-md hover:border-purple/30 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple/5 via-transparent to-purple/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-lg opacity-0 group-hover:opacity-10 bg-purple-500 transition-opacity" />
                    
                    <div className="relative flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/20 shrink-0">
                          <Gift className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {bonus.reason_bonus || "Bonus"}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {new Date(bonus.created_at).toLocaleDateString("fr-FR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-base font-bold text-purple-600 dark:text-purple-400">
                          +{parseFloat(bonus.amount).toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "XOF",
                            minimumFractionDigits: 0,
                          })}
                        </p>
                        {bonus.transaction && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Ref: {bonus.transaction}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchBonuses(currentPage - 1)}
                  disabled={currentPage === 1 || isLoadingBonuses}
                  className="rounded-lg"
                >
                  Précédent
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => fetchBonuses(page)}
                      disabled={isLoadingBonuses}
                      className="rounded-lg h-8 w-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchBonuses(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoadingBonuses}
                  className="rounded-lg"
                >
                  Suivant
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
