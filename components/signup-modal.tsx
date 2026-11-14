"use client"

import { trackUserTest } from "@/lib/usertest"
import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Eye, EyeOff, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/contexts/language-context"
import { authClient } from "@/lib/auth-client"
import { lettersOnly, phoneChars } from "@/lib/input-filters"
import { setPendingPassword } from "@/lib/pending-signup"
import { isEmailAvailable } from "@/app/actions/signup-check"

interface SignupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToLogin?: () => void
  onSignup?: () => void
}

export function SignupModal({ open, onOpenChange, onSwitchToLogin, onSignup }: SignupModalProps) {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [showPassword, setShowPassword] = useState(false)
  const [accountType, setAccountType] = useState<"user" | "professional" | null>(null)
  const [category, setCategory] = useState<string>("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) trackUserTest("signup_opened")
  }, [open])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    trackUserTest("signup_submitted", { account_type: accountType })

    if (!accountType) {
      trackUserTest("signup_error", { reason: "account_type_missing" })
      setError(language === "nl" ? "Kies eerst wat voor account je wilt." : "First choose the kind of account you want.")
      return
    }
    if (accountType === "professional" && !category) {
      trackUserTest("signup_error", { reason: "category_missing" })
      setError(language === "nl" ? "Kies een categorie." : "Please choose a category.")
      return
    }
    if (password.length < 8) {
      trackUserTest("signup_error", { reason: "password_too_short" })
      setError(language === "nl" ? "Je wachtwoord moet minimaal 8 tekens hebben." : "Your password must be at least 8 characters.")
      return
    }
    if (password !== password2) {
      trackUserTest("signup_error", { reason: "password_mismatch" })
      setError(language === "nl" ? "De twee wachtwoorden zijn niet hetzelfde." : "The two passwords do not match.")
      return
    }
    if (accountType === "professional") {
      setLoading(true)
      const available = await isEmailAvailable({ email }).catch(() => true)
      setLoading(false)
      if (!available) {
        trackUserTest("signup_error", { reason: "email_taken" })
        setError(
          language === "nl"
            ? "Er bestaat al een account met dit e-mailadres. Log in of gebruik een ander adres."
            : "An account with this email address already exists. Log in or use another address.",
        )
        return
      }
      // A professional only gets an account once the registration form is saved. The details
      // travel along and are fixed there; the password stays in memory only.
      sessionStorage.setItem(
        "professionalSignupData",
        JSON.stringify({ category, fullName: fullName.trim(), email: email.trim(), phone: phone.trim() }),
      )
      setPendingPassword(password)
      setPassword("")
      setPassword2("")
      onOpenChange(false)
      router.push("/register/professional")
      return
    }

    setLoading(true)
    const { error: signUpError } = await authClient.signUp.email({
      name: fullName.trim(),
      email: email.trim(),
      password,
      role: accountType,
      phone: phone.trim(),
    })
    setLoading(false)

    if (signUpError) {
      trackUserTest("signup_error", { reason: "server" })
      setError(
        language === "nl"
          ? "Registreren is niet gelukt. Controleer je gegevens of log in als je al een account hebt."
          : "Sign up failed. Check your details, or log in if you already have an account.",
      )
      return
    }
    setPassword("")
    setPassword2("")
    trackUserTest("signup_completed", { account_type: accountType })

    onOpenChange(false)
    if (onSignup) onSignup()
    else router.push("/account")
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-w-[95vw] p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">{t.createAccount}</DialogTitle>
        <div className="relative p-4 sm:p-8">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-500">{t.createAccount}</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-2">{t.createAccountSubtitle}</p>
            </div>

            {/* Account Type Toggle: no default, so nobody ends up with the wrong kind of account. */}
            <div className="space-y-2">
              <p id="account-type-label" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {language === "nl" ? "Wat voor account wil je?" : "What kind of account do you want?"}
              </p>
              <div role="group" aria-labelledby="account-type-label" className="flex gap-0 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <button
                  type="button"
                  aria-pressed={accountType === "user"}
                  onClick={() => setAccountType("user")}
                  className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                    accountType === "user"
                      ? "bg-red-700 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {t.user}
                </button>
                <button
                  type="button"
                  aria-pressed={accountType === "professional"}
                  onClick={() => setAccountType("professional")}
                  className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                    accountType === "professional"
                      ? "bg-red-700 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {t.professional}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === "nl"
                  ? "Gebruiker: je wilt boeken. Professional: je wilt geboekt worden, bijvoorbeeld als artiest."
                  : "User: you want to book. Professional: you want to be booked, for example as an artist."}
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-3 sm:space-y-4">
              {accountType === "professional" && (
                <div>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger className="h-12 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:border-red-600 focus:ring-red-600">
                      <SelectValue placeholder={t.selectCategory} />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800">
                      <SelectItem value="artist">{t.categoryArtist}</SelectItem>
                      <SelectItem value="photo-video">{t.categoryPhotoVideo}</SelectItem>
                      <SelectItem value="venue">{t.categoryVenue}</SelectItem>
                      <SelectItem value="catering">{t.categoryCatering}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.categoryHelp}</p>
                </div>
              )}

              <div>
                <Input
                  type="text"
                  placeholder={t.fullName}
                  aria-label={t.fullName}
                  value={fullName}
                  onChange={(e) => setFullName(lettersOnly(e.target.value))}
                  className="h-12 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-red-600 focus:ring-red-600"
                  required
                />
              </div>

              <div>
                <Input
                  type="email"
                  placeholder={t.email}
                  aria-label={t.email}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-red-600 focus:ring-red-600"
                  required
                />
              </div>

              <div>
                <Input
                  type="tel"
                  placeholder={t.phoneNumber}
                  aria-label={t.phoneNumber}
                  value={phone}
                  onChange={(e) => setPhone(phoneChars(e.target.value))}
                  className="h-12 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-red-600 focus:ring-red-600"
                  required
                />
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t.password}
                    aria-label={t.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-10 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-red-600 focus:ring-red-600"
                  required
                  autoComplete="new-password"
                  aria-describedby="signup-password-help"
                />
                <button
                  type="button"
                  aria-label={language === "nl" ? "Wachtwoord tonen of verbergen" : "Show or hide password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={language === "nl" ? "Herhaal wachtwoord" : "Repeat password"}
                  aria-label={language === "nl" ? "Herhaal wachtwoord" : "Repeat password"}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className="h-12 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-red-600 focus:ring-red-600"
                  required
                  autoComplete="new-password"
                />
              </div>

              <p id="signup-password-help" className="text-xs text-gray-500 dark:text-gray-400">
                {language === "nl" ? "Minimaal 8 tekens." : "At least 8 characters."}
              </p>

              {accountType === "professional" && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {language === "nl"
                    ? "Op de volgende pagina vul je je profiel in. Deze gegevens gaan mee en zijn daar niet meer aan te passen. Je account wordt aangemaakt zodra je dat formulier opslaat."
                    : "On the next page you complete your profile. These details are carried over and cannot be changed there. Your account is created once you save that form."}
                </p>
              )}

              {error && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 sm:h-12 bg-red-700 hover:bg-red-600 text-white font-medium text-sm sm:text-base"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : accountType === "professional" ? (
                  language === "nl" ? "Verder naar registratie" : "Continue to registration"
                ) : (
                  t.signUpButton
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-600 dark:text-gray-300">
              {t.alreadyHaveAccount}{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {t.logIn}
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
