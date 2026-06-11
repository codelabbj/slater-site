import type React from "react"
// import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

const APK_DOWNLOAD_URL = "/app-v1.0.2.apk"
const APK_FILE_NAME = "Slater-v1.0.2.apk"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-60 blur-3xl" style={{ background: "radial-gradient(90% 70% at 20% 0%, rgba(50, 251, 255, 0.28) 0%, transparent 60%)" }} />
        <div className="absolute inset-0 opacity-70 blur-[110px]" style={{ background: "radial-gradient(70% 60% at 80% 10%, rgba(23, 161, 255, 0.20) 0%, transparent 60%)" }} />
      </div>

      <div className="mb-6 sm:mb-8 flex flex-col items-center gap-2">
        {/* <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/25 glow-primary">
        <Image
          src="/Slater-logo.png"
          alt="Slater Logo"
            width={48}
          height={16}
            className="h-auto w-auto max-w-[160px]"
          priority
        />
        </div> */}
        {/* <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Espace sécurisé</p> */}
        <Button
        asChild
        variant="outline"
        className="w-full h-12 sm:h-11 text-base sm:text-sm font-bold flex items-center justify-center gap-3 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 text-foreground rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <a href={APK_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
          {/* <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 text-primary">
            <Download className="h-4 w-4" />
          </div> */}
          📱 Télécharger l'application mobile
        </a>
      </Button>
      </div>

      <div className="w-full max-w-lg">{children}</div>
    </div>
  )
}
