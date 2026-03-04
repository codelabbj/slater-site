"use client"

import React, { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, ArrowDownToLine, ArrowUpFromLine, Ticket, Phone, LogOut, User, Loader2, Bell, Gift } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { settingsApi } from "@/lib/api-client"
import { Footer } from "@/components/footer"

const coreNavigation = [
  { name: "Accueil", href: "/dashboard", icon: Home },
  { name: "Coupon", href: "/dashboard/coupon", icon: Ticket },
  { name: "Mes numéros", href: "/dashboard/phones", icon: Phone },
  { name: "Notifications", href: "/notifications", icon: Bell },
]

const financeNavigation = [
  { name: "Dépôt", href: "/dashboard/deposit", icon: ArrowDownToLine },
  { name: "Retrait", href: "/dashboard/withdrawal", icon: ArrowUpFromLine },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading, logout } = useAuth()
  const [referralBonusEnabled, setReferralBonusEnabled] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await settingsApi.get()
        setReferralBonusEnabled(settings?.referral_bonus === true)
      } catch (error) {
        console.error("Error fetching settings:", error)
        setReferralBonusEnabled(false)
      } finally {
        setIsLoadingSettings(false)
      }
    }
    if (user) {
      fetchSettings()
    }
  }, [user])

  const navigation = referralBonusEnabled
    ? [
        ...coreNavigation,
        { name: "Bonus", href: "/dashboard/bonus", icon: Gift },
      ]
    : coreNavigation

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Avoid SSR/client mismatch during hydration
    return <div className="min-h-screen bg-background" />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const userInitials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header - Fixed at top */}
      <header className="flex-shrink-0 z-50 px-2 sm:px-4 pt-2 sm:pt-4">
        <div className="relative isolate max-w-md mx-auto">
          <div className="absolute inset-0 -z-10 rounded-xl sm:rounded-2xl blur-2xl opacity-50" style={{ background: "radial-gradient(80% 60% at 50% 100%, rgba(50, 251, 255, 0.15), transparent 60%)" }} />
          <div className="rounded-xl sm:rounded-2xl bg-gradient-to-b from-white/80 via-white/90 to-white/60 dark:from-white/10 dark:via-white/8 dark:to-white/5 border border-border/60 shadow-lg">
            <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
              {/* Logo */}
              <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-primary/15 overflow-hidden">
                  <Image
                    src="/Slater-logo.png"
                    alt="Slater Logo"
                    width={40}
                    height={14}
                    className="h-5 w-auto sm:h-7 object-contain"
                    priority
                  />
                </div>
                <span className="text-base sm:text-lg font-bold text-foreground">Slater</span>
              </Link>

              {/* Right side actions */}
              <div className="flex items-center gap-1 sm:gap-2">
                <ThemeToggle />
                <Button asChild variant="ghost" size="icon" className="relative rounded-lg h-8 w-8 sm:h-10 sm:w-10">
                  <Link href="/notifications">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-lg p-0">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs sm:text-sm">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
                    <DropdownMenuLabel className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.first_name} {user.last_name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Mon Profil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/notifications" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <span>Notifications</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>Déconnexion</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content - Scrollable */}
      <main className="flex-1 overflow-y-auto container mx-auto px-3 sm:px-4 py-4">
        <div className="relative isolate max-w-md mx-auto">
          <div className="absolute inset-0 -z-10 rounded-3xl blur-3xl opacity-40" style={{ background: "radial-gradient(80% 65% at 50% 0%, rgba(50, 251, 255, 0.20), transparent 60%)" }} />
          <div className="rounded-3xl bg-gradient-to-b from-white/70 via-white/80 to-white/40 dark:from-white/5 dark:via-white/5 dark:to-white/0 border border-border/70 shadow-[0_20px_60px_-30px_rgba(5,12,22,0.45)] p-3 sm:p-5">
            {children}
          </div>
        </div>
      </main>

      {/* Footer - Fixed at bottom */}
      <Footer />
    </div>
  )
}
