"use client"

import { trackUserTest } from "@/lib/usertest"
import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, X, Eye, EyeOff, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/contexts/language-context"
import { authClient } from "@/lib/auth-client"
import { lettersOnly, phoneChars } from "@/lib/input-filters"
import { setPendingPassword } from "@/lib/pending-signup"
import { isEmailAvailable } from "@/app/actions/signup-check"

/** Visible label above a field; required fields get a red asterisk. */
function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">
      {children}
      <span className="ml-0.5 text-red-700 dark:text-red-400" aria-hidden="true">
        *
      </span>
    </label>
  )
}

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
  const [accountType, setAccountType] = useState<"user" | "professional" | null>("user")
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
      if (signUpError.status === 429) {
        setError(
          language === "nl"
            ? "Te veel pogingen. Probeer het over een minuut opnieuw."
            : "Too many attempts. Try again in a minute.",
        )
        return
      }
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
      <DialogContent showCloseButton={false} className="sm:max-w-[480px] max-w-[95vw] p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <div className="relative p-4 sm:p-8">
          <DialogClose
            aria-label={language === "nl" ? "Sluiten" : "Close"}
            className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="size-5" aria-hidden />
          </DialogClose>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <DialogTitle className="pr-10 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{t.createAccount}</DialogTitle>
              <DialogDescription className="mt-2 text-sm">{t.createAccountSubtitle}</DialogDescription>
            </div>

            {/* Account Type Toggle: no default, so nobody ends up with the wrong kind of account. */}
            <div className="space-y-2">
              <p id="account-type-label" className="text-sm font-medium text-foreground">
                {language === "nl" ? "Wat voor account wil je?" : "What kind of account do you want?"}
              </p>
              <div role="group" aria-labelledby="account-type-label" className="flex gap-0 overflow-hidden rounded-lg border border-[var(--rf-line)]">
                <button
                  type="button"
                  aria-pressed={accountType === "user"}
                  onClick={() => setAccountType("user")}
                  className={`flex min-h-12 flex-1 items-center justify-center gap-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring ${
                    accountType === "user"
                      ? "bg-red-700 text-white"
                      : "bg-[var(--rf-field)] text-foreground hover:bg-accent"
                  }`}
                >
                  {accountType === "user" && <Check className="size-4" aria-hidden />}
                  {t.user}
                </button>
                <button
                  type="button"
                  aria-pressed={accountType === "professional"}
                  onClick={() => setAccountType("professional")}
                  className={`flex min-h-12 flex-1 items-center justify-center gap-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring ${
                    accountType === "professional"
                      ? "bg-red-700 text-white"
                      : "bg-[var(--rf-field)] text-foreground hover:bg-accent"
                  }`}
                >
                  {accountType === "professional" && <Check className="size-4" aria-hidden />}
                  {t.professional}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "nl"
                  ? "Gebruiker: je wilt boeken. Professional: je wilt geboekt worden, bijvoorbeeld als artiest."
                  : "User: you want to book. Professional: you want to be booked, for example as an artist."}
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-3 sm:space-y-4">
              <p className="text-xs text-muted-foreground">
                {language === "nl" ? "Velden met " : "Fields marked "}
                <span className="text-red-700 dark:text-red-400">*</span>
                {language === "nl" ? " zijn verplicht." : " are required."}
              </p>
              {accountType === "professional" && (
                <div>
                  <FieldLabel htmlFor="signup-category">{language === "nl" ? "Categorie" : "Category"}</FieldLabel>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger id="signup-category" className="h-12 w-full border-[var(--rf-line)] bg-[var(--rf-field)] text-foreground data-[size=default]:h-12 dark:bg-[var(--rf-field)]">
                      <SelectValue placeholder={t.selectCategory} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="artist">{t.categoryArtist}</SelectItem>
                      <SelectItem value="photo-video">{t.categoryPhotoVideo}</SelectItem>
                      <SelectItem value="venue" disabled>{t.categoryVenue} ({language === "nl" ? "binnenkort" : "coming soon"})</SelectItem>
                      <SelectItem value="catering" disabled>{t.categoryCatering} ({language === "nl" ? "binnenkort" : "coming soon"})</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">{t.categoryHelp}</p>
                </div>
              )}

              <div>
                <FieldLabel htmlFor="signup-name">{t.fullName}</FieldLabel>
                <Input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  placeholder={language === "nl" ? "Voor- en achternaam" : "First and last name"}
                  value={fullName}
                  onChange={(e) => setFullName(lettersOnly(e.target.value))}
                  className="h-12 border-[var(--rf-line)] bg-[var(--rf-field)] text-foreground placeholder:text-[var(--rf-placeholder)] dark:bg-[var(--rf-field)]"
                  required
                />
              </div>

              <div>
                <FieldLabel htmlFor="signup-email">{t.email}</FieldLabel>
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder={language === "nl" ? "naam@voorbeeld.nl" : "name@example.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-[var(--rf-line)] bg-[var(--rf-field)] text-foreground placeholder:text-[var(--rf-placeholder)] dark:bg-[var(--rf-field)]"
                  required
                />
              </div>

              <div>
                <FieldLabel htmlFor="signup-phone">{t.phoneNumber}</FieldLabel>
                <Input
                  id="signup-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder={language === "nl" ? "06 12345678" : "+31 6 12345678"}
                  value={phone}
                  onChange={(e) => setPhone(phoneChars(e.target.value))}
                  className="h-12 border-[var(--rf-line)] bg-[var(--rf-field)] text-foreground placeholder:text-[var(--rf-placeholder)] dark:bg-[var(--rf-field)]"
                  required
                />
              </div>

              <div>
                <FieldLabel htmlFor="signup-password">{t.password}</FieldLabel>
                <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 border-[var(--rf-line)] bg-[var(--rf-field)] text-foreground placeholder:text-[var(--rf-placeholder)] dark:bg-[var(--rf-field)] pr-12"
                  required
                  autoComplete="new-password"
                  aria-describedby="signup-password-help"
                />
                <button
                  type="button"
                  aria-pressed={showPassword}
                  aria-label={language === "nl" ? "Wachtwoord tonen" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 flex size-12 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              </div>

              <div>
                <FieldLabel htmlFor="signup-password2">{language === "nl" ? "Herhaal wachtwoord" : "Repeat password"}</FieldLabel>
                <Input
                  id="signup-password2"
                  type={showPassword ? "text" : "password"}
                  placeholder={language === "nl" ? "Herhaal wachtwoord" : "Repeat password"}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className="h-12 border-[var(--rf-line)] bg-[var(--rf-field)] text-foreground placeholder:text-[var(--rf-placeholder)] dark:bg-[var(--rf-field)]"
                  required
                  autoComplete="new-password"
                />
              </div>

              <p id="signup-password-help" className="text-xs text-muted-foreground">
                {language === "nl" ? "Minimaal 8 tekens." : "At least 8 characters."}
              </p>

              {accountType === "professional" && (
                <p className="text-sm text-muted-foreground">
                  {language === "nl"
                    ? "Op de volgende pagina vul je je profiel in. Deze gegevens gaan mee en zijn daar niet meer aan te passen. Je account wordt aangemaakt zodra je dat formulier opslaat."
                    : "On the next page you complete your profile. These details are carried over and cannot be changed there. Your account is created once you save that form."}
                </p>
              )}

              {error && (
                <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-red-700 hover:bg-red-600 text-white font-medium text-sm sm:text-base"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : accountType === "professional" ? (
                  language === "nl" ? "Verder naar registratie" : "Continue to registration"
                ) : (
                  language === "nl" ? "Account aanmaken" : "Create account"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {t.alreadyHaveAccount}{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="inline-flex min-h-11 items-center font-medium text-red-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring dark:text-red-400"
              >
                {language === "nl" ? "Inloggen" : "Log in"}
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
