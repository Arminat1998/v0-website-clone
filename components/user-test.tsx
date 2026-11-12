"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useLanguage } from "@/contexts/language-context"
import {
  USERTEST_GOAL_EVENT,
  answerUserTestConsent,
  claimUserTestFromUrl,
  finishUserTest,
  resumeUserTest,
  trackUserTest,
  userTestAvailable,
  type UserTestState,
} from "@/lib/usertest"

type Panel = "none" | "stuck" | "finish" | "thanks"

/** Consent, "I'm stuck" and closing question for testers who opened the site with ?test=CODE. */
export function UserTest() {
  const { language } = useLanguage()
  const tr = (nl: string, en: string) => (language === "nl" ? nl : en)
  const [state, setState] = useState<UserTestState | null>(null)
  const [panel, setPanel] = useState<Panel>("none")
  const [note, setNote] = useState("")
  const [completed, setCompleted] = useState("")
  const [ease, setEase] = useState<number | null>(null)

  useEffect(() => {
    if (!userTestAvailable()) return
    setState(claimUserTestFromUrl())
    resumeUserTest()
    const onGoal = () => {
      setCompleted("yes")
      setPanel("finish")
    }
    window.addEventListener(USERTEST_GOAL_EVENT, onGoal)
    return () => window.removeEventListener(USERTEST_GOAL_EVENT, onGoal)
  }, [])

  if (!state || state.consent === "no") return null
  if (state.done && panel !== "thanks") return null

  const closePanel = () => {
    setPanel("none")
    setNote("")
  }

  if (state.consent === null) {
    return (
      <div data-usertest className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
        <div role="dialog" aria-modal="true" aria-labelledby="usertest-title" className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
          <h2 id="usertest-title" className="text-xl font-bold text-foreground">
            {tr("Doe je mee aan de test?", "Will you join the test?")}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {tr(
              "Je helpt ARSI Events de site te verbeteren. Je opdracht: maak een account aan als artiest en vul je profiel in tot je in je dashboard staat.",
              "You help ARSI Events improve the site. Your task: create an artist account and complete your profile until you reach your dashboard.",
            )}
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>{tr("We nemen je scherm op deze site op en meten hoe lang elke stap duurt.", "We record your screen on this site and measure how long each step takes.")}</li>
            <li>{tr("Wat je typt, zoals je wachtwoord, wordt niet opgenomen.", "What you type, such as your password, is not recorded.")}</li>
            <li>{tr("De opname stopt zodra je de test afrondt.", "The recording stops as soon as you finish the test.")}</li>
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button className="flex-1 bg-red-600 text-white hover:bg-red-700" onClick={() => setState(answerUserTestConsent("yes"))}>
              {tr("Akkoord en starten", "Agree and start")}
            </Button>
            <Button className="flex-1 bg-accent text-foreground hover:bg-muted" onClick={() => setState(answerUserTestConsent("no"))}>
              {tr("Niet meedoen", "Don't take part")}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (panel === "thanks") {
    return (
      <div data-usertest className="pointer-events-auto fixed bottom-4 left-4 z-[100] max-w-xs rounded-lg border border-border bg-card p-4 shadow-lg">
        <p className="text-sm font-semibold text-foreground">{tr("Bedankt voor het testen!", "Thanks for testing!")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{tr("De opname is gestopt.", "The recording has stopped.")}</p>
        <Button className="mt-3 h-8 bg-accent px-3 text-xs text-foreground hover:bg-muted" onClick={() => setPanel("none")}>
          {tr("Sluiten", "Close")}
        </Button>
      </div>
    )
  }

  return (
    <>
      <div data-usertest className="pointer-events-auto fixed bottom-4 left-4 z-[100] w-[calc(100vw-2rem)] max-w-xs rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="text-xs text-muted-foreground">
          {tr("Test loopt · je scherm wordt opgenomen", "Test running · your screen is being recorded")}
        </p>
        <div className="mt-2 flex gap-2">
          <Button
            className="h-8 flex-1 bg-accent px-3 text-xs text-foreground hover:bg-muted"
            onClick={() => {
              trackUserTest("test_stuck_opened")
              setPanel("stuck")
            }}
          >
            {tr("Ik loop vast", "I'm stuck")}
          </Button>
          <Button className="h-8 flex-1 bg-red-600 px-3 text-xs text-white hover:bg-red-700" onClick={() => setPanel("finish")}>
            {tr("Ik ben klaar", "I'm done")}
          </Button>
        </div>
      </div>

      {/* Dialogs, so they stack on top of a modal the tester may have open (e.g. signup). */}
      <Dialog open={panel === "stuck"} onOpenChange={(open) => !open && closePanel()}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>{tr("Wat lukt er niet?", "What isn't working?")}</DialogTitle>
          <textarea
            aria-label={tr("Wat lukt er niet?", "What isn't working?")}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                trackUserTest("test_stuck", { note: note.trim() })
                closePanel()
              }}
            >
              {tr("Versturen en doorgaan", "Send and continue")}
            </Button>
            <Button className="bg-accent text-foreground hover:bg-muted" onClick={closePanel}>
              {tr("Terug", "Back")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={panel === "finish"} onOpenChange={(open) => !open && closePanel()}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>{tr("Test afronden", "Finish the test")}</DialogTitle>
          <div>
            <p className="text-sm font-semibold text-foreground">{tr("Is de opdracht gelukt?", "Did you complete the task?")}</p>
            <div className="mt-2 flex gap-2">
              {[
                ["yes", tr("Ja", "Yes")],
                ["partly", tr("Deels", "Partly")],
                ["no", tr("Nee", "No")],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={completed === value}
                  onClick={() => setCompleted(value)}
                  className={`h-9 flex-1 rounded-md border text-sm ${completed === value ? "border-red-600 bg-red-600 text-white" : "border-border bg-background text-foreground"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{tr("Hoe makkelijk was het?", "How easy was it?")}</p>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={ease === value}
                  aria-label={`${value} ${tr("van 7", "out of 7")}`}
                  onClick={() => setEase(value)}
                  className={`h-9 flex-1 rounded-md border text-sm ${ease === value ? "border-red-600 bg-red-600 text-white" : "border-border bg-background text-foreground"}`}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>{tr("Heel moeilijk", "Very hard")}</span>
              <span>{tr("Heel makkelijk", "Very easy")}</span>
            </div>
          </div>
          <div>
            <label htmlFor="usertest-note" className="block text-sm font-semibold text-foreground">
              {tr("Wat kan beter?", "What could be better?")}
            </label>
            <textarea
              id="usertest-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <Button
            disabled={!completed || ease === null}
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={() => {
              finishUserTest({ completed, ease, note: note.trim() })
              setState({ ...state, done: true })
              setNote("")
              setPanel("thanks")
            }}
          >
            {tr("Test afronden", "Finish test")}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
