"use client"

// Remote user test: a tester opens the site with ?test=CODE, gives consent and
// is then measured (events + session recording) until the test is finished.
// Regular visitors are never tracked by this module.

import type { PostHog } from "posthog-js"

export type UserTestState = {
  code: string
  consent: "yes" | "no" | null
  startedAt: number | null
  done: boolean
}

const STORAGE_KEY = "arsi:usertest"
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com"

export const USERTEST_GOAL_EVENT = "arsi:usertest-goal"

let client: PostHog | null = null
let loading: Promise<void> | null = null
const queue: { event: string; props: Record<string, unknown> }[] = []

export function userTestAvailable() {
  return Boolean(POSTHOG_KEY)
}

export function readUserTest(): UserTestState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as UserTestState) : null
  } catch {
    return null
  }
}

function writeUserTest(state: UserTestState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage can be blocked; the test then only lasts for this page.
  }
}

/** Reads ?test=CODE from the URL and registers a new tester. */
export function claimUserTestFromUrl(): UserTestState | null {
  const params = new URLSearchParams(window.location.search)
  const code = params.get("test")?.trim().slice(0, 24)
  if (!code || !/^[A-Za-z0-9_-]+$/.test(code)) return readUserTest()

  const existing = readUserTest()
  const state = existing?.code === code ? existing : { code, consent: null, startedAt: null, done: false }
  writeUserTest(state)

  params.delete("test")
  const query = params.toString()
  window.history.replaceState(null, "", window.location.pathname + (query ? `?${query}` : ""))
  return state
}

function isActive(state: UserTestState | null): state is UserTestState {
  return Boolean(state && state.consent === "yes" && !state.done)
}

function load(state: UserTestState) {
  if (client || loading || !POSTHOG_KEY) return
  loading = import("posthog-js").then(({ default: posthog }) => {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: "identified_only",
      persistence: "localStorage",
      capture_pageview: true,
      autocapture: true,
      // Typed text never leaves the browser; only where testers click and how long it takes.
      session_recording: { maskAllInputs: true },
    })
    posthog.identify(`tester-${state.code}`)
    posthog.register({ test_code: state.code })
    client = posthog
    for (const item of queue.splice(0)) posthog.capture(item.event, item.props)
  })
}

/** Continues an already started test after a page load. */
export function resumeUserTest() {
  const state = readUserTest()
  if (isActive(state)) load(state)
  return state
}

export function answerUserTestConsent(consent: "yes" | "no") {
  const state = readUserTest()
  if (!state) return null
  const next = { ...state, consent, startedAt: consent === "yes" ? Date.now() : null }
  writeUserTest(next)
  if (consent === "yes") {
    load(next)
    trackUserTest("test_started")
  }
  return next
}

/** Records a step of the test. Does nothing for regular visitors. */
export function trackUserTest(event: string, props: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return
  const state = readUserTest()
  if (!isActive(state)) return
  const payload = {
    ...props,
    path: window.location.pathname,
    seconds_since_start: state.startedAt ? Math.round((Date.now() - state.startedAt) / 1000) : null,
  }
  if (client) client.capture(event, payload)
  else {
    queue.push({ event, props: payload })
    load(state)
  }
}

/** Marks the goal of the test as reached, so the closing question can be shown. */
export function reachUserTestGoal(goal: string) {
  trackUserTest("test_goal_reached", { goal })
  if (isActive(readUserTest())) window.dispatchEvent(new CustomEvent(USERTEST_GOAL_EVENT, { detail: { goal } }))
}

export function finishUserTest(answers: { completed: string; ease: number | null; note: string }) {
  const state = readUserTest()
  if (!isActive(state)) return
  trackUserTest("test_finished", answers)
  writeUserTest({ ...state, done: true })
  // Give the last event time to be sent before recording stops.
  setTimeout(() => {
    client?.stopSessionRecording()
    client?.reset()
    client = null
    loading = null
  }, 1500)
}
