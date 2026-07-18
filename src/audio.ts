// Offline pronunciation audio.
//
// Every term, example and drill line is pre-rendered to an mp3 by an old British
// skipper (ElevenLabs v3, voice "George" steered gruff). The files live in
// public/audio/{terms,examples,drills}/<id>.mp3 and are precached by the service
// worker, so tapping 🔊 plays real speech with ZERO signal once the app has loaded
// — unlike the browser speech engine, which is usually silent offline on iOS.
//
// speechSynthesis stays only as a last-ditch fallback if a clip is ever missing.

const BASE = import.meta.env.BASE_URL

export type ClipKind = 'terms' | 'examples' | 'drills'

export function clipUrl(kind: ClipKind, id: string): string {
  return `${BASE}audio/${kind}/${encodeURIComponent(id)}.mp3`
}

// One shared element: starting a new clip cuts off the previous one (no overlap).
let current: HTMLAudioElement | null = null

/**
 * Play a pre-rendered clip. Never throws. If the file is missing/undecodable,
 * calls `fallback` (best-effort browser TTS) so the user still hears *something*.
 */
export function playClip(
  kind: ClipKind,
  id: string,
  opts: { fallback?: () => void } = {},
): void {
  if (typeof Audio === 'undefined') { opts.fallback?.(); return }
  try {
    current?.pause()
    const a = new Audio(clipUrl(kind, id))
    current = a
    let handled = false
    const fb = () => { if (!handled) { handled = true; opts.fallback?.() } }
    a.addEventListener('error', fb, { once: true })
    // play() rejects on autoplay-block or load failure; only the load failure
    // warrants the TTS fallback, but falling back on either is harmless.
    a.play().catch(fb)
  } catch {
    opts.fallback?.()
  }
}

/** Last-ditch browser speech — usually silent offline on iOS, hence just a fallback. */
export function speakFallback(text: string): void {
  try {
    const synth = window.speechSynthesis
    if (!synth || !text) return
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-GB'
    u.rate = 0.9
    synth.speak(u)
  } catch {
    // offline voice engines can throw — swallow, it's best-effort only
  }
}
