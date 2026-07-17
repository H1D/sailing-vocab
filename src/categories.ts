import type { Category } from './types/index'

/**
 * Human label + emoji icon for EVERY id in `CATEGORIES` (src/types/index.ts).
 * Shared by all views so a raw category slug (e.g. "winch-work", "vhf") never
 * leaks into the UI. If a new category is added to CATEGORIES, add it here too —
 * `satisfies Record<Category, ...>` makes the omission a type error.
 */
export const CATEGORY_META = {
  parts: { icon: '🚢', label: 'Parts of Boat' },
  sails: { icon: '⛵', label: 'Sails' },
  'points-of-sail': { icon: '🧭', label: 'Points of Sail' },
  commands: { icon: '📢', label: 'Commands' },
  'winch-work': { icon: '⚙️', label: 'Winch Work' },
  mooring: { icon: '⚓', label: 'Mooring' },
  rigging: { icon: '🔗', label: 'Rigging' },
  navigation: { icon: '🗺️', label: 'Navigation' },
  weather: { icon: '🌬️', label: 'Weather' },
  safety: { icon: '🛟', label: 'Safety' },
  engine: { icon: '🔧', label: 'Engine' },
  vhf: { icon: '📻', label: 'VHF & Radio' },
  tender: { icon: '🛶', label: 'Tender & Dinghy' },
  tide: { icon: '🌊', label: 'Tide & Pilotage' },
  domestic: { icon: '🍽️', label: 'Onboard Systems' },
} satisfies Record<Category, { icon: string; label: string }>

/** Just the labels, for places that only need text. */
export const CATEGORY_LABELS: Record<Category, string> = Object.fromEntries(
  (Object.entries(CATEGORY_META) as [Category, { icon: string; label: string }][]).map(
    ([id, { label }]) => [id, label],
  ),
) as Record<Category, string>

/** Safe lookup that never returns a raw slug for a known category. */
export function categoryLabel(id: string): string {
  return (CATEGORY_LABELS as Record<string, string>)[id] ?? id
}

export function categoryIcon(id: string): string {
  return (CATEGORY_META as Record<string, { icon: string; label: string }>)[id]?.icon ?? '•'
}
