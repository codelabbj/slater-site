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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { authApi } from "@/lib/api-client"
import { handleFieldErrors } from "@/lib/utils"
import { toast } from "react-hot-toast"
import { Loader2, Eye, EyeOff, Download, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { setupNotifications } from "@/lib/fcm-helper"

const loginSchema = z.object({
  email_or_phone: z.string().min(1, "Adresse e-mail ou numéro de téléphone requis"),
  password: z.string().min(6, "Le mot de passe doit contenir au minimum 6 caractères"),
})

type LoginFormData = z.infer<typeof loginSchema>

const APK_DOWNLOAD_URL = "https://slaterci-mobile-app.vercel.app/releases/app-v1.0.2.apk"
const APK_FILE_NAME = "Slater-v1.0.2.apk"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
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
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const CREDS_KEY = "slater_remembered_creds"

  // Load remembered credentials on mount
  useEffect(() => {
    const savedCreds = localStorage.getItem(CREDS_KEY)
    if (savedCreds) {
      try {
        const { email, password } = JSON.parse(savedCreds)
        if (email && password) {
          setRememberMe(true)
          setValue("email_or_phone", email)
          setValue("password", password)
        }
      } catch (e) {
        console.error("Error parsing saved credentials", e)
      }
    }
  }, [setValue])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      // Step 1: Authenticate user
      const response = await authApi.login(data.email_or_phone, data.password)
      
      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem(CREDS_KEY, JSON.stringify({ 
          email: data.email_or_phone.trim().toLowerCase().replace(/\s+/g, ''), 
          password: data.password 
        }))
      } else {
        localStorage.removeItem(CREDS_KEY)
      }
      
      login(response.access, response.refresh, response.data)
      
      // Save user ID and email for parity with blaffa-mobile (using slater naming convention)
      if (response.data?.id) {
        localStorage.setItem("user_id", response.data.id.toString())
      }
      localStorage.setItem("user_email", data.email_or_phone.trim().toLowerCase().replace(/\s+/g, ''))
      
      // Step 2: Show success toast first
      toast.success("Connexion réussie!")
      
      // Step 3: Request notification permission (shows native browser prompt)
      try {
        const userId = response.data?.id
        
        if (userId) {
          // Add small delay to ensure page is ready
          await new Promise(resolve => setTimeout(resolve, 100))
          
          console.log('[Login] Setting up notifications for user:', userId)
          const fcmToken = await setupNotifications(userId)
          
          if (fcmToken) {
            toast.success("Notifications activées!")
            console.log('[Login] FCM Token registered:', fcmToken.substring(0, 20) + '...')
          } else {
            console.log('[Login] No FCM token - permission might be denied or not granted')
          }
        }
      } catch (fcmError) {
        // Non-critical error - don't block login
        console.error('[Login] Error setting up notifications:', fcmError)
      }
      
      // Step 4: Redirect to dashboard
      // Wait a bit more to ensure notification prompt completes if shown
      await new Promise(resolve => setTimeout(resolve, 300))
      router.push("/dashboardv2")
    } catch (error: any) {
      console.error("Login error:", error)

      // Handle field-specific errors from backend
      if (error.response?.data && typeof error.response.data === 'object') {
        const fieldErrors = error.response.data

        // Check for field-specific errors and set them on form
        if (fieldErrors.email_or_phone && Array.isArray(fieldErrors.email_or_phone)) {
          setError("email_or_phone", {
            type: "server",
            message: fieldErrors.email_or_phone[0]
          })
        }

        if (fieldErrors.password && Array.isArray(fieldErrors.password)) {
          setError("password", {
            type: "server",
            message: fieldErrors.password[0]
          })
        }

        // Handle non-field errors (like "Invalid credentials")
        if (fieldErrors.non_field_errors && Array.isArray(fieldErrors.non_field_errors)) {
          setError("email_or_phone", {
            type: "server",
            message: fieldErrors.non_field_errors[0]
          })
        }

        if (fieldErrors.detail && typeof fieldErrors.detail === 'string') {
          setError("email_or_phone", {
            type: "server",
            message: fieldErrors.detail
          })
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPasswordSubmit = async () => {
    if (forgotPasswordStep === 1) {
      // Step 1: Send OTP
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
        console.error("Send OTP error:", error)
        // Handle field-specific errors for email
        if (error.response?.data?.email && Array.isArray(error.response.data.email)) {
          toast.error(error.response.data.email[0])
        }
      } finally {
        setIsLoading(false)
      }
    } else if (forgotPasswordStep === 2) {
      // Step 2: Verify OTP (just advance to next step, actual verification happens in reset)
      if (!forgotPasswordOtp || forgotPasswordOtp.length < 4) {
        toast.error("Veuillez entrer un code OTP valide (minimum 4 caractères)")
        return
      }
      toast.success("OTP vérifié avec succès")
      setForgotPasswordStep(3)
    } else if (forgotPasswordStep === 3) {
      // Step 3: Reset password
      if (!newPassword || newPassword.length < 6) {
        toast.error("Le mot de passe doit contenir au moins 6 caractères")
        return
      }

      if (newPassword !== confirmNewPassword) {
        toast.error("Les mots de passe ne correspondent pas")
        return
      }

      // Validate password strength
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

        // Update remembered credentials if the email matches
        // Always save the new credentials so the user can log in immediately
        const normalizedForgotEmail = forgotPasswordEmail.trim().toLowerCase().replace(/\s+/g, '')
        
        localStorage.setItem(CREDS_KEY, JSON.stringify({ 
          email: normalizedForgotEmail, 
          password: newPassword 
        }))
        
        // Also update user_email to keep it in sync
        localStorage.setItem("user_email", normalizedForgotEmail)

        // Reset forgot password state
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } catch (error: any) {
        console.error("Reset password error:", error)
        // Handle field-specific errors for password reset
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
            <Label htmlFor="forgot_email" className="text-sm sm:text-base font-medium text-foreground">Adresse e-mail de récupération</Label>
            <Input
              id="forgot_email"
              type="email"
              placeholder="votre.email@exemple.com"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              disabled={isLoading}
              className="h-12 sm:h-11 text-base sm:text-sm border-primary/20 focus:border-primary/40 bg-background/50 transition-all duration-200 focus:ring-2 focus:ring-primary/10"
            />
          </div>
          
          <Button 
            type="button"
            onClick={handleForgotPasswordSubmit}
            className="w-full h-11 sm:h-10 text-base sm:text-sm font-medium" 
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
            className="w-full h-11 sm:h-10 text-base sm:text-sm"
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
            <Label htmlFor="otp" className="text-sm sm:text-base font-medium text-foreground">Code de vérification à 6 chiffres</Label>
            <Input
              id="otp"
              type="text"
              placeholder="123456"
              value={forgotPasswordOtp}
              onChange={(e) => setForgotPasswordOtp(e.target.value)}
              disabled={isLoading}
              className="h-12 sm:h-11 text-base sm:text-sm border-primary/20 focus:border-primary/40 bg-background/50 transition-all duration-200 focus:ring-2 focus:ring-primary/10 text-center font-mono tracking-widest"
              maxLength={6}
            />
            <p className="text-xs text-muted-foreground font-medium">
              Code envoyé à votre adresse : {forgotPasswordEmail}
            </p>
          </div>
          
          <Button 
            type="button"
            onClick={handleForgotPasswordSubmit}
            className="w-full h-11 sm:h-10 text-base sm:text-sm font-medium" 
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
            className="w-full h-11 sm:h-10 text-base sm:text-sm"
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
            <Label htmlFor="new_password" className="text-sm sm:text-base font-medium text-foreground">Nouveau mot de passe sécurisé</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showNewPassword ? "text" : "password"}
                placeholder="Minimum 6 caractères avec majuscules et chiffres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                className="h-12 sm:h-11 text-base sm:text-sm pr-12 border-primary/20 focus:border-primary/40 bg-background/50 transition-all duration-200 focus:ring-2 focus:ring-primary/10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-12 sm:h-11 w-11 hover:bg-primary/5"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isLoading}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_new_password" className="text-sm sm:text-base font-medium text-foreground">Confirmer le mot de passe</Label>
            <div className="relative">
              <Input
                id="confirm_new_password"
                type={showConfirmNewPassword ? "text" : "password"}
                placeholder="Répétez le même mot de passe"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={isLoading}
                className="h-12 sm:h-11 text-base sm:text-sm pr-12 border-primary/20 focus:border-primary/40 bg-background/50 transition-all duration-200 focus:ring-2 focus:ring-primary/10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-12 sm:h-11 w-11 hover:bg-primary/5"
                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                disabled={isLoading}
              >
                {showConfirmNewPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          
          <Button 
            type="button"
            onClick={handleForgotPasswordSubmit}
            className="w-full h-11 sm:h-10 text-base sm:text-sm font-medium" 
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
            className="w-full h-11 sm:h-10 text-base sm:text-sm"
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
    <div className="space-y-5 sm:space-y-6">
      <Card className="glass-panel border border-primary/20 shadow-2xl shadow-primary/20 rounded-2xl sm:rounded-3xl overflow-hidden">
        <CardHeader className="space-y-4 px-6 sm:px-8 pt-8 sm:pt-10 text-center relative">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/30 ring-offset-2 ring-offset-background shadow-xl shadow-primary/20">
                <Image
                  src="/Slater-logo.png"
                  alt="Slater Logo"
                  width={80}
                  height={20}
                  className="w-16 h-auto object-contain drop-shadow-sm"
                  priority
                />
              </div>
              {/* <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center shadow-sm">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div> */}
            </div>
          </div>

          {/* <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/15 to-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-[0.15em] shadow-lg">
              {isForgotPassword ? "🔒 Sécurité" : "🔐 Connexion sécurisée"}
            </div>
          </div> */}
          <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground mt-4">
            {isForgotPassword ? "Récupération de compte" : "Bienvenue sur Slater"}
          </CardTitle>
          <CardDescription className="text-base sm:text-lg text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {isForgotPassword
              ? forgotPasswordStep === 1
                ? "Saisissez votre adresse e-mail pour recevoir un code de vérification sécurisé"
                : forgotPasswordStep === 2
                ? "Vérifiez votre boîte de réception et saisissez le code à 6 chiffres"
                : "Créez un nouveau mot de passe fort pour sécuriser votre compte"
              : "Connectez-vous à votre espace personnel pour gérer vos transactions"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8">
          {isForgotPassword ? (
            renderForgotPasswordForm()
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-7">
              <div className="space-y-2">
                <Label htmlFor="email_or_phone" className="text-sm sm:text-base font-medium text-foreground">Adresse e-mail ou téléphone</Label>
                <Input
                  id="email_or_phone"
                  type="text"
                  placeholder="votre.email@exemple.com ou +225 01 23 45 67"
                  {...register("email_or_phone")}
                  disabled={isLoading}
                  className="h-12 sm:h-11 text-base sm:text-sm border-primary/20 focus:border-primary/40 bg-background/50 transition-all duration-200 focus:ring-2 focus:ring-primary/10"
                />
                {errors.email_or_phone && <p className="text-xs sm:text-sm text-destructive font-medium">{errors.email_or_phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm sm:text-base font-medium text-foreground">Mot de passe sécurisé</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Entrez votre mot de passe"
                    {...register("password")}
                    disabled={isLoading}
                    className="h-12 sm:h-11 text-base sm:text-sm pr-12 border-primary/20 focus:border-primary/40 bg-background/50 transition-all duration-200 focus:ring-2 focus:ring-primary/10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-12 sm:h-11 w-11 hover:bg-primary/5"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && <p className="text-xs sm:text-sm text-destructive font-medium">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="remember_me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="remember_me"
                    className="text-sm font-medium cursor-pointer text-foreground"
                  >
                    Rester connecté
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm h-auto text-primary hover:text-primary/80 font-medium hover:underline"
                  onClick={() => {
                    setIsForgotPassword(true)
                    setForgotPasswordStep(1)
                    // Pre-fill email if available in the login form
                    const currentEmail = watch("email_or_phone")
                    if (currentEmail && currentEmail.includes("@")) {
                      setForgotPasswordEmail(currentEmail)
                    }
                  }}
                  disabled={isLoading}
                >
                  Mot de passe oublié ?
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full h-12 sm:h-11 text-base sm:text-sm font-bold bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-xl glow-primary hover:shadow-primary/50 transition-all duration-300 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    🔐 Se connecter maintenant
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 px-4 sm:px-6 pb-6 sm:pb-6">
          <div className="text-xs sm:text-sm text-muted-foreground text-center">
            Pas encore de compte?{" "}
            <Link href="/registerv2" className="text-primary hover:underline font-medium">
              Créer un compte
            </Link>
          </div>
          <div className="text-[10px] text-slate-300 font-mono text-center">
            Site Version: TURN 12 | Root Flow
          </div>
        </CardFooter>
      </Card>

      
    </div>
  )
}
