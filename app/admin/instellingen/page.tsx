"use client"

import { useState } from "react"
import { Bell, Users, ShieldCheck } from "lucide-react"

export default function InstellingenPage() {
  const [notifyNew, setNotifyNew] = useState(true)
  const [notifyInfo, setNotifyInfo] = useState(true)
  const [autoAssign, setAutoAssign] = useState(false)

  const team = [
    { name: "Noor Bakker", role: "Beheerder", initials: "NB" },
    { name: "Daan Visser", role: "Beoordelaar", initials: "DV" },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Instellingen</h1>
        <p className="text-muted-foreground mt-1">Beheer meldingen, teamleden en beoordelingsvoorkeuren.</p>
      </div>

      <div className="space-y-6">
        {/* Notifications */}
        <section className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-red-600/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-red-500" />
            </div>
            <h2 className="font-semibold text-foreground">Meldingen</h2>
          </div>
          <div className="space-y-1">
            <ToggleRow
              label="Nieuwe aanmeldingen"
              description="Ontvang een melding zodra een artiest zich aanmeldt."
              checked={notifyNew}
              onChange={() => setNotifyNew(!notifyNew)}
            />
            <ToggleRow
              label="Aanvullingen van artiesten"
              description="Melding wanneer een artiest gevraagde informatie aanlevert."
              checked={notifyInfo}
              onChange={() => setNotifyInfo(!notifyInfo)}
            />
          </div>
        </section>

        {/* Review preferences */}
        <section className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-red-600/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-red-500" />
            </div>
            <h2 className="font-semibold text-foreground">Beoordeling</h2>
          </div>
          <div className="space-y-1">
            <ToggleRow
              label="Automatisch toewijzen"
              description="Wijs nieuwe aanmeldingen automatisch toe aan een beschikbare beoordelaar."
              checked={autoAssign}
              onChange={() => setAutoAssign(!autoAssign)}
            />
          </div>
        </section>

        {/* Team */}
        <section className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-red-600/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-red-500" />
            </div>
            <h2 className="font-semibold text-foreground">Team</h2>
          </div>
          <ul className="divide-y divide-border">
            {team.map((member) => (
              <li key={member.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-foreground text-sm font-semibold">
                  {member.initials}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-red-600" : "bg-accent"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  )
}
