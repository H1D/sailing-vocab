import { useCallback, useEffect, useState } from 'react'
import type { LeitnerState, Term, VocabData } from './types/index'
import { useNightMode } from './hooks/useNightMode'
import { useAmbience } from './hooks/useAmbience'
import Browse from './views/Browse'
import Train from './views/Train'
import Drill from './views/Drill'
import CheatSheet from './views/CheatSheet'
import vocabData from './data/vocab.json'

const VIEWS = ['#search', '#flashcards', '#quiz', '#cheatsheet'] as const
type View = (typeof VIEWS)[number]

const NAV_TABS = [
  { hash: '#search' as View, icon: '🔍', label: 'Search' },
  { hash: '#flashcards' as View, icon: '🃏', label: 'Cards' },
  { hash: '#quiz' as View, icon: '🎯', label: 'Drill' },
  { hash: '#cheatsheet' as View, icon: '📋', label: 'Sheet' },
]

const data = vocabData as unknown as VocabData
const allTerms: Term[] = data.terms ?? []
const allSequences = data.sequences ?? []

export default function App() {
  // Navigation
  const [view, setView] = useState<View>(() => {
    const h = window.location.hash as View
    return VIEWS.includes(h) ? h : '#search'
  })

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash as View
      if (VIEWS.includes(h)) setView(h)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Night mode
  const { nightMode, toggle: toggleNightMode } = useNightMode()

  // Sea ambience — low looping bed you can toggle while drilling
  const { playing: ambiencePlaying, toggle: toggleAmbience } = useAmbience()

  // Online/offline
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  // SW update banner
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setShowUpdateBanner(true)
            }
          })
        })
      }).catch(() => {
        // SW not available in dev mode — ignore
      })
    }
  }, [])

  // Leitner state — stored in localStorage, managed by Train via useLeitner hook
  // We store a copy here so Browse can read progress dots
  const [leitnerState, setLeitnerState] = useState<LeitnerState>(() => {
    try {
      const raw = localStorage.getItem('leitner-state')
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })

  const handleLeitnerUpdate = useCallback((state: LeitnerState) => {
    setLeitnerState(state)
  }, [])

  return (
    <div className="h-full overscroll-none bg-slate-900 dark:bg-black text-white dark:text-red-300 flex flex-col max-w-2xl mx-auto relative">
      {/* SW update banner */}
      {showUpdateBanner && (
        <div
          className="fixed top-0 left-0 right-0 z-50 bg-sky-600 dark:bg-red-800 text-white text-center pb-3 pt-[calc(0.75rem_+_env(safe-area-inset-top))] px-4 text-sm font-medium cursor-pointer shadow-lg max-w-2xl mx-auto"
          onClick={() => window.location.reload()}
        >
          New version available — tap to reload
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-lg"
            onClick={e => { e.stopPropagation(); setShowUpdateBanner(false) }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header — pad past the notch / Dynamic Island / status bar on modern iPhones */}
      <header className="flex items-center justify-between pb-3 pt-[calc(0.75rem_+_env(safe-area-inset-top))] pl-[calc(1rem_+_env(safe-area-inset-left))] pr-[calc(1rem_+_env(safe-area-inset-right))] bg-slate-900 dark:bg-black border-b border-slate-700 dark:border-slate-900 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-white dark:text-red-300">⚓ Sail Vocab</h1>
          {/* Offline indicator */}
          <span
            className={`w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`}
            title={online ? 'Online' : 'Offline'}
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleAmbience}
            className={`text-xl p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
              ambiencePlaying
                ? 'bg-slate-700 dark:bg-slate-900 opacity-100'
                : 'opacity-50 hover:opacity-100 hover:bg-slate-700 dark:hover:bg-slate-900'
            }`}
            aria-label={ambiencePlaying ? 'Stop sea ambience' : 'Play sea ambience'}
            aria-pressed={ambiencePlaying}
            title="Sea ambience"
          >
            🌊
          </button>
          <button
            onClick={toggleNightMode}
            className="text-xl p-2 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-900 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={nightMode ? 'Switch to day mode' : 'Switch to night mode'}
          >
            {nightMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {view === '#search' && (
          <Browse terms={allTerms} leitnerState={leitnerState} />
        )}
        {view === '#flashcards' && (
          <Train
            terms={allTerms}
            leitnerState={leitnerState}
            onUpdate={handleLeitnerUpdate}
          />
        )}
        {view === '#quiz' && (
          <Drill terms={allTerms} />
        )}
        {view === '#cheatsheet' && (
          <CheatSheet terms={allTerms} sequences={allSequences} />
        )}
      </main>

      {/* Bottom nav */}
      <nav aria-label="Primary" className="bg-slate-800 dark:bg-slate-950 border-t border-slate-700 dark:border-slate-800 flex pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] flex-shrink-0">
        {NAV_TABS.map(({ hash, icon, label }) => (
          <a
            key={hash}
            href={hash}
            aria-current={view === hash ? 'page' : undefined}
            className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] text-xs font-medium transition-colors gap-0.5 ${
              view === hash
                ? 'text-sky-400 dark:text-red-400 bg-slate-700 dark:bg-slate-900'
                : 'text-slate-400 hover:text-white dark:hover:text-red-300'
            }`}
          >
            <span className="text-lg leading-none" aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
