"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { 
  Home, 
  Wallet, 
  Ticket, 
  Gift, 
  History, 
  User, 
  LogOut,
  ChevronDown
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface NavLink {
  href: string
  label: string
  icon: React.ElementType
}

const navLinks: NavLink[] = [
  { href: "/dashboardv2", label: "Accueil", icon: Home },
  { href: "/dashboardv2/deposit", label: "Dépôt", icon: Wallet },
  { href: "/dashboardv2/withdrawal", label: "Retrait", icon: History },
  { href: "/dashboardv2/coupon", label: "Coupons", icon: Ticket },
  { href: "/dashboardv2/bonus", label: "Bonus", icon: Gift },
]

export function AppBar() {
  const { user, logout } = useAuth()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    setIsProfileMenuOpen(false)
  }

  return (
    <>
      {/* Desktop Navbar */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm py-3"
            : "bg-transparent py-4"
        )}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/dashboardv2" className="flex items-center gap-2 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                <Image
                  src="/Slater-logo.png"
                  alt="Slater"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300 sm:block drop-shadow-sm">
                Slater
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group"
                >
                  <link.icon className="h-4 w-4 inline-block mr-2 group-hover:scale-110 transition-transform duration-200" />
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full group-hover:-translate-x-1/2" />
                </Link>
              ))}
            </nav>

            {/* Desktop User Profile */}
            <div className="items-center gap-3">
              {mounted && user ? (
                <DropdownMenu open={isProfileMenuOpen} onOpenChange={setIsProfileMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                      <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {user.first_name}
                      </span>
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl border-2 shadow-xl">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                      <Link href="/dashboardv2/profile" className="flex items-center gap-3">
                        <User className="h-4 w-4 text-slate-500" />
                        <span>Profil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleLogout} 
                      className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Se déconnecter</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  className="h-10 px-3 rounded-xl text-slate-500 dark:text-slate-400"
                  disabled
                >
                  <User className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

    </>
  )
}
