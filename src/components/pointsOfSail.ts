// Map a vocab term id to the points-of-sail diagram sector it represents.
// Wind concepts (windward, leeward, gust, apparent/true wind) are NOT points of
// sail, so they have no wedge — callers use hasSailDiagram() to skip the diagram.
export const TERM_TO_SECTOR: Record<string, string> = {
  'close-hauled': 'close-hauled',
  'close-reach': 'close-reach',
  'beam-reach': 'beam-reach',
  'broad-reach': 'broad-reach',
  'dead-run': 'running',
  'in-irons': 'in-irons',
  'no-go-zone': 'in-irons',
}

export function hasSailDiagram(termId: string): boolean {
  return termId in TERM_TO_SECTOR
}
