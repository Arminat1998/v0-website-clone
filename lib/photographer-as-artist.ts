import type { Artist, Photographer } from "@/lib/smart-search"

/** The artist profile view shows photographers too; specialisations take the place of music genres. */
export function photographerAsArtist(professional: Photographer): Artist {
  const years = professional.experience?.match(/\d+/)?.[0]
  return {
    id: professional.id,
    name: professional.name,
    specialty: professional.specialty,
    location: professional.location,
    rating: professional.rating,
    reviews: professional.reviews,
    price: professional.price,
    available: professional.available,
    description: professional.description,
    eventTypes: professional.eventTypes,
    musicStyles: professional.serviceTypes,
    experience: years,
    availableDates: professional.availableDates,
    unavailableDates: professional.unavailableDates,
    minHours: professional.minHours,
    maxHours: professional.maxHours,
    rangeKm: professional.rangeKm,
    category: professional.category,
    image: professional.image,
    banner: professional.banner,
    avatar: professional.avatar,
    // No sample DJ equipment: photographers only show the extras they listed.
    equipmentDetails: { packageItems: [], extraItems: professional.equipmentDetails?.extraItems ?? [] },
    kind: "photo-video",
  }
}
