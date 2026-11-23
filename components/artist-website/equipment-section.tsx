"use client"

import { useWebsite } from "@/components/artist-website/website-context"
import { digitsOnlyPrice, formatRentalPrice, imageSrc } from "@/lib/professional-profile-types"
import type { EquipmentDetail } from "@/lib/smart-search"

const PACKAGE_ITEMS = [
  { image: "/pioneer-cdj-2000-dj-player.jpg", name: { nl: "2x Pioneer CDJ-2000-spelers", en: "2x Pioneer CDJ-2000 Players" }, text: { nl: "Professionele mediaspelers", en: "Professional-grade media players" } },
  { image: "/djm-900nxs2-mixer.jpg", name: { nl: "DJM-900NXS2-mixer", en: "DJM-900NXS2 Mixer" }, text: { nl: "Vierkanaals mixer, standaard in de branche", en: "Industry standard 4-channel mixer" } },
  { image: "/dj-table-with-cover.jpg", name: { nl: "Dj-tafel met hoes", en: "DJ Table with Cover" }, text: { nl: "Professionele opstelling met nette bekabeling", en: "Professional setup with cable management" } },
  { image: "/shure-sm58-microphone.jpg", name: { nl: "Shure SM58-microfoon", en: "Shure SM58 Microphone" }, text: { nl: "Professionele zangmicrofoon met statief", en: "Professional vocal microphone with stand" } },
  { image: "/qsc-k12-2-speakers.jpg", name: { nl: "2x QSC K12.2-speakers", en: "2x QSC K12.2 Speakers" }, text: { nl: "Krachtige 2000W-speakers met statieven", en: "Powerful 2000W speakers with stands" } },
  { image: "/dj-lighting-package.jpg", name: { nl: "Basis lichtpakket", en: "Basic Lighting Package" }, text: { nl: "2 moving heads, 2 parspots en controller", en: "2 moving heads, 2 par cans, and controller" } },
]

const EXTRAS = [
  { name: { nl: "Pioneer CDJ-3000", en: "Pioneer CDJ-3000" }, text: { nl: "Upgrade naar de nieuwste spelers", en: "Upgrade to latest players" }, price: "+€ 150" },
  { name: { nl: "Extra subwoofer", en: "Extra Subwoofer" }, text: { nl: "Extra krachtige bas", en: "Add powerful bass" }, price: "+€ 100" },
]

function RealEquipment({ packageItems, extraItems }: { packageItems: EquipmentDetail[]; extraItems: EquipmentDetail[] }) {
  const { t, artist } = useWebsite()
  const isDutch = t.locale.startsWith("nl")
  const photo = artist.kind === "photo-video"
  const suffix = isDutch ? "/dag" : "/day"

  if (!packageItems.length && !extraItems.length) {
    return (
      <section className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        {photo
          ? isDutch
            ? "Er zijn nog geen extra's toegevoegd."
            : "No extras have been added yet."
          : isDutch
            ? "Er is nog geen apparatuur toegevoegd."
            : "No equipment has been added yet."}
      </section>
    )
  }

  const packageTotal = packageItems.reduce((sum, item) => sum + (Number(digitsOnlyPrice(item.price)) || 0), 0)

  return (
    <div className="space-y-4">
      {packageItems.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-foreground">{isDutch ? "Apparatuurpakket" : "Equipment package"}</h2>
            {packageTotal > 0 && (
              <span className="rounded-full border border-border px-4 py-1 text-sm font-bold text-foreground">
                {isDutch ? "Totaal " : "Total "}
                {formatRentalPrice(String(packageTotal), suffix)}
              </span>
            )}
          </div>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {packageItems.map((item) => (
              <li key={item.name} className="flex gap-3">
                {item.image && (
                  <img
                    src={imageSrc(item.image) || "/placeholder.svg"}
                    alt={item.name}
                    className="size-16 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">{item.name}</h3>
                  {item.description && item.description.trim() !== item.name.trim() && <p className="text-sm text-muted-foreground">{item.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {extraItems.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-4 text-xl font-bold text-foreground">{t.extraOptions}</h2>
          <ul className="grid gap-4 md:grid-cols-2">
            {extraItems.map((extra, index) => (
              <li key={`${extra.name}-${index}`} className="flex gap-3 rounded-lg border border-border bg-background p-4">
                {extra.image && (
                  <img
                    src={imageSrc(extra.image) || "/placeholder.svg"}
                    alt={extra.name}
                    className="size-16 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">{extra.name}</h3>
                  {extra.description && extra.description.trim() !== extra.name.trim() && <p className="mb-2 text-sm text-muted-foreground">{extra.description}</p>}
                  {extra.price && (
                    <p className="text-lg font-bold text-red-700 dark:text-red-400">+{formatRentalPrice(extra.price, suffix)}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export function EquipmentSection() {
  const { artist, t } = useWebsite()

  if (artist.equipmentDetails) {
    return <RealEquipment {...artist.equipmentDetails} />
  }

  // Sample profiles only: example equipment. Real profiles always carry their own list.
  const nl = t.locale.startsWith("nl")
  const lang = nl ? "nl" : "en"
  const perDay = nl ? "/dag" : "/day"
  const price = `${(artist.equipmentPrice ?? "€450").replace("€", "€ ").replace(/\d{4,}/, (n) => n.replace(/\B(?=(\d{3})+(?!\d))/g, "."))}${perDay}`

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-foreground">{nl ? "Basis dj-pakket" : "Basic DJ package"}</h2>
          <span className="rounded-full border border-border px-4 py-1 text-sm font-bold text-foreground">{price}</span>
        </div>
        <p className="mb-1 font-semibold text-foreground">{nl ? "Complete set" : "Complete set-up"}</p>
        <p className="mb-5 text-sm text-muted-foreground">{nl ? "Alles voor een professionele dj-set." : "Everything for a professional DJ set-up."}</p>
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PACKAGE_ITEMS.map((item) => (
            <li key={item.name.en} className="flex gap-3">
              <img src={item.image || "/placeholder.svg"} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
              <div>
                <h3 className="font-semibold text-foreground">{item.name[lang]}</h3>
                <p className="text-sm text-muted-foreground">{item.text[lang]}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-4 text-xl font-bold text-foreground">{t.extraOptions}</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {EXTRAS.map((extra) => (
            <li key={extra.name.en} className="rounded-lg border border-border bg-background p-4">
              <h3 className="font-semibold text-foreground">{extra.name[lang]}</h3>
              <p className="mb-2 text-sm text-muted-foreground">{extra.text[lang]}</p>
              <p className="text-lg font-bold text-red-700 dark:text-red-400">
                {extra.price}
                {perDay}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
