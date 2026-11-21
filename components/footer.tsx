"use client"

import { Instagram } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="bg-muted py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">{t.aboutUs}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">{t.aboutUsDescription}</p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">{t.quickLinks}</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-red-600">
                  {t.howItWorks}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-red-600">
                  {t.findVendors}
                </a>
              </li>
              <li>
                <a href="/design-system" className="hover:text-red-600">
                  Design System
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">{t.support}</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-red-600">
                  {t.contactUs}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-red-600">
                  {t.termsOfService}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">{t.followUs}</h3>
            <div className="flex space-x-4">
              <a
                href="https://www.instagram.com/arsievents/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:text-red-600"
              >
                <Instagram className="w-5 h-5" aria-hidden />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">© {new Date().getFullYear()} ARSI Events. {t.allRightsReserved}</p>
        </div>
      </div>
    </footer>
  )
}
