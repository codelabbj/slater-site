import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
// import { DevTools } from "@/components/dev-tools"
import { Toaster } from "react-hot-toast"
// import { ErudaLoader } from "@/components/eruda-loader"
import { Suspense } from "react"
import { NotificationInitializer } from "@/components/notification-initializer"


const inter = Inter({ subsets: ["latin"] })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Slater - Gestion de Dépôts et Retraits",
  description: "Plateforme de gestion de transactions pour paris sportifs",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.JSX.Element {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative min-h-screen flex flex-col overflow-hidden">
            {/* Enhanced animated gradient background */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              {/* Primary gradient - top left */}
              <div className="absolute inset-0 opacity-40 blur-3xl animate-float" 
                style={{ background: "radial-gradient(circle at 20% 10%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)" }} 
              />
              {/* Secondary gradient - top right */}
              <div className="absolute inset-0 opacity-35 blur-3xl animate-float-slow" 
                style={{ background: "radial-gradient(circle at 80% 5%, rgba(139, 92, 246, 0.25) 0%, transparent 50%)" }} 
              />
              {/* Accent gradient - center */}
              <div className="absolute inset-0 opacity-30 blur-[100px] animate-pulse-slow" 
                style={{ background: "radial-gradient(circle at 50% 40%, rgba(16, 185, 129, 0.2) 0%, transparent 60%)" }} 
              />
              {/* Bottom gradient */}
              <div className="absolute inset-0 opacity-25 blur-3xl animate-drift animate-delay-1000" 
                style={{ background: "radial-gradient(circle at 30% 90%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)" }} 
              />
              {/* Additional floating orbs */}
              <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20 bg-cyan-400 animate-float animate-delay-2000" />
              <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl opacity-20 bg-purple-400 animate-float-slow animate-delay-3000" />
              {/* Mesh overlay for texture */}
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} 
              />
            </div>
            <div className="flex-1 flex flex-col relative">
              <AuthProvider>
                <NotificationInitializer />
                {/* <ErudaLoader /> */}
                <Suspense fallback={null}>
                  {children}
                </Suspense>
                <Toaster position="top-right" />
                {/* <DevTools /> */}
              </AuthProvider>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
