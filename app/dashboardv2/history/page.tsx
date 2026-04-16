"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, Filter, RefreshCw, ArrowLeft } from "lucide-react"
import { networkApi, transactionApi } from "@/lib/api-client"
import type { Network, Transaction } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { formatPhoneNumberForDisplay } from "@/lib/utils"
import TransactionCard from "@/components/ui/transaction-card"
import { AppBar } from "@/components/ui/app-bar"

export default function TransactionHistoryPageV2() {
  const router = useRouter()
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [networks, setNetworks] = useState<Network[]>([])
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "deposit" | "withdrawal">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accept" | "reject" | "timeout">("all")

  useEffect(() => {
    fetchTransactions()
  }, [currentPage, searchTerm, typeFilter, statusFilter])

  useEffect(() => {
    fetchNetworks()
  }, [])

  // Refetch data when the page gains focus to ensure fresh data
  useEffect(() => {
    const handleFocus = () => {
      fetchTransactions()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const fetchTransactions = async () => {
    setIsLoading(true)
    try {
      const params: any = {
        page: currentPage,
        page_size: 10,
      }
      
      if (searchTerm) params.search = searchTerm
      if (typeFilter !== "all") params.type_trans = typeFilter
      if (statusFilter !== "all") params.status = statusFilter
      
      const data = await transactionApi.getHistory(params)
      setTransactions(data.results)
      setTotalCount(data.count)
      setTotalPages(Math.ceil(data.count / 10))
    } catch (error) {
      toast.error("Erreur lors du chargement de l'historique")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchNetworks = async () => {
    try {
      const networkData = await networkApi.getAll()
      setNetworks(networkData)
    } catch (error) {
      console.error('Error loading networks : ', error)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === "type") {
      setTypeFilter(value as any)
    } else if (filterType === "status") {
      setStatusFilter(value as any)
    }
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setTypeFilter("all")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Veuillez vous connecter pour voir l'historique</p>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen">
      <AppBar />
      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboardv2")}
              className="flex items-center gap-1.5 h-9 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-300 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Historique</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Vos transactions
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-2xl p-3 bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-800/50 border border-blue-100 dark:border-slate-700 shadow-sm mb-6">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">
            <Filter className="h-3 w-3" />
            Filtres
          </h2>
          <div className="grid gap-1.5 grid-cols-2 sm:grid-cols-4">
            <div className="relative col-span-2 sm:col-span-1">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-3 w-3" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 h-8 text-xs rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={(value) => handleFilterChange("type", value)}>
              <SelectTrigger className="h-8 text-xs rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="deposit">Dépôts</SelectItem>
                <SelectItem value="withdrawal">Retraits</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger className="h-8 text-xs rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="accept">Accepté</SelectItem>
                <SelectItem value="reject">Rejeté</SelectItem>
                <SelectItem value="timeout">Expiré</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={clearFilters} className="h-8 text-xs rounded-xl border-blue-200 hover:bg-blue-50 hover:border-blue-300">
              Effacer
            </Button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="rounded-2xl p-3 bg-white border border-slate-200 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{totalCount} transactions</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={fetchTransactions}
              disabled={isLoading}
              className="h-8 w-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-900 dark:text-white" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 mb-3 mx-auto">
                <Search className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500">Aucune transaction</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => {
                const network = networks.find(n => n.id == transaction.network)
                return <TransactionCard key={transaction.id} transaction={transaction} network={network} basePath="/dashboardv2/history" />
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 text-xs rounded-xl border-slate-200 hover:bg-slate-50"
              >
                Précédent
              </Button>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {currentPage}/{totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 text-xs rounded-xl border-slate-200 hover:bg-slate-50"
              >
                Suivant
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
