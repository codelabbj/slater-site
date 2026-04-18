"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Loader2, 
  Ticket,
  ChevronRight,
  Zap
} from "lucide-react"
import { couponApi, platformApi, settingsApi, authApi } from "@/lib/api-client"
import type { Platform } from "@/lib/types"
import { toast } from "react-hot-toast"
import { cn } from "@/lib/utils"
import { AppBar } from "@/components/ui/app-bar"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export default function CreateCouponV2Page() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [platformsLoading, setPlatformsLoading] = useState(true)

  // Form State
  const [couponCode, setCouponCode] = useState("")
  const [matchCount, setMatchCount] = useState("1")
  const [odds, setOdds] = useState("")
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null)
  const [couponType, setCouponType] = useState<"single" | "combine">("single")

  const [mounted, setMounted] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  
  useEffect(() => {
    setMounted(true)
    checkAccessAndFetchPlatforms()
  }, [])

  const checkAccessAndFetchPlatforms = async () => {
    try {
      const [settings, profile] = await Promise.all([
        settingsApi.get(),
        authApi.getProfile()
      ])

      const canPublish = settings?.allow_all_users_publish_coupons || 
        profile?.can_publish_coupons || 
        profile?.is_staff || 
        profile?.is_superuser || 
        (profile as any)?.is_supperuser ||
        user?.can_publish_coupons ||
        user?.is_staff ||
        user?.is_superuser ||
        (user as any)?.is_supperuser

      if (!canPublish) {
        toast.error("Vous n'avez pas l'autorisation de publier des coupons.")
        router.push("/dashboardv2/coupon")
        return
      }

      await fetchPlatforms()
    } catch (error) {
      console.error("Error checking access:", error)
      router.push("/dashboardv2/coupon")
    } finally {
      setCheckingAccess(false)
    }
  }

  useEffect(() => {
    const count = parseInt(matchCount) || 0
    setCouponType(count > 1 ? "combine" : "single")
  }, [matchCount])

  const fetchPlatforms = async () => {
    try {
      const data = await platformApi.getAll()
      setPlatforms(data || [])
    } catch (error) {
      console.error("Error fetching platforms:", error)
    } finally {
      setPlatformsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlatformId) return toast.error("Sélectionnez un bookmaker")
    if (!odds) return toast.error("Entrez la cote")
    if (!couponCode) return toast.error("Entrez le code")

    setLoading(true)
    try {
      await couponApi.create({
        bet_app_id: selectedPlatformId,
        code: couponCode,
        odds: odds,
        coupon_type: couponType,
        match_count: parseInt(matchCount) || 1
      })
      toast.success("Coupon partagé !")
      router.push("/dashboardv2/coupon")
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erreur publication")
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || !user) return null

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Vérification des accès...</p>
      </div>
    )
  }

  return (
    <>
      <AppBar />
      <div className="max-w-md mx-auto px-4 pb-10 pt-4 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-9 w-9 p-0 rounded-xl">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-black">Publier <span className="text-primary italic">Coupon</span></h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="rounded-[2rem] border-0 shadow-xl bg-card/50 backdrop-blur-sm border-b-4 border-muted overflow-hidden">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Code Coupon</Label>
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="EX: ABC123"
                  className="h-12 rounded-xl bg-background border-muted font-mono font-black text-lg tracking-widest focus-visible:ring-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Matchs</Label>
                  <Input
                    type="number"
                    min="1"
                    value={matchCount}
                    onChange={(e) => setMatchCount(e.target.value)}
                    className="h-12 rounded-xl bg-background border-muted font-bold text-center"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cote</Label>
                  <Input
                    value={odds}
                    onChange={(e) => setOdds(e.target.value)}
                    placeholder="2.00"
                    className="h-12 rounded-xl bg-background border-muted font-bold text-center"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <Zap className="h-4 w-4 text-primary fill-current" />
                <p className="text-xs font-bold">
                  {couponType === "combine" ? "Combiné détecté" : "Coupon simple"}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Choisir Bookmaker</Label>
            <ScrollArea className="w-full whitespace-nowrap pb-2">
              <div className="flex gap-3">
                {platforms.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlatformId(p.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 h-24 w-20 rounded-2xl border-2 transition-all shrink-0",
                      selectedPlatformId === p.id 
                        ? "border-primary bg-primary/5 shadow-lg" 
                        : "border-muted bg-card"
                    )}
                  >
                    <img src={p.image} className="w-8 h-8 object-contain mb-2" />
                    <p className={cn("text-[8px] font-black uppercase truncate w-full text-center", selectedPlatformId === p.id ? "text-primary" : "text-muted-foreground")}>{p.name}</p>
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="hidden" />
            </ScrollArea>
          </div>

          <Button 
            type="submit"
            disabled={loading || !selectedPlatformId || !odds || !couponCode}
            className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Partager <ChevronRight size={18} className="ml-1" /></>}
          </Button>
        </form>
      </div>
    </>
  )
}
