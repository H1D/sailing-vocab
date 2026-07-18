import { useCallback, useState } from 'react'
import type { LeitnerState, Term } from '../types/index'

const LS_KEY = 'leitner-state'
const SUSPEND_KEY = 'leitner-suspended'

const BOX_INTERVALS: Record<1 | 2 | 3, number> = { 1: 1, 2: 3, 3: 7 }

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function loadState(): LeitnerState {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as LeitnerState
  } catch {
    // ignore
  }
  return {}
}

function saveState(state: LeitnerState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

function loadSuspended(): Set<string> {
  try {
    const raw = localStorage.getItem(SUSPEND_KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch {
    // ignore
  }
  return new Set()
}

function saveSuspended(ids: Set<string>): void {
  try {
    localStorage.setItem(SUSPEND_KEY, JSON.stringify([...ids]))
  } catch {
    // ignore
  }
}

export function useLeitner(terms: Term[]) {
  const [state, setState] = useState<LeitnerState>(loadState)
  const [suspended, setSuspended] = useState<Set<string>>(loadSuspended)

  // Cards eligible for training: flagged trainable AND not user-suspended
  // ("don't teach me this"). Suspended ids persist in their own LS key.
  const trainableTerms = terms.filter(t => t.trainable !== false)
  const activeTerms = trainableTerms.filter(t => !suspended.has(t.id))

  const updateState = useCallback((updater: (prev: LeitnerState) => LeitnerState) => {
    setState(prev => {
      const next = updater(prev)
      saveState(next)
      return next
    })
  }, [])

  // Remove a card from rotation for good (until restored). Persisted immediately.
  const suspend = useCallback((termId: string) => {
    setSuspended(prev => {
      const next = new Set(prev)
      next.add(termId)
      saveSuspended(next)
      return next
    })
  }, [])

  const restoreSuspended = useCallback(() => {
    setSuspended(() => {
      const next = new Set<string>()
      saveSuspended(next)
      return next
    })
  }, [])

  const getDueCards = useCallback((): Term[] => {
    const today = todayISO()

    const due: Term[] = []
    const notStarted: Term[] = []

    for (const term of activeTerms) {
      const entry = state[term.id]
      if (!entry) {
        notStarted.push(term)
      } else if (entry.nextReview <= today) {
        due.push(term)
      }
    }

    // Sort due by box ascending (box 1 first = most urgent)
    due.sort((a, b) => {
      const aBox = state[a.id]?.box ?? 1
      const bBox = state[b.id]?.box ?? 1
      return aBox - bBox
    })

    return [...due, ...notStarted]
  }, [state, activeTerms])

  const getNextReviewDate = useCallback((): string | null => {
    const today = todayISO()
    let earliest: string | null = null

    for (const term of activeTerms) {
      const entry = state[term.id]
      if (!entry) continue
      if (entry.nextReview > today) {
        if (!earliest || entry.nextReview < earliest) {
          earliest = entry.nextReview
        }
      }
    }
    return earliest
  }, [state, activeTerms])

  const markGotIt = useCallback((termId: string) => {
    updateState(prev => {
      const entry = prev[termId]
      const currentBox: 1 | 2 | 3 = entry?.box ?? 1
      const currentStreak = entry?.streak ?? 0
      const newStreak = currentStreak + 1

      // Advance to next box after 3 consecutive correct in current box
      let newBox: 1 | 2 | 3 = currentBox
      if (newStreak >= 3 && currentBox < 3) {
        newBox = (currentBox + 1) as 1 | 2 | 3
      }

      const nextReview = addDays(todayISO(), BOX_INTERVALS[newBox])

      return {
        ...prev,
        [termId]: {
          box: newBox,
          nextReview,
          streak: newBox !== currentBox ? 0 : newStreak,
        },
      }
    })
  }, [updateState])

  const markStillLearning = useCallback((termId: string) => {
    updateState(prev => {
      const nextReview = addDays(todayISO(), BOX_INTERVALS[1])
      return {
        ...prev,
        [termId]: {
          box: 1,
          nextReview,
          streak: 0,
        },
      }
    })
  }, [updateState])

  const getStats = useCallback(() => {
    let known = 0
    let learning = 0
    let notStarted = 0

    for (const term of activeTerms) {
      const entry = state[term.id]
      if (!entry) {
        notStarted++
      } else if (entry.box === 3) {
        known++
      } else {
        learning++
      }
    }

    return {
      total: activeTerms.length,
      known,
      learning,
      notStarted,
      suspended: suspended.size,
    }
  }, [state, activeTerms, suspended])

  return {
    state,
    getDueCards,
    markGotIt,
    markStillLearning,
    getStats,
    getNextReviewDate,
    suspend,
    restoreSuspended,
  }
}
