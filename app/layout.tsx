import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { LanguageProvider } from "@/contexts/language-context"
import { ThemeProvider } from "@/contexts/theme-context"
import { SkipLink } from "@/components/skip-link"
import { UserTest } from "@/components/user-test"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ARSI Events — Alles voor jouw evenement",
  description: "Ontdek en boek artiesten en eventprofessionals. Beheer je aanvragen, favorieten en boekingen in je eigen ARSI Events account.",
  generator: "v0.app",
}

// Sets the saved (or system) theme before the first paint, so a dark site does not flash white.
// The theme provider reads the same value once React has loaded.
const initScript = `try{var d=document.documentElement,t=localStorage.getItem("theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");d.classList.toggle("dark",t==="dark");d.style.colorScheme=t}catch(e){}`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl" className="bg-background" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <LanguageProvider>
            <SkipLink />
            {children}
            <Toaster />
            <UserTest />
            <Analytics />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
