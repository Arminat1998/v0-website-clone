"use client"

import Link from "next/link"
import Image from "next/image"
import { Inbox, Clock, CheckCircle2, XCircle, ArrowRight, HelpCircle } from "lucide-react"
import { useAdmin, type SubmissionStatus } from "@/contexts/admin-submissions-context"
import { statusLabels, statusClasses, formatDate } from "@/lib/admin-status"

export default function AdminOverviewPage() {
  const { submissions } = useAdmin()

  const count = (status: SubmissionStatus) => submissions.filter((s) => s.status === status).length

  const stats = [
    {
      label: "Nieuw",
      value: count("nieuw"),
      icon: Inbox,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/admin/aanmeldingen?status=nieuw",
    },
    {
      label: "In beoordeling",
      value: count("in-beoordeling"),
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      href: "/admin/aanmeldingen?status=in-beoordeling",
    },
    {
      label: "Wacht op aanvulling",
      value: count("wacht-op-aanvulling"),
      icon: HelpCircle,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      href: "/admin/aanmeldingen?status=wacht-op-aanvulling",
    },
    {
      label: "Goedgekeurd",
      value: count("goedgekeurd"),
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-500/10",
      href: "/admin/aanmeldingen?status=goedgekeurd",
    },
    {
      label: "Afgewezen",
      value: count("afgewezen"),
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      href: "/admin/aanmeldingen?status=afgewezen",
    },
  ]

  const nieuweAanmeldingen = [...submissions]
    .filter((s) => s.status === "nieuw" || s.status === "in-beoordeling")
    .sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt))
    .slice(0, 6)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground text-balance">Overzicht</h1>
        <p className="text-muted-foreground mt-1">
          Beheer artiestaanmeldingen en bewaak de voortgang van je beoordelingen.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-card border border-border rounded-xl p-5 hover:border-red-600/50 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </Link>
          )
        })}
      </div>

      {/* Latest submissions */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Te beoordelen</h2>
            <p className="text-sm text-muted-foreground">Nieuwste aanmeldingen die je aandacht nodig hebben.</p>
          </div>
          <Link
            href="/admin/aanmeldingen"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-400 transition-colors"
          >
            Alle aanmeldingen
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {nieuweAanmeldingen.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">Geen openstaande aanmeldingen.</div>
        ) : (
          <ul className="divide-y divide-border">
            {nieuweAanmeldingen.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/admin/aanmeldingen/${s.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-accent transition-colors"
                >
                  <Image
                    src={s.photo || "/placeholder.svg"}
                    alt={s.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{s.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {s.discipline} &middot; {s.city}
                    </p>
                  </div>
                  <div className="hidden sm:block text-sm text-muted-foreground flex-shrink-0">
                    {formatDate(s.submittedAt)}
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${statusClasses[s.status]}`}
                  >
                    {statusLabels[s.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
