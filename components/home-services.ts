import { Camera, MapPin, Music, PartyPopper, ShieldAlert, Sparkles, Utensils } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

/**
 * The service categories on the homepage. A category without `href` has no professionals yet:
 * its page only says "coming soon", so it is shown as such and not linked.
 */
export function useHomeServices() {
  const { t, language } = useLanguage()
  const nl = language === "nl"
  return {
    soonLabel: nl ? "Binnenkort" : "Coming soon",
    services: [
      {
        icon: Music,
        title: t.artistsService,
        description: nl ? "Dj's, bands en zangers die jouw feest op gang brengen." : "DJs, bands and singers who get your party started.",
        href: "/artiesten",
      },
      {
        icon: Camera,
        title: nl ? "Foto & video" : "Photo & video",
        description: nl ? "Leg elk moment vast in foto's en film." : "Capture every moment in photos and film.",
        href: "/photo-video",
      },
      {
        icon: MapPin,
        title: t.locationService,
        description: nl ? "Locaties voor jouw evenement." : "Venues for your event.",
        href: null,
      },
      {
        icon: Utensils,
        title: t.cateringService,
        description: nl ? "Catering voor elke smaak." : "Catering for every taste.",
        href: null,
      },
      {
        icon: PartyPopper,
        title: t.entertainmentService,
        description: nl ? "Liveacts die energie brengen." : "Live acts that bring energy.",
        href: null,
      },
      {
        icon: Sparkles,
        title: t.decorationService,
        description: nl ? "Aankleding voor de juiste sfeer." : "Decorations that set the mood.",
        href: null,
      },
      {
        icon: ShieldAlert,
        title: t.securityService,
        description: nl ? "Beveiliging voor een veilig evenement." : "Security for a safe event.",
        href: null,
      },
    ],
  }
}
