"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, User, Save, Eye, EyeOff, Lock, ArrowLeft } from "lucide-react"
import { authApi } from "@/lib/api-client"
import { handleFieldErrors } from "@/lib/utils"
import type { User } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const profileSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
})

const passwordSchema = z
  .object({
    old_password: z.string().min(1, "L'ancien mot de passe est requis"),
    new_password: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
    confirm_new_password: z.string().min(6, "La confirmation est requise"),
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    message: "Les nouveaux mots de passe ne correspondent pas",
    path: ["confirm_new_password"],
  })

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const router = useRouter()
  const { user: authUser, login } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    setError: setPasswordError,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  useEffect(() => {
    if (!authUser) {
      router.push("/login")
      return
    }
    fetchProfile()
  }, [authUser, router])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const userData = await authApi.getProfile()
      setProfile(userData)
      reset({
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        email: userData.email || "",
        phone: userData.phone || "",
      })
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Erreur lors du chargement du profil")
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true)
    try {
      const updatedUser = await authApi.updateProfile(data)
      setProfile(updatedUser)

      // Update auth context with new user data
      if (authUser) {
        login(
          localStorage.getItem("access_token") || "",
          localStorage.getItem("refresh_token") || "",
          updatedUser
        )
      }

      toast.success("Profil mis à jour avec succès!")
    } catch (error: any) {
      console.error("Error updating profile:", error)

      // Handle field-specific errors from backend
      handleFieldErrors(error, setError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsChangingPassword(true)
    try {
      await authApi.changePassword({
        old_password: data.old_password,
        new_password: data.new_password,
        confirm_new_password: data.confirm_new_password,
      })
      toast.success("Mot de passe modifié avec succès!")
      resetPassword()
      setShowOldPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
    } catch (error: any) {
      console.error("Error changing password:", error)

      // Handle field-specific errors from backend
      handleFieldErrors(error, setPasswordError)
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (!authUser) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      <div className="flex items-center justify-start">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 h-10 px-4  hover:bg-primary/10 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Button>
      </div>

      {/* Hero Section */}
      <Card className="border-0 floating-card overflow-hidden  sm:rounded-3xl">
        <CardContent className="p-5 sm:p-6 relative z-10">
          <div className="absolute -top-10 right-2 h-28 w-28 rounded-full bg-primary/20 blur-3xl" />
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14  bg-primary/15 text-primary glow-primary">
                    <User className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  Mon profil
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl">
                  Gérez vos informations personnelles et mettez à jour vos paramètres de sécurité
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Summary */}
      <Card className="glass-panel border-primary/15  sm:rounded-3xl">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20  bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                  <User className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  {profile?.first_name} {profile?.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <p className="text-sm text-muted-foreground">
                  Membre depuis {profile?.created_at ? format(new Date(profile.created_at), 'MMMM yyyy', { locale: fr }) : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10  border border-green-500/20">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">Compte actif</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10  border border-blue-500/20">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-700">Vérifié</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information Card */}
      <Card className="glass-panel border-primary/15  sm:rounded-3xl">
        <CardHeader className="p-5 sm:p-6">
          <CardTitle className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8  bg-primary/15 text-primary">
              <User className="h-4 w-4" />
            </div>
            Informations personnelles
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-2">
            Modifiez vos informations de profil pour les maintenir à jour
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 pt-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-sm sm:text-base font-medium text-foreground flex items-center gap-2">
                  👤 Prénom complet
                </Label>
                <Input
                  id="first_name"
                  type="text"
                  placeholder="Saisissez votre prénom officiel"
                  {...register("first_name")}
                  disabled={isSubmitting}
                  className="h-12 sm:h-11 text-base sm:text-sm border-primary/20 focus:border-primary/40 bg-background/50  transition-all duration-200 focus:ring-2 focus:ring-primary/10"
                />
                {errors.first_name && (
                  <p className="text-xs sm:text-sm text-destructive font-medium">
                    {errors.first_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-sm sm:text-base font-medium text-foreground flex items-center gap-2">
                  👤 Nom de famille
                </Label>
                <Input
                  id="last_name"
                  type="text"
                  placeholder="Saisissez votre nom de famille"
                  {...register("last_name")}
                  disabled={isSubmitting}
                  className="h-12 sm:h-11 text-base sm:text-sm border-primary/20 focus:border-primary/40 bg-background/50  transition-all duration-200 focus:ring-2 focus:ring-primary/10"
                />
                {errors.last_name && (
                  <p className="text-xs sm:text-sm text-destructive font-medium">
                    {errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base font-medium text-foreground flex items-center gap-2">
                📧 Adresse e-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="votre.adresse.email@exemple.com"
                {...register("email")}
                disabled={isSubmitting}
                className="h-12 sm:h-11 text-base sm:text-sm border-primary/20 focus:border-primary/40 bg-background/50  transition-all duration-200 focus:ring-2 focus:ring-primary/10"
              />
              {errors.email && (
                <p className="text-xs sm:text-sm text-destructive font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm sm:text-base font-medium text-foreground flex items-center gap-2">
                📱 Numéro de téléphone
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+225 XX XX XX XX XX"
                {...register("phone")}
                disabled={isSubmitting}
                className="h-12 sm:h-11 text-base sm:text-sm border-primary/20 focus:border-primary/40 bg-background/50  transition-all duration-200 focus:ring-2 focus:ring-primary/10"
              />
              {errors.phone && (
                <p className="text-xs sm:text-sm text-destructive font-medium">{errors.phone.message}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial h-12 sm:h-11 text-sm border-primary/30 bg-primary/5 text-foreground hover:bg-primary/10  "
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial h-12 sm:h-11 text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg glow-primary  "
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="glass-panel border-primary/15  sm:rounded-3xl">
        <CardHeader className="p-5 sm:p-6">
          <CardTitle className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8  bg-primary/15 text-primary">
              <Lock className="h-4 w-4" />
            </div>
            Changer le mot de passe
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-2">
            Modifiez votre mot de passe pour sécuriser votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 pt-0">
          <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-6 sm:space-y-7">
            <div className="space-y-2">
              <Label htmlFor="old_password" className="text-sm sm:text-base font-medium text-foreground flex items-center gap-2">
                🔒 Ancien mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="old_password"
                  type={showOldPassword ? "text" : "password"}
                  placeholder="Saisissez votre mot de passe actuel"
                  {...registerPassword("old_password")}
                  disabled={isChangingPassword}
                  className="h-12 sm:h-11 text-base sm:text-sm pr-12 border-primary/20 focus:border-primary/40 bg-background/50  transition-all duration-200 focus:ring-2 focus:ring-primary/10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-12 sm:h-11 w-11 hover:bg-primary/5 "
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  disabled={isChangingPassword}
                >
                  {showOldPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {passwordErrors.old_password && (
                <p className="text-xs sm:text-sm text-destructive font-medium">
                  {passwordErrors.old_password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password" className="text-sm sm:text-base font-medium text-foreground flex items-center gap-2">
                🛡️ Nouveau mot de passe sécurisé
              </Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Au moins 6 caractères avec majuscules et chiffres"
                  {...registerPassword("new_password")}
                  disabled={isChangingPassword}
                  className="h-12 sm:h-11 text-base sm:text-sm pr-12 border-primary/20 focus:border-primary/40 bg-background/50  transition-all duration-200 focus:ring-2 focus:ring-primary/10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-12 sm:h-11 w-11 hover:bg-primary/5 "
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isChangingPassword}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {passwordErrors.new_password && (
                <p className="text-xs sm:text-sm text-destructive font-medium">
                  {passwordErrors.new_password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_new_password" className="text-sm sm:text-base font-medium text-foreground flex items-center gap-2">
                ✅ Confirmer le nouveau mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="confirm_new_password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Répétez exactement le nouveau mot de passe"
                  {...registerPassword("confirm_new_password")}
                  disabled={isChangingPassword}
                  className="h-12 sm:h-11 text-base sm:text-sm pr-12 border-primary/20 focus:border-primary/40 bg-background/50  transition-all duration-200 focus:ring-2 focus:ring-primary/10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-12 sm:h-11 w-11 hover:bg-primary/5 "
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isChangingPassword}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {passwordErrors.confirm_new_password && (
                <p className="text-xs sm:text-sm text-destructive font-medium">
                  {passwordErrors.confirm_new_password.message}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetPassword()
                  setShowOldPassword(false)
                  setShowNewPassword(false)
                  setShowConfirmPassword(false)
                }}
                disabled={isChangingPassword}
                className="w-full sm:flex-initial h-12 sm:h-11 text-sm border-primary/30 bg-primary/5 text-foreground hover:bg-primary/10  "
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="w-full sm:flex-initial h-12 sm:h-11 text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg glow-primary  "
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Modification...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Modifier le mot de passe</span>
                    <span className="sm:hidden">Modifier</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Information Card */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Informations du compte</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Informations en lecture seule
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs sm:text-sm text-muted-foreground">Nom d'utilisateur</Label>
                <p className="text-sm sm:text-base font-medium mt-1">{profile.username}</p>
              </div>
              <div>
                <Label className="text-xs sm:text-sm text-muted-foreground">ID utilisateur</Label>
                <p className="text-sm sm:text-base font-medium mt-1 font-mono text-xs">
                  {profile.id}
                </p>
              </div>
              <div>
                <Label className="text-xs sm:text-sm text-muted-foreground">Date d'inscription</Label>
                <p className="text-sm sm:text-base font-medium mt-1">
                  {format(new Date(profile.date_joined), "dd MMMM yyyy", { locale: fr })}
                </p>
              </div>
              <div>
                <Label className="text-xs sm:text-sm text-muted-foreground">Dernière connexion</Label>
                <p className="text-sm sm:text-base font-medium mt-1">
                  {profile.last_login
                    ? format(new Date(profile.last_login), "dd MMMM yyyy à HH:mm", { locale: fr })
                    : "Jamais"}
                </p>
              </div>
              {profile.referral_code && (
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground">Code de parrainage</Label>
                  <p className="text-sm sm:text-base font-medium mt-1 font-mono">
                    {profile.referral_code}
                  </p>
                </div>
              )}
              {profile.bonus_available !== undefined && (
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground">Bonus disponible</Label>
                  <p className="text-sm sm:text-base font-medium mt-1">
                    {profile.bonus_available.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "XOF",
                      minimumFractionDigits: 0,
                    })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

