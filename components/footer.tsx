"use client"

export function Footer() {
  return (
    <footer className="flex-shrink-0 px-2 sm:px-4 pb-2 sm:pb-4">
      <div className="relative isolate max-w-md mx-auto">
        <div className="absolute inset-0 -z-10 rounded-xl sm:rounded-2xl blur-2xl opacity-50" style={{ background: "radial-gradient(80% 60% at 50% 0%, rgba(50, 251, 255, 0.15), transparent 60%)" }} />
        <div className="rounded-xl sm:rounded-2xl bg-gradient-to-b from-white/80 via-white/90 to-white/60 dark:from-white/10 dark:via-white/8 dark:to-white/5 border border-border/60 shadow-lg">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm text-muted-foreground">
            <span className="inline-flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary animate-pulse" aria-hidden />
            <span>
              Développé par {" "}
              <a
                href="https://codelab.bj/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline transition-colors"
              >
                Code Lab
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}


