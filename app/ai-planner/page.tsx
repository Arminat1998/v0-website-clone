import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AiEventPlanner } from "@/components/ai-event-planner"

export default function AiPlannerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Evenement Planner</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Laat onze AI je helpen met het plannen van het perfecte evenement. Krijg gepersonaliseerde suggesties,
            budgetadvies en creatieve ideeën.
          </p>
        </div>
        <AiEventPlanner />
      </main>
      <Footer />
    </div>
  )
}
