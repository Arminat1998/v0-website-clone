"use client"

import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { useHomeServices } from "@/components/home-services"

export function ServiceSelector() {
  const nl = useLanguage().language === "nl"
  const { services, soonLabel } = useHomeServices()

  return (
    <section aria-label={nl ? "Kies een categorie" : "Choose a category"} className="bg-muted py-12 sm:py-16">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 sm:grid-cols-4 sm:gap-6 sm:px-6 lg:grid-cols-7">
        {services.map(({ icon: Icon, title, href }) => (
          <li key={title}>
            {href ? (
              <Link href={href} className="group block rounded-lg text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                <span className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full border-2 border-red-600 bg-card transition-colors group-hover:border-red-700 group-hover:bg-red-50 sm:mb-4 sm:size-20 dark:group-hover:bg-red-950/20">
                  <Icon className="size-7 text-red-600 sm:size-8" aria-hidden />
                </span>
                <span className="block text-sm font-medium text-foreground underline-offset-4 group-hover:underline lg:text-base">
                  {title}
                </span>
              </Link>
            ) : (
              <div className="text-center">
                <span className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/50 sm:mb-4 sm:size-20">
                  <Icon className="size-7 text-muted-foreground sm:size-8" aria-hidden />
                </span>
                <span className="block text-sm font-medium text-muted-foreground lg:text-base">{title}</span>
                <span className="block text-xs text-muted-foreground">{soonLabel}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
