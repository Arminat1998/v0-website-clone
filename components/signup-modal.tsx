"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Eye, EyeOff } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/contexts/language-context"

interface SignupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToLogin?: () => void
  onSignup?: () => void
}

export function SignupModal({ open, onOpenChange, onSwitchToLogin, onSignup }: SignupModalProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [showPassword, setShowPassword] = useState(false)
  const [accountType, setAccountType] = useState<"user" | "professional">("user")
  const [category, setCategory] = useState<string>("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Signup simulated:", { fullName, email, phone, password, accountType, category })

    if (accountType === "professional") {
      console.log("[v0] Redirecting professional to registration page")
      sessionStorage.setItem(
        "professionalSignupData",
        JSON.stringify({
          fullName,
          email,
          phone,
          category,
        }),
      )
      onOpenChange(false)
      router.push("/register/professional")
    } else {
      // Regular user signup - redirect to dashboard
      console.log("[v0] Redirecting user to dashboard")
      if (onSignup) {
        onSignup()
      }
      onOpenChange(false)
      router.push("/dashboard")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-w-[95vw] p-0 gap-0 max-h-[90vh] overflow-y-auto">
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

            {/* Account Type Toggle */}
            <div className="flex gap-0 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
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
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-red-600 focus:ring-red-600"
                  required
                />
              </div>

              <div>
                <Input
                  type="email"
                  placeholder={t.email}
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-red-600 focus:ring-red-600"
                  required
                />
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-10 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-red-600 focus:ring-red-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-11 sm:h-12 bg-red-700 hover:bg-red-600 text-white font-medium text-sm sm:text-base"
              >
                {t.signUpButton}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-gray-600 dark:text-gray-300 font-medium">
                  {t.orContinueWith}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {t.google}
            </Button>

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
