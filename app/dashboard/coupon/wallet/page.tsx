"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { couponApi } from "@/lib/api-client"
import { Wallet, ArrowLeft, Loader2, TrendingUp, History, Coins, CheckCircle2 } from "lucide-react"
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
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [walletData, setWalletData] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [wallet, userStats] = await Promise.all([
        couponApi.getWallet(),
        couponApi.getUserStats()
      ])
      setWalletData(wallet)
      setStats(userStats)
    } catch (error) {
      console.error("Error fetching wallet data:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    fetchData()
  }, [user, router])

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount < 100) {
      toast.error("Minimum 100 XOF")
      return
    }

    setIsSubmitting(true)
    try {
      await couponApi.withdraw(amount)
      toast.success("Demande de retrait envoyée!")
      setIsWithdrawModalOpen(false)
      fetchData()
    } catch (error: any) {
      toast.error("Erreur lors du retrait")
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
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/coupon")}
          className="rounded-2xl h-11 w-11 shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-black">Mon Portefeuille Coupon</h1>
          <p className="text-muted-foreground text-sm font-medium italic">V: TURN 12 | Portefeuille Actif</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-[2.5rem] border-0 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-2">
            <CardContent className="p-6">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Solde disponible</p>
                <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-5xl font-black italic tracking-tighter">
                        {(walletData?.balance || 0).toLocaleString("fr-FR")} <span className="text-primary">XOF</span>
                    </h2>
                    <Wallet size={32} className="text-primary opacity-50" />
                </div>
                <Button 
                    onClick={() => setIsWithdrawModalOpen(true)}
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg transition-all active:scale-95 shadow-xl shadow-primary/20"
                >
                    Retirer mes gains
                </Button>
            </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-primary/10 shadow-lg bg-card p-2">
            <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <TrendingUp size={16} /> Performance
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-muted/50 p-4 rounded-3xl">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total</p>
                    <p className="text-xl font-black">{(walletData?.total_earned || 0)} XOF</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-3xl">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Articles</p>
                    <p className="text-xl font-black">{stats?.total_coupons || 0}</p>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card className="rounded-[2.5rem] border-0 shadow-lg p-2">
          <CardHeader>
              <CardTitle className="font-black italic flex items-center gap-2">
                  <History className="text-primary" /> HISTORIQUE DES GAINS
              </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              {walletData?.payouts?.length > 0 ? (
                  walletData.payouts.map((payout: any) => (
                      <div key={payout.id} className="flex items-center justify-between p-4 rounded-3xl border border-muted/50 hover:bg-muted/20 transition-all">
                          <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-xl ${payout.payout_type === 'withdrawal' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                  {payout.payout_type === 'withdrawal' ? <History size={18} /> : <Coins size={18} />}
                              </div>
                              <div>
                                  <p className="font-bold text-sm">
                                      {payout.payout_type === 'per_vote' ? "Vote reçu" : payout.payout_type === 'withdrawal' ? "Retrait" : "Gain"}
                                  </p>
                                  <p className="text-[10px] font-semibold text-muted-foreground">{new Date(payout.created_at).toLocaleDateString('fr-FR')}</p>
                              </div>
                          </div>
                          <p className={`font-black ${payout.payout_type === 'withdrawal' ? 'text-red-600' : 'text-emerald-600'}`}>
                              {payout.payout_type === 'withdrawal' ? '-' : '+'}{payout.amount}
                          </p>
                      </div>
                  ))
              ) : (
                  <p className="text-center py-10 italic text-muted-foreground text-sm font-medium">Aucune donnée encore disponible</p>
              )}
          </CardContent>
      </Card>

      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
        <DialogContent className="rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black italic">Retrait de gains</DialogTitle>
            <DialogDescription>Transférez vos pépites vers votre solde Slater.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="number"
              placeholder="Montant (ex: 500)"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="h-14 rounded-2xl font-black text-xl px-4"
            />
          </div>
          <DialogFooter>
            <Button 
                onClick={handleWithdraw} 
                disabled={isSubmitting || !withdrawAmount}
                className="w-full h-14 rounded-2xl bg-primary text-white font-black text-lg"
            >
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirmer le retrait"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
