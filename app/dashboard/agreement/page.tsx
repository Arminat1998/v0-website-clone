"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Check } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function AgreementPage() {
  const { t } = useLanguage()
  const [agreed, setAgreed] = useState(false)

  const handleAccept = () => {
    console.log("[v0] Agreement accepted")
    // Here you would typically save the acceptance to a database
    alert("Agreement accepted successfully!")
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg shadow-sm border border-border p-5 sm:p-6 md:p-8 lg:p-10">
            {/* Header */}
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-5 sm:mb-6 md:mb-8">
              {t.agreementTitle}
            </h1>

            {/* Agreement Content */}
            <div className="space-y-5 sm:space-y-6 text-sm sm:text-base text-foreground">
              {/* Section 1 */}
              <section>
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                  1. General Terms
                </h2>
                <p className="leading-relaxed">
                  By registering as a DJ on ARSI Events, you agree to the following terms and conditions.
                  This agreement ensures clear expectations and a professional working relationship between you
                  and the platform.
                </p>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                  2. Professional Conduct
                </h2>
                <ul className="space-y-1.5 sm:space-y-2 list-disc list-inside pl-1 sm:pl-2">
                  <li>Maintain a professional attitude at all times.</li>
                  <li>Honor all bookings as agreed and on time.</li>
                  <li>No changes to a booking without prior approval.</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section>
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                  3. Rates & Payments
                </h2>
                <ul className="space-y-1.5 sm:space-y-2 list-disc list-inside pl-1 sm:pl-2">
                  <li>DJs set their own hourly rate via the platform.</li>
                  <li>Rates exclude equipment and travel costs unless noted.</li>
                  <li>ARSI Events may deduct a service fee per booking.</li>
                </ul>
              </section>

              {/* Section 4 */}
              <section>
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                  4. Availability & Scheduling
                </h2>
                <ul className="space-y-1.5 sm:space-y-2 list-disc list-inside pl-1 sm:pl-2">
                  <li>DJs must keep their availability updated.</li>
                  <li>Unavailability must be communicated early.</li>
                </ul>
              </section>

              {/* Section 5 */}
              <section>
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                  5. Cancellations & No-shows
                </h2>
                <ul className="space-y-1.5 sm:space-y-2 list-disc list-inside pl-1 sm:pl-2">
                  <li>
                    Cancellations within 72 hours without valid reason may result in a penalty or suspension.
                  </li>
                  <li>No-shows can result in account suspension or removal.</li>
                </ul>
              </section>

              {/* Section 6 */}
              <section>
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                  6. Client Communication
                </h2>
                <ul className="space-y-1.5 sm:space-y-2 list-disc list-inside pl-1 sm:pl-2">
                  <li>Initial client communication must happen via the platform.</li>
                  <li>Unprofessional language may lead to account termination.</li>
                </ul>
              </section>

              {/* Section 7 */}
              <section>
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                  7. Reviews & Feedback
                </h2>
                <ul className="space-y-1.5 sm:space-y-2 list-disc list-inside pl-1 sm:pl-2">
                  <li>Clients can leave a review after each booking.</li>
                  <li>Replies must be respectful and professional at all times.</li>
                </ul>
              </section>

              {/* Section 8 */}
              <section>
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                  8. Equipment & Responsibility
                </h2>
                <ul className="space-y-1.5 sm:space-y-2 list-disc list-inside pl-1 sm:pl-2">
                  <li>DJs are responsible for any personal equipment used.</li>
                  <li>Issues must be reported immediately to clients and the platform.</li>
                </ul>
              </section>

              {/* Section 9 */}
              <section>
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                  9. Privacy & Data Use
                </h2>
                <ul className="space-y-1.5 sm:space-y-2 list-disc list-inside pl-1 sm:pl-2">
                  <li>All data is handled in accordance with our privacy policy.</li>
                  <li>Client data may not be used for private or commercial gain.</li>
                </ul>
              </section>

              {/* Section 10 */}
              <section>
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                  10. Account Termination
                </h2>
                <ul className="space-y-1.5 sm:space-y-2 list-disc list-inside pl-1 sm:pl-2">
                  <li>ARSI Events may terminate accounts for rule violations or repeated complaints.</li>
                  <li>DJs may request account deletion at any time.</li>
                </ul>
              </section>

              {/* Confirmation Section */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 sm:p-4 md:p-6 mt-6 sm:mt-8">
                <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-600 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <p className="text-sm sm:text-base font-medium text-foreground">
                    {t.acceptAgreementConfirm}
                  </p>
                </div>
                <ul className="space-y-1.5 sm:space-y-2 list-disc list-inside pl-7 sm:pl-9 text-xs sm:text-sm text-foreground">
                  <li>You've read and understood the terms above</li>
                  <li>You agree to act professionally and ethically</li>
                  <li>You accept the working method of ARSI Events</li>
                </ul>
              </div>

              {/* Checkbox */}
              <div className="flex items-start gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-border mt-4 sm:mt-6">
                <input
                  type="checkbox"
                  id="agreement-checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 rounded border-border text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="agreement-checkbox" className="text-xs sm:text-sm md:text-base text-foreground cursor-pointer select-none">
                  {t.acceptAgreementCheckbox}
                </label>
              </div>

              {/* Accept Button */}
              <button
                type="button"
                onClick={handleAccept}
                disabled={!agreed}
                className={`w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-colors mt-3 sm:mt-4 touch-manipulation ${
                  agreed
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {t.acceptAgreementButton}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
