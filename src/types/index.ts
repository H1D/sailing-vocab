export type Category =
  | 'parts'
  | 'sails'
  | 'points-of-sail'
  | 'commands'
  | 'winch-work'
  | 'mooring'
  | 'rigging'
  | 'navigation'
  | 'weather'
  | 'safety'

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
