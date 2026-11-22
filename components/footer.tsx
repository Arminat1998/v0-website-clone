"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Instagram } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

function FooterLink({ href, lang, children }: { href: string; lang?: string; children: ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        lang={lang}
        className="inline-flex min-h-11 items-center underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring md:min-h-8"
      >
        {children}
      </Link>
    </li>
  )
}

export function Footer() {
  const { t, language } = useLanguage()
  const nl = language === "nl"
  const headingClass = "mb-2 text-base font-semibold text-foreground"

  return (
    <footer className="bg-muted py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 md:grid-cols-4">
          <div>
            <h2 className={headingClass}>{nl ? "Over ons" : t.aboutUs}</h2>
            <p className="text-sm text-muted-foreground">
              {nl
                ? "ARSI Events is jouw alles-in-één platform voor moeiteloos evenementen plannen en betrouwbare professionals."
                : t.aboutUsDescription}
            </p>
          </div>

          <nav aria-labelledby="footer-links">
            <h2 id="footer-links" className={headingClass}>{nl ? "Snelle links" : t.quickLinks}</h2>
            <ul className="text-sm text-muted-foreground">
              <FooterLink href="/artiesten">{nl ? "Artiesten" : "Artists"}</FooterLink>
              <FooterLink href="/photo-video">{nl ? "Foto & video" : "Photo & video"}</FooterLink>
              <FooterLink href="/#hoe-het-werkt">{nl ? "Hoe het werkt" : "How it works"}</FooterLink>
              <FooterLink href="/design-system" lang="en">Design System</FooterLink>
            </ul>
          </nav>

          {/* There is no contact page or terms page yet. Signed-in clients reach ARSI through their messages. */}
          <div>
            <h2 className={headingClass}>{t.support}</h2>
            <ul className="text-sm text-muted-foreground">
              <FooterLink href="/account/berichten">
                {nl ? "Stuur ons een bericht (met account)" : "Send us a message (with an account)"}
              </FooterLink>
            </ul>
          </div>

          <div>
            <h2 className={headingClass}>{nl ? "Volg ons" : t.followUs}</h2>
            <a
              href="https://www.instagram.com/arsievents/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Instagram className="size-5" aria-hidden />
              Instagram
              <span className="sr-only">{nl ? "(opent in een nieuw tabblad)" : "(opens in a new tab)"}</span>
            </a>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-6 text-center sm:mt-8 sm:pt-8">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ARSI Events. {t.allRightsReserved}
          </p>
        </div>
      </div>
    </footer>
  )
}
