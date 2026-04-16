"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AppBar } from "@/components/ui/app-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { couponApi } from "@/lib/api-client"
import { Wallet, ArrowLeft, Loader2, TrendingUp, History, Coins, ArrowRight, CheckCircle2 } from "lucide-react"
import type { User } from "@/lib/types"
import { toast } from "react-hot-toast"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function CouponWalletPage() {
  const router = useRouter()
  const { user, login } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [walletData, setWalletData] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeUser, setActiveUser] = useState<User | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [wallet, userStats] = await Promise.all([
        couponApi.getWallet(),
        couponApi.getUserStats()
      ])
      setWalletData(wallet)
      setStats(userStats)
      
      // Update local user points from wallet if possible
      if (user) {
        setActiveUser({
            ...user,
            coupon_points: wallet.balance
        })
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error)
      toast.error("Erreur lors du chargement du portefeuille")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      router.push("/loginv2")
      return
    }
    fetchData()
  }, [user, router])

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount < 100) {
      toast.error("Le montant minimum est de 100 XOF")
      return
    }

    if (amount > (walletData?.balance || 0)) {
        toast.error("Solde insuffisant")
        return
    }

    setIsSubmitting(true)
    try {
      await couponApi.withdraw(amount)
      toast.success("Demande de retrait envoyée avec succès!")
      setIsWithdrawModalOpen(false)
      fetchData() // Refresh data
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erreur lors du retrait")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <AppBar />
      <main className="min-h-screen pt-20 pb-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mon Portefeuille Coupon</h1>
            <p className="text-slate-500 text-sm">Gérez vos revenus générés par vos pépites</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Main Balance Card */}
          <Card className="md:col-span-2 overflow-hidden border-none shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-slate-400 text-sm mb-1 uppercase tracking-wider font-semibold">Solde disponible</p>
                  <h2 className="text-4xl font-black italic tracking-tighter">
                    {(walletData?.balance || 0).toLocaleString("fr-FR")} <span className="text-primary tracking-tighter">XOF</span>
                  </h2>
                </div>
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md">
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={() => setIsWithdrawModalOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-8 rounded-xl h-12 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                  Retirer mes gains
                </Button>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Transfert immédiat vers votre solde principal</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-none shadow-lg bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-500">Total gagné</p>
                <p className="text-xl font-bold">{(walletData?.total_earned || 0).toLocaleString()} XOF</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Coupons publiés</p>
                <p className="text-xl font-bold">{stats?.total_coupons || 0}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Moyenne des notes</p>
                <div className="flex items-center gap-1">
                  <p className="text-xl font-bold">{stats?.average_rating?.toFixed(1) || "0.0"}</p>
                  <span className="text-amber-500 text-lg">★</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Payouts */}
        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-slate-400" />
                Historique des gains
              </CardTitle>
              <CardDescription>Vos derniers crédits issus des interactions communautaires</CardDescription>
            </div>
            <Coins className="h-8 w-8 text-slate-50 opacity-10 absolute right-4 top-4" />
          </CardHeader>
          <CardContent>
            {walletData?.payouts?.length > 0 ? (
              <div className="space-y-4">
                {walletData.payouts.map((payout: any) => (
                  <div key={payout.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${payout.payout_type === 'withdrawal' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {payout.payout_type === 'withdrawal' ? <History className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {payout.payout_type === 'per_vote' ? "Vote reçu sur un coupon" : 
                           payout.payout_type === 'per_like' ? "Like reçu sur un coupon" :
                           payout.payout_type === 'withdrawal' ? "Retrait de fonds" : "Bonus coupon"}
                        </p>
                        <p className="text-xs text-slate-500">{new Date(payout.created_at).toLocaleString('fr-FR')}</p>
                      </div>
                    </div>
                    <div className={`font-bold ${payout.payout_type === 'withdrawal' ? 'text-red-600' : 'text-emerald-600'}`}>
                      {payout.payout_type === 'withdrawal' ? '-' : '+'}{payout.amount} XOF
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Coins className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-500">Aucun historique de gains pour le moment</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verification Tag */}
        <div className="mt-10 pt-6 border-t border-slate-100 text-center">
             <div className="text-[10px] text-slate-300 font-mono">
                Site Version: TURN 12 | Wallet Component Active
             </div>
        </div>
      </main>

      {/* Withdraw Modal */}
      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Retirer vos gains</DialogTitle>
            <DialogDescription>
              Le montant sera transféré de votre portefeuille coupon vers votre solde principal Slater.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Montant à retirer (XOF)</label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Ex: 500"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="h-12 rounded-xl pl-4 pr-12 text-lg font-bold"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">XOF</div>
              </div>
              <p className="text-xs text-slate-500">
                Solde disponible: <span className="font-bold">{(walletData?.balance || 0).toLocaleString()} XOF</span>
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-3">
            <Button 
              onClick={handleWithdraw} 
              disabled={isSubmitting || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
              className="w-full h-12 rounded-xl bg-primary text-white font-bold"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Confirmer le transfert"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsWithdrawModalOpen(false)}
              className="w-full h-12 rounded-xl border-slate-200"
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
