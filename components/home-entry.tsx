import { HomeClient } from "@/components/home-client"

/** The homepage. It renders on the server, so visitors see it right away instead of a blank screen until all scripts have loaded. */
export function HomeEntry() {
  return <HomeClient />
}
