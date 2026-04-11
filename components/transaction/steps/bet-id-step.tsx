"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Plus, Edit, Trash2 } from "lucide-react"
import { userAppIdApi } from "@/lib/api-client"
import type { UserAppId, Platform, SearchUserResponse } from "@/lib/types"
import { toast } from "react-hot-toast"

interface BetIdStepProps {
  selectedPlatform: Platform | null
  selectedBetId: UserAppId | null
  onSelect: (betId: UserAppId) => void
  onNext: () => void
  type: "deposit" | "withdrawal"
}

export function BetIdStep({ selectedPlatform, selectedBetId, onSelect, onNext, type }: BetIdStepProps) {
  const [betIds, setBetIds] = useState<UserAppId[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingBetId, setEditingBetId] = useState<UserAppId | null>(null)
  const [newBetId, setNewBetId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [betIdToDelete, setBetIdToDelete] = useState<UserAppId | null>(null)
  
  // Bet ID search states
  const [isSearching, setIsSearching] = useState(false)
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false)
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [searchResult, setSearchResult] = useState<{ name: string; userId: number; currencyId: number } | null>(null)
  const [pendingBetId, setPendingBetId] = useState<{ appId: string; betId: string } | null>(null)
  const [isEditingMode, setIsEditingMode] = useState(false)

  useEffect(() => {
    if (selectedPlatform) {
      fetchBetIds()
    }
  }, [selectedPlatform])

  const fetchBetIds = async () => {
    if (!selectedPlatform || !selectedPlatform.id) return
    
    setIsLoading(true)
    try {
      const data = await userAppIdApi.getByPlatform(selectedPlatform.id, type)
      setBetIds(data)
    } catch (error) {
      toast.error("Erreur lors du chargement des IDs de pari")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddBetId = async () => {
    if (!newBetId.trim() || !selectedPlatform || !selectedPlatform.id) return
    
    // Search for the user first
    setIsSearching(true)
    try {
      const response = await userAppIdApi.searchUser(selectedPlatform.id, newBetId.trim())
      
      // Validate user exists
      if (response.UserId === 0) {
        setErrorMessage("Utilisateur non trouvé avec cet ID de pari.")
        setIsErrorModalOpen(true)
        return
      }

      // Validate currency
      if (response.CurrencyId !== 27) {
        setErrorMessage("Cet utilisateur n'utilise pas la devise XOF. Seuls les utilisateurs avec la devise XOF peuvent être ajoutés.")
        setIsErrorModalOpen(true)
        return
      }

      // User is valid - show confirmation modal with search results
      setSearchResult({
        name: response.Name,
        userId: response.UserId,
        currencyId: response.CurrencyId,
      })
      setPendingBetId({ appId: selectedPlatform.id || "", betId: newBetId.trim() })
      setIsAddDialogOpen(false)
      setIsEditingMode(false)
      setIsConfirmationModalOpen(true)
    } catch (error: any) {
      console.error("Search error:", error)
      // Check for field-specific errors (400 status)
      if (error.response?.status === 400) {
        const errorData = error.response.data
        let errorMsg = "Erreur lors de la recherche"
        
        if (errorData.user_app_id) {
          errorMsg = Array.isArray(errorData.user_app_id) 
            ? errorData.user_app_id[0] 
            : errorData.user_app_id
        } else if (errorData.app) {
          errorMsg = Array.isArray(errorData.app) 
            ? errorData.app[0] 
            : errorData.app
        } else if (errorData.detail || errorData.error || errorData.message) {
          errorMsg = errorData.detail || errorData.error || errorData.message
        }
        
        setErrorMessage(errorMsg)
      } else {
        setErrorMessage("Erreur lors de la recherche de l'utilisateur. Veuillez réessayer.")
      }
      setIsErrorModalOpen(true)
    } finally {
      setIsSearching(false)
    }
  }

  const handleConfirmAddBetId = async () => {
    if (!pendingBetId || !selectedPlatform) return
    
    setIsSubmitting(true)
    try {
      const newBetIdData = await userAppIdApi.create(pendingBetId.betId, pendingBetId.appId)
      setBetIds(prev => [...prev, newBetIdData])
      setNewBetId("")
      setIsConfirmationModalOpen(false)
      setPendingBetId(null)
      setSearchResult(null)
      toast.success("ID de pari ajouté avec succès")
      // Auto-select and advance
      onSelect(newBetIdData)
      setTimeout(() => {
        onNext()
      }, 300)
    } catch (error: any) {
      console.error("Add bet ID error:", error)
      let errorMsg = "Erreur lors de l'ajout de l'ID de pari"
      
      if (error.response?.status === 400) {
        const errorData = error.response.data
        if (errorData.user_app_id) {
          errorMsg = Array.isArray(errorData.user_app_id) 
            ? errorData.user_app_id[0] 
            : errorData.user_app_id
        } else if (errorData.detail || errorData.error || errorData.message) {
          errorMsg = errorData.detail || errorData.error || errorData.message
        }
      }
      
      toast.error(errorMsg)
      setIsConfirmationModalOpen(false)
      setPendingBetId(null)
      setSearchResult(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditBetId = async () => {
    if (!newBetId.trim() || !editingBetId || !selectedPlatform || !selectedPlatform.id) return
    
    // If the bet ID hasn't changed, update directly without search
    if (editingBetId.user_app_id === newBetId.trim()) {
    setIsSubmitting(true)
    try {
      const updatedBetId = await userAppIdApi.update(
        editingBetId.id,
        newBetId.trim(),
          selectedPlatform.id || ""
      )
      setBetIds(prev => prev.map(betId => 
        betId.id === editingBetId.id ? updatedBetId : betId
      ))
      setNewBetId("")
      setEditingBetId(null)
      setIsEditDialogOpen(false)
      toast.success("ID de pari modifié avec succès")
    } catch (error) {
      toast.error("Erreur lors de la modification de l'ID de pari")
    } finally {
      setIsSubmitting(false)
    }
      return
    }

    // If bet ID changed, search first
    setIsSearching(true)
    try {
      const response = await userAppIdApi.searchUser(selectedPlatform.id, newBetId.trim())
      
      // Validate user exists
      if (response.UserId === 0) {
        setErrorMessage("Utilisateur non trouvé avec cet ID de pari.")
        setIsErrorModalOpen(true)
        return
      }

      // Validate currency
      if (response.CurrencyId !== 27) {
        setErrorMessage("Cet utilisateur n'utilise pas la devise XOF. Seuls les utilisateurs avec la devise XOF peuvent être ajoutés.")
        setIsErrorModalOpen(true)
        return
      }

      // User is valid - show confirmation modal with search results
      setSearchResult({
        name: response.Name,
        userId: response.UserId,
        currencyId: response.CurrencyId,
      })
      setPendingBetId({ appId: selectedPlatform.id || "", betId: newBetId.trim() })
      setIsEditDialogOpen(false)
      setIsEditingMode(true)
      setIsConfirmationModalOpen(true)
    } catch (error: any) {
      console.error("Search error:", error)
      // Check for field-specific errors (400 status)
      if (error.response?.status === 400) {
        const errorData = error.response.data
        let errorMsg = "Erreur lors de la recherche"
        
        if (errorData.user_app_id) {
          errorMsg = Array.isArray(errorData.user_app_id) 
            ? errorData.user_app_id[0] 
            : errorData.user_app_id
        } else if (errorData.app) {
          errorMsg = Array.isArray(errorData.app) 
            ? errorData.app[0] 
            : errorData.app
        } else if (errorData.detail || errorData.error || errorData.message) {
          errorMsg = errorData.detail || errorData.error || errorData.message
        }
        
        setErrorMessage(errorMsg)
      } else {
        setErrorMessage("Erreur lors de la recherche de l'utilisateur. Veuillez réessayer.")
      }
      setIsErrorModalOpen(true)
    } finally {
      setIsSearching(false)
    }
  }

  const handleConfirmEditBetId = async () => {
    if (!pendingBetId || !editingBetId || !selectedPlatform) return

    setIsSubmitting(true)
    try {
      const updatedBetId = await userAppIdApi.update(
        editingBetId.id,
        pendingBetId.betId,
        pendingBetId.appId
      )
      setBetIds(prev => prev.map(betId => 
        betId.id === editingBetId.id ? updatedBetId : betId
      ))
      setNewBetId("")
      setEditingBetId(null)
      setIsConfirmationModalOpen(false)
      setPendingBetId(null)
      setSearchResult(null)
      toast.success("ID de pari modifié avec succès")
    } catch (error: any) {
      console.error("Update bet ID error:", error)
      let errorMsg = "Erreur lors de la modification de l'ID de pari"
      
      if (error.response?.status === 400) {
        const errorData = error.response.data
        if (errorData.user_app_id) {
          errorMsg = Array.isArray(errorData.user_app_id) 
            ? errorData.user_app_id[0] 
            : errorData.user_app_id
        } else if (errorData.detail || errorData.error || errorData.message) {
          errorMsg = errorData.detail || errorData.error || errorData.message
        }
      }
      
      toast.error(errorMsg)
      setIsConfirmationModalOpen(false)
      setPendingBetId(null)
      setSearchResult(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteBetId = (betId: UserAppId) => {
    setBetIdToDelete(betId)
  }

  const confirmDeleteBetId = async () => {
    if (!betIdToDelete) return
    
    try {
      await userAppIdApi.delete(betIdToDelete.id)
      setBetIds(prev => prev.filter(b => b.id !== betIdToDelete.id))
      if (selectedBetId?.id === betIdToDelete.id) {
        onSelect(null as any)
      }
      toast.success("ID de pari supprimé avec succès")
      setBetIdToDelete(null)
    } catch (error) {
      toast.error("Erreur lors de la suppression de l'ID de pari")
    }
  }

  const openEditDialog = (betId: UserAppId) => {
    setEditingBetId(betId)
    setNewBetId(betId.user_app_id)
    setIsEditDialogOpen(true)
  }

  if (!selectedPlatform) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-xs text-muted-foreground">Veuillez d'abord sélectionner une plateforme</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Choisir votre ID de pari</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {betIds.map((betId) => (
              <div
                key={betId.id}
                className={`cursor-pointer transition-all duration-200 rounded-lg border overflow-hidden ${
                  selectedBetId?.id === betId.id
                    ? "ring-2 ring-primary bg-primary/5 border-primary"
                    : "hover:bg-muted/50 hover:border-primary/50 border-border"
                }`}
                onClick={() => {
                  onSelect(betId)
                  setTimeout(() => {
                    onNext()
                  }, 300)
                }}
              >
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm break-all">{betId.user_app_id}</h3>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditDialog(betId)
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteBetId(betId)
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {betIds.length === 0 && (
              <div className="text-center py-8">
                <p className="text-xs text-muted-foreground mb-3">Aucun ID de pari trouvé</p>
                <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Ajouter un ID
                </Button>
              </div>
            )}
            
            {betIds.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(true)}
                size="sm"
                className="w-full"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Ajouter un autre ID
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add Bet ID Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Ajouter un ID de pari</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                id="betId"
                value={newBetId}
                onChange={(e) => setNewBetId(e.target.value)}
                placeholder="Entrez votre ID de pari"
                className="h-11 sm:h-10 text-base sm:text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto h-11 sm:h-10 text-sm">
              Annuler
            </Button>
            <Button onClick={handleAddBetId} disabled={!newBetId.trim() || isSubmitting || isSearching} className="w-full sm:w-auto h-11 sm:h-10 text-sm">
              {isSubmitting || isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSearching ? "Recherche..." : "Ajout..."}
                </>
              ) : (
                "Ajouter"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bet ID Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Modifier l'ID de pari</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                id="editBetId"
                value={newBetId}
                onChange={(e) => setNewBetId(e.target.value)}
                placeholder="Entrez votre ID de pari"
                className="h-11 sm:h-10 text-base sm:text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto h-11 sm:h-10 text-sm">
              Annuler
            </Button>
            <Button onClick={handleEditBetId} disabled={!newBetId.trim() || isSubmitting || isSearching} className="w-full sm:w-auto h-11 sm:h-10 text-sm">
              {isSubmitting || isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSearching ? "Recherche..." : "Modification..."}
                </>
              ) : (
                "Modifier"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!betIdToDelete} onOpenChange={() => setBetIdToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement cet ID de pari.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteBetId} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bet ID Search Confirmation Modal */}
      <Dialog open={isConfirmationModalOpen} onOpenChange={setIsConfirmationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer {isEditingMode ? "la modification" : "l'ajout"}</DialogTitle>
            {searchResult && (
              <div className="text-muted-foreground text-sm space-y-2">
                <div>Utilisateur trouvé:</div>
                <div className="bg-muted p-3 rounded-md space-y-1">
                  <div><strong>Nom:</strong> {searchResult.name}</div>
                  <div><strong>ID utilisateur:</strong> {searchResult.userId}</div>
                  <div><strong>Devise:</strong> XOF (ID: {searchResult.currencyId})</div>
                </div>
                <div className="mt-2">Voulez-vous {isEditingMode ? "modifier" : "ajouter"} cet ID de pari à votre liste?</div>
              </div>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmationModalOpen(false)
                setPendingBetId(null)
                setSearchResult(null)
                setIsEditingMode(false)
                if (editingBetId) {
                  setEditingBetId(null)
                  setNewBetId("")
                }
              }}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button 
              onClick={isEditingMode ? handleConfirmEditBetId : handleConfirmAddBetId} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditingMode ? "Modification..." : "Ajout..."}
                </>
              ) : (
                "Confirmer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bet ID Search Error Modal */}
      <Dialog open={isErrorModalOpen} onOpenChange={setIsErrorModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Erreur</DialogTitle>
            <DialogDescription className="text-destructive">
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsErrorModalOpen(false)
                setErrorMessage("")
              }}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
