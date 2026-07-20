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
  example?: string     // optional short real on-deck usage line (e.g. "Ease the mainsheet!")
}

// A drilled call-and-response manoeuvre (tack, gybe, MOB, leaving berth, ...).
// Rendered on the CheatSheet as an ordered call → response list so Artem can
// rehearse the whole exchange, not just isolated words.
export interface SequenceStep {
  call: string          // the English line actually spoken on deck
  ru: string            // Russian meaning
  by: CommandRole       // who says it: helm / crew / both
}

export interface ManoeuvreSequence {
  id: string
  name: string          // English name, e.g. "Tacking"
  ru: string            // Russian name, e.g. "Поворот оверштаг"
  steps: SequenceStep[]
}

export interface VocabData {
  meta: { version: number; total_terms: number }
  terms: Term[]
  sequences?: ManoeuvreSequence[]
}

// A single trainable card. Every trainable term becomes two cards — forward
// (ENG→RU) and reverse (RU→ENG) — thrown into one pile with independent SRS
// progress. Forward keeps the bare term id; reverse gets a "::rev" suffix.
export type CardDirection = 'fwd' | 'rev'
export interface Card {
  cardId: string        // 'hull' (forward) | 'hull::rev' (reverse)
  dir: CardDirection
  term: Term            // underlying term (audio clips are keyed by term.id)
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
