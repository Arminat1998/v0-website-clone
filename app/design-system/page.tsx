import { Suspense } from "react"
import DesignSystemContent from "./design-system-content"

export default function DesignSystemPage() {
  return (
    <Suspense fallback={null}>
      <DesignSystemContent />
    </Suspense>
  )
}
