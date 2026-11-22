"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowLeft,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  FileText,
  Globe,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Star,
  Sun,
  UserRound,
  X,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { useTheme } from "@/contexts/theme-context"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: ReactNode
}

// These two pages render without their own spacing; the others bring it themselves.
const PADDED_PAGES = ["/dashboard/chats", "/dashboard/reviews"]

/** The shell of the professional's dashboard, in the same form as the client's account (components/account/account-shell). */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toggleTheme } = useTheme()
  const { t, language } = useLanguage()
  const nl = language === "nl"
  const { data: sessionData } = authClient.useSession()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState("")

  const items = [
    { label: t.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { label: nl ? "Boekingsaanvragen" : t.bookingRequests, href: "/dashboard/booking-requests", icon: Inbox },
    { label: nl ? "Geaccepteerde boekingen" : t.acceptedBookings, href: "/dashboard/accepted-bookings", icon: CalendarCheck },
    { label: nl ? "Afgeronde boekingen" : t.completedBookings, href: "/dashboard/completed-bookings", icon: CheckCircle2 },
    { label: t.calendar, href: "/dashboard/calendar", icon: CalendarDays },
    { label: t.chats, href: "/dashboard/chats", icon: MessageSquare },
    { label: t.reviews, href: "/dashboard/reviews", icon: Star },
    { label: nl ? "Profiel bewerken" : t.editProfile, href: "/dashboard/edit-profile", icon: UserRound },
    { label: nl ? "Mijn website" : t.myWebsite, href: "/dashboard/my-page", icon: Globe },
    { label: t.agreement, href: "/dashboard/agreement", icon: FileText },
  ]
  const active = items.find((item) => pathname === item.href)
  const name = sessionData?.user?.name ?? ""

  async function signOut() {
    setSigningOut(true)
    try {
      const result = await authClient.signOut()
      if (result.error) throw new Error("Sign out failed")
      router.push("/")
      router.refresh()
    } catch {
      setError(nl ? "Uitloggen is niet gelukt. Probeer opnieuw." : "Could not sign out. Try again.")
    } finally {
      setSigningOut(false)
    }
  }

  const nav = (
    <nav aria-label="Dashboard" className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          aria-current={active?.href === href ? "page" : undefined}
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-lg px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring",
            active?.href === href
              ? "bg-brand/10 font-semibold text-red-700 dark:text-red-400"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <Icon className="size-5 shrink-0" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  )

  const footer = (
    <div className="flex flex-col gap-2">
      <Link
        href="/"
        onClick={() => setOpen(false)}
        className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {nl ? "Terug naar ontdekken" : "Back to explore"}
      </Link>
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-sm font-semibold">
          {sessionData?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sessionData.user.image} alt="" className="size-full object-cover" />
          ) : (
            name.slice(0, 2).toUpperCase()
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <p className="truncate text-sm text-muted-foreground">{sessionData?.user?.email}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-11"
          onClick={signOut}
          disabled={signingOut}
          aria-label={nl ? "Uitloggen" : "Sign out"}
          title={nl ? "Uitloggen" : "Sign out"}
        >
          <LogOut />
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r bg-card lg:flex">
        <div className="px-7 py-6">
          <Link href="/" aria-label={nl ? "ARSI Events, naar home" : "ARSI Events, go to home"} className="inline-flex min-h-11 items-center">
            <Image src="/arsi-logo.png" alt="" width={160} height={50} className="h-10 w-auto dark:hidden" />
            <Image src="/arsi-logo-dark.png" alt="" width={160} height={50} className="hidden h-10 w-auto dark:block" />
          </Link>
        </div>
        <div className="flex-1 px-4 pb-4">{nav}</div>
        <div className="border-t p-5">{footer}</div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex min-h-16 items-center justify-between gap-2 border-b px-4 sm:px-8 lg:min-h-20">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="size-11 lg:hidden" aria-label={nl ? "Menu openen" : "Open menu"}>
                  <Menu />
                </Button>
              </SheetTrigger>
              {/* The sheet's own close button is 16 px and English only, so it is replaced by the one below. */}
              <SheetContent side="left" className="gap-0 overflow-y-auto [&>button]:hidden">
                <SheetHeader className="flex-row items-center justify-between">
                  <div>
                    <SheetTitle>Dashboard</SheetTitle>
                    <SheetDescription>ARSI Events</SheetDescription>
                  </div>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="size-11" aria-label={nl ? "Menu sluiten" : "Close menu"}>
                      <X />
                    </Button>
                  </SheetClose>
                </SheetHeader>
                <div className="flex-1 px-4">{nav}</div>
                <div className="p-4">{footer}</div>
              </SheetContent>
            </Sheet>
            <p className="truncate text-sm text-muted-foreground">
              <span className={active?.href === "/dashboard" ? "text-foreground" : "hidden sm:inline"}>Dashboard</span>
              {active && active.href !== "/dashboard" && (
                <>
                  <span className="mx-3 hidden text-border sm:inline" aria-hidden>
                    /
                  </span>
                  <span className="text-foreground">{active.label}</span>
                </>
              )}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              className="size-11"
              onClick={toggleTheme}
              aria-label={nl ? "Licht of donker thema" : "Light or dark theme"}
            >
              <Moon className="dark:hidden" />
              <Sun className="hidden dark:block" />
            </Button>
          </div>
        </header>
        <main className={cn("touch-targets mx-auto max-w-7xl", PADDED_PAGES.includes(pathname) && "p-4 sm:p-8 lg:p-10")}>
          {children}
        </main>
      </div>
    </div>
  )
}
