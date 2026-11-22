"use client"

import Link from "next/link"
import { LayoutDashboard, LogOut, User } from "lucide-react"
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
        className="flex size-11 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-accent hover:border-red-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
        ) : (
          <User className="size-5 text-muted-foreground" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="min-h-11 sm:min-h-9">
          <Link href={dashboardPath} className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            {role === "user" ? (nl ? "Mijn dashboard" : "My dashboard") : "Dashboard"}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onSignOut} className="min-h-11 cursor-pointer sm:min-h-9">
          <LogOut className="mr-2 h-4 w-4" />
          {nl ? "Uitloggen" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
