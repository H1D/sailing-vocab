import { playClip, speakFallback, type ClipKind } from '../audio'

interface Props {
  kind: ClipKind
  id: string
  /** Spoken by the browser TTS engine only if the pre-rendered clip is missing. */
  fallbackText: string
  className?: string
  label?: string
  /** Visual glyph — 🔊 for words, ▶ for a phrase/example/drill line. */
  glyph?: string
}

/**
 * Tap to hear the gruff-skipper pronunciation. Stops event propagation so it can
 * sit inside a clickable card/row without triggering the card's own tap.
 */
export default function SpeakButton({
  kind,
  id,
  fallbackText,
  className,
  label = 'Play pronunciation',
  glyph = '🔊',
}: Props) {
  return (
    <button
      type="button"
      className={
        className ??
        'text-slate-400 hover:text-white active:scale-90 transition-transform'
      }
      onClick={e => {
        e.stopPropagation()
        e.preventDefault()
        playClip(kind, id, { fallback: () => speakFallback(fallbackText) })
      }}
      aria-label={label}
    >
      {glyph}
    </button>
  )
}
