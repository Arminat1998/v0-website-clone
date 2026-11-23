"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Star,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useTheme } from "@/contexts/theme-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { clearBookingDrafts } from "@/hooks/use-booking-draft";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function AccountShell({
  children,
  name,
  email,
  image = null,
  unread,
}: {
  children: ReactNode;
  name: string;
  email: string;
  image?: string | null;
  unread: number;
}) {
  const nl = useLanguage().language === "nl";
  const { toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const items = [
    {
      href: "/account",
      label: nl ? "Overzicht" : "Overview",
      icon: LayoutDashboard,
    },
    {
      href: "/account/boekingen",
      label: nl ? "Mijn boekingen" : "My bookings",
      icon: CalendarDays,
    },
    {
      href: "/account/berichten",
      label: nl ? "Berichten" : "Messages",
      icon: MessageSquare,
    },
    {
      href: "/account/reviews",
      label: nl ? "Reviews" : "Reviews",
      icon: Star,
    },
    {
      href: "/account/favorieten",
      label: nl ? "Favorieten" : "Favorites",
      icon: Heart,
    },
    {
      href: "/account/meldingen",
      label: nl ? "Meldingen" : "Notifications",
      icon: Bell,
    },
    {
      href: "/account/profiel",
      label: nl ? "Mijn gegevens" : "My details",
      icon: UserRound,
    },
  ];
  const active = items.find((item) =>
    item.href === "/account"
      ? pathname === item.href
      : pathname.startsWith(item.href),
  );
  const logo = (
    <Link href="/" aria-label="ARSI Events" onClick={() => setOpen(false)}>
      <Image
        src="/arsi-logo.png"
        alt="ARSI Events"
        width={160}
        height={50}
        className="h-10 w-auto dark:hidden"
      />
      <Image
        src="/arsi-logo-dark.png"
        alt="ARSI Events"
        width={160}
        height={50}
        className="hidden h-10 w-auto dark:block"
      />
    </Link>
  );
  const nav = (
    <nav
      aria-label={nl ? "Klantomgeving" : "Customer account"}
      className="flex flex-col gap-1"
    >
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          aria-current={active?.href === href ? "page" : undefined}
          className={cn(
            "flex min-h-11 items-center rounded-lg px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring",
            active?.href === href
              ? "bg-brand/10 font-semibold text-red-700 dark:text-red-400"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <span className="flex items-center gap-3">
            <Icon className="size-5" aria-hidden />
            {label}
          </span>
          {href.endsWith("meldingen") && unread > 0 && (
            <span className="ml-auto rounded-full bg-red-700 px-2 text-sm text-white">
              {unread}
              <span className="sr-only">{nl ? " ongelezen" : " unread"}</span>
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
  async function signOut() {
    setSigningOut(true);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Sign out failed");
      clearBookingDrafts();
      router.push("/");
      router.refresh();
    } catch {
      setError(
        nl
          ? "Uitloggen is niet gelukt. Probeer opnieuw."
          : "Could not sign out. Try again.",
      );
    } finally {
      setSigningOut(false);
    }
  }
  const footer = (
    <div className="flex flex-col gap-4">
      <Link
        href="/"
        className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <ArrowLeft className="size-4" />
        {nl ? "Terug naar ontdekken" : "Back to explore"}
      </Link>
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-sm font-semibold">
          {image ? (
            <img src={image} alt="" className="size-full object-cover" />
          ) : (
            name.slice(0, 2).toUpperCase()
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-11"
          onClick={signOut}
          disabled={signingOut}
          aria-label={nl ? "Uitloggen" : "Sign out"}
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
  );
  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="px-7 py-8">{logo}</div>
        <div className="px-7 pb-5">
          <p className="text-sm text-muted-foreground">
            {nl ? "Jouw klantomgeving" : "Your customer account"}
          </p>
        </div>
        <div className="flex-1 px-4">{nav}</div>
        <div className="border-t p-5">{footer}</div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex min-h-16 items-center justify-between gap-2 border-b lg:min-h-20 px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11 lg:hidden"
                  aria-label={nl ? "Menu openen" : "Open menu"}
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              {/* The sheet's own close button is 16 px and English only, so it is replaced by the one below. */}
              <SheetContent side="left" className="gap-0 overflow-y-auto [&>button]:hidden">
                <SheetHeader className="flex-row items-center justify-between">
                  <div>
                    <SheetTitle>{nl ? "Mijn account" : "My account"}</SheetTitle>
                    <SheetDescription>ARSI Events</SheetDescription>
                  </div>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11"
                      aria-label={nl ? "Menu sluiten" : "Close menu"}
                    >
                      <X />
                    </Button>
                  </SheetClose>
                </SheetHeader>
                <div className="flex-1 px-4">{nav}</div>
                <div className="p-4">{footer}</div>
              </SheetContent>
            </Sheet>
            <p className="text-sm text-muted-foreground">
              <span className="hidden sm:inline">
                {nl ? "Mijn account" : "My account"}
                <span className="mx-3 text-border" aria-hidden>
                  /
                </span>
              </span>
              <span className="text-foreground">{active?.label}</span>
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
            <Button variant="ghost" size="icon" className="size-11" asChild>
              <Link
                href="/account/meldingen"
                aria-label={
                  nl
                    ? `${unread} ongelezen meldingen`
                    : `${unread} unread notifications`
                }
              >
                <Bell />
              </Link>
            </Button>
          </div>
        </header>
        <main
          data-private
          id="account-content"
          className="touch-targets mx-auto max-w-7xl p-4 sm:p-8 lg:p-10"
        >
          {children}
        </main>
        <footer className="flex flex-wrap items-center justify-between border-t px-6 py-5 text-sm text-muted-foreground">
          <span>
            ARSI Events ·{" "}
            {nl ? "Alles voor jouw evenement" : "Everything for your event"}
          </span>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-1 hover:text-foreground"
          >
            {nl ? "Ontdek professionals" : "Discover professionals"}
            <ArrowUpRight className="size-4" />
          </Link>
        </footer>
      </div>
    </div>
  );
}
