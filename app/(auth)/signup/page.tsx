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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { authApi, settingsApi } from "@/lib/api-client"
import { handleFieldErrors } from "@/lib/utils"
import { toast } from "react-hot-toast"
import { Loader2, Eye, EyeOff } from "lucide-react"
import Image from "next/image"

const baseSignupSchema = z.object({
  first_name: z.string().min(2, "Le prénom doit contenir au minimum 2 caractères"),
  last_name: z.string().min(2, "Le nom doit contenir au minimum 2 caractères"),
  email: z.string().email("Adresse e-mail invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au minimum 6 caractères"),
  re_password: z.string().min(6, "Confirmation du mot de passe requise"),
})

type SignupFormData = z.infer<typeof baseSignupSchema> & {
  referral_code?: string
}

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [referralBonusEnabled, setReferralBonusEnabled] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await settingsApi.get()
        setReferralBonusEnabled(settings?.referral_bonus === true)
      } catch (error) {
        console.error("Error fetching settings:", error)
        setReferralBonusEnabled(false)
      } finally {
        setIsLoadingSettings(false)
      }
    }
    fetchSettings()
  }, [])

  const signupSchema = referralBonusEnabled
    ? baseSignupSchema
        .extend({
          referral_code: z.string().optional(),
        })
        .refine((data) => data.password === data.re_password, {
          message: "Les mots de passe ne correspondent pas",
          path: ["re_password"],
        })
    : baseSignupSchema.refine((data) => data.password === data.re_password, {
        message: "Les mots de passe ne correspondent pas",
        path: ["re_password"],
      })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    try {
      const registrationData: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        re_password: data.re_password,
      }

      // Only include referral_code if referral bonus is enabled and code is provided
      if (referralBonusEnabled && data.referral_code) {
        registrationData.referral_code = data.referral_code
      }

      await authApi.register(registrationData)
      toast.success("Compte créé avec succès! Veuillez vous connecter.")
      router.push("/login")
    } catch (error: any) {
      console.error("Signup error:", error)

      // Handle field-specific errors from backend
      handleFieldErrors(error, setError, {
        email_or_phone: 'email' // Map email_or_phone to email for signup
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingSettings) {
    return (
      <Card className="border-border/50 shadow-xl">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
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
            {/*  */}
          </div>
        </div>

        {/* <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/15 to-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-[0.15em] shadow-lg">
            ✨ Création de compte
          </div>
        </div> */}
        <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground mt-4">Rejoignez la communauté Slater</CardTitle>
        <CardDescription className="text-base sm:text-lg text-muted-foreground max-w-sm mx-auto leading-relaxed">Créez votre compte sécurisé en quelques étapes simples</CardDescription>
      </CardHeader>
      <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-sm sm:text-base font-medium text-foreground">Prénom complet</Label>
              <Input id="first_name" type="text" placeholder="Votre prénom (ex: Jean-Marie)" {...register("first_name")} disabled={isLoading} className="h-12 sm:h-11 text-base sm:text-sm border-primary/20 focus:border-primary/40 bg-background/50 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-primary/10" />
              {errors.first_name && <p className="text-xs sm:text-sm text-destructive font-medium">{errors.first_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-sm sm:text-base font-medium text-foreground">Nom de famille</Label>
              <Input id="last_name" type="text" placeholder="Votre nom (ex: Kouassi)" {...register("last_name")} disabled={isLoading} className="h-12 sm:h-11 text-base sm:text-sm border-primary/20 focus:border-primary/40 bg-background/50 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-primary/10" />
              {errors.last_name && <p className="text-xs sm:text-sm text-destructive font-medium">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm sm:text-base font-medium text-foreground">Adresse e-mail principale</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre.email.principal@exemple.com"
              {...register("email")}
              disabled={isLoading}
              className="h-12 sm:h-11 text-base sm:text-sm border-primary/20 focus:border-primary/40 bg-background/50 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-primary/10"
            />
            {errors.email && <p className="text-xs sm:text-sm text-destructive font-medium">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm sm:text-base font-medium text-foreground">Numéro de téléphone mobile</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+225 01 23 45 67 89"
              {...register("phone")}
              disabled={isLoading}
              className="h-12 sm:h-11 text-base sm:text-sm border-primary/20 focus:border-primary/40 bg-background/50 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-primary/10"
            />
            {errors.phone && <p className="text-xs sm:text-sm text-destructive font-medium">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm sm:text-base font-medium text-foreground">Mot de passe sécurisé</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Au moins 6 caractères avec chiffres et majuscules"
                {...register("password")}
                disabled={isLoading}
                className="h-12 sm:h-11 text-base sm:text-sm pr-12 border-primary/20 focus:border-primary/40 bg-background/50 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-primary/10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-12 sm:h-11 w-11 hover:bg-primary/5 rounded-lg"
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

          <div className="space-y-2">
            <Label htmlFor="re_password" className="text-sm sm:text-base font-medium text-foreground">Confirmer le mot de passe</Label>
            <div className="relative">
              <Input
                id="re_password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Répétez exactement le même mot de passe"
                {...register("re_password")}
                disabled={isLoading}
                className="h-12 sm:h-11 text-base sm:text-sm pr-12 border-primary/20 focus:border-primary/40 bg-background/50 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-primary/10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-12 sm:h-11 w-11 hover:bg-primary/5 rounded-lg"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.re_password && <p className="text-xs sm:text-sm text-destructive font-medium">{errors.re_password.message}</p>}
          </div>

          {referralBonusEnabled && (
            <div className="space-y-2">
              <Label htmlFor="referral_code" className="text-sm sm:text-base font-medium text-foreground">Code de parrainage (optionnel)</Label>
              <Input
                id="referral_code"
                type="text"
                placeholder="Code fourni par votre parrain (ex: SLATER2024)"
                {...register("referral_code")}
                disabled={isLoading}
                className="h-12 sm:h-11 text-base sm:text-sm border-primary/20 focus:border-primary/40 bg-background/50 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-primary/10 uppercase font-mono"
              />
              {errors.referral_code && <p className="text-xs sm:text-sm text-destructive font-medium">{errors.referral_code.message}</p>}
            </div>
          )}

          <Button type="submit" className="w-full h-12 sm:h-11 text-base sm:text-sm font-bold bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-xl glow-primary hover:shadow-primary/50 rounded-xl transition-all duration-300 transform hover:scale-[1.02]" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création de votre compte...
              </>
            ) : (
              <>
                🚀 Créer mon compte maintenant
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-3 px-6 sm:px-8 pb-8 sm:pb-10">
        <div className="text-sm sm:text-base text-muted-foreground text-center font-medium">
          Déjà membre de la communauté Slater ?{" "}
          <Link href="/login" className="text-primary hover:text-primary/80 font-bold hover:underline transition-colors">
            Se connecter à mon compte →
          </Link>
        </div>
        <div className="text-xs text-muted-foreground/80 text-center max-w-sm mx-auto">
          En créant un compte, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
        </div>
      </CardFooter>
    </Card>
  )
}
