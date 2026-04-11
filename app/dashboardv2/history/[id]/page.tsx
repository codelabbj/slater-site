"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  ArrowLeft, 
  Info, 
  Copy, 
  Phone, 
  DollarSign, 
  Receipt, 
  Calendar, 
  User,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { transactionApi, settingsApi, networkApi } from "@/lib/api-client"
import type { Transaction, Network, Settings } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import toast from "react-hot-toast"
import { Suspense } from "react"

function TransactionDetailContent() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [networks, setNetworks] = useState<Network[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      let transactionData = null;
      try {
        const cached = sessionStorage.getItem('cached_transaction')
        if (cached) {
          const parsed = JSON.parse(cached)
          if (String(parsed.id) === String(id) || String(parsed.reference) === String(id)) {
            transactionData = parsed
          }
        }
      } catch (e) {}

      if (!transactionData) {
        const response: any = await transactionApi.getHistory({ page: 1, page_size: 50 })
        transactionData = response.results?.find?.((t: any) => String(t.id) === String(id) || String(t.reference) === String(id) || String(t.uid) === String(id))
        if (transactionData) {
          sessionStorage.setItem('cached_transaction', JSON.stringify(transactionData))
        } else {
          throw new Error("Transaction non trouvée dans l'historique.")
        }
      }

      const [networksData, settingsData] = await Promise.all([
        networkApi.getAll(),
        settingsApi.get()
      ])
      
      setTransaction(transactionData)
      setNetworks(networksData)
      setSettings(settingsData)
    } catch (err) {
      console.error("Error fetching transaction details:", err)
      setError("Erreur lors du chargement de la transaction")
    } finally {
      setIsLoading(false)
    }
  }

  if (!id) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <p className="text-destructive mb-4">ID de transaction manquant</p>
        <Button onClick={() => router.back()}>Retour</Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <p className="text-destructive mb-4">{error || "Transaction non trouvée"}</p>
        <Button onClick={() => router.back()}>Retour</Button>
      </div>
    )
  }

  const network = networks?.find(n => n.id === transaction.network)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copié dans le presse-papier")
  }

  const getStatusInfo = (status: string) => {
    const s = status.toLowerCase()
    switch (s) {
      case "accept":
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
          bgColor: "bg-emerald-50",
          textColor: "text-emerald-700",
          message: "Transaction effectuée avec succès"
        }
      case "error":
      case "annuler":
      case "fail":
        return {
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          bgColor: "bg-red-50",
          textColor: "text-red-700",
          message: s === "annuler" ? "La transaction a été annulée" : "La transaction a échoué"
        }
      default:
        return {
          icon: <Info className="h-5 w-5 text-blue-500" />,
          bgColor: "bg-blue-50",
          textColor: "text-blue-700",
          message: "Transaction en cours de traitement"
        }
    }
  }

  const statusInfo = getStatusInfo(transaction.status)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      {/* Header - EXACT MOBILE STYLE */}
      <header className="px-4 py-4 flex items-center sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b max-w-2xl mx-auto w-full">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-white dark:bg-slate-800 border shadow-sm" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-bold flex-1 text-center pr-10">Détails de la transaction</h1>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-6">
        {/* Amount Section */}
        <div className="text-center py-4">
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
             {transaction.amount.toLocaleString()} <span className="text-2xl">FCFA</span>
          </h2>
        </div>

        {/* Status Message Banner - EXACT MOBILE STYLE */}
        <div className={`rounded-[2rem] p-6 flex items-start gap-4 border ${statusInfo.bgColor} dark:bg-opacity-10 ${statusInfo.textColor} shadow-lg backdrop-blur-md animate-in zoom-in-95 duration-500`}>
          <div className="mt-1 flex-shrink-0">
            <div className="bg-white/40 dark:bg-black/20 rounded-full p-2 shadow-sm">
              {statusInfo.icon}
            </div>
          </div>
          <div>
            <p className="font-extrabold text-lg mb-0.5">Statut</p>
            <p className="text-sm font-medium opacity-90 leading-relaxed">{statusInfo.message}</p>
          </div>
        </div>

        {/* Transaction Information Card - EXACT MOBILE STYLE */}
        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CardContent className="p-6 sm:p-8 space-y-7">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Détails du paiement</h3>

            <div className="space-y-6">
              {/* Application Row */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {transaction.app_details?.image ? (
                    <img src={transaction.app_details.image} alt="" className="w-3/4 h-3/4 object-contain" />
                  ) : (
                    <div className="w-full h-full bg-blue-900 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">1xBet</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 border-b dark:border-slate-800 pb-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Application</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
                    {transaction.app_details?.name || transaction.app}
                  </p>
                </div>
              </div>

              {/* Network Row */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 p-1.5">
                  {network?.image ? (
                    <img src={network.image} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <Phone className="h-6 w-6 text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0 border-b dark:border-slate-800 pb-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Réseau</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
                    {network?.public_name || "N/A"}
                  </p>
                </div>
              </div>

              {/* Number Row */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-6 w-6 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0 border-b dark:border-slate-800 pb-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Numéro</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {transaction.phone_number}
                  </p>
                </div>
              </div>

              {/* Reference Row */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                  <Receipt className="h-6 w-6 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0 border-b dark:border-slate-800 pb-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Référence</p>
                    <p className="text-sm font-mono font-bold text-slate-900 dark:text-white break-all leading-tight">
                      {transaction.reference}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 flex-shrink-0 rounded-full hover:bg-primary/10" 
                    onClick={() => handleCopy(transaction.reference)}
                  >
                    <Copy className="h-4 w-4 text-primary" />
                  </Button>
                </div>
              </div>

              {/* Date Row */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0 border-b dark:border-slate-800 pb-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Date</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatDate(transaction.created_at)}
                  </p>
                </div>
              </div>

              {/* App ID Row */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg border-2 border-primary/20 flex items-center justify-center">
                       <User className="h-4 w-4 text-primary" />
                    </div>
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-0.5">
                    {transaction.app_details?.name || "Application"} ID
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {transaction.user_app_id}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support Button - EXACT MOBILE STYLE */}
        <div className="pt-4 pb-10">
          <Button 
            className="w-full h-16 rounded-[1.5rem] bg-white dark:bg-slate-900 text-primary border border-primary/10 text-xl font-bold shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 backdrop-blur-xl"
            onClick={() => {
              const phone = settings?.whatsapp_phone || "2250544360901"
              const message = `Bonjour, j'ai besoin d'aide pour ma transaction:\n- Réf: ${transaction.reference}\n- Montant: ${transaction.amount} FCFA\n- Date: ${formatDate(transaction.created_at)}`
              
              const encodedMsg = encodeURIComponent(message)
              window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank')
            }}
          >
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="h-6 w-6" />
            </div>
            Contacter le support
          </Button>
        </div>

        <div className="flex justify-center -mt-6">
          <Button variant="ghost" onClick={() => router.push("/dashboardv2/history")} className="text-sm font-semibold text-slate-400 hover:text-primary">
            Voir l&apos;historique complet
          </Button>
        </div>
      </main>
    </div>
  )
}

export default function TransactionDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <TransactionDetailContent />
    </Suspense>
  )
}
