"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ArrowDownToLine, ArrowUpFromLine, Wallet, Loader2, ArrowRight, RefreshCw, MessageCircle, Send, Smartphone, Download, Ticket, Bell, Gift, Copy, Check, Coins } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { transactionApi, advertisementApi, settingsApi, authApi } from "@/lib/api-client"
import type { Transaction, Advertisement, Settings, User } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { formatPhoneNumberForDisplay, cn } from "@/lib/utils"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"

export default function DashboardPage() {
  const { user } = useAuth()
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([])
  const [isLoadingAd, setIsLoadingAd] = useState(true)
  const [adImageErrors, setAdImageErrors] = useState<Set<string>>(new Set())
  const [isChatPopoverOpen, setIsChatPopoverOpen] = useState(false)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [isCarouselPaused, setIsCarouselPaused] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [referralBonusEnabled, setReferralBonusEnabled] = useState(false)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [copiedReferralCode, setCopiedReferralCode] = useState(false)

  const fetchRecentTransactions = async () => {
    try {
      setIsLoadingTransactions(true)
      const data = await transactionApi.getHistory({
        page: 1,
        page_size: 5, // Get only the 5 most recent transactions
      })
      setRecentTransactions(data.results)
    } catch (error) {
      console.error("Error fetching recent transactions:", error)
      toast.error("Erreur lors du chargement des transactions récentes")
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  const fetchAdvertisement = async () => {
    try {
      setIsLoadingAd(true)
      const response = await advertisementApi.get()
      // The API returns a paginated response with results array
      if (response && response.results && Array.isArray(response.results)) {
        // Get all advertisements where enable is true and have an image
        const enabledAds = response.results.filter(
          (ad: Advertisement) => ad.enable === true && (ad.image || ad.image_url)
        )
        setAdvertisements(enabledAds)
      } else {
        // Empty or invalid response - show placeholder
        setAdvertisements([])
      }
    } catch (error) {
      console.error("Error fetching advertisement:", error)
      // On error, show placeholder
      setAdvertisements([])
    } finally {
      setIsLoadingAd(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const settingsData = await settingsApi.get()
      setSettings(settingsData)
      setReferralBonusEnabled(settingsData?.referral_bonus === true)
    } catch (error) {
      console.error("Error fetching settings:", error)
      setSettings({ whatsapp_phone: "0594811767", telegram: "0594811767" })
      setReferralBonusEnabled(false)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const profileData = await authApi.getProfile()
      setUserProfile(profileData)
      console.log("Fetched user profile:", profileData)
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchRecentTransactions()
      fetchAdvertisement()
      fetchSettings()
      fetchUserProfile()
    }
  }, [user])

  // Refetch data when the page gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchRecentTransactions()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

  const getAdvertisementImageUrl = (ad: Advertisement) => {
    return ad.image_url || ad.image || null
  }

  const getAdvertisementLink = (ad: Advertisement) => {
    return ad.url || ad.link || null
  }

  const handleAdImageError = (adId: string) => {
    setAdImageErrors(prev => new Set(prev).add(adId))
  }

  // Auto-play carousel
  useEffect(() => {
    if (!carouselApi || advertisements.length <= 1 || isCarouselPaused) return

    const interval = setInterval(() => {
      carouselApi.scrollNext()
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [carouselApi, advertisements.length, isCarouselPaused])

  const getStatusBadge = (status: Transaction["status"]) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "En attente" },
      accept: { variant: "default", label: "Accepté" },
      init_payment: { variant: "secondary", label: "En attente" },
      error: { variant: "destructive", label: "Erreur" },
      reject: { variant: "destructive", label: "Rejeté" },
      timeout: { variant: "outline", label: "Expiré" },
    }
    
    const config = statusConfig[status] || { variant: "outline" as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTypeBadge = (type: Transaction["type_trans"]) => {
    return (
      <Badge variant={type === "deposit" ? "default" : "secondary"}>
        {type === "deposit" ? "Dépôt" : "Retrait"}
      </Badge>
    )
  }

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

  return (
    <>
    <div className="space-y-5 sm:space-y-8">
      {/* Hero */}
      <Card className="border-0 floating-card overflow-hidden  sm:rounded-3xl">
        <CardContent className="p-4 sm:p-6 relative z-10">
          <div className="absolute -top-10 right-2 h-28 w-28 rounded-full bg-primary/20 blur-3xl" />
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 text-left">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight break-words">
                  Bonjour, {user?.first_name} {user?.last_name}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
                  Votre hub pour suivre vos dépôts, retraits et notifications en un clin d'œil.
                </p>
              </div>
            </div>

            {/* Advertisement Section */}
            <div className="w-full">
              <Card className="overflow-hidden border border-primary/20 glass-panel p-0 py-0  sm:rounded-3xl">
                <CardContent className="p-0">
                  {isLoadingAd ? (
                    <div className="relative w-full aspect-[16/9] bg-muted/30 flex items-center justify-center sm:rounded-3xl">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : advertisements.length > 0 ? (
                    <Carousel
                      setApi={setCarouselApi}
                      opts={{
                        align: "start",
                        loop: true,
                      }}
                      className="w-full"
                      onTouchStart={() => setIsCarouselPaused(true)}
                      onTouchEnd={() => setIsCarouselPaused(false)}
                      onMouseEnter={() => setIsCarouselPaused(true)}
                      onMouseLeave={() => setIsCarouselPaused(false)}
                    >
                      <CarouselContent className="-ml-0">
                        {advertisements.map((ad) => {
                          const imageUrl = getAdvertisementImageUrl(ad)
                          const link = getAdvertisementLink(ad)
                          const adId = ad.id?.toString() || ""
                          const hasError = adImageErrors.has(adId)

                          if (!imageUrl || hasError) return null

                          return (
                            <CarouselItem key={adId} className="pl-0">
                              <div className="relative w-full aspect-[16/9] bg-muted/30 sm:rounded-3xl overflow-hidden">
                                <Image
                                  src={imageUrl}
                                  alt={ad.title || "Publicité"}
                                  fill
                                  className={link ? "object-cover cursor-pointer transition-transform duration-300 hover:scale-105" : "object-cover"}
                                  onError={() => handleAdImageError(adId)}
                                />
                                {link && (
                                  <a
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 z-10"
                                    aria-label={ad.title || "Voir la publicité"}
                                  />
                                )}
                              </div>
                            </CarouselItem>
                          )
                        })}
                      </CarouselContent>
                    </Carousel>
                  ) : (
                    <div className="relative w-full aspect-[16/9] bg-primary/5 flex items-center justify-center sm:rounded-3xl">
                      <div className="text-center p-4 text-muted-foreground">
                        <p className="text-sm sm:text-base font-semibold text-foreground/80">Espace publicitaire</p>
                        <p className="text-xs text-muted-foreground mt-1">Vos campagnes apparaîtront ici</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Circular Action Buttons */}
            <div className="flex gap-8 justify-center mb-4">
                {/* Deposit Button */}
                <div className="flex flex-col items-center gap-2">
                  <Button
                    asChild
                    className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-xl shadow-blue-500/40 border border-blue-400/30 hover:shadow-blue-500/60 transition-all duration-300 transform hover:-translate-y-1 hover:scale-110"
                  >
                    <Link href="/dashboard/deposit" className="flex items-center justify-center">
                      <ArrowDownToLine className="h-7 w-7" />
                    </Link>
                  </Button>
                  <span className="text-xs font-medium text-foreground">Dépôt</span>
                </div>

                {/* Withdrawal Button */}
                <div className="flex flex-col items-center gap-2">
                  <Button
                    asChild
                    className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white shadow-xl shadow-emerald-500/40 border border-emerald-400/30 hover:shadow-emerald-500/60 transition-all duration-300 transform hover:-translate-y-1 hover:scale-110"
                  >
                    <Link href="/dashboard/withdrawal" className="flex items-center justify-center">
                      <ArrowUpFromLine className="h-7 w-7" />
                    </Link>
                  </Button>
                  <span className="text-xs font-medium text-foreground">Retrait</span>
                </div>

                {/* Coupons Button */}
                <div className="flex flex-col items-center gap-2">
                  <Button
                    asChild
                    className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 text-white shadow-xl shadow-amber-500/40 border border-amber-400/30 hover:shadow-amber-500/60 transition-all duration-300 transform hover:-translate-y-1 hover:scale-110"
                  >
                    <Link href="/dashboard/coupon" className="flex items-center justify-center">
                      <Ticket className="h-7 w-7" />
                    </Link>
                  </Button>
                  <span className="text-xs font-medium text-foreground">Coupons</span>
                </div>

                {/* Bonus Button */}
                {referralBonusEnabled && (
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      asChild
                      className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white shadow-xl shadow-purple-500/40 border border-purple-400/30 hover:shadow-purple-500/60 transition-all duration-300 transform hover:-translate-y-1 hover:scale-110"
                    >
                      <Link href="/dashboard/bonus" className="flex items-center justify-center">
                        <Gift className="h-7 w-7" />
                      </Link>
                    </Button>
                    <span className="text-xs font-medium text-foreground">Bonus</span>
                  </div>
                )}
              </div>
            </div>
        </CardContent>
      </Card>

      {/* Referral Code and Bonus Balance */}
      {referralBonusEnabled && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Referral Code */}
        <Card className="glass-panel border-primary/15  ">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10  bg-primary/15 text-primary flex-shrink-0">
                  <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Code de parrainage</p>
                  <p className="text-sm sm:text-base font-mono font-semibold text-foreground truncate">
                    {userProfile?.referral_code || user?.referral_code || "N/A"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyReferralCode}
                className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0  hover:bg-primary/10"
              >
                {copiedReferralCode ? (
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bonus Balance */}
        <Card className="glass-panel border-primary/15  ">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10  bg-primary/15 text-primary flex-shrink-0">
                <Coins className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Bonus disponible</p>
                <p className="text-sm sm:text-base font-semibold text-foreground">
                  {(userProfile?.bonus_available || user?.bonus_available || 0).toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "XOF",
                    minimumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Mobile App Download */}
      <Card className="glass-panel border border-primary/15  sm:rounded-3xl">
        <CardContent className="p-4 sm:p-5">
          <Button
            asChild
            className="w-full h-12 sm:h-12 justify-center bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-xl glow-primary text-sm sm:text-base font-bold  hover:shadow-primary/50 transition-all duration-300 transform hover:scale-[1.02]"
          >
            <a
              href="https://slaterci-mobile-app.vercel.app/releases/app-v1.0.2.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3"
            >
              <div className="flex items-center justify-center w-8 h-8  bg-primary/20">
                <Download className="h-4 w-4" />
              </div>
              📱 Télécharger Slater Mobile (v1.0.2)
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold section-title">Activité récente</h2>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchRecentTransactions}
              disabled={isLoadingTransactions}
              className="h-9 sm:h-10 sm:w-auto px-3 bg-primary/10 border-primary/30 text-foreground hover:bg-primary/15"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingTransactions ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Actualiser</span>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-9 sm:h-10 text-xs sm:text-sm hover:bg-primary/10">
              <Link href="/dashboard/history" className="flex items-center gap-1 sm:gap-2">
                <span className="hidden sm:inline">Voir tout</span>
                <span className="sm:hidden">Tout</span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </Button>
          </div>
        </div>
        
        {isLoadingTransactions ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : recentTransactions.length === 0 ? (
          <Card className="glass-panel  sm:rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12">
              <Wallet className="h-12 w-12 text-primary mb-4" />
              <p className="text-foreground font-semibold text-center">Aucune transaction récente</p>
              <p className="text-sm text-muted-foreground text-center mt-1">Vos transactions apparaîtront ici</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
            {recentTransactions.map((transaction) => {
              const isDeposit = transaction.type_trans === "deposit"
              return (
                <Card
                  key={transaction.id}
                  className={cn(
                    "glass-panel hover:shadow-lg transition-all duration-200 border-primary/10  sm:rounded-3xl",
                    "relative overflow-hidden"
                  )}
                >
                  <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: isDeposit ? "linear-gradient(90deg, rgba(50,251,255,0.35), rgba(23,161,255,0.25))" : "linear-gradient(90deg, rgba(15,34,55,0.35), rgba(50,251,255,0.15))" }} />
                  <CardContent className="p-3.5 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={cn(
                            "p-2  flex-shrink-0",
                            isDeposit ? "bg-primary/15 text-primary" : "bg-secondary/20 text-foreground"
                          )}
                        >
                          {isDeposit ? (
                            <ArrowDownToLine className="h-4 w-4" />
                          ) : (
                            <ArrowUpFromLine className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <h3 className="font-semibold text-sm sm:text-base truncate">#{transaction.reference}</h3>
                            {getTypeBadge(transaction.type_trans)}
                            {getStatusBadge(transaction.status)}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {transaction.app_details?.name || transaction.app} • {formatPhoneNumberForDisplay(transaction.phone_number)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base sm:text-lg font-semibold">
                          {transaction.amount.toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "XOF",
                            minimumFractionDigits: 0,
                          })}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {format(new Date(transaction.created_at), "dd MMM à HH:mm", {
                            locale: fr,
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>

    <Popover open={isChatPopoverOpen} onOpenChange={setIsChatPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          className="fixed right-4 bottom-24 sm:bottom-10 sm:right-8 h-16 w-16 p-0  bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-xl shadow-primary/40 hover:shadow-primary/60 transition-all duration-300 transform hover:-translate-y-2 hover:scale-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary border border-primary/30"
          aria-label="Ouvrir le chat"
        >
          <div className="relative flex items-center justify-center w-full h-full">
            <svg
              className="h-7 w-7"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background animate-pulse shadow-sm" />
          </div>
          <span className="sr-only">Ouvrir le chat</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-56 p-2 mb-2 mr-2" 
        align="end"
        side="top"
      >
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={() => {
              const whatsappNumber = settings?.whatsapp_phone || "0544360901"
              window.open(`https://wa.me/${whatsappNumber}`, "_blank")
              setIsChatPopoverOpen(false)
            }}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#25D366] text-white">
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium text-sm">WhatsApp</span>
              <span className="text-xs text-muted-foreground">Chat sur WhatsApp</span>
            </div>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={() => {
              const telegramUsername = settings?.telegram 
              window.open(`${telegramUsername}`, "_blank")
              setIsChatPopoverOpen(false)
            }}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white">
              <Send className="h-4 w-4" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium text-sm">Telegram</span>
              <span className="text-xs text-muted-foreground">Chat sur Telegram</span>
            </div>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
    </>
  )
}
