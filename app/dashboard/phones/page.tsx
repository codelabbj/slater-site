"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { phoneApi, userAppIdApi, networkApi, platformApi } from "@/lib/api-client"
import type { UserPhone, UserAppId, Network, Platform } from "@/lib/types"
import { toast } from "react-hot-toast"
import { Loader2, Phone, Plus, Trash2, Edit, Smartphone, ArrowLeft } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

const phoneSchema = z.object({
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  network: z.number().min(1, "Réseau requis"),
})

const appIdSchema = z.object({
  user_app_id: z.string().min(1, "ID de pari requis"),
  app: z.string().min(1, "Plateforme requise"),
})

type PhoneFormData = z.infer<typeof phoneSchema>
type AppIdFormData = z.infer<typeof appIdSchema>

export default function PhonesPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userPhones, setUserPhones] = useState<UserPhone[]>([])
  const [userAppIds, setUserAppIds] = useState<UserAppId[]>([])
  const [networks, setNetworks] = useState<Network[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false)
  const [isAppIdDialogOpen, setIsAppIdDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingPhone, setEditingPhone] = useState<UserPhone | null>(null)
  const [editingAppId, setEditingAppId] = useState<UserAppId | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: "phone" | "appId"; id: number } | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string>(DEFAULT_COUNTRY_VALUE)
  const [editingCountry, setEditingCountry] = useState<string>(DEFAULT_COUNTRY_VALUE)
  
  // Bet ID search states
  const [isSearching, setIsSearching] = useState(false)
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false)
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [searchResult, setSearchResult] = useState<{ name: string; userId: number; currencyId: number } | null>(null)
  const [pendingBetId, setPendingBetId] = useState<{ appId: string; betId: string } | null>(null)

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  })

  const appIdForm = useForm<AppIdFormData>({
    resolver: zodResolver(appIdSchema),
  })

  useEffect(() => {
    loadData()
  }, [])

  // Refetch data when the page gains focus to ensure fresh data
  useEffect(() => {
    const handleFocus = () => {
      loadData()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [phonesData, networksData, platformsData] = await Promise.all([
        phoneApi.getAll(),
        networkApi.getAll(),
        platformApi.getAll(),
      ])
      setUserPhones(phonesData)
      setNetworks(networksData)
      setPlatforms(platformsData)

      // Load all app IDs
      try {
        const appIds = await userAppIdApi.getAll()
        setUserAppIds(appIds)
      } catch (error) {
        console.error("Failed to load app IDs:", error)
      }
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneSubmit = async (data: PhoneFormData) => {
    setIsSubmitting(true)
    try {
      const countryValue = editingPhone ? editingCountry : selectedCountry
      const phoneWithPrefix = buildInternationalPhone(data.phone, countryValue)
      
      if (editingPhone) {
        await phoneApi.update(editingPhone.id, phoneWithPrefix, data.network)
        toast.success("Numéro modifié avec succès!")
      } else {
        await phoneApi.create(phoneWithPrefix, data.network)
        toast.success("Numéro ajouté avec succès!")
      }
      setIsPhoneDialogOpen(false)
      phoneForm.reset()
      setEditingPhone(null)
      setSelectedCountry(DEFAULT_COUNTRY_VALUE)
      setEditingCountry(DEFAULT_COUNTRY_VALUE)
      loadData()
    } catch (error) {
      console.error("Phone operation error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAppIdSubmit = async (data: AppIdFormData) => {
    // If editing, update directly without search
    if (editingAppId) {
      setIsSubmitting(true)
      try {
        await userAppIdApi.update(editingAppId.id, data.user_app_id, data.app)
        toast.success("ID de pari modifié avec succès!")
        setIsAppIdDialogOpen(false)
        appIdForm.reset()
        setEditingAppId(null)
        loadData()
      } catch (error) {
        console.error("App ID operation error:", error)
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    // For new bet IDs, search first
    setIsSearching(true)
    try {
      const response = await userAppIdApi.searchUser(data.app, data.user_app_id)
      
      // Validate user exists
      if (response.UserId === 0) {
        setErrorMessage("Utilisateur non trouvé avec cet ID de pari.")
        setIsErrorModalOpen(true)
        setIsAppIdDialogOpen(false)
        return
      }

      // Validate currency
      if (response.CurrencyId !== 27) {
        setErrorMessage("Cet utilisateur n'utilise pas la devise XOF. Seuls les utilisateurs avec la devise XOF peuvent être ajoutés.")
        setIsErrorModalOpen(true)
        setIsAppIdDialogOpen(false)
        return
      }

      // User is valid - show confirmation modal with search results
      setSearchResult({
        name: response.Name,
        userId: response.UserId,
        currencyId: response.CurrencyId,
      })
      setPendingBetId({ appId: data.app, betId: data.user_app_id })
      setIsAppIdDialogOpen(false)
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
      setIsAppIdDialogOpen(false)
    } finally {
      setIsSearching(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      if (deleteTarget.type === "phone") {
        await phoneApi.delete(deleteTarget.id)
        toast.success("Numéro supprimé avec succès!")
      } else {
        await userAppIdApi.delete(deleteTarget.id)
        toast.success("ID de pari supprimé avec succès!")
      }
      setDeleteTarget(null)
      loadData()
    } catch (error) {
      console.error("Delete error:", error)
    }
  }

  const openEditPhoneDialog = (phone: UserPhone) => {
    const { countryValue, localNumber } = parsePhoneByCountry(phone.phone)
    setEditingPhone(phone)
    setEditingCountry(countryValue)
    phoneForm.reset({
      phone: localNumber,
      network: phone.network,
    })
    setIsPhoneDialogOpen(true)
  }

  const openEditAppIdDialog = (appId: UserAppId) => {
    setEditingAppId(appId)
    appIdForm.reset({
      user_app_id: appId.user_app_id,
      app: appId.app?.toString() || "",
    })
    setIsAppIdDialogOpen(true)
  }

  const closePhoneDialog = () => {
    setIsPhoneDialogOpen(false)
    setEditingPhone(null)
    setSelectedCountry(DEFAULT_COUNTRY_VALUE)
    setEditingCountry(DEFAULT_COUNTRY_VALUE)
    phoneForm.reset()
  }

  const closeAppIdDialog = () => {
    setIsAppIdDialogOpen(false)
    setEditingAppId(null)
    appIdForm.reset()
  }


  const handleConfirmAddBetId = async () => {
    if (!pendingBetId) return

    setIsSubmitting(true)
    try {
      await userAppIdApi.create(pendingBetId.betId, pendingBetId.appId)
      toast.success("ID de pari ajouté avec succès!")
      setIsConfirmationModalOpen(false)
      setPendingBetId(null)
      setSearchResult(null)
      appIdForm.reset()
      loadData()
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
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-start">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 h-10 px-4 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Button>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Phone className="h-6 w-6 sm:h-8 sm:w-8" />
          Mes numéros et IDs
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">Gérez vos numéros de téléphone et IDs de pari</p>
      </div>

      <Tabs defaultValue="phones" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="phones" className="flex-1 sm:flex-initial text-xs sm:text-sm">Numéros</TabsTrigger>
          <TabsTrigger value="appIds" className="flex-1 sm:flex-initial text-xs sm:text-sm">IDs de pari</TabsTrigger>
        </TabsList>

        {/* Phone Numbers Tab */}
        <TabsContent value="phones" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-4 sm:p-6">
              <div>
                <CardTitle className="text-base sm:text-lg">Numéros de téléphone</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Gérez vos numéros de téléphone mobile</CardDescription>
              </div>
              <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingPhone(null)} size="sm" className="w-full sm:w-auto h-9 sm:h-10">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un numéro
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">{editingPhone ? "Modifier le numéro" : "Ajouter un numéro"}</DialogTitle>
                    <DialogDescription className="text-sm">
                      {editingPhone
                        ? "Modifiez les informations de votre numéro"
                        : "Ajoutez un nouveau numéro de téléphone"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm sm:text-base">Numéro de téléphone</Label>
                      <div className="flex gap-2">
                        <Select
                          value={editingPhone ? editingCountry : selectedCountry}
                          onValueChange={(value) => {
                            if (editingPhone) {
                              setEditingCountry(value)
                            } else {
                              setSelectedCountry(value)
                            }
                          }}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="w-[170px] h-11 sm:h-10">
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
                          type="tel"
                          placeholder="Ex: 07 12 34 56 78"
                          {...phoneForm.register("phone")}
                          onChange={(e) => {
                            phoneForm.setValue("phone", e.target.value)
                            // Auto-detect country from prefix if user types a full number with prefix
                            const detected = parsePhoneByCountry(e.target.value)
                            if (editingPhone) {
                              if (detected.countryValue !== editingCountry) {
                                setEditingCountry(detected.countryValue)
                              }
                            } else {
                              if (detected.countryValue !== selectedCountry) {
                                setSelectedCountry(detected.countryValue)
                              }
                            }
                          }}
                          disabled={isSubmitting}
                          className="h-11 sm:h-10 text-base sm:text-sm flex-1"
                        />
                      </div>
                      {phoneForm.formState.errors.phone && (
                        <p className="text-xs sm:text-sm text-destructive">{phoneForm.formState.errors.phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="network" className="text-sm sm:text-base">Réseau mobile</Label>
                      <Select
                        onValueChange={(value) => phoneForm.setValue("network", Number.parseInt(value))}
                        defaultValue={editingPhone?.network?.toString()}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                          <SelectValue placeholder="Sélectionnez un réseau" />
                        </SelectTrigger>
                        <SelectContent>
                          {networks.map((network) => (
                            <SelectItem key={network.id} value={network.id?.toString() || ""}>
                              {network.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {phoneForm.formState.errors.network && (
                        <p className="text-xs sm:text-sm text-destructive">{phoneForm.formState.errors.network.message}</p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closePhoneDialog}
                        className="flex-1 bg-transparent h-11 sm:h-10 text-sm"
                      >
                        Annuler
                      </Button>
                      <Button type="submit" disabled={isSubmitting} className="flex-1 h-11 sm:h-10 text-sm">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enregistrement...
                          </>
                        ) : editingPhone ? (
                          "Modifier"
                        ) : (
                          "Ajouter"
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : userPhones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun numéro enregistré</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Ajoutez votre premier numéro pour commencer</p>
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="block sm:hidden space-y-3">
                    {userPhones.map((phone) => (
                      <Card key={phone.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{formatPhoneNumberForDisplay(phone.phone)}</p>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {networks.find((n) => n.id === phone.network)?.name || "Inconnu"}
                              </Badge>
                            </div>
                            <div className="flex gap-2 ml-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditPhoneDialog(phone)} className="h-9 w-9">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteTarget({ type: "phone", id: phone.id })}
                                className="h-9 w-9"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Numéro</TableHead>
                          <TableHead>Réseau</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userPhones.map((phone) => (
                          <TableRow key={phone.id}>
                            <TableCell className="font-medium">{formatPhoneNumberForDisplay(phone.phone)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {networks.find((n) => n.id === phone.network)?.name || "Inconnu"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => openEditPhoneDialog(phone)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteTarget({ type: "phone", id: phone.id })}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* App IDs Tab */}
        <TabsContent value="appIds" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-4 sm:p-6">
              <div>
                <CardTitle className="text-base sm:text-lg">IDs de pari</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Gérez vos identifiants de plateformes de pari</CardDescription>
              </div>
              <Dialog open={isAppIdDialogOpen} onOpenChange={setIsAppIdDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingAppId(null)} size="sm" className="w-full sm:w-auto h-9 sm:h-10">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un ID
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">{editingAppId ? "Modifier l'ID" : "Ajouter un ID"}</DialogTitle>
                    <DialogDescription className="text-sm">
                      {editingAppId ? "Modifiez votre ID de pari" : "Ajoutez un nouvel ID de pari"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={appIdForm.handleSubmit(handleAppIdSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="app" className="text-sm sm:text-base">Plateforme de pari</Label>
                      <Select
                        onValueChange={(value) => appIdForm.setValue("app", value)}
                        defaultValue={editingAppId?.app?.toString()}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                          <SelectValue placeholder="Sélectionnez une plateforme" />
                        </SelectTrigger>
                        <SelectContent>
                          {platforms.map((platform) => (
                            <SelectItem key={platform.id} value={platform.id?.toString() || ""}>
                              {platform.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {appIdForm.formState.errors.app && (
                        <p className="text-xs sm:text-sm text-destructive">{appIdForm.formState.errors.app.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user_app_id" className="text-sm sm:text-base">ID de pari</Label>
                      <Input
                        id="user_app_id"
                        type="text"
                        placeholder="Votre ID sur la plateforme"
                        {...appIdForm.register("user_app_id")}
                        disabled={isSubmitting}
                        className="h-11 sm:h-10 text-base sm:text-sm"
                      />
                      {appIdForm.formState.errors.user_app_id && (
                        <p className="text-xs sm:text-sm text-destructive">{appIdForm.formState.errors.user_app_id.message}</p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closeAppIdDialog}
                        className="flex-1 bg-transparent h-11 sm:h-10 text-sm"
                      >
                        Annuler
                      </Button>
                      <Button type="submit" disabled={isSubmitting || isSearching} className="flex-1 h-11 sm:h-10 text-sm">
                        {isSubmitting || isSearching ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isSearching ? "Recherche..." : "Enregistrement..."}
                          </>
                        ) : editingAppId ? (
                          "Modifier"
                        ) : (
                          "Ajouter"
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : userAppIds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun ID enregistré</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Ajoutez votre premier ID pour commencer</p>
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="block sm:hidden space-y-3">
                    {userAppIds.map((appId) => (
                      <Card key={appId.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{appId.user_app_id}</p>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {appId.app_details?.name || platforms.find((p) => p.id === appId.app)?.name || "Inconnu"}
                              </Badge>
                            </div>
                            <div className="flex gap-2 ml-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditAppIdDialog(appId)} className="h-9 w-9">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteTarget({ type: "appId", id: appId.id })}
                                className="h-9 w-9"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID de pari</TableHead>
                          <TableHead>Plateforme</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userAppIds.map((appId) => (
                          <TableRow key={appId.id}>
                            <TableCell className="font-medium">{appId.user_app_id}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {appId.app_details?.name || platforms.find((p) => p.id === appId.app)?.name || "Inconnu"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => openEditAppIdDialog(appId)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteTarget({ type: "appId", id: appId.id })}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement{" "}
              {deleteTarget?.type === "phone" ? "ce numéro" : "cet ID"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-white hover:bg-destructive/90 hover:text-white focus:ring-destructive"
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
            <DialogTitle>Confirmer l'ajout</DialogTitle>
            <DialogDescription asChild>
              <div className="text-muted-foreground text-sm space-y-2">
                {searchResult && (
                  <>
                    <p>Utilisateur trouvé:</p>
                    <div className="bg-muted p-3 rounded-md space-y-1">
                      <p><strong>Nom:</strong> {searchResult.name}</p>
                      <p><strong>ID utilisateur:</strong> {searchResult.userId}</p>
                      <p><strong>Devise:</strong> XOF (ID: {searchResult.currencyId})</p>
                    </div>
                    <p className="mt-2">Voulez-vous ajouter cet ID de pari à votre liste?</p>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmationModalOpen(false)
                setPendingBetId(null)
                setSearchResult(null)
              }}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button onClick={handleConfirmAddBetId} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajout...
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
        <DialogContent className="bg-white">
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
    </div>
  )
}
