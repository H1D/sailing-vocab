import { useEffect, useRef, useState } from 'react'
import type { Term } from '../types/index'
import { useTTS } from '../hooks/useTTS'

interface Props {
  terms: Term[]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
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

function pickWrongOptions(correct: Term, pool: Term[], count = 3): Term[] {
  const others = pool.filter(t => t.id !== correct.id)
  const shuffled = shuffle(others)
  return shuffled.slice(0, count)
}

interface QuizCard {
  term: Term
  options: Array<{ text: string; termId: string }>
  correctId: string
}

function buildCard(term: Term, pool: Term[]): QuizCard {
  const wrongs = pickWrongOptions(term, pool, 3)
  const options = shuffle([
    { text: term.definition, termId: term.id },
    ...wrongs.map(w => ({ text: w.definition, termId: w.id })),
  ])
  return { term, options, correctId: term.id }
}

export default function Drill({ terms }: Props) {
  const { speak, isSupported } = useTTS()

  const commandTerms = terms.filter(
    t => t.category === 'commands' && t.trainable !== false
  )

  const [queue, setQueue] = useState<QuizCard[]>([])
  const [current, setCurrent] = useState<QuizCard | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const hasSpoken = useRef(false)

  function initSession(cmdTerms: Term[]) {
    const shuffled = shuffle(cmdTerms)
    const cards = shuffled.map(t => buildCard(t, cmdTerms))
    setQueue(cards.slice(1))
    setCurrent(cards[0] ?? null)
    setSelected(null)
    setScore({ correct: 0, total: 0 })
    hasSpoken.current = false
  }

  useEffect(() => {
    if (commandTerms.length > 0) {
      initSession(commandTerms)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terms])

  // Auto-play TTS when card changes
  useEffect(() => {
    if (current && isSupported && !hasSpoken.current) {
      hasSpoken.current = true
      speak(current.term.term)
    }
  }, [current, isSupported, speak])

  function handleSelect(optionTermId: string) {
    if (selected) return // already answered
    setSelected(optionTermId)
    const isCorrect = optionTermId === current?.correctId
    setScore(s => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }))
  }

  function handleNext() {
    if (queue.length === 0) {
      // Reshuffle and restart
      initSession(commandTerms)
      return
    }
    const [next, ...rest] = queue
    setCurrent(next)
    setQueue(rest)
    setSelected(null)
    hasSpoken.current = false
  }

  if (commandTerms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-5xl mb-4">📢</div>
        <h2 className="text-xl font-bold text-white dark:text-red-300">No Commands Yet</h2>
        <p className="text-slate-400 dark:text-slate-500 mt-2 text-sm">
          Add terms with category "commands" to vocab.json to use the drill.
        </p>
      </div>
    )
  }

  if (!current) return null

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Score */}
      <div className="flex items-center justify-between">
        <div className="text-slate-300 dark:text-red-300 text-sm font-semibold">
          Score: <span className="text-green-400">{score.correct}</span>
          <span className="text-slate-500"> / {score.total}</span>
        </div>
        <div className="text-slate-500 text-xs">
          {queue.length} remaining
        </div>
      </div>

      {/* Question card */}
      <div className="bg-slate-800 dark:bg-slate-950 rounded-2xl border border-slate-600 dark:border-slate-800 p-6 flex flex-col items-center gap-4">
        <span className="bg-slate-700 dark:bg-slate-800 text-slate-300 dark:text-slate-400 text-xs px-3 py-1 rounded-full">
          Command
        </span>

        <div className="text-3xl font-bold text-white dark:text-red-300 text-center">
          "{current.term.term}"
        </div>

        {isSupported && (
          <button
            className="flex items-center gap-2 bg-slate-700 dark:bg-slate-800 hover:bg-slate-600 dark:hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-sm transition-colors"
            onClick={() => speak(current.term.term)}
          >
            🔊 Replay
          </button>
        )}

        <p className="text-slate-400 dark:text-slate-500 text-sm text-center">
          What does this command mean?
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {current.options.map(opt => {
          const isSelected = selected === opt.termId
          const isCorrect = opt.termId === current.correctId
          const showResult = selected !== null

          let btnCls = 'bg-slate-800 dark:bg-slate-950 border border-slate-600 dark:border-slate-700 text-white dark:text-red-200'
          if (showResult) {
            if (isCorrect) {
              btnCls = 'bg-green-900/60 border border-green-600 text-green-200'
            } else if (isSelected && !isCorrect) {
              btnCls = 'bg-red-900/60 border border-red-600 text-red-200'
            } else {
              btnCls = 'bg-slate-800/50 dark:bg-slate-950/50 border border-slate-700 dark:border-slate-800 text-slate-500'
            }
          }

          return (
            <button
              key={opt.termId}
              className={`w-full min-h-[56px] rounded-xl px-4 py-3 text-left text-sm leading-snug transition-colors ${btnCls}`}
              onClick={() => handleSelect(opt.termId)}
              disabled={!!selected}
            >
              <span>{opt.text}</span>
              {showResult && isCorrect && (
                <span className="ml-2 text-green-400 font-bold">✓</span>
              )}
              {showResult && isSelected && !isCorrect && (
                <span className="ml-2 text-red-400 font-bold">✗</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Role badge + Next button after answer */}
      {selected && (
        <div className="flex flex-col gap-3 mt-2">
          {current.term.role && (
            <div className="flex items-center gap-2 text-sm text-slate-300 dark:text-slate-400">
              <span>Command role:</span>
              {roleBadge(current.term.role)}
            </div>
          )}
          <button
            className="w-full min-h-[56px] rounded-xl bg-sky-700 hover:bg-sky-600 dark:bg-red-900 dark:hover:bg-red-800 text-white font-semibold text-base active:scale-95 transition-transform"
            onClick={handleNext}
          >
            {queue.length === 0 ? 'Restart Session' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  )
}
