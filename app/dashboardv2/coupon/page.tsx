"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Loader2, 
  Ticket, 
  Copy, 
  Check, 
  ArrowLeft, 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  Plus, 
  Star,
  Send,
  Trophy,
  Wallet,
  X,
  Lock
} from "lucide-react"
import Link from "next/link"
import { couponApi, platformApi, authApi, settingsApi, transactionApi } from "@/lib/api-client"
import type { Coupon, Platform, Comment as CouponComment, User } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { AppBar } from "@/components/ui/app-bar"

export default function CouponV2Page() {
  const router = useRouter()
  const { user } = useAuth()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [platformsLoading, setPlatformsLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)

  // Comment state
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  const [comments, setComments] = useState<CouponComment[]>([])
  const [commentText, setCommentText] = useState("")
  const [commentsLoading, setCommentsLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isAccessRestricted, setIsAccessRestricted] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [minDepositRequired, setMinDepositRequired] = useState(0)

  useEffect(() => {
    setMounted(true)
    fetchPlatforms()
    fetchUserProfile()
    checkAccess()
  }, [])

  const checkAccess = async () => {
    setCheckingAccess(true)
    try {
      const settings = await settingsApi.get()
      if (settings?.requires_deposit_to_view_coupon) {
        const minReq = settings.minimun_deposit_before_view_coupon || 0
        setMinDepositRequired(minReq)
        
        // Check transaction history for a single accepted deposit >= minReq
        const history = await transactionApi.getHistory({
          type_trans: "deposit",
          status: "accept",
          page: 1,
          page_size: 50 // Check last 50 successful deposits
        })
        
        const results = history.results || []
        const hasValidDeposit = results.some((t: any) => t.amount >= minReq)
        
        if (!hasValidDeposit) {
          setIsAccessRestricted(true)
        }
      }
    } catch (err) {
      console.error("Error checking coupon access:", err)
    } finally {
      setCheckingAccess(false)
    }
  }

  useEffect(() => {
    fetchCoupons(selectedPlatformId)
  }, [selectedPlatformId])

  const fetchUserProfile = async () => {
    try {
      const profile = await authApi.getProfile()
      setUserProfile(profile)
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  const fetchPlatforms = async () => {
    setPlatformsLoading(true)
    try {
      const data = await platformApi.getAll()
      setPlatforms(data || [])
    } catch (error) {
      console.error("Error fetching platforms:", error)
    } finally {
      setPlatformsLoading(false)
    }
  }

  const fetchCoupons = async (platformId: string | null = null) => {
    setIsLoading(true)
    try {
      const data = await couponApi.getAll({ 
        page: 1, 
        page_size: 50, 
        bet_app: platformId || undefined 
      })
      const results = (data.results || data || []) as any[]
      
      // Map API response → internal Coupon shape
      const mappedCoupons = results.map((c: any) => {
        // Author: API returns combined "author_name" e.g. "ALPHA rarsh"
        const authorParts = (c.author_name || "").trim().split(" ")
        const author_first_name = c.author_first_name || authorParts[0] || "Utilisateur"
        const author_last_name = c.author_last_name || authorParts.slice(1).join(" ") || ""

        // bet_app: API returns a UUID string + separate bet_app_details object
        const bet_app = typeof c.bet_app === "string"
          ? { id: c.bet_app, name: c.bet_app_details?.name || "App", image: c.bet_app_details?.image || "" }
          : c.bet_app

        return {
          ...c,
          author_first_name,
          author_last_name,
          bet_app,
          // Odds may be returned as "odds" or legacy "cote"
          odds: c.odds ?? c.cote ?? "—",
          user_liked: c.user_liked ?? (c.user_rating === 5),
          user_disliked: c.user_disliked ?? (c.user_rating === 1),
          // Default to true if missing, or allow if explicitly true
          can_rate: c.can_rate ?? true,
          total_comments: c.total_comments ?? 0,
        }
      })
      setCoupons(mappedCoupons)
    } catch (err: any) {
      console.error("Error fetching coupons:", err)
      setError(err.message || "Erreur lors du chargement des coupons.")
      setTimeout(() => setError(null), 4000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVote = async (couponId: string, voteType: 'like' | 'dislike') => {
    const isSpecialUser = 
      userProfile?.is_staff || 
      userProfile?.is_superuser || 
      (userProfile as any)?.is_supperuser ||
      user?.is_staff || 
      user?.is_superuser || 
      (user as any)?.is_supperuser

    if (!userProfile?.can_rate_coupons && !isSpecialUser) {
      setError("Vous n'avez pas l'autorisation de noter des coupons. Pour noter, vous devez avoir au moins 1 mois d'ancienneté et 15 000 FCFA de transactions acceptées.")
      setTimeout(() => setError(null), 5000)
      return
    }
    try {
      const response = await couponApi.vote(couponId, voteType)
      setError(null)
      // Update local state directly
      setCoupons(prev => prev.map(c => {
        if (c.id === couponId) {
          const voteData = response.coupon || response.data?.coupon || response
          return {
            ...c,
            likes_count: voteData.likes ?? voteData.likes_count ?? c.likes_count,
            dislikes_count: voteData.dislikes ?? voteData.dislikes_count ?? c.dislikes_count,
            user_liked: voteData.user_liked ?? c.user_liked,
            user_disliked: voteData.user_disliked ?? c.user_disliked,
          }
        }
        return c
      }))
      toast.success(response.message || "Vote enregistré")
    } catch (err: any) {
      console.error("Error voting coupon:", err)
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || "Erreur lors du vote."
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    }
  }

  const fetchComments = async (authorId: string) => {
    setCommentsLoading(true)
    try {
      // API returns a plain array (not paginated)
      const raw = await couponApi.getComments(authorId)
      const data = Array.isArray(raw) ? raw : (raw.results || [])
      
      // Normalize: split author_name into first/last for rendering
      const normalized = data.map((comment: any) => {
        const parts = (comment.author_name || "").trim().split(" ")
        return {
          ...comment,
          author: {
            id: comment.author,
            first_name: parts[0] || "?",
            last_name: parts.slice(1).join(" ") || "",
          },
        }
      })
      setComments(normalized)
    } catch (err: any) {
      console.error("Error fetching comments:", err)
      const msg = err.message || err.response?.data?.detail || "Erreur lors du chargement des commentaires."
      setError(msg)
      setTimeout(() => setError(null), 3000)
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleOpenComments = async (coupon: Coupon) => {
    setSelectedCoupon(coupon)
    setShowCommentModal(true)
    fetchComments(coupon.author)
  }

  const handleCloseComments = () => {
    setShowCommentModal(false)
    setSelectedCoupon(null)
    setComments([])
    setCommentText("")
  }

  const handleSendComment = async () => {
    if (!selectedCoupon || !commentText.trim()) return
    try {
      await couponApi.postComment({ coupon_id: selectedCoupon.id, content: commentText.trim() })
      setCommentText("")
      fetchComments(selectedCoupon.author)
      // Increment count locally
      setCoupons(prev => prev.map(c => c.id === selectedCoupon.id ? { ...c, total_comments: (c.total_comments || 0) + 1 } : c))
      toast.success("Envoyé")
    } catch (err: any) {
      const msg = err.message || err.response?.data?.error || err.response?.data?.detail || "Erreur envoi"
      setError(msg)
      setTimeout(() => setError(null), 3000)
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success("Copié !")
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getInitials = (first?: string, last?: string) => {
    if (!first && !last) return "?"
    return `${(first || "").charAt(0)}${(last || "").charAt(0)}`.toUpperCase()
  }

  if (!mounted || !user) return null

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Vérification des accès...</p>
      </div>
    )
  }

  if (isAccessRestricted) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <AppBar showBackButton={true} backHref="/dashboardv2" title="Accès Restreint" />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full rounded-[2.5rem] border-0 shadow-2xl overflow-hidden bg-white dark:bg-slate-900 border-b-8 border-red-100 dark:border-red-900/20">
            <CardContent className="p-10 flex flex-col items-center text-center space-y-8">
              <div className="relative">
                <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-[2rem] blur-2xl opacity-50" />
                <div className="relative h-24 w-24 rounded-[2rem] bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-900/20 flex items-center justify-center border border-red-200 dark:border-red-800 shadow-inner">
                  <Lock className="h-10 w-10 text-red-500" strokeWidth={2.5} />
                </div>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Accès Limité</h2>
                <div className="h-1 w-12 bg-red-500 rounded-full mx-auto" />
                <p className="text-slate-600 dark:text-slate-400 font-bold leading-relaxed pt-2">
                  Vous n'êtes pas autorisé à accéder à la page des coupons tant qu'un dépôt minimum de 
                  <span className="text-red-500 mx-1">
                    {minDepositRequired.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "XOF",
                      minimumFractionDigits: 0,
                    })}
                  </span> 
                  n'a pas été effectué.
                </p>
              </div>

              <div className="w-full pt-4 space-y-3">
                <Button 
                  onClick={() => router.push("/dashboardv2/deposit")}
                  className="w-full rounded-2xl h-14 text-base font-black shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all bg-primary hover:bg-primary/90"
                >
                  Effectuer un dépôt
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => router.push("/dashboardv2")}
                  className="w-full h-12 rounded-2xl font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  Retour au tableau de bord
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <AppBar showBackButton={true} backHref="/dashboardv2" title="Coupons Mobcash" />
      <div className="max-w-6xl mx-auto px-4 pb-10 pt-8 space-y-8">
        {/* Error Banner */}
        {error && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-4 rounded-2xl border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-400 flex items-center gap-3 shadow-lg backdrop-blur-md">
              <span className="font-medium text-sm flex-1">{error}</span>
              <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-full transition-colors shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── User Profile Card (blaffa style) ── */}
        <Card className="rounded-[2rem] border-0 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 border-b-4 border-slate-50 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <Avatar className="h-16 w-16 rounded-[1.5rem] bg-primary/5 border border-primary/10">
                  <AvatarFallback className="text-xl font-bold text-primary">
                    {getInitials(userProfile?.first_name, userProfile?.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-2xl text-slate-900 dark:text-white">
                      {userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : "Chargement..."}
                    </h3>
                    <Badge variant="outline" className="rounded-xl px-3 py-1 border-primary/20 text-primary text-[10px] uppercase font-black">Tipster Pro</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          size={16}
                          className={cn(
                            i <= 4 ? "fill-yellow-400 text-yellow-400" : "text-slate-200 fill-slate-200"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-slate-400">• 4.0 de note</span>
                  </div>
                </div>
              </div>
              
            <div className="flex items-center gap-3">
              {(userProfile?.can_publish_coupons || 
                userProfile?.is_staff || 
                userProfile?.is_superuser || 
                (userProfile as any)?.is_supperuser ||
                user?.can_publish_coupons ||
                user?.is_staff ||
                user?.is_superuser ||
                (user as any)?.is_supperuser
              ) && (
                <Button
                  onClick={() => router.push("/dashboardv2/coupon/create")}
                  className="rounded-2xl h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" strokeWidth={3} />
                  Publier
                </Button>
              )}
            </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Platform Scroll & Header ── */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Pépites du jour</h2>
              <p className="text-slate-400 font-bold flex items-center gap-2 lowercase">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                disponibles ce {mounted ? format(new Date(), "EEEE d MMMM", { locale: fr }) : "..."}
              </p>
            </div>

            <div className="max-w-md w-full">
              <ScrollArea className="w-full whitespace-nowrap pb-2">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={selectedPlatformId === null ? "default" : "outline"}
                    onClick={() => setSelectedPlatformId(null)}
                    className="rounded-2xl px-5 font-bold h-11 border-slate-100"
                  >
                    <Trophy className={cn("h-4 w-4 mr-2", selectedPlatformId === null ? "text-white" : "text-primary")} />
                    Tous
                  </Button>
                  {platformsLoading
                    ? [1, 2, 3].map((i) => (
                        <div key={i} className="h-11 w-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                      ))
                    : platforms.map((platform) => (
                        <Button
                          key={platform.id}
                          size="sm"
                          variant={selectedPlatformId === platform.id ? "default" : "outline"}
                          onClick={() => setSelectedPlatformId(platform.id)}
                          className="rounded-2xl px-5 font-bold h-11 border-slate-100"
                        >
                          <img src={platform.image} className="w-4 h-4 mr-2 object-contain" alt="" />
                          {platform.name}
                        </Button>
                      ))}
                </div>
                <ScrollBar orientation="horizontal" className="hidden" />
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* ── Coupons Grid ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-black uppercase text-muted-foreground animate-pulse">Extraction des codes...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed border-muted">
            <Ticket size={40} className="mx-auto text-muted mb-4" />
            <p className="font-bold">Aucun coupon disponible</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map(coupon => (
              <Card key={coupon.id} className="border-0 shadow-lg rounded-[2.5rem] overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 bg-white dark:bg-slate-900 border-b-4 border-slate-50 dark:border-slate-800">
                <CardContent className="p-8 space-y-6">
                  {/* Author Info (blaffa style) */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-50 dark:border-slate-700">
                      <AvatarFallback className="text-sm font-bold text-slate-500">
                        {getInitials(coupon.author_first_name, coupon.author_last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                        {coupon.author_first_name} {coupon.author_last_name}
                      </h3>
                      <div className="flex gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            size={12}
                            className={cn(
                              i <= Math.round(coupon.author_rating || 4)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-slate-200 fill-slate-200"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bet Type Pill (blaffa style) */}
                  <Badge className="rounded-xl px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-0 text-[10px] uppercase font-black tracking-tight flex w-fit items-center gap-2">
                    <Ticket size={16} className="rotate-45" />
                    {coupon.coupon_type === "combine"
                      ? `Combiné (${coupon.match_count} matchs)`
                      : `Simple (${coupon.match_count} match)`}
                  </Badge>

                  {/* Côte & Platform (blaffa style) */}
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">
                        Côte totale
                      </p>
                      <span className="text-[28px] font-black text-slate-900 dark:text-white leading-none tracking-tight">
                        {coupon.odds}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <div className="w-5 h-5 rounded flex items-center justify-center overflow-hidden">
                        <img src={coupon.bet_app.image} className="w-full h-full object-contain" alt="" />
                      </div>
                      <span className="font-bold text-[10px] text-slate-900 dark:text-white">
                        {coupon.bet_app.name}
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-slate-50 dark:bg-slate-800/50 w-full" />

                  {/* Actions (blaffa style) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => coupon.can_rate && handleVote(coupon.id, "like")}
                        disabled={!coupon.can_rate && !coupon.user_liked && !coupon.user_disliked}
                        className={cn(
                          "flex items-center gap-2 text-sm font-bold transition-all",
                          coupon.user_liked ? "text-primary scale-110" : "text-slate-400 hover:text-primary"
                        )}
                      >
                        <ThumbsUp size={20} className={coupon.user_liked ? "fill-current" : ""} />
                        {coupon.likes_count || 0}
                      </button>
                      <button
                        onClick={() => coupon.can_rate && handleVote(coupon.id, "dislike")}
                        disabled={!coupon.can_rate && !coupon.user_liked && !coupon.user_disliked}
                        className={cn(
                          "flex items-center gap-2 text-sm font-bold transition-all",
                          coupon.user_disliked ? "text-red-500 scale-110" : "text-slate-400 hover:text-red-500"
                        )}
                      >
                        <ThumbsDown size={20} className={coupon.user_disliked ? "fill-current" : ""} />
                        {coupon.dislikes_count || 0}
                      </button>
                      <button
                        onClick={() => handleOpenComments(coupon)}
                        className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-all"
                      >
                        <MessageCircle size={20} />
                        {coupon.total_comments || 0}
                      </button>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(coupon.code)}
                      className={cn(
                        "rounded-2xl h-11 px-8 font-mono font-black tracking-[0.2em] text-sm uppercase transition-all shadow-sm active:scale-95 border-0",
                        copiedCode === coupon.code
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-primary/5 text-primary hover:bg-primary/10"
                      )}
                    >
                      {copiedCode === coupon.code ? <Check className="h-4 w-4" /> : coupon.code}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Comments Dialog (blaffa-mobile style) ── */}
      <Dialog open={showCommentModal} onOpenChange={(open) => !open && handleCloseComments()}>
        <DialogContent className="sm:max-w-[500px] p-0 rounded-[2.5rem] overflow-hidden border-0 shadow-2xl bg-white dark:bg-slate-900">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">Commentaires</DialogTitle>
            <DialogDescription className="text-sm font-bold text-slate-400">
              {selectedCoupon?.total_comments || 0} avis sur ce pronostic
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[450px] px-8 py-2">
            <div className="space-y-6 pb-4">
              {commentsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Chargement...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto">
                    <MessageCircle className="h-8 w-8 text-slate-200" />
                  </div>
                  <p className="text-slate-400 text-sm font-bold">Soyez le premier à commenter!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <Avatar className="h-10 w-10 rounded-2xl border border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 shrink-0">
                      <AvatarFallback className="text-xs font-bold text-slate-500">
                        {getInitials(comment.author.first_name, comment.author.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                          {comment.author.first_name} {comment.author.last_name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {format(new Date(comment.created_at), "d MMM, HH:mm", { locale: fr })}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl rounded-tl-none border border-slate-50 dark:border-slate-800">
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="p-8 pt-4 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <Input 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                placeholder="Ajouter un commentaire..."
                className="rounded-2xl h-14 border-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700 text-sm font-bold px-6 shadow-sm focus-visible:ring-primary"
              />
              <Button 
                disabled={!commentText.trim()}
                onClick={handleSendComment}
                className="rounded-2xl h-14 w-14 p-0 shadow-lg shadow-primary/20 active:scale-95 transition-all shrink-0"
              >
                <Send className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
