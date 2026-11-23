import { listPayments, listPayouts } from "@/app/actions/admin-payments"
import { PaymentsTable } from "@/components/admin/payments-table"
import { PayoutsTable } from "@/components/admin/payouts-table"

export const dynamic = "force-dynamic"

export default async function AdminPaymentsPage() {
  const [payments, payouts] = await Promise.all([listPayments(), listPayouts()])
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <PaymentsTable rows={payments} />
      <PayoutsTable rows={payouts} />
    </div>
  )
}
