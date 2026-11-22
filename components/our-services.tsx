"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"
import { useHomeServices } from "@/components/home-services"

export function OurServices() {
  const { t, language } = useLanguage()
  const { services, soonLabel } = useHomeServices()

  return (
    <section className="bg-muted py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            {language === "nl" ? "Onze diensten" : t.servicesTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 xl:grid-cols-4">
          {services.map(({ icon: Icon, title, description, href }) =>
            href ? (
              <Link
                key={title}
                href={href}
                className="group flex h-full flex-col items-center rounded-lg bg-card p-6 text-center shadow-md transition-shadow duration-300 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-8"
              >
                <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-red-600 transition-colors group-hover:bg-red-700 sm:mb-6 sm:size-16">
                  <Icon className="size-7 text-white sm:size-8" aria-hidden />
                </span>
                <h3 className="mb-3 text-xl font-semibold text-foreground underline-offset-4 group-hover:underline sm:text-2xl">{title}</h3>
                <p className="text-sm text-muted-foreground sm:text-base">{description}</p>
              </Link>
            ) : (
              <div
                key={title}
                className="flex h-full flex-col items-center rounded-lg border border-dashed border-border p-6 text-center sm:p-8"
              >
                <span className="mb-4 flex size-14 items-center justify-center rounded-full border border-dashed border-muted-foreground/50 sm:mb-6 sm:size-16">
                  <Icon className="size-7 text-muted-foreground sm:size-8" aria-hidden />
                </span>
                <h3 className="mb-2 text-xl font-semibold text-muted-foreground sm:text-2xl">{title}</h3>
                <Badge variant="secondary" className="mb-3 border-border">{soonLabel}</Badge>
                <p className="text-sm text-muted-foreground sm:text-base">{description}</p>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  )
}
