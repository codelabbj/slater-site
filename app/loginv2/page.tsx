"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth-context"
import { authApi } from "@/lib/api-client"
import { handleFieldErrors } from "@/lib/utils"
import { toast } from "react-hot-toast"
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { setupNotifications } from "@/lib/fcm-helper"

const loginSchema = z.object({
  email_or_phone: z.string().min(1, "Adresse e-mail ou numéro de téléphone requis"),
  password: z.string().min(6, "Le mot de passe doit contenir au minimum 6 caractères"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPageV2() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Load remembered credentials on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("remembered_email")
    const rememberedPassword = localStorage.getItem("remembered_password")
    const shouldRemember = localStorage.getItem("remember_me") === "true"
    
    if (shouldRemember && rememberedEmail && rememberedPassword) {
      setRememberMe(true)
      setValue("email_or_phone", rememberedEmail)
      setValue("password", rememberedPassword)
    }
  }, [setValue])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const response = await authApi.login(data.email_or_phone, data.password)
      
      if (rememberMe) {
        localStorage.setItem("remembered_email", data.email_or_phone)
        localStorage.setItem("remembered_password", data.password)
        localStorage.setItem("remember_me", "true")
      } else {
        localStorage.removeItem("remembered_email")
        localStorage.removeItem("remembered_password")
        localStorage.removeItem("remember_me")
      }
      
      login(response.access, response.refresh, response.data)
      toast.success("Connexion réussie!")
      
      try {
        const userId = response.data?.id
        if (userId) {
          await new Promise(resolve => setTimeout(resolve, 100))
          const fcmToken = await setupNotifications(userId)
          if (fcmToken) {
            toast.success("Notifications activées!")
          }
        }
      } catch (fcmError) {
        console.error('[Login] Error setting up notifications:', fcmError)
      }
      
      await new Promise(resolve => setTimeout(resolve, 300))
      router.push("/dashboardv2")
    } catch (error: any) {
      console.error("Login error:", error)
      handleFieldErrors(error, setError)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPasswordSubmit = async () => {
    if (forgotPasswordStep === 1) {
      if (!forgotPasswordEmail || !forgotPasswordEmail.includes("@")) {
        toast.error("Veuillez entrer une adresse email valide")
        return
      }

      setIsLoading(true)
      try {
        await authApi.sendOtp(forgotPasswordEmail)
        toast.success("OTP a été envoyé à votre email")
        setForgotPasswordStep(2)
      } catch (error: any) {
        if (error.response?.data?.email && Array.isArray(error.response.data.email)) {
          toast.error(error.response.data.email[0])
        }
      } finally {
        setIsLoading(false)
      }
    } else if (forgotPasswordStep === 2) {
      if (!forgotPasswordOtp || forgotPasswordOtp.length < 4) {
        toast.error("Veuillez entrer un code OTP valide")
        return
      }
      toast.success("OTP vérifié avec succès")
      setForgotPasswordStep(3)
    } else if (forgotPasswordStep === 3) {
      if (!newPassword || newPassword.length < 6) {
        toast.error("Le mot de passe doit contenir au moins 6 caractères")
        return
      }

      if (newPassword !== confirmNewPassword) {
        toast.error("Les mots de passe ne correspondent pas")
        return
      }

      const hasUpperCase = /[A-Z]/.test(newPassword)
      const hasLowerCase = /[a-z]/.test(newPassword)
      const hasDigit = /\d/.test(newPassword)

      if (!hasUpperCase || !hasLowerCase || !hasDigit) {
        toast.error("Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre")
        return
      }

      setIsLoading(true)
      try {
        await authApi.resetPassword({
          otp: forgotPasswordOtp,
          new_password: newPassword,
          confirm_new_password: confirmNewPassword,
        })
        toast.success("Mot de passe réinitialisé avec succès!")

        setIsForgotPassword(false)
        setForgotPasswordStep(1)
        setForgotPasswordEmail("")
        setForgotPasswordOtp("")
        setNewPassword("")
        setConfirmNewPassword("")
      } catch (error: any) {
        if (error.response?.data && typeof error.response.data === 'object') {
          const fieldErrors = error.response.data
          if (fieldErrors.new_password && Array.isArray(fieldErrors.new_password)) {
            toast.error(fieldErrors.new_password[0])
          } else if (fieldErrors.otp && Array.isArray(fieldErrors.otp)) {
            toast.error(fieldErrors.otp[0])
          }
        }
      } finally {
        setIsLoading(false)
      }
    }
  }

  const renderForgotPasswordForm = () => {
    if (forgotPasswordStep === 1) {
      return (
        <div className="space-y-4 sm:space-y-5">
          <div className="space-y-2">
            <Label htmlFor="forgot_email" className="text-sm font-medium text-slate-600">Adresse e-mail de récupération</Label>
            <Input
              id="forgot_email"
              type="email"
              placeholder="votre.email@exemple.com"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              disabled={isLoading}
              className="h-10 sm:h-11 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-sm sm:text-base"
            />
          </div>
          
          <Button 
            type="button"
            onClick={handleForgotPasswordSubmit}
            className="w-full h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm sm:text-base"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              "Envoyer OTP"
            )}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsForgotPassword(false)}
            className="w-full h-10 sm:h-11 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm sm:text-base"
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la connexion
          </Button>
        </div>
      )
    } else if (forgotPasswordStep === 2) {
      return (
        <div className="space-y-4 sm:space-y-5">
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-sm font-medium text-slate-600">Code de vérification</Label>
            <Input
              id="otp"
              type="text"
              placeholder="123456"
              value={forgotPasswordOtp}
              onChange={(e) => setForgotPasswordOtp(e.target.value)}
              disabled={isLoading}
              className="h-10 sm:h-11 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-center font-mono tracking-widest text-sm sm:text-base"
              maxLength={6}
            />
            <p className="text-xs text-slate-500">
              Code envoyé à : {forgotPasswordEmail}
            </p>
          </div>
          
          <Button 
            type="button"
            onClick={handleForgotPasswordSubmit}
            className="w-full h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm sm:text-base"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Vérification...
              </>
            ) : (
              "Vérifier OTP"
            )}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={() => setForgotPasswordStep(1)}
            className="w-full h-10 sm:h-11 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm sm:text-base"
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      )
    } else if (forgotPasswordStep === 3) {
      return (
        <div className="space-y-4 sm:space-y-5">
          <div className="space-y-2">
            <Label htmlFor="new_password" className="text-sm font-medium text-slate-600">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showNewPassword ? "text" : "password"}
                placeholder="Minimum 6 caractères"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                className="h-10 sm:h-11 pr-10 sm:pr-11 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-sm sm:text-base"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-10 sm:h-11 w-10 sm:w-11 hover:bg-slate-100"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isLoading}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-slate-400" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-400" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_new_password" className="text-sm font-medium text-slate-600">Confirmer le mot de passe</Label>
            <div className="relative">
              <Input
                id="confirm_new_password"
                type={showConfirmNewPassword ? "text" : "password"}
                placeholder="Répétez le mot de passe"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={isLoading}
                className="h-10 sm:h-11 pr-10 sm:pr-11 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-sm sm:text-base"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-10 sm:h-11 w-10 sm:w-11 hover:bg-slate-100"
                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                disabled={isLoading}
              >
                {showConfirmNewPassword ? (
                  <EyeOff className="h-4 w-4 text-slate-400" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-400" />
                )}
              </Button>
            </div>
          </div>
          
          <Button 
            type="button"
            onClick={handleForgotPasswordSubmit}
            className="w-full h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm sm:text-base"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Réinitialisation...
              </>
            ) : (
              "Réinitialiser le mot de passe"
            )}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={() => setForgotPasswordStep(2)}
            className="w-full h-10 sm:h-11 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm sm:text-base"
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <Image
              src="/Slater-logo.png"
              alt="Slater Logo"
              width={64}
              height={16}
              className="w-12 h-auto object-contain sm:w-16"
            />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {isForgotPassword ? "Récupération" : "Bon retour"}
          </h2>
          <p className="text-sm sm:text-base text-slate-500">
            {isForgotPassword
              ? forgotPasswordStep === 1
                ? "Entrez votre email pour recevoir un code"
                : forgotPasswordStep === 2
                ? "Vérifiez votre boîte de réception"
                : "Créez un nouveau mot de passe"
              : "Connectez-vous pour accéder à votre compte"
            }
          </p>
        </div>

        {/* Form */}
        {isForgotPassword ? (
          renderForgotPasswordForm()
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email_or_phone" className="text-sm font-medium text-slate-700">
                Email ou téléphone
              </Label>
              <Input
                id="email_or_phone"
                type="text"
                placeholder="votre@email.com ou +225 01 23 45 67"
                {...register("email_or_phone")}
                disabled={isLoading}
                className="h-10 sm:h-11 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-sm sm:text-base"
              />
              {errors.email_or_phone && (
                <p className="text-xs sm:text-sm text-red-500 font-medium">{errors.email_or_phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={isLoading}
                  className="h-10 sm:h-11 pr-10 sm:pr-11 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-sm sm:text-base"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-10 sm:h-11 w-10 sm:w-11 hover:bg-slate-100"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-xs sm:text-sm text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <Checkbox
                  id="remember_me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="remember_me"
                  className="text-xs sm:text-sm cursor-pointer text-slate-600"
                >
                  Se souvenir de moi
                </Label>
              </div>
              <Button
                type="button"
                variant="link"
                className="px-0 text-xs sm:text-sm h-auto text-slate-600 hover:text-slate-900 font-medium"
                onClick={() => {
                  setIsForgotPassword(true)
                  setForgotPasswordStep(1)
                }}
                disabled={isLoading}
              >
                Mot de passe oublié ?
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-lg transition-all duration-200 text-sm sm:text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-200 text-center space-y-2">
          <p className="text-xs sm:text-sm text-slate-500">
            Pas encore de compte ?{" "}
            <Link href="/registerv2" className="text-slate-900 font-semibold hover:underline">
              Créer un compte
            </Link>
          </p>
          <div className="text-[10px] text-slate-300 font-mono">
            Site Version: TURN 12
          </div>
        </div>
      </div>
    </div>
  )
}