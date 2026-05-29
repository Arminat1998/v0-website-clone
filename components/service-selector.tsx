"use client"

import { Music, Camera, MapPin, Utensils, PartyPopper, Sparkles, ShieldAlert, Mic2, Shield } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"

export function ServiceSelector() {
  const { t } = useLanguage()

  return (
    <section className="py-12 sm:py-16 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-6">
          {/* Location */}
          <Link href="/location" className="text-center group">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full border-2 border-red-600 flex items-center justify-center bg-card hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer group-hover:border-red-700">
              <MapPin className="w-7 h-7 sm:w-8 sm:h-8 text-red-600 group-hover:text-red-700" />
            </div>
            <p className="text-xs sm:text-sm lg:text-base font-medium text-foreground group-hover:text-red-600 transition-colors">
              {t.locationService}
            </p>
          </Link>

          {/* Catering */}
          <Link href="/catering" className="text-center group">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full border-2 border-red-600 flex items-center justify-center bg-card hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer group-hover:border-red-700">
              <Utensils className="w-7 h-7 sm:w-8 sm:h-8 text-red-600 group-hover:text-red-700" />
            </div>
            <p className="text-xs sm:text-sm lg:text-base font-medium text-foreground group-hover:text-red-600 transition-colors">
              {t.cateringService}
            </p>
          </Link>

          {/* Artists */}
          <Link href="/artiesten" className="text-center group">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full border-2 border-red-600 flex items-center justify-center bg-card hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer group-hover:border-red-700">
              <Music className="w-7 h-7 sm:w-8 sm:h-8 text-red-600 group-hover:text-red-700" />
            </div>
            <p className="text-xs sm:text-sm lg:text-base font-medium text-foreground group-hover:text-red-600 transition-colors">
              {t.artistsService}
            </p>
          </Link>

          {/* Photo / Video */}
          <Link href="/photo-video" className="text-center group">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full border-2 border-red-600 flex items-center justify-center bg-card hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer group-hover:border-red-700">
              <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-red-600 group-hover:text-red-700" />
            </div>
            <p className="text-xs sm:text-sm lg:text-base font-medium text-foreground group-hover:text-red-600 transition-colors">
              {t.photoVideoService}
            </p>
          </Link>

          {/* Entertainment */}
          <Link href="/entertainment" className="text-center group">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full border-2 border-red-600 flex items-center justify-center bg-card hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer group-hover:border-red-700">
              <PartyPopper className="w-7 h-7 sm:w-8 sm:h-8 text-red-600 group-hover:text-red-700" />
            </div>
            <p className="text-xs sm:text-sm lg:text-base font-medium text-foreground group-hover:text-red-600 transition-colors">
              {t.entertainmentService}
            </p>
          </Link>

          {/* Decoration */}
          <Link href="/decoration" className="text-center group">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full border-2 border-red-600 flex items-center justify-center bg-card hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer group-hover:border-red-700">
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-red-600 group-hover:text-red-700" />
            </div>
            <p className="text-xs sm:text-sm lg:text-base font-medium text-foreground group-hover:text-red-600 transition-colors">
              {t.decorationService}
            </p>
          </Link>

          {/* Security */}
          <Link href="/security" className="text-center group">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full border-2 border-red-600 flex items-center justify-center bg-card hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer group-hover:border-red-700">
              <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8 text-red-600 group-hover:text-red-700" />
            </div>
            <p className="text-xs sm:text-sm lg:text-base font-medium text-foreground group-hover:text-red-600 transition-colors">
              {t.securityService}
            </p>
          </Link>
        </div>
      </div>
    </section>
  )
}
