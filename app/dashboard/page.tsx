"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ArrowDownToLine, ArrowUpFromLine, Wallet, Loader2, ArrowRight, RefreshCw, Send, Ticket, Gift, Copy, Check, Coins, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { transactionApi, advertisementApi, settingsApi, authApi, networkApi } from "@/lib/api-client"
import type { Transaction, Advertisement, Settings, User, Network } from "@/lib/types"
import { toast } from "react-hot-toast"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import TransactionCard from "@/components/ui/transaction-card"

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
  const [networks, setNetworks] = useState<Network[]>([])

  const fetchRecentTransactions = async () => {
    try {
      setIsLoadingTransactions(true)
      const data = await transactionApi.getHistory({
        page: 1,
        page_size: 5,
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
      if (response && response.results && Array.isArray(response.results)) {
        const enabledAds = response.results.filter(
          (ad: Advertisement) => ad.enable === true && (ad.image || ad.image_url)
        )
        setAdvertisements(enabledAds)
      } else {
        setAdvertisements([])
      }
    } catch (error) {
      console.error("Error fetching advertisement:", error)
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
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  const fetchNetworks = async () => {
    try {
      const networkData = await networkApi.getAll()
      setNetworks(networkData)
    } catch (error) {
      console.error("Error fetching networks:", error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchRecentTransactions()
      fetchAdvertisement()
      fetchSettings()
      fetchUserProfile()
      fetchNetworks()
    }
  }, [user])

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

  useEffect(() => {
    if (!carouselApi || advertisements.length <= 1 || isCarouselPaused) return
    const interval = setInterval(() => {
      carouselApi.scrollNext()
    }, 5000)
    return () => clearInterval(interval)
  }, [carouselApi, advertisements.length, isCarouselPaused])

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
      <div className="space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-1 sm:gap-2">
          <h1 className="text-xl sm:text-3xl font-bold text-foreground">
            Bonjour, {user?.first_name} 👋
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Voici un aperçu de votre activité
          </p>
        </div>

        {/* Advertisement Banner - Right after greeting */}
        <div className="relative isolate ">
          <div className="absolute inset-0 -z-10 rounded-2xl blur-xl opacity-40" style={{ background: "radial-gradient(80% 60% at 50% 100%, rgba(50, 251, 255, 0.2), transparent 60%)" }} />
          <div className="rounded-2xl bg-gradient-to-b from-white/90 via-white/95 to-white/80 dark:from-white/10 dark:via-white/8 dark:to-white/5 border border-border/60 shadow-lg overflow-hidden">
            <Card className="border-0 bg-transparent shadow-none py-0">
              <CardContent className="p-0">
                {isLoadingAd ? (
                  <div className="w-full aspect-[16/9] bg-muted/50 animate-pulse flex items-center justify-center rounded-xl">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : advertisements.length > 0 ? (
                  <div className="relative">
                    <Carousel
                      setApi={setCarouselApi}
                      opts={{ align: "start", loop: true }}
                      className="w-full"
                      onTouchStart={() => setIsCarouselPaused(true)}
                      onTouchEnd={() => setIsCarouselPaused(false)}
                      onMouseEnter={() => setIsCarouselPaused(true)}
                      onMouseLeave={() => setIsCarouselPaused(false)}
                    >
                      <CarouselContent>
                        {advertisements.map((ad) => {
                          const imageUrl = getAdvertisementImageUrl(ad)
                          const link = getAdvertisementLink(ad)
                          const adId = ad.id?.toString() || ""
                          const hasError = adImageErrors.has(adId)

                          if (!imageUrl || hasError) return null

                          return (
                            <CarouselItem key={adId}>
                              <div className="relative w-full aspect-[16/9]">
                                <Image
                                  src={imageUrl}
                                  alt={ad.title || "Publicité"}
                                  fill
                                  className="object-cover"
                                  onError={() => handleAdImageError(adId)}
                                />
                                {link && (
                                  <a href={link} target="_blank" rel="noopener noreferrer" className="absolute inset-0" />
                                )}
                              </div>
                            </CarouselItem>
                          )
                        })}
                      </CarouselContent>
                    </Carousel>
                    {/* Dots indicator */}
                    {advertisements.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                        {advertisements.map((_, index) => (
                          <div
                            key={index}
                            className="h-1.5 rounded-full bg-white/50 transition-all duration-300"
                            style={{ width: 6, opacity: 0.5 }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-[16/9] bg-muted/30 flex items-center justify-center rounded-xl">
                    <div className="text-center">
                      <p className="text-muted-foreground">Aucune publicité disponible</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-br from-background to-muted/20 border-muted">
          <CardContent className="p-2">
            <div className="flex items-center justify-around gap-2">
              <Link href="/dashboard/deposit" className="group flex flex-col items-center gap-1 flex-1">
                <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
                  <ArrowDownToLine className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Dépôt</span>
              </Link>

              <div className="h-8 w-px bg-border" />

              <Link href="/dashboard/withdrawal" className="group flex flex-col items-center gap-1 flex-1">
                <div className="p-2 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
                  <ArrowUpFromLine className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Retrait</span>
              </Link>

              <div className="h-8 w-px bg-border" />

              <Link href="/dashboard/coupon" className="group flex flex-col items-center gap-1 flex-1">
                <div className="p-2 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
                  <Ticket className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Coupons</span>
              </Link>

              {referralBonusEnabled && (
                <>
                  <div className="h-8 w-px bg-border" />
                  
                  <Link href="/dashboard/bonus" className="group flex flex-col items-center gap-1 flex-1">
                    <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
                      <Gift className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Bonus</span>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {referralBonusEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20">
                    <Copy className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Code de parrainage</p>
                    <p className="text-xs sm:text-sm font-mono font-semibold truncate">
                      {userProfile?.referral_code || user?.referral_code || "N/A"}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={copyReferralCode}>
                    {copiedReferralCode ? (
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/20">
                    <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Bonus disponible</p>
                    <p className="text-sm sm:text-lg font-bold text-amber-700 dark:text-amber-300">
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

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-xl font-semibold flex items-center gap-1.5 sm:gap-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Récents
            </h2>
            <div className="flex gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 sm:h-9"
                onClick={fetchRecentTransactions}
                disabled={isLoadingTransactions}
              >
                <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isLoadingTransactions ? 'animate-spin' : ''}`} />
              </Button>
              <Button asChild variant="ghost" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
                <Link href="/dashboard/history">
                  Tout voir
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          {isLoadingTransactions ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
            </div>
          ) : recentTransactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
                <Wallet className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base font-medium">Aucune transaction</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Vos transactions apparaîtront ici</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentTransactions.map((transaction) => {
                const network = networks.find(n => n.id == transaction.network)
                return <TransactionCard key={transaction.id} transaction={transaction} network={network} />
              })}
            </div>
          )}
        </div>

        {/* Download App Card */}
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div>
                <h3 className="text-sm sm:font-semibold font-medium">Télécharger l&apos;application</h3>
                <p className="text-xs sm:text-sm opacity-90">Version 1.0.2</p>
              </div>
              <Button asChild variant="secondary" className="shrink-0 h-8 sm:h-10 text-xs sm:text-sm">
                <a href="https://slaterci-mobile-app.vercel.app/releases/app-v1.0.2.apk" target="_blank" rel="noopener noreferrer">
                  Télécharger
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Popover */}
      <Popover open={isChatPopoverOpen} onOpenChange={setIsChatPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            className="fixed right-4 bottom-24 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all"
            aria-label="Ouvrir le chat"
          >
            <Send className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2 mb-2 mr-2" align="end" side="top">
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
                <Send className="h-4 w-4" />
              </div>
              <span className="font-medium text-sm">WhatsApp</span>
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
              <span className="font-medium text-sm">Telegram</span>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}