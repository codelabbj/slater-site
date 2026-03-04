"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { phoneApi } from "@/lib/api-client"
import type { UserPhone, Network } from "@/lib/types"
import { toast } from "react-hot-toast"
import { formatPhoneNumberForDisplay } from "@/lib/utils"

const COUNTRY_OPTIONS = [
  { label: "Burkina Faso", value: "bf", prefix: "+226" },
  { label: "Sénégal", value: "sn", prefix: "+221" },
  { label: "Bénin", value: "bj", prefix: "+229" },
  { label: "Côte d'Ivoire", value: "ci", prefix: "+225" },
]

const DEFAULT_COUNTRY_VALUE = "ci"

const buildInternationalPhone = (input: string, countryValue: string) => {
  const country = COUNTRY_OPTIONS.find(option => option.value === countryValue)
  if (!country) return input.trim()

  let sanitized = input.trim().replace(/\s+/g, "")
  if (!sanitized) return `${country.prefix}`

  if (sanitized.startsWith(country.prefix)) {
    sanitized = sanitized.slice(country.prefix.length)
  } else {
    const numericPrefix = country.prefix.replace("+", "")
    if (sanitized.startsWith(numericPrefix)) {
      sanitized = sanitized.slice(numericPrefix.length)
    }
  }

  if (sanitized.startsWith("+")) {
    sanitized = sanitized.slice(1)
  }

  return `${country.prefix}${sanitized}`
}

const parsePhoneByCountry = (phone: string) => {
  const sanitized = phone.replace(/\s+/g, "")
  for (const country of COUNTRY_OPTIONS) {
    if (sanitized.startsWith(country.prefix)) {
      return {
        countryValue: country.value,
        localNumber: sanitized.slice(country.prefix.length),
      }
    }
  }
  return {
    countryValue: DEFAULT_COUNTRY_VALUE,
    localNumber: sanitized,
  }
}

interface PhoneStepProps {
  selectedNetwork: Network | null
  selectedPhone: UserPhone | null
  onSelect: (phone: UserPhone) => void
  onNext: () => void
}

export function PhoneStep({ selectedNetwork, selectedPhone, onSelect, onNext }: PhoneStepProps) {
  const [phones, setPhones] = useState<UserPhone[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPhone, setEditingPhone] = useState<UserPhone | null>(null)
  const [newPhone, setNewPhone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [phoneToDelete, setPhoneToDelete] = useState<UserPhone | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string>(DEFAULT_COUNTRY_VALUE)
  const [editingCountry, setEditingCountry] = useState<string>(DEFAULT_COUNTRY_VALUE)

  useEffect(() => {
    if (selectedNetwork) {
      fetchPhones()
    }
  }, [selectedNetwork])

  const fetchPhones = async () => {
    if (!selectedNetwork) return
    
    setIsLoading(true)
    try {
      // Use network parameter to get phones filtered by network UID
      const data = await phoneApi.getAll(selectedNetwork.id)
      setPhones(data)
    } catch (error) {
      toast.error("Erreur lors du chargement des numéros de téléphone")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPhone = async () => {
    if (!newPhone.trim() || !selectedNetwork) return

    const phoneWithPrefix = buildInternationalPhone(newPhone, selectedCountry)
    
    setIsSubmitting(true)
    try {
      const newPhoneData = await phoneApi.create(phoneWithPrefix, selectedNetwork.id)
      setPhones(prev => [...prev, newPhoneData])
      setNewPhone("")
      setSelectedCountry(DEFAULT_COUNTRY_VALUE)
      setIsAddDialogOpen(false)
      toast.success("Numéro de téléphone ajouté avec succès")
      // Auto-select and advance
      onSelect(newPhoneData)
      setTimeout(() => {
        onNext()
      }, 300)
    } catch (error) {
      toast.error("Erreur lors de l'ajout du numéro de téléphone")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditPhone = async () => {
    if (!newPhone.trim() || !editingPhone || !selectedNetwork) return

    const phoneWithPrefix = buildInternationalPhone(newPhone, editingCountry)
    
    setIsSubmitting(true)
    try {
      const updatedPhone = await phoneApi.update(
        editingPhone.id,
        phoneWithPrefix,
        selectedNetwork.id
      )
      setPhones(prev => prev.map(phone => 
        phone.id === editingPhone.id ? updatedPhone : phone
      ))
      setNewPhone("")
      setEditingPhone(null)
      setEditingCountry(DEFAULT_COUNTRY_VALUE)
      setIsEditDialogOpen(false)
      toast.success("Numéro de téléphone modifié avec succès")
    } catch (error) {
      toast.error("Erreur lors de la modification du numéro de téléphone")
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
    const { countryValue, localNumber } = parsePhoneByCountry(phone.phone)
    setEditingPhone(phone)
    setEditingCountry(countryValue)
    setNewPhone(localNumber)
    setIsEditDialogOpen(true)
  }

  const openAddDialog = () => {
    setSelectedCountry(DEFAULT_COUNTRY_VALUE)
    setNewPhone("")
    setIsAddDialogOpen(true)
  }

  if (!selectedNetwork) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-xs text-muted-foreground">Veuillez d'abord sélectionner un réseau</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Choisir un numéro de téléphone</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {phones.map((phone) => (
              <div
                key={phone.id}
                className={`cursor-pointer transition-all duration-200 rounded-lg border overflow-hidden ${
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
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm break-all">{formatPhoneNumberForDisplay(phone.phone)}</h3>
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
            
            {phones.length === 0 && (
              <div className="text-center py-8">
                <p className="text-xs text-muted-foreground mb-3">Aucun numéro de téléphone trouvé</p>
                <Button
                  onClick={openAddDialog}
                  size="sm"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Ajouter un numéro
                </Button>
              </div>
            )}
            
            {phones.length > 0 && (
              <Button 
                variant="outline" 
                onClick={openAddDialog}
                size="sm"
                className="w-full"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Ajouter un autre numéro
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add Phone Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Ajouter un numéro de téléphone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedCountry}
                  onValueChange={setSelectedCountry}
                >
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Choisir un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map(country => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label} ({country.prefix})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              <Input
                id="phone"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Ex: 07 12 34 56 78"
                  className="h-11 sm:h-10 text-base sm:text-sm flex-1"
              />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto h-11 sm:h-10 text-sm">
              Annuler
            </Button>
            <Button onClick={handleAddPhone} disabled={!newPhone.trim() || isSubmitting} className="w-full sm:w-auto h-11 sm:h-10 text-sm">
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
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Modifier le numéro de téléphone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editPhone">Numéro de téléphone</Label>
              <div className="flex gap-2">
                <Select
                  value={editingCountry}
                  onValueChange={setEditingCountry}
                >
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Choisir un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map(country => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label} ({country.prefix})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              <Input
                id="editPhone"
                value={newPhone}
                onChange={(e) => {
                  const value = e.target.value
                  setNewPhone(value)
                  // Auto-detect country from prefix if user types a full number with prefix
                  const detected = parsePhoneByCountry(value)
                  if (detected.countryValue !== editingCountry) {
                    setEditingCountry(detected.countryValue)
                  }
                }}
                  placeholder="Ex: 07 12 34 56 78"
                  className="h-11 sm:h-10 text-base sm:text-sm flex-1"
              />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto h-11 sm:h-10 text-sm">
              Annuler
            </Button>
            <Button onClick={handleEditPhone} disabled={!newPhone.trim() || isSubmitting} className="w-full sm:w-auto h-11 sm:h-10 text-sm">
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement ce numéro de téléphone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeletePhone} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
