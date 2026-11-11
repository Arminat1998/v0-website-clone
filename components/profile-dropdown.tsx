"use client"

import Link from "next/link"
import { CalendarCheck, LayoutDashboard, LogOut, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/contexts/language-context"

interface ProfileDropdownProps {
  name: string
  image?: string | null
  role?: string | null
  onSignOut: () => void
}

export function ProfileDropdown({ name, image, role, onSignOut }: ProfileDropdownProps) {
  const nl = useLanguage().language === "nl"
  const dashboardPath = role === "admin" ? "/admin" : role === "professional" ? "/dashboard" : "/account"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={nl ? "Profielmenu" : "Profile menu"}
        className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-accent hover:border-red-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
        ) : (
          <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={dashboardPath} className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            {role === "user" ? (nl ? "Mijn dashboard" : "My dashboard") : "Dashboard"}
          </Link>
        </DropdownMenuItem>
        {role === "user" && <DropdownMenuItem asChild>
          <Link href="/account/boekingen" className="cursor-pointer">
            <CalendarCheck className="mr-2 h-4 w-4" />
            {nl ? "Mijn boekingen" : "My bookings"}
          </Link>
        </DropdownMenuItem>}
        <DropdownMenuItem onSelect={onSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          {nl ? "Uitloggen" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
