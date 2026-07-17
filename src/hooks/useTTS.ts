import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Text-to-speech, offline-hardened.
 *
 * TTS is an ENHANCEMENT, never the teacher. On a boat with no internet, iOS /
 * Android frequently ship with NO en-GB (or any English) voice available
 * offline. The `pron` respelling in the data is the reliable teacher; this hook
 * just lets the UI add a best-effort 🔊 button when — and only when — a usable
 * English voice actually exists.
 *
 * Key robustness detail: `speechSynthesis.getVoices()` is very often empty on
 * first call and only populates after the async `voiceschanged` event fires. We
 * subscribe to that event and re-read, so `hasEnglishVoice` becomes true as soon
 * as the platform finishes loading voices (if it ever does).
 */
export function useTTS() {
  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window

  // The chosen English voice (en-GB preferred, else any en-*). null until known.
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const [hasEnglishVoice, setHasEnglishVoice] = useState(false)

  useEffect(() => {
    if (!isSupported) return

    const synth = window.speechSynthesis

    const pickVoice = () => {
      let voices: SpeechSynthesisVoice[] = []
      try {
        voices = synth.getVoices()
      } catch {
        voices = []
      }
      if (!voices || voices.length === 0) return

      // Prefer en-GB, then any English voice.
      const enGB = voices.find(v => /^en-GB/i.test(v.lang))
      const anyEn =
        enGB ?? voices.find(v => /^en(-|_|$)/i.test(v.lang))

      voiceRef.current = anyEn ?? null
      setHasEnglishVoice(!!anyEn)
    }

    // First synchronous attempt (works on desktop Chrome/Firefox).
    pickVoice()

    // ...and subscribe for platforms that populate voices asynchronously.
    synth.addEventListener?.('voiceschanged', pickVoice)
    // Fallback for engines without addEventListener on the synth object.
    const prevHandler = synth.onvoiceschanged
    if (!synth.addEventListener) {
      synth.onvoiceschanged = pickVoice
    }

    return () => {
      synth.removeEventListener?.('voiceschanged', pickVoice)
      if (!synth.addEventListener) {
        synth.onvoiceschanged = prevHandler ?? null
      }
    }
  }, [isSupported])

  /**
   * Speak best-effort. NEVER throws. Sets the chosen voice when one was found,
   * always tags the utterance as en-GB so a platform can still make a sensible
   * choice even if we could not enumerate a voice.
   */
  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text) return
      try {
        const synth = window.speechSynthesis
        synth.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        if (voiceRef.current) utterance.voice = voiceRef.current
        utterance.lang = 'en-GB'
        utterance.rate = 0.9
        synth.speak(utterance)
      } catch {
        // Best-effort only — offline voice engines can throw; swallow it.
      }
    },
    [isSupported],
  )

  return { speak, isSupported, hasEnglishVoice }
}
