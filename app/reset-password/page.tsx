import { Header } from "@/components/header"
import { ResetPasswordForm } from "@/components/reset-password-form"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  const { token, error } = await searchParams

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex max-w-md px-4 py-12 sm:py-20">
        <ResetPasswordForm token={token} invalid={Boolean(error) || !token} />
      </main>
    </div>
  )
}
