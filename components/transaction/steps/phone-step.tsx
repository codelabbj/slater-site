"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Edit, Trash2, Phone } from "lucide-react"
import { phoneApi } from "@/lib/api-client"
import type { Network, UserPhone } from "@/lib/types"
import { toast } from "react-hot-toast"
import { formatPhoneNumberForDisplay } from "@/lib/utils"

interface PhoneStepProps {
  selectedNetwork: Network | null
  selectedPhone: UserPhone | null
  onSelect: (phone: UserPhone) => void
  onNext: () => void
  type: "deposit" | "withdrawal"
}

// Country configurations with prefixes
const COUNTRIES = [
  { code: "BF", name: "Burkina Faso", prefix: "226" },
  { code: "SN", name: "Sénégal", prefix: "221" },
  { code: "BJ", name: "Bénin", prefix: "229" },
  { code: "CI", name: "Côte d'Ivoire", prefix: "225" },
]

export function PhoneStep({ selectedNetwork, selectedPhone, onSelect, onNext, type }: PhoneStepProps) {
  const [phones, setPhones] = useState<UserPhone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPhone, setEditingPhone] = useState<UserPhone | null>(null)
  const [newPhoneNumber, setNewPhoneNumber] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("BF")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [phoneToDelete, setPhoneToDelete] = useState<UserPhone | null>(null)

  useEffect(() => {
    if (selectedNetwork) {
      fetchPhones()
    }
  }, [selectedNetwork])

  const fetchPhones = async () => {
    if (!selectedNetwork) return

    setIsLoading(true)
    try {
      const data = await phoneApi.getAll(selectedNetwork.id, type)
      setPhones(data)
    } catch (error) {
      toast.error("Erreur lors du chargement des numéros de téléphone")
    } finally {
      setIsLoading(false)
    }
  }

  const getCountryPrefix = (countryCode: string) => {
    return COUNTRIES.find(c => c.code === countryCode)?.prefix || ""
  }

  const formatPhoneInput = (value: string, countryCode: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "")
    const prefix = getCountryPrefix(countryCode)

    // If the input already starts with the prefix, don't add it again
    if (digits.startsWith(prefix)) {
      return digits
    }

    // Add prefix if not present
    if (digits.length > 0) {
      return prefix + digits
    }

    return ""
  }

  const handleAddPhone = async () => {
    if (!newPhoneNumber.trim() || !selectedNetwork) return

    const formattedPhone = formatPhoneInput(newPhoneNumber, selectedCountry)

    setIsSubmitting(true)
    try {
      const newPhone = await phoneApi.create(formattedPhone, selectedNetwork.id)
      setPhones(prev => [...prev, newPhone])
      setNewPhoneNumber("")
      setSelectedCountry("BF")
      setIsAddDialogOpen(false)
      toast.success("Numéro de téléphone ajouté avec succès")
      // Auto-select and advance
      onSelect(newPhone)
      setTimeout(() => {
        onNext()
      }, 300)
    } catch (error: any) {
      console.error("Add phone error:", error)
      let errorMsg = "Erreur lors de l'ajout du numéro de téléphone"

      if (error.response?.status === 400) {
        const errorData = error.response.data
        if (errorData.phone) {
          errorMsg = Array.isArray(errorData.phone) ? errorData.phone[0] : errorData.phone
        } else if (errorData.detail || errorData.error || errorData.message) {
          errorMsg = errorData.detail || errorData.error || errorData.message
        }
      }

      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditPhone = async () => {
    if (!newPhoneNumber.trim() || !editingPhone || !selectedNetwork) return

    const formattedPhone = formatPhoneInput(newPhoneNumber, selectedCountry)

    setIsSubmitting(true)
    try {
      const updatedPhone = await phoneApi.update(editingPhone.id, formattedPhone, selectedNetwork.id)
      setPhones(prev => prev.map(p => (p.id === editingPhone.id ? updatedPhone : p)))
      setNewPhoneNumber("")
      setSelectedCountry("BF")
      setEditingPhone(null)
      setIsEditDialogOpen(false)
      toast.success("Numéro de téléphone modifié avec succès")
    } catch (error: any) {
      console.error("Edit phone error:", error)
      let errorMsg = "Erreur lors de la modification du numéro de téléphone"

      if (error.response?.status === 400) {
        const errorData = error.response.data
        if (errorData.phone) {
          errorMsg = Array.isArray(errorData.phone) ? errorData.phone[0] : errorData.phone
        } else if (errorData.detail || errorData.error || errorData.message) {
          errorMsg = errorData.detail || errorData.error || errorData.message
        }
      }

      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePhone = (phone: UserPhone) => {
    setPhoneToDelete(phone)
  }

  const confirmDeletePhone = async () => {
    if (!phoneToDelete) return

    try {
      await phoneApi.delete(phoneToDelete.id)
      setPhones(prev => prev.filter(p => p.id !== phoneToDelete.id))
      if (selectedPhone?.id === phoneToDelete.id) {
        onSelect(null as any)
      }
      toast.success("Numéro de téléphone supprimé avec succès")
      setPhoneToDelete(null)
    } catch (error) {
      toast.error("Erreur lors de la suppression du numéro de téléphone")
    }
  }

  const openEditDialog = (phone: UserPhone) => {
    setEditingPhone(phone)
    // Extract the phone number without the prefix
    const phoneDigits = phone.phone.replace(/\D/g, "")
    const prefix = getCountryPrefix(selectedCountry)
    const numberWithoutPrefix = phoneDigits.startsWith(prefix)
      ? phoneDigits.slice(prefix.length)
      : phoneDigits

    setNewPhoneNumber(numberWithoutPrefix)
    setIsEditDialogOpen(true)
  }

  if (!selectedNetwork) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-xs text-muted-foreground">Veuillez d'abord sélectionner un réseau</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Chargement des numéros de téléphone...</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Choisir un numéro de téléphone</h2>
          <p className="text-xs text-muted-foreground">
            Sélectionnez un numéro pour {selectedNetwork.public_name}
          </p>
        </div>

        {phones.length > 0 ? (
          <div className="space-y-2">
            <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2">
              {phones.map((phone) => (
                <div
                  key={phone.id}
                  className={`cursor-pointer transition-all duration-200 rounded-lg border overflow-hidden group ${
                    selectedPhone?.id === phone.id
                      ? "ring-2 ring-primary bg-primary/5 border-primary"
                      : "hover:bg-muted/50 hover:border-primary/50 border-border"
                  }`}
                  onClick={() => {
                    onSelect(phone)
                    setTimeout(() => {
                      onNext()
                    }, 300)
                  }}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Phone className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm break-all">
                            {formatPhoneNumberForDisplay(phone.phone)}
                          </h3>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditDialog(phone)
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
                            handleDeletePhone(phone)
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
            </div>

            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(true)}
              size="sm"
              className="w-full"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Ajouter un autre numéro
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-muted mb-3">
              <Phone className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Aucun numéro de téléphone</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Ajoutez un numéro de téléphone pour continuer
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Ajouter un numéro
            </Button>
          </div>
        )}
      </div>

      {/* Add Phone Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Ajouter un numéro de téléphone</DialogTitle>
            <DialogDescription>
              Sélectionnez votre pays et entrez votre numéro de téléphone
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block">Pays</label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code} className="rounded-lg">
                      {country.name} (+{country.prefix})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block">Numéro de téléphone</label>
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 px-3 h-11 sm:h-10 rounded-xl border border-input bg-muted flex items-center">
                  <span className="text-sm font-semibold text-muted-foreground">+{getCountryPrefix(selectedCountry)}</span>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                  placeholder="01 57 45 54 19"
                  className="h-11 sm:h-10 text-base sm:text-sm rounded-xl flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                setNewPhoneNumber("")
                setSelectedCountry("BF")
              }}
              className="w-full sm:w-auto h-11 sm:h-10 text-sm rounded-xl"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddPhone}
              disabled={!newPhoneNumber.trim() || isSubmitting}
              className="w-full sm:w-auto h-11 sm:h-10 text-sm rounded-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajout...
                </>
              ) : (
                "Ajouter"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Phone Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Modifier le numéro de téléphone</DialogTitle>
            <DialogDescription>
              Mettez à jour votre numéro de téléphone
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block">Pays</label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code} className="rounded-lg">
                      {country.name} (+{country.prefix})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block">Numéro de téléphone</label>
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 px-3 h-11 sm:h-10 rounded-xl border border-input bg-muted flex items-center">
                  <span className="text-sm font-semibold text-muted-foreground">+{getCountryPrefix(selectedCountry)}</span>
                </div>
                <Input
                  id="editPhone"
                  type="tel"
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                  placeholder="01 57 45 54 19"
                  className="h-11 sm:h-10 text-base sm:text-sm rounded-xl flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setNewPhoneNumber("")
                setEditingPhone(null)
                setSelectedCountry("BF")
              }}
              className="w-full sm:w-auto h-11 sm:h-10 text-sm rounded-xl"
            >
              Annuler
            </Button>
            <Button
              onClick={handleEditPhone}
              disabled={!newPhoneNumber.trim() || isSubmitting}
              className="w-full sm:w-auto h-11 sm:h-10 text-sm rounded-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Modification...
                </>
              ) : (
                "Modifier"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!phoneToDelete} onOpenChange={() => setPhoneToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement ce numéro de téléphone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePhone}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
