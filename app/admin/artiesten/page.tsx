"use client"

import Link from "next/link"
import Image from "next/image"
import { MapPin, Euro } from "lucide-react"
import { useAdmin } from "@/contexts/admin-submissions-context"

export default function ArtiestenPage() {
  const { submissions } = useAdmin()
  const approved = submissions.filter((s) => s.status === "goedgekeurd")

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Artiesten</h1>
        <p className="text-muted-foreground mt-1">
          {approved.length} goedgekeurde artiesten staan live op het platform.
        </p>
      </div>

      {approved.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-foreground font-medium">Nog geen goedgekeurde artiesten</p>
          <p className="text-muted-foreground text-sm mt-1">
            Goedgekeurde aanmeldingen verschijnen hier automatisch.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {approved.map((s) => (
            <Link
              key={s.id}
              href={`/admin/aanmeldingen/${s.id}`}
              className="bg-card border border-border rounded-xl overflow-hidden hover:border-red-600/50 transition-colors group"
            >
              <div className="relative aspect-[4/3] bg-accent">
                <Image
                  src={s.photo || "/placeholder.svg"}
                  alt={s.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-foreground truncate">{s.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 flex-shrink-0">
                    Live
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{s.discipline}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {s.city}
                  </span>
                  {s.hourlyRate && (
                    <span className="flex items-center gap-1.5">
                      <Euro className="w-3.5 h-3.5" />
                      {s.hourlyRate} p/u
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
