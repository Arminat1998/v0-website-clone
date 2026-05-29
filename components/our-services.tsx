"use client"

import { Music, Camera, MapPin, Utensils, PartyPopper, Sparkles, ShieldAlert, Mic2, Shield } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"

export function OurServices() {
  const { t } = useLanguage()

  const services = [
    {
      icon: MapPin,
      title: t.locationService,
      description: "Perfect venues for unforgettable events.",
      href: "/location"
    },
    {
      icon: Utensils,
      title: t.cateringService,
      description: "Delicious catering for every taste.",
      href: "/catering"
    },
    {
      icon: Music,
      title: t.artistsService,
      description: "Top-notch entertainment to get the party started.",
      href: "/artiesten"
    },
    {
      icon: Camera,
      title: t.photoVideoService,
      description: "Capture every moment in stunning detail & Record your event with cinematic quality.",
      href: "/photo-video"
    },
    {
      icon: PartyPopper,
      title: t.entertainmentService,
      description: "Live performances that bring energy to your event.",
      href: "/entertainment"
    },
    {
      icon: Sparkles,
      title: t.decorationService,
      description: "Beautiful decorations to set the perfect atmosphere.",
      href: "/decoration"
    },
    {
      icon: ShieldAlert,
      title: t.securityService,
      description: "Professional security guards for safe and secure events.",
      href: "/security"
    }
  ]

  return (
    <section className="py-16 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{t.servicesTitle}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <Link key={index} href={service.href} className="group h-full">
              <div className="text-center p-6 sm:p-8 bg-card rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 h-full flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 rounded-full bg-red-600 flex items-center justify-center group-hover:bg-red-700 transition-colors">
                    <service.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-3 sm:mb-4 group-hover:text-red-600 transition-colors">
                    {service.title}
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">{service.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
