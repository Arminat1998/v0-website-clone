"use client"

import dynamic from "next/dynamic"

const HomeClient = dynamic(
  () => import("@/components/home-client").then((module) => module.HomeClient),
  {
    ssr: false,
    loading: () => <main className="min-h-screen bg-background" aria-busy="true" />,
  },
)

export function HomeEntry() {
  return <HomeClient />
}
