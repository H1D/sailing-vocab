import { useEffect, useRef, useState } from 'react'
import type { LeitnerState, Term } from '../types/index'
import { useLeitner } from '../hooks/useLeitner'
import { useTTS } from '../hooks/useTTS'
import { categoryLabel } from '../categories'
import PointsOfSail from '../components/PointsOfSail'

interface Props {
  terms: Term[]
  leitnerState: LeitnerState
  onUpdate: (state: LeitnerState) => void
}

function roleBadge(role: string) {
  const cfg: Record<string, { label: string; cls: string }> = {
    helm: { label: 'HELM', cls: 'bg-blue-700 text-blue-100' },
    crew: { label: 'CREW', cls: 'bg-green-700 text-green-100' },
    both: { label: 'BOTH', cls: 'bg-purple-700 text-purple-100' },
  }
  const c = cfg[role] ?? cfg.both
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded ${c.cls}`}>
      {c.label}
    </span>
  )
}

export default function Train({ terms, leitnerState: _externalState, onUpdate }: Props) {
  const leitner = useLeitner(terms)
  const { speak, hasEnglishVoice } = useTTS()

  // Sync external leitner state if needed - we use the hook's internal state
  // but propagate updates upward via onUpdate
  const [session, setSession] = useState<Term[]>([])
  const [sessionTotal, setSessionTotal] = useState(0)
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [answered, setAnswered] = useState<'got-it' | 'still-learning' | null>(null)

  // Touch swipe state
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // Initialize session on mount
  useEffect(() => {
    const due = leitner.getDueCards()
    setSession(due)
    setSessionTotal(due.length)
    setCardIndex(0)
    setFlipped(false)
    setAnswered(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Propagate state up after each answer
  useEffect(() => {
    onUpdate(leitner.state)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leitner.state])

  const currentTerm = session[cardIndex]
  const progress = sessionTotal > 0 ? cardIndex / sessionTotal : 0

  // Autoplay the English term/example on reveal — best-effort only. Silent if no
  // voice loaded; never blocks the reveal itself (that's plain state above).
  useEffect(() => {
    if (flipped && hasEnglishVoice && currentTerm) {
      speak(currentTerm.example || currentTerm.term)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, cardIndex])

  function advance() {
    const next = cardIndex + 1
    if (next >= session.length) {
      // session done — rebuild with any remaining due
      const remaining = leitner.getDueCards()
      if (remaining.length === 0) {
        setSession([])
        setCardIndex(0)
      } else {
        setSession(remaining)
        setSessionTotal(prev => prev + remaining.length)
        setCardIndex(0)
      }
    } else {
      setCardIndex(next)
    }
    setFlipped(false)
    setAnswered(null)
  }

  function handleGotIt() {
    if (!currentTerm || answered) return
    setAnswered('got-it')
    leitner.markGotIt(currentTerm.id)
  }

  function handleStillLearning() {
    if (!currentTerm || answered) return
    setAnswered('still-learning')
    leitner.markStillLearning(currentTerm.id)
  }

  // Touch swipe handlers
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    if (!flipped || answered) return

    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current

    // Guard: only activate if |dx| > |dy| (horizontal swipe)
    if (Math.abs(dx) < Math.abs(dy)) return
    // Guard: threshold 60px
    if (Math.abs(dx) < 60) return
    // Guard: don't trigger if touch started within 20px of edge
    const screenW = window.innerWidth
    if (touchStartX.current < 20 || touchStartX.current > screenW - 20) return

    if (dx > 0) {
      handleGotIt()
    } else {
      handleStillLearning()
    }

    touchStartX.current = null
    touchStartY.current = null
  }

  const stats = leitner.getStats()
  const nextReview = leitner.getNextReviewDate()

  // All caught up
  if (session.length === 0 || (cardIndex >= session.length)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-6">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-white dark:text-red-300">All caught up!</h2>
        {nextReview && (
          <p className="text-slate-400 dark:text-slate-500">
            Next review:{' '}
            <span className="text-sky-400 dark:text-red-400 font-semibold">{nextReview}</span>
          </p>
        )}
        <div className="grid grid-cols-3 gap-4 w-full max-w-xs mt-4">
          <div className="bg-green-900/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.known}</div>
            <div className="text-xs text-green-300">Known</div>
          </div>
          <div className="bg-yellow-900/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.learning}</div>
            <div className="text-xs text-yellow-300">Learning</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-slate-300">{stats.notStarted}</div>
            <div className="text-xs text-slate-400">New</div>
          </div>
        </div>
        {leitner.getDueCards().length > 0 && (
          <button
            className="mt-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 px-8 rounded-xl"
            onClick={() => {
              const due = leitner.getDueCards()
              setSession(due)
              setSessionTotal(due.length)
              setCardIndex(0)
              setFlipped(false)
              setAnswered(null)
            }}
          >
            Start New Session
          </button>
        )}
      </div>
    )
  }

  if (!currentTerm) return null

  const doneInSession = cardIndex
  const totalInSession = sessionTotal

  return (
    <div className="flex flex-col h-full select-none">
      {/* Progress bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-1">
          <span>{doneInSession} of {totalInSession}</span>
          <span className="text-slate-500">📦 Box {leitner.state[currentTerm.id]?.box ?? '—'}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-700 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-500 dark:bg-red-500 rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 px-4 pb-4 flex flex-col gap-4">
        <div
          ref={cardRef}
          className="flex-1 rounded-2xl bg-slate-800 dark:bg-slate-950 border border-slate-600 dark:border-slate-800 flex flex-col items-center justify-center p-6 gap-4 cursor-pointer active:opacity-90 transition-opacity relative"
          onClick={() => !answered && setFlipped(f => !f)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* TTS button — only useful when an English voice actually loaded.
              The pron respelling on the back is the reliable teacher regardless. */}
          {hasEnglishVoice && (
            <button
              className="absolute top-2 right-2 text-2xl text-slate-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={e => { e.stopPropagation(); speak(currentTerm.term) }}
              aria-label="Speak term"
            >
              🔊
            </button>
          )}

          {/* Category badge */}
          <span className="bg-slate-700 dark:bg-slate-800 text-slate-300 dark:text-slate-400 text-xs px-3 py-1 rounded-full">
            {categoryLabel(currentTerm.category)}
          </span>

          {!flipped ? (
            /* Front */
            <div className="text-center">
              <div className="text-3xl font-bold text-white dark:text-red-300 leading-tight mb-2">
                {currentTerm.term}
              </div>
              {currentTerm.aka && currentTerm.aka.length > 0 && (
                <div className="text-slate-400 dark:text-slate-500 text-sm">
                  aka {currentTerm.aka.join(', ')}
                </div>
              )}
              <div className="text-slate-500 dark:text-slate-600 text-sm mt-6">Tap to reveal →</div>
            </div>
          ) : (
            /* Back */
            <div className="text-center space-y-3 w-full">
              {currentTerm.category === 'commands' && (
                <div className="text-2xl font-bold text-sky-300 dark:text-red-300">
                  "{currentTerm.term}"
                </div>
              )}

              {/* Pronunciation respelling — the reliable teacher. Always shown
                  when present, independent of any TTS voice availability. */}
              {currentTerm.pron && (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-lg text-amber-300 dark:text-red-300 tracking-wide">
                    {currentTerm.pron}
                  </span>
                  {hasEnglishVoice && (
                    <button
                      className="text-xl text-slate-400 hover:text-white p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      onClick={e => { e.stopPropagation(); speak(currentTerm.example || currentTerm.term) }}
                      aria-label="Speak pronunciation"
                    >
                      🔊
                    </button>
                  )}
                </div>
              )}

              <p className="text-white dark:text-red-200 text-base leading-relaxed">{currentTerm.definition}</p>
              <p className="text-slate-400 dark:text-red-400 text-sm">{currentTerm.ru}</p>

              {/* Real on-deck usage line */}
              {currentTerm.example && (
                <p className="text-sky-200 dark:text-red-200 text-sm italic leading-relaxed border-l-2 border-sky-500/50 dark:border-red-500/50 pl-3 mx-auto max-w-xs text-left">
                  "{currentTerm.example}"
                </p>
              )}

              {currentTerm.role && roleBadge(currentTerm.role)}
              {currentTerm.category === 'points-of-sail' && (
                <div className="mt-2">
                  <PointsOfSail compact />
                </div>
              )}

              {/* Swipe hint */}
              {!answered && (
                <div className="text-slate-600 dark:text-slate-700 text-xs mt-2">
                  ← Still learning &nbsp;|&nbsp; Got it →
                </div>
              )}

              {/* Answer feedback */}
              {answered === 'got-it' && (
                <div className="text-green-400 font-semibold text-sm mt-2">✓ Marked as got it!</div>
              )}
              {answered === 'still-learning' && (
                <div className="text-red-400 font-semibold text-sm mt-2">✗ Back to box 1</div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {flipped && !answered ? (
          <div className="flex gap-3">
            <button
              className="flex-1 min-h-[56px] rounded-xl bg-red-900/60 hover:bg-red-800/80 border border-red-700 text-red-200 font-semibold text-base active:scale-95 transition-transform"
              onClick={handleStillLearning}
            >
              Still learning ✗
            </button>
            <button
              className="flex-1 min-h-[56px] rounded-xl bg-green-900/60 hover:bg-green-800/80 border border-green-700 text-green-200 font-semibold text-base active:scale-95 transition-transform"
              onClick={handleGotIt}
            >
              Got it! ✓
            </button>
          </div>
        ) : answered ? (
          <button
            className="w-full min-h-[56px] rounded-xl bg-sky-700 hover:bg-sky-600 dark:bg-red-900 dark:hover:bg-red-800 text-white font-semibold text-base active:scale-95 transition-transform"
            onClick={advance}
          >
            Next →
          </button>
        ) : (
          <button
            className="w-full min-h-[56px] rounded-xl bg-slate-700 hover:bg-slate-600 dark:bg-slate-900 text-white font-semibold text-base active:scale-95 transition-transform"
            onClick={() => setFlipped(true)}
          >
            Reveal
          </button>
        )}
      </div>
    </div>
  )
}
