"use client"

export function Footer() {
  return (
    <footer className="w-full py-4 text-center text-xs sm:text-sm text-muted-foreground border-t border-primary/10 bg-background/90 mt-auto backdrop-blur">
      <div className="flex items-center justify-center gap-2">
        <span className="inline-flex h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden />
        <span>Design repensé par{" "}
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
    </footer>
  )
}


