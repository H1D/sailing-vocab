import { useCallback, useEffect, useRef, useState } from 'react'

const BASE = import.meta.env.BASE_URL

/**
 * A low, looping sea-and-rigging bed (ElevenLabs text-to-sound-effects) you can
 * toggle on while drilling — the "you're on the boat" atmosphere. Kept quiet so
 * it sits under the pronunciation clips, and precached so it works offline too.
 */
export function useAmbience() {
  const ref = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  const toggle = useCallback(() => {
    if (typeof Audio === 'undefined') return
    if (!ref.current) {
      const a = new Audio(`${BASE}audio/ambience.mp3`)
      a.loop = true
      a.volume = 0.22
      ref.current = a
    }
    const a = ref.current
    if (playing) {
      a.pause()
      setPlaying(false)
    } else {
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }, [playing])

  // Stop the bed if the component using it unmounts.
  useEffect(() => () => { ref.current?.pause() }, [])

  return { playing, toggle }
}
