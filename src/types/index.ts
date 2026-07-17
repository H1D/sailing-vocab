// Single source of truth for categories. The `Category` type derives from this
// array, and scripts/check-vocab.ts imports it, so the CI data-check can never
// drift from the type. Add a new category id here (and render it in the UI).
export const CATEGORIES = [
  'parts',
  'sails',
  'points-of-sail',
  'commands',
  'winch-work',
  'mooring',
  'rigging',
  'navigation',
  'weather',
  'safety',
  'engine',
  'vhf',
  'tender',
  'tide',
  'domestic',
] as const

export type Category = (typeof CATEGORIES)[number]

export type CommandRole = 'helm' | 'crew' | 'both'

export interface Term {
  id: string
  term: string
  ru: string           // Russian translation — MANDATORY on every term
  definition: string   // English definition (concise, max 2 sentences)
  category: Category
  aka?: string[]       // alternative names
  role?: CommandRole   // only for 'commands' category
  trainable?: boolean  // false = reference only (Browse), excluded from Train rotation. Default true.
  pron?: string        // optional pronunciation hint tuned to a Russian speaker's traps (e.g. gunwale "GUN-nel")
  example?: string     // optional short real on-deck usage line (e.g. "Ease the mainsheet!")
}

export interface VocabData {
  meta: { version: number; total_terms: number }
  terms: Term[]
}

// Leitner SRS types
export interface LeitnerState {
  [termId: string]: {
    box: 1 | 2 | 3   // 1=daily, 2=every3days, 3=weekly
    nextReview: string // ISO date string
    streak: number     // consecutive "got it" hits in current box
  }
}

export type QuizOption = {
  text: string
  correct: boolean
}
