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
    <div className="relative flex-1 flex flex-col bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-primary/15 via-primary/8 to-transparent blur-3xl" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-transparent">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="mt-3 sm:mt-4 mb-3 sm:mb-4 rounded-2xl glass-panel shadow-lg">
          {/* Top row with logo and user menu */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
              <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30 glow-primary overflow-hidden">
                <Image
                      src="/Slater-logo.png"
                      alt="Slater Logo"
                      width={48}
                      height={16}
                      className="h-8 w-auto object-contain"
                  priority
                />
                  </div>
                  <div className="hidden sm:flex flex-col leading-tight">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Slater</span>
                    <span className="text-sm font-semibold text-foreground">Espace client</span>
                  </div>
              </Link>
            </div>

              {/* Mobile: Show "Slater" title in center, Desktop: Theme toggle, notifications, and User menu */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Mobile: Slater title in center */}
                <div className="sm:hidden absolute left-1/2 transform -translate-x-1/2 flex flex-col leading-tight">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Slater</span>
                  <span className="text-sm font-semibold text-foreground">Espace client</span>
                </div>

                {/* Desktop: Theme toggle and notifications */}
                <div className="hidden sm:flex items-center gap-1 sm:gap-2">
                  <ThemeToggle />
                  <Button asChild variant="ghost" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full glow-primary">
                    <Link href="/notifications" className="flex items-center justify-center">
                      <Bell className="h-4 w-4" />
                      <span className="sr-only">Notifications</span>
                    </Link>
                  </Button>
                </div>


              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-12 w-12 sm:h-14 sm:w-14 p-0 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 border border-primary/30 shadow-lg shadow-primary/20 glow-primary hover:shadow-primary/30 hover:scale-105 transition-all duration-200"
                    >
                      <div className="relative flex items-center justify-center w-full h-full">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-primary/40 ring-offset-1 ring-offset-background">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm sm:text-base font-bold">
                            {userInitials}
                          </AvatarFallback>
                  </Avatar>
                      </div>
                </Button>
              </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-64 p-0 glass-panel border-primary/20 shadow-2xl shadow-primary/10 rounded-2xl overflow-hidden"
                    align="end"
                    forceMount
                    sideOffset={8}
                  >
                    {/* Profile Header */}
                    <div className="bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 p-4 border-b border-primary/20">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-primary/30">
                          <AvatarFallback className="bg-primary text-primary-foreground font-bold text-base">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">
                      {user.first_name} {user.last_name}
                    </p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <DropdownMenuItem asChild className="rounded-xl px-3 py-3 hover:bg-primary/10 focus:bg-primary/10 transition-colors">
                        <Link href="/dashboard/profile" className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 text-primary">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-medium">Mon Profil</span>
                            <p className="text-xs text-muted-foreground">Gérer mes informations</p>
                  </div>
                  </Link>
                </DropdownMenuItem>

                      {/* Mobile: Theme toggle and notifications in dropdown */}
                      <div className="sm:hidden">
                        <DropdownMenuSeparator className="my-2" />
                        <DropdownMenuItem asChild className="rounded-xl px-3 py-3 hover:bg-primary/10 focus:bg-primary/10 transition-colors">
                          <Link href="/notifications" className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 text-primary">
                              <Bell className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="font-medium">Notifications</span>
                              <p className="text-xs text-muted-foreground">Voir mes notifications</p>
                            </div>
                          </Link>
                        </DropdownMenuItem>

                        <div className="px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Thème</span>
                            <ThemeToggle />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Changer le thème sombre/clair</p>
                        </div>

                        <DropdownMenuSeparator className="my-2" />
                      </div>

                      {/* Desktop: Separator only */}
                      <div className="hidden sm:block">
                        <DropdownMenuSeparator className="my-2" />
                      </div>

                      <DropdownMenuItem
                        onClick={logout}
                        className="rounded-xl px-3 py-3 hover:bg-destructive/10 focus:bg-destructive/10 text-destructive focus:text-destructive transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/15 text-destructive">
                            <LogOut className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-medium">Déconnexion</span>
                            <p className="text-xs text-muted-foreground">Se déconnecter du compte</p>
                          </div>
                        </div>
                </DropdownMenuItem>
                    </div>
              </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-3 sm:px-4 pb-24 lg:pb-10">
        <div className="relative isolate">
          <div className="absolute inset-0 -z-10 rounded-3xl blur-3xl opacity-40" style={{ background: "radial-gradient(80% 65% at 50% 0%, rgba(50, 251, 255, 0.20), transparent 60%)" }} />
          <div className="rounded-3xl bg-gradient-to-b from-white/70 via-white/80 to-white/40 dark:from-white/5 dark:via-white/5 dark:to-white/0 border border-border/70 shadow-[0_20px_60px_-30px_rgba(5,12,22,0.45)] p-3 sm:p-5">
            {children}
          </div>
        </div>
      </main>

    </div>
  )
}
