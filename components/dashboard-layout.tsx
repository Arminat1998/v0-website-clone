"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, User, Menu, X, Sun, Moon } from "lucide-react"
import Image from "next/image"
import { useTheme } from "@/contexts/theme-context"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { toggleTheme } = useTheme()
  const { t } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const menuItems = [
    { label: t.dashboard, href: "/dashboard" },
    { label: t.editProfile, href: "/dashboard/edit-profile" },
    { label: t.myWebsite, href: "/dashboard/my-page" },
    { label: t.calendar, href: "/dashboard/calendar" },
    { label: t.bookingRequests, href: "/dashboard/booking-requests" },
    { label: t.acceptedBookings, href: "/dashboard/accepted-bookings" },
    { label: t.completedBookings, href: "/dashboard/completed-bookings" },
    { label: t.chats, href: "/dashboard/chats" },
    { label: t.reviews, href: "/dashboard/reviews" },
    { label: t.agreement, href: "/dashboard/agreement" },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-lg shadow-md border border-border"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
      </button>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 lg:sticky lg:top-0
        w-64 h-screen bg-card border-r border-border flex flex-col
        transform transition-transform duration-200 ease-in-out
        overflow-y-auto
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 pt-6 flex-shrink-0 h-24 flex items-center justify-center">
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            <Image
              src="/arsi-logo.png"
              alt="ARSI Logo"
              width={600}
              height={185}
              className="h-10 w-auto object-contain dark:hidden"
            />
            <Image
              src="/arsi-logo-dark.png"
              alt="ARSI Logo"
              width={430}
              height={158}
              className="hidden h-10 w-auto object-contain dark:block"
            />
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 mb-1 rounded-lg text-sm leading-none hover:bg-accent transition-colors ${
                  isActive 
                    ? "bg-accent font-medium text-foreground" 
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Settings Section */}
        <div className="px-4 py-3 border-t border-border flex-shrink-0">
          <div className="flex items-center justify-center gap-2">
            {/* Language Switcher - Same as Navbar */}
            <LanguageSwitcher />

            {/* Theme Toggle - Same as Navbar */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-foreground hover:bg-accent h-8 w-8 sm:h-10 sm:w-10"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              <Moon className="h-4 w-4 sm:h-5 sm:w-5 dark:hidden" />
              <Sun className="hidden h-4 w-4 sm:h-5 sm:w-5 dark:block" />
            </Button>
          </div>
        </div>

        {/* Back to Profile Link */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors px-4 py-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToProfile}</span>
          </Link>
        </div>

        {/* Profile Avatar */}
        <div className="p-4 flex justify-center flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-accent border-2 border-border flex items-center justify-center">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen bg-background">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  )
}
