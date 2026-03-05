"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, Filter, RefreshCw, ArrowLeft } from "lucide-react"
import {networkApi, transactionApi} from "@/lib/api-client"
import type {Network, Transaction} from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { formatPhoneNumberForDisplay } from "@/lib/utils"
import TransactionCard from "@/components/ui/transaction-card";

export default function TransactionHistoryPage() {
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
  }, []);

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
    }catch (error) {
      console.error('Error loading networks : ',error)
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
    <div className="max-w-6xl mx-auto">
      <div className="space-y-3">
        {/* Back Button */}
        <div className="flex items-center justify-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 h-8 px-3 hover:bg-primary/10 text-muted-foreground hover:text-foreground text-xs"
          >
            <ArrowLeft className="h-3 w-3" />
            Retour
          </Button>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">Historique</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Vos transactions
          </p>
        </div>

        {/* Filters */}
        <div className="border rounded-lg p-3 sm:p-4">
          <h2 className="flex items-center gap-2 text-sm mb-3">
            <Filter className="h-3 w-3" />
            Filtres
          </h2>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
            <div className="relative col-span-2 sm:col-span-1">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={(value) => handleFilterChange("type", value)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="deposit">Dépôts</SelectItem>
                <SelectItem value="withdrawal">Retraits</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger className="h-8 text-xs">
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
            
            <Button variant="outline" onClick={clearFilters} className="h-8 text-xs">
              Effacer
            </Button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="border rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3 text-sm">
            <span>{totalCount} transactions</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={fetchTransactions}
                disabled={isLoading}
                className="h-7 px-2 text-xs"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
          </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground">Aucune transaction</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction) => {
                  const network = networks.find(n=> n.id == transaction.network)
                  return(
                      <TransactionCard transaction={transaction} network={network}/>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-7 text-xs px-2"
                >
                  Précédent
                </Button>
                <span className="text-xs text-muted-foreground">
                  {currentPage}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-7 text-xs px-2"
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