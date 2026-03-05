"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, User, Save, Eye, EyeOff, Lock, ArrowLeft } from "lucide-react"
import { authApi, settingsApi } from "@/lib/api-client"
import { handleFieldErrors } from "@/lib/utils"
import type { User as UserType } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

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
  const [profile, setProfile] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [referralBonusEnabled, setReferralBonusEnabled] = useState(false)

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
    fetchSettings()
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

  const fetchSettings = async () => {
    try {
      const settings = await settingsApi.get()
      setReferralBonusEnabled(settings?.referral_bonus === true)
    } catch (error) {
      console.error("Error fetching settings:", error)
      setReferralBonusEnabled(false)
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
    <div className="max-w-5xl mx-auto space-y-4">
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

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-primary/10 via-primary/5 to-background border backdrop-blur-sm shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 bg-primary" />
        
        <div className="relative">
          <h1 className="text-xl font-bold leading-tight flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg">
              <User className="h-5 w-5" />
            </div>
            Mon profil
          </h1>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-md">
            Gérez vos informations personnelles et sécurisez votre compte
          </p>
        </div>
      </div>

      {/* Account Summary */}
      <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-lg">
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 bg-primary" />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-foreground">
                {profile?.first_name} {profile?.last_name}
              </h3>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
              <p className="text-xs text-muted-foreground">
                Membre depuis {profile?.created_at ? format(new Date(profile.created_at), 'MMMM yyyy', { locale: fr }) : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-[10px] font-medium text-green-700 dark:text-green-300">Actif</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="text-[10px] font-medium text-blue-700 dark:text-blue-300">Vérifié</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 bg-primary" />
        
        <div className="relative mb-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            Informations personnelles
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Modifiez vos informations de profil
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="first_name" className="text-xs font-medium text-foreground">
                Prénom
              </Label>
              <Input
                id="first_name"
                type="text"
                placeholder="Prénom"
                {...register("first_name")}
                disabled={isSubmitting}
                className="h-10 text-xs border-border focus:border-primary bg-background/50 transition-all"
              />
              {errors.first_name && (
                <p className="text-[10px] text-destructive font-medium">
                  {errors.first_name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="last_name" className="text-xs font-medium text-foreground">
                Nom
              </Label>
              <Input
                id="last_name"
                type="text"
                placeholder="Nom"
                {...register("last_name")}
                disabled={isSubmitting}
                className="h-10 text-xs border-border focus:border-primary bg-background/50 transition-all"
              />
              {errors.last_name && (
                <p className="text-[10px] text-destructive font-medium">
                  {errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              {...register("email")}
              disabled={isSubmitting}
              className="h-10 text-xs border-border focus:border-primary bg-background/50 transition-all"
            />
            {errors.email && (
              <p className="text-[10px] text-destructive font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-medium text-foreground">
              Téléphone
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Téléphone"
              {...register("phone")}
              disabled={isSubmitting}
              className="h-10 text-xs border-border focus:border-primary bg-background/50 transition-all"
            />
            {errors.phone && (
              <p className="text-[10px] text-destructive font-medium">{errors.phone.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="flex-1 h-10 text-xs rounded-xl"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-10 text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-3 w-3" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-transparent opacity-50" />
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 bg-amber-400" />
        
        <div className="relative mb-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10">
              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            Mot de passe
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Modifiez votre mot de passe
          </p>
        </div>

        <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="old_password" className="text-xs font-medium text-foreground">
              Ancien mot de passe
            </Label>
            <div className="relative">
              <Input
                id="old_password"
                type={showOldPassword ? "text" : "password"}
                placeholder="Mot de passe actuel"
                {...registerPassword("old_password")}
                disabled={isChangingPassword}
                className="h-10 text-xs pr-10 border-border focus:border-primary bg-background/50 transition-all"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-10 w-10 hover:bg-primary/5"
                onClick={() => setShowOldPassword(!showOldPassword)}
                disabled={isChangingPassword}
              >
                {showOldPassword ? (
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
            </div>
            {passwordErrors.old_password && (
              <p className="text-[10px] text-destructive font-medium">
                {passwordErrors.old_password.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new_password" className="text-xs font-medium text-foreground">
              Nouveau mot de passe
            </Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showNewPassword ? "text" : "password"}
                placeholder="Nouveau mot de passe"
                {...registerPassword("new_password")}
                disabled={isChangingPassword}
                className="h-10 text-xs pr-10 border-border focus:border-primary bg-background/50 transition-all"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-10 w-10 hover:bg-primary/5"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isChangingPassword}
              >
                {showNewPassword ? (
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
            </div>
            {passwordErrors.new_password && (
              <p className="text-[10px] text-destructive font-medium">
                {passwordErrors.new_password.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm_new_password" className="text-xs font-medium text-foreground">
              Confirmer
            </Label>
            <div className="relative">
              <Input
                id="confirm_new_password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Répéter le mot de passe"
                {...registerPassword("confirm_new_password")}
                disabled={isChangingPassword}
                className="h-10 text-xs pr-10 border-border focus:border-primary bg-background/50 transition-all"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-10 w-10 hover:bg-primary/5"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isChangingPassword}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
            </div>
            {passwordErrors.confirm_new_password && (
              <p className="text-[10px] text-destructive font-medium">
                {passwordErrors.confirm_new_password.message}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
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
              className="flex-1 h-10 text-xs rounded-xl"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isChangingPassword}
              className="flex-1 h-10 text-xs rounded-xl bg-amber-500 text-white hover:bg-amber-600"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Modification...
                </>
              ) : (
                <>
                  <Lock className="mr-1.5 h-3 w-3" />
                  Modifier
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Account Information */}
      {profile && (
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 bg-primary" />
          
          <div className="relative mb-4">
            <h2 className="text-base font-bold">Informations du compte</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Lecture seule
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Nom d'utilisateur</p>
              <p className="text-xs font-medium">{profile.username}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">ID</p>
              <p className="text-xs font-mono">{profile.id}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Inscription</p>
              <p className="text-xs font-medium">
                {format(new Date(profile.date_joined), "dd MMM yyyy", { locale: fr })}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Dernière connexion</p>
              <p className="text-xs font-medium">
                {profile.last_login
                  ? format(new Date(profile.last_login), "dd MMM, HH:mm", { locale: fr })
                  : "Jamais"}
              </p>
            </div>
            {referralBonusEnabled && profile.referral_code && (
              <div>
                <p className="text-[10px] text-muted-foreground">Code de parrainage</p>
                <p className="text-xs font-mono">{profile.referral_code}</p>
              </div>
            )}
            {referralBonusEnabled && profile.bonus_available !== undefined && (
              <div>
                <p className="text-[10px] text-muted-foreground">Bonus</p>
                <p className="text-xs font-bold text-green-600 dark:text-green-400">
                  {profile.bonus_available.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "XOF",
                    minimumFractionDigits: 0,
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

