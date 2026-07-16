import { useCallback, useState } from 'react'
import type { LeitnerState, Term } from '../types/index'

const LS_KEY = 'leitner-state'

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

export function useLeitner(terms: Term[]) {
  const [state, setState] = useState<LeitnerState>(loadState)

  const trainableTerms = terms.filter(t => t.trainable !== false)

  const updateState = useCallback((updater: (prev: LeitnerState) => LeitnerState) => {
    setState(prev => {
      const next = updater(prev)
      saveState(next)
      return next
    })
  }, [])

  const getDueCards = useCallback((): Term[] => {
    const today = todayISO()

    const due: Term[] = []
    const notStarted: Term[] = []

    for (const term of trainableTerms) {
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
  }, [state, trainableTerms])

  const getNextReviewDate = useCallback((): string | null => {
    const today = todayISO()
    let earliest: string | null = null

    for (const term of trainableTerms) {
      const entry = state[term.id]
      if (!entry) continue
      if (entry.nextReview > today) {
        if (!earliest || entry.nextReview < earliest) {
          earliest = entry.nextReview
        }
      }
    }
    return earliest
  }, [state, trainableTerms])

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

    for (const term of trainableTerms) {
      const entry = state[term.id]
      if (!entry) {
        notStarted++
      } else if (entry.box === 3) {
        known++
      } else {
        learning++
      }
    }

    return { total: trainableTerms.length, known, learning, notStarted }
  }, [state, trainableTerms])

  return { state, getDueCards, markGotIt, markStillLearning, getStats, getNextReviewDate }
}
