import type React from "react"
import Image from "next/image"

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
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/25 glow-primary">
        <Image
          src="/Slater-logo.png"
          alt="Slater Logo"
            width={48}
          height={16}
            className="h-auto w-auto max-w-[160px]"
          priority
        />
        </div>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Espace sécurisé</p>
      </div>

      <div className="w-full max-w-lg">{children}</div>
    </div>
  )
}
