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
            <div className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute inset-0 opacity-60 blur-3xl" style={{ background: "radial-gradient(120% 60% at 20% 0%, rgba(50, 251, 255, 0.35) 0%, transparent 55%)" }} />
              <div className="absolute inset-0 opacity-70 blur-[120px]" style={{ background: "radial-gradient(80% 70% at 80% 10%, rgba(23, 161, 255, 0.24) 0%, transparent 55%)" }} />
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
