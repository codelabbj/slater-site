"use client"

import { Button } from "@/components/ui/button"
import { Youtube, ChevronRight } from "lucide-react"
import type { Platform } from "@/lib/types"

interface TutoStepProps {
  selectedPlatform: Platform | null
  onNext: () => void
  type?: "deposit" | "withdrawal"
}

export function TutoStep({ selectedPlatform, onNext, type = "deposit" }: TutoStepProps) {
  const isDeposit = type === "deposit"
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 py-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Besoin d&apos;aide ?</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[280px] mx-auto">
          Consultez {type === "deposit" ? "notre tutoriel vidéo" : "nos tutoriels vidéo"} pour faciliter votre {type === "deposit" ? "dépôt" : "retrait"}.
        </p>
      </div>

      <div className="space-y-4">
        {isDeposit && selectedPlatform?.deposit_tuto_link && (
          <div 
            onClick={() => window.open(selectedPlatform.deposit_tuto_link!, "_blank")}
            className="group relative overflow-hidden bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 cursor-pointer active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div className="w-16 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-red-100 dark:border-red-900/30">
              <Youtube className="h-8 w-8 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-red-600 font-bold mb-0.5">Tutoriel vidéo</p>
              <p className="text-sm font-bold leading-tight text-slate-900 dark:text-white">
                Comment effectuer un dépôt sur {selectedPlatform?.name || "1XBET"} ?
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-red-600 transition-colors" />
          </div>
        )}

        {!isDeposit && selectedPlatform?.withdrawal_tuto_link && (
          <div 
            onClick={() => window.open(selectedPlatform.withdrawal_tuto_link!, "_blank")}
            className="group relative overflow-hidden bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 cursor-pointer active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div className="w-16 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-red-100 dark:border-red-900/30">
              <Youtube className="h-8 w-8 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-red-600 font-bold mb-0.5">Tutoriel vidéo</p>
              <p className="text-sm font-bold leading-tight text-slate-900 dark:text-white">
                Comment obtenir un code {selectedPlatform?.name || "1XBET"} ?
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-red-600 transition-colors" />
          </div>
        )}

        {!isDeposit && selectedPlatform?.why_withdrawal_fail && (
          <div 
            onClick={() => window.open(selectedPlatform.why_withdrawal_fail!, "_blank")}
            className="group relative overflow-hidden bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 cursor-pointer active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div className="w-16 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center flex-shrink-0 border border-slate-100 dark:border-slate-700">
              <Youtube className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">Aide retrait</p>
              <p className="text-sm font-bold leading-tight text-slate-900 dark:text-white">
                Pourquoi mon retrait a échoué ?
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
          </div>
        )}
      </div>

      <div className="pt-8">
        <Button 
          onClick={onNext}
          className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white text-base font-extrabold shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
        >
          {isDeposit ? "J'ai compris, continuer" : "J'ai déjà un code de retrait"}
        </Button>
      </div>
    </div>
  )
}
