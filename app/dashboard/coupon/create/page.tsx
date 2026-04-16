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
  Plus, 
  CheckCircle2, 
  Circle, 
  Loader2, 
  Ticket,
  ChevronRight,
  Trophy,
  Zap
} from "lucide-react"
import { couponApi, platformApi } from "@/lib/api-client"
import type { Platform } from "@/lib/types"
import { toast } from "react-hot-toast"
import { cn } from "@/lib/utils"

export default function CreateCouponPage() {
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

  useEffect(() => {
    fetchPlatforms()
  }, [])

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
      toast.error("Échec de la récupération des plateformes")
    } finally {
      setPlatformsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlatformId) {
      toast.error("Veuillez sélectionner une plateforme")
      return
    }
    if (!odds) {
      toast.error("Veuillez entrer une cote")
      return
    }
    if (!couponCode) {
      toast.error("Veuillez entrer le code du coupon")
      return
    }

    setLoading(true)
    try {
      await couponApi.create({
        bet_app_id: selectedPlatformId,
        code: couponCode,
        odds: odds,
        coupon_type: couponType,
        match_count: parseInt(matchCount) || 1
      })
      toast.success("Coupon partagé avec succès !")
      router.push("/dashboard/coupon")
      router.refresh()
    } catch (error: any) {
      console.error("Error creating coupon:", error)
      const msg = error.response?.data?.error || error.response?.data?.detail || "Une erreur est survenue"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-2xl h-11 w-11 shadow-sm border-primary/10 hover:bg-primary/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Publier un <span className="text-primary">Coupon</span></h1>
          <p className="text-muted-foreground text-sm">Partagez votre expertise avec la communauté</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-0 shadow-2xl rounded-[2.5rem] bg-card/50 backdrop-blur-xl border border-white/10 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Ticket className="h-5 w-5" />
                </div>
                Détails du coupon
              </CardTitle>
              <CardDescription>Remplissez les informations de votre prédiction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="couponCode" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Code du coupon</Label>
                <Input
                  id="couponCode"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="EX: CODE123"
                  className="rounded-2xl h-14 bg-background border-primary/10 focus-visible:ring-primary text-lg font-mono font-black tracking-widest"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="matchCount" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Matchs</Label>
                  <Input
                    id="matchCount"
                    type="number"
                    min="1"
                    value={matchCount}
                    onChange={(e) => setMatchCount(e.target.value)}
                    className="rounded-2xl h-14 bg-background border-primary/10 focus-visible:ring-primary font-bold text-lg text-center"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="odds" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Cote totale</Label>
                  <Input
                    id="odds"
                    type="text"
                    value={odds}
                    onChange={(e) => setOdds(e.target.value)}
                    placeholder="2.50"
                    className="rounded-2xl h-14 bg-background border-primary/10 focus-visible:ring-primary font-bold text-lg text-center"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="p-2 rounded-lg bg-primary text-white shadow-lg">
                  <Zap className="h-4 w-4 fill-current" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-none">Type détecté</p>
                  <p className="text-sm font-bold mt-1">
                    {couponType === "combine" ? "Combiné (Multi-match)" : "Simple (Match unique)"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Platform Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Sélectionner Bookmaker</Label>
            <div className="grid grid-cols-1 gap-3">
              {platformsLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
                ))
              ) : (
                platforms.map((platform) => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => setSelectedPlatformId(platform.id)}
                    className={cn(
                      "group relative w-full p-4 flex items-center gap-4 rounded-2xl border transition-all duration-300",
                      selectedPlatformId === platform.id
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/30 hover:bg-muted/30"
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-white p-2 flex items-center justify-center shadow-sm shrink-0 border border-slate-100">
                      <img src={platform.image} alt={platform.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={cn("font-bold text-sm", selectedPlatformId === platform.id ? "text-primary" : "text-foreground")}>
                        {platform.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Bet Application</p>
                    </div>
                    {selectedPlatformId === platform.id ? (
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground/30 group-hover:text-muted-foreground/50" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <Button 
            type="submit"
            disabled={loading || !selectedPlatformId || !odds || !couponCode}
            className="w-full h-16 rounded-[2rem] text-lg font-black shadow-xl shadow-primary/20 active:scale-95 transition-all mt-6"
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                Publier maintenant
                <ChevronRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
