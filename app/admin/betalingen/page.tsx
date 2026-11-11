import { listPayments } from "@/app/actions/admin-payments"
import { PaymentsTable } from "@/components/admin/payments-table"

export const dynamic = "force-dynamic"

export default async function AdminPaymentsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PaymentsTable rows={await listPayments()} />
    </div>
  )
}
