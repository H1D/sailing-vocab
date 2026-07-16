export type CategoryId =
  | 'boat-parts'
  | 'sails-and-rigging'
  | 'maneuvers'
  | 'points-of-sail'
  | 'navigation'
  | 'weather'
  | 'safety'
  | 'anchoring-and-docking'
  | 'engine-and-mechanical'
  | 'phrasebook'

export interface Term {
  id: string
  en: string
  ru: string
  category: CategoryId
  subcategory?: string
  definition_en: string
  example_en?: string
  example_ru?: string
  disambiguation_note?: string
  pronunciation_hint?: string
  phrasebook_only?: boolean
  safety_critical?: boolean
  image_ref?: string
}

export interface VocabData {
  meta: { version: number; total_terms: number }
  terms: Term[]
}
