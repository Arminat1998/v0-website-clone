"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Inbox, Users, Settings, Menu, X, Sun, Moon, ArrowLeft } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"
import { Button } from "@/components/ui/button"
import { useAdmin } from "@/contexts/admin-submissions-context"

const menuItems = [
  { label: "Overzicht", href: "/admin", icon: LayoutDashboard },
  { label: "Aanmeldingen", href: "/admin/aanmeldingen", icon: Inbox },
  { label: "Artiesten", href: "/admin/artiesten", icon: Users },
  { label: "Instellingen", href: "/admin/instellingen", icon: Settings },
]

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { toggleTheme } = useTheme()
  const { submissions } = useAdmin()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const teBeoordelen = submissions.filter((s) => s.status === "nieuw").length

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-lg shadow-md border border-border"
        aria-label="Menu openen of sluiten"
      >
        {mobileMenuOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
      </button>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 lg:sticky lg:top-0 w-64 h-screen bg-card border-r border-border flex flex-col transform transition-transform duration-200 ease-in-out overflow-y-auto ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 flex-shrink-0 h-24 flex items-center justify-center border-b border-border">
          <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
            <Image
              src="/arsi-logo.png"
              alt="ARSI Events logo"
              width={600}
              height={185}
              className="h-9 w-auto object-contain dark:hidden"
            />
            <Image
              src="/arsi-logo-dark.png"
              alt="ARSI Events logo"
              width={430}
              height={158}
              className="hidden h-9 w-auto object-contain dark:block"
            />
          </Link>
        </div>

        <div className="px-6 pt-5 pb-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Beheer</p>
        </div>

        <nav className="flex-1 px-4">
          {menuItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 mb-1 rounded-lg text-sm transition-colors ${
                  active ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  {item.label}
                </span>
                {item.href === "/admin/aanmeldingen" && teBeoordelen > 0 && (
                  <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-600 text-white text-xs font-semibold">
                    {teBeoordelen}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-3 border-t border-border flex-shrink-0 flex items-center justify-between">
          <span className="text-xs text-muted-foreground px-2">Thema</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-foreground hover:bg-accent h-9 w-9"
            title="Thema wisselen"
            aria-label="Thema wisselen"
          >
            <Moon className="h-4 w-4 dark:hidden" />
            <Sun className="hidden h-4 w-4 dark:block" />
          </Button>
        </div>

        <div className="p-4 border-t border-border flex-shrink-0">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors px-4 py-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Terug naar site</span>
          </Link>
        </div>

        <div className="p-4 border-t border-border flex-shrink-0 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            NB
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Noor Bakker</p>
            <p className="text-xs text-muted-foreground truncate">Beheerder</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-h-screen bg-background">
        <div className="pt-16 lg:pt-0">{children}</div>
      </main>
    </div>
  )
}
