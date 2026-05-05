"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AppBar } from "@/components/ui/app-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authApi, settingsApi } from "@/lib/api-client"
import type { User } from "@/lib/types"
import { toast } from "react-hot-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  User as UserIcon,
  Lock,
  Mail,
  Phone,
  Calendar,
  Copy,
  Check,
  LogIn,
  Gift,
  Users,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

// Validation schemas
const profileSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(1, "Le téléphone est requis"),
})

const passwordSchema = z.object({
  old_password: z.string().min(1, "L'ancien mot de passe est requis"),
  new_password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirm_new_password: z.string(),
}).refine((data) => data.new_password === data.confirm_new_password, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirm_new_password"],
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export default function ProfileV2Page() {
  const router = useRouter()
  const { user } = useAuth()

  // State management
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [copiedReferralCode, setCopiedReferralCode] = useState(false)
  const [copiedUserId, setCopiedUserId] = useState(false)

  // Form hooks
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfileForm,
    watch: watchProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/loginv2")
    }
  }, [user, router])

  if (!user) {
    return null
  }

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      setIsLoadingProfile(true)
      const profileData = await authApi.getProfile()
      setUserProfile(profileData)
      resetProfileForm({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
        phone: profileData.phone,
      })
    } catch (error) {
      console.error("Error fetching user profile:", error)
      toast.error("Erreur lors du chargement du profil")
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (user) {
      fetchUserProfile()
    }
  }, [user])

  // Handle profile update
  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      setIsUpdatingProfile(true)
      const updatedProfile = await authApi.updateProfile(data as any)
      setUserProfile(updatedProfile)
      localStorage.setItem("user_email", updatedProfile.email.replace(/\s+/g, ''))
      toast.success("Profil mis à jour avec succès!")
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast.error(error.response?.data?.detail || "Erreur lors de la mise à jour du profil")
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Handle password change
  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      setIsChangingPassword(true)
      await authApi.changePassword({
        old_password: data.old_password,
        new_password: data.new_password,
        confirm_new_password: data.confirm_new_password,
      })
      toast.success("Mot de passe changé avec succès!")

      // Update remembered credentials if the email matches
      const CREDS_KEY = "slater_remembered_creds"
      const savedCreds = localStorage.getItem(CREDS_KEY)
      if (savedCreds) {
        try {
          const creds = JSON.parse(savedCreds)
          const userEmail = userProfile?.email || user?.email
          const normalizedUserEmail = (userEmail || "").trim().toLowerCase().replace(/\s+/g, '')
          const normalizedSavedEmail = (creds.email || "").trim().toLowerCase().replace(/\s+/g, '')

          if (normalizedSavedEmail === normalizedUserEmail) {
            localStorage.setItem(CREDS_KEY, JSON.stringify({ ...creds, password: data.new_password }))
          }
        } catch (e) {
          console.error("Error updating saved credentials after password change", e)
        }
      }

      resetPasswordForm()
    } catch (error: any) {
      console.error("Error changing password:", error)
      toast.error(error.response?.data?.detail || "Erreur lors du changement de mot de passe")
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Copy referral code
  const copyReferralCode = async () => {
    const referralCode = userProfile?.referral_code || user?.referral_code
    if (referralCode) {
      try {
        await navigator.clipboard.writeText(referralCode)
        setCopiedReferralCode(true)
        toast.success("Code de parrainage copié!")
        setTimeout(() => setCopiedReferralCode(false), 2000)
      } catch (error) {
        toast.error("Erreur lors de la copie")
      }
    }
  }

  // Copy user ID
  const copyUserId = async () => {
    const userId = userProfile?.id || user?.id
    if (userId) {
      try {
        await navigator.clipboard.writeText(String(userId))
        setCopiedUserId(true)
        toast.success("ID copié!")
        setTimeout(() => setCopiedUserId(false), 2000)
      } catch (error) {
        toast.error("Erreur lors de la copie")
      }
    }
  }

  const profileFormValues = watchProfile()

  return (
    <>
      <AppBar />
      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 sm:pt-8 pb-4 sm:pb-2">
        <div className="w-full max-w-2xl">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboardv2")}
                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profil</h1>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md ring-1 ring-blue-400/20">
                <UserIcon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Gérez vos informations personnelles et votre sécurité</p>
          </div>

          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Account Information Section */}
              <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-blue/5 via-transparent to-blue/5 opacity-50" />
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 bg-blue-500" />

                <div className="relative">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </span>
                    Informations du compte
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {/* Username */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Nom d'utilisateur
                      </p>
                      <p className="text-base font-bold text-slate-900 dark:text-white">
                        {userProfile?.username || "N/A"}
                      </p>
                    </div>

                    {/* User ID */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          ID utilisateur
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={copyUserId}
                          className="h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          {copiedUserId ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-slate-500" />
                          )}
                        </Button>
                      </div>
                      <p className="text-base font-mono font-bold text-slate-900 dark:text-white">
                        {userProfile?.id || "N/A"}
                      </p>
                    </div>

                    {/* Registration Date */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Date d'inscription
                      </p>
                      <p className="text-base font-bold text-slate-900 dark:text-white">
                        {userProfile?.date_joined
                          ? new Date(userProfile.date_joined).toLocaleDateString("fr-FR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "N/A"}
                      </p>
                    </div>

                    {/* Last Login */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Dernière connexion
                      </p>
                      <p className="text-base font-bold text-slate-900 dark:text-white">
                        {userProfile?.last_login
                          ? formatDistanceToNow(new Date(userProfile.last_login), {
                              addSuffix: true,
                              locale: fr,
                            })
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Referral Code */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" />
                        Code de parrainage
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={copyReferralCode}
                        className="h-6 w-6 p-0 hover:bg-blue-200 dark:hover:bg-blue-900/30"
                      >
                        {copiedReferralCode ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        )}
                      </Button>
                    </div>
                    <p className="text-base font-mono font-bold text-blue-900 dark:text-blue-100">
                      {userProfile?.referral_code || user?.referral_code || "N/A"}
                    </p>
                  </div>

                  {/* Bonus Available */}
                  {userProfile?.bonus_available !== undefined && (
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-50/50 dark:from-amber-900/20 dark:to-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                          <Gift className="h-3.5 w-3.5" />
                          Bonus disponible
                        </p>
                        <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                          {(userProfile.bonus_available || 0).toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "XOF",
                            minimumFractionDigits: 0,
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Information Section */}
              <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-blue/5 via-transparent to-blue/5 opacity-50" />
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 bg-blue-500" />

                <div className="relative">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </span>
                    Informations personnelles
                  </h2>

                  <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* First Name */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Prénom
                        </label>
                        <Input
                          {...registerProfile("first_name")}
                          placeholder="Votre prénom"
                          className="rounded-xl border-slate-200 dark:border-slate-700 focus:ring-blue-500"
                        />
                        {profileErrors.first_name && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {profileErrors.first_name.message}
                          </p>
                        )}
                      </div>

                      {/* Last Name */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Nom
                        </label>
                        <Input
                          {...registerProfile("last_name")}
                          placeholder="Votre nom"
                          className="rounded-xl border-slate-200 dark:border-slate-700 focus:ring-blue-500"
                        />
                        {profileErrors.last_name && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {profileErrors.last_name.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Email
                      </label>
                      <Input
                        {...registerProfile("email")}
                        type="email"
                        placeholder="votre@email.com"
                        className="rounded-xl border-slate-200 dark:border-slate-700 focus:ring-blue-500"
                      />
                      {profileErrors.email && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {profileErrors.email.message}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Téléphone
                      </label>
                      <Input
                        {...registerProfile("phone")}
                        placeholder="+225 XX XX XX XX"
                        className="rounded-xl border-slate-200 dark:border-slate-700 focus:ring-blue-500"
                      />
                      {profileErrors.phone && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {profileErrors.phone.message}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isUpdatingProfile || !profileFormValues.first_name}
                      className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:shadow-blue-500/50 text-white font-semibold transition-all duration-300"
                    >
                      {isUpdatingProfile ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Mise à jour...
                        </>
                      ) : (
                        "Mettre à jour le profil"
                      )}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Password Change Section */}
              <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-amber/5 via-transparent to-amber/5 opacity-50" />
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 bg-amber-500" />

                <div className="relative">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </span>
                    Changer le mot de passe
                  </h2>

                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                    {/* Old Password */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Ancien mot de passe
                      </label>
                      <div className="relative">
                        <Input
                          {...registerPassword("old_password")}
                          type={showOldPassword ? "text" : "password"}
                          placeholder="Entrez votre ancien mot de passe"
                          className="rounded-xl border-slate-200 dark:border-slate-700 focus:ring-amber-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        >
                          {showOldPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.old_password && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {passwordErrors.old_password.message}
                        </p>
                      )}
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Nouveau mot de passe
                      </label>
                      <div className="relative">
                        <Input
                          {...registerPassword("new_password")}
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Entrez votre nouveau mot de passe"
                          className="rounded-xl border-slate-200 dark:border-slate-700 focus:ring-amber-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.new_password && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {passwordErrors.new_password.message}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Confirmer le mot de passe
                      </label>
                      <div className="relative">
                        <Input
                          {...registerPassword("confirm_new_password")}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirmez votre nouveau mot de passe"
                          className="rounded-xl border-slate-200 dark:border-slate-700 focus:ring-amber-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.confirm_new_password && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {passwordErrors.confirm_new_password.message}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isChangingPassword}
                      className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:shadow-lg hover:shadow-amber-500/50 text-white font-semibold transition-all duration-300"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Changement en cours...
                        </>
                      ) : (
                        "Changer le mot de passe"
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
