import { useCallback } from 'react'

export function useTTS() {
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const speak = useCallback((text: string) => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-GB'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }, [isSupported])

  return { speak, isSupported }
}
