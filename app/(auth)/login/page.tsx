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
import { toast } from "react-hot-toast"
import { Loader2, Eye, EyeOff, Download, ArrowLeft } from "lucide-react"
import { setupNotifications } from "@/lib/fcm-helper"

const loginSchema = z.object({
  email_or_phone: z.string().min(1, "Email ou téléphone requis"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
})

type LoginFormData = z.infer<typeof loginSchema>

const APK_DOWNLOAD_URL = "/app-v1.0.5.apk"
const APK_FILE_NAME = "Slater-v1.0.5.apk"

export default function LoginPage() {
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
      // Step 1: Authenticate user
      const response = await authApi.login(data.email_or_phone, data.password)
      
      // Handle Remember Me
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
      router.push("/dashboard")
    } catch (error) {
      // Error is handled by api interceptor
      console.error("Login error:", error)
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
      } catch (error) {
        console.error("Send OTP error:", error)
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
        
        // Reset forgot password state
        setIsForgotPassword(false)
        setForgotPasswordStep(1)
        setForgotPasswordEmail("")
        setForgotPasswordOtp("")
        setNewPassword("")
        setConfirmNewPassword("")
      } catch (error) {
        console.error("Reset password error:", error)
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
            <Label htmlFor="forgot_email" className="text-sm sm:text-base">Email</Label>
            <Input
              id="forgot_email"
              type="email"
              placeholder="exemple@email.com"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              disabled={isLoading}
              className="h-11 sm:h-10 text-base sm:text-sm"
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
            <Label htmlFor="otp" className="text-sm sm:text-base">Code de vérification</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Entrez le code OTP"
              value={forgotPasswordOtp}
              onChange={(e) => setForgotPasswordOtp(e.target.value)}
              disabled={isLoading}
              className="h-11 sm:h-10 text-base sm:text-sm"
              maxLength={6}
            />
            <p className="text-xs text-muted-foreground">
              Entrez le code de vérification envoyé à {forgotPasswordEmail}
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
            <Label htmlFor="new_password" className="text-sm sm:text-base">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showNewPassword ? "text" : "password"}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                className="h-11 sm:h-10 text-base sm:text-sm pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-11 sm:h-10 w-10 hover:bg-transparent"
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
            <Label htmlFor="confirm_new_password" className="text-sm sm:text-base">Confirmer le nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="confirm_new_password"
                type={showConfirmNewPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={isLoading}
                className="h-11 sm:h-10 text-base sm:text-sm pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-11 sm:h-10 w-10 hover:bg-transparent"
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
      <Card className="glass-panel border border-primary/15 shadow-xl shadow-primary/10">
        <CardHeader className="space-y-1 px-4 sm:px-6 pt-6 sm:pt-6 text-center">
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-[0.2em]">
            {isForgotPassword ? "Sécurité" : "Connexion sécurisée"}
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">
            {isForgotPassword ? "Réinitialiser le mot de passe" : "Connexion"}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-muted-foreground">
            {isForgotPassword 
              ? forgotPasswordStep === 1 
                ? "Entrez votre adresse email pour recevoir un code de vérification"
                : forgotPasswordStep === 2
                ? "Entrez le code de vérification envoyé à votre email"
                : "Entrez votre nouveau mot de passe"
              : "Accédez à votre espace client en toute sécurité"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {isForgotPassword ? (
            renderForgotPasswordForm()
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email_or_phone" className="text-sm sm:text-base">Email ou Téléphone</Label>
                <Input
                  id="email_or_phone"
                  type="text"
                  placeholder="exemple@email.com ou +225..."
                  {...register("email_or_phone")}
                  disabled={isLoading}
                  className="h-11 sm:h-10 text-base sm:text-sm"
                />
                {errors.email_or_phone && <p className="text-xs sm:text-sm text-destructive">{errors.email_or_phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm sm:text-base">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    disabled={isLoading}
                    className="h-11 sm:h-10 text-base sm:text-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 sm:h-10 w-10 hover:bg-transparent"
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
                {errors.password && <p className="text-xs sm:text-sm text-destructive">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember_me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="remember_me"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Se souvenir de moi
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm h-auto text-primary"
                  onClick={() => {
                    setIsForgotPassword(true)
                    setForgotPasswordStep(1)
                  }}
                  disabled={isLoading}
                >
                  Mot de passe oublié?
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full h-11 sm:h-10 text-base sm:text-sm font-medium bg-primary text-primary-foreground glow-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 px-4 sm:px-6 pb-6 sm:pb-6">
          <div className="text-xs sm:text-sm text-muted-foreground text-center">
            Pas encore de compte?{" "}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              Créer un compte
            </Link>
          </div>
        </CardFooter>
      </Card>

      <Button
        asChild
        variant="outline"
        className="w-full h-11 sm:h-10 text-base sm:text-sm font-medium flex items-center justify-center gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10 text-foreground"
      >
        <a href={APK_DOWNLOAD_URL} download={APK_FILE_NAME} className="flex items-center gap-2">
          <Download className="h-4 w-4 text-primary" />
          Télécharger l'application mobile
        </a>
      </Button>
    </div>
  )
}
