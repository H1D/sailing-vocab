import { useEffect, useState } from 'react'

const VIEWS = ['#search', '#flashcards', '#quiz', '#cheatsheet'] as const
type View = typeof VIEWS[number]

export default function App() {
  const [view, setView] = useState<View>('#search')

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash as View
      if (VIEWS.includes(h)) setView(h)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <main className="flex-1 p-4">
        <h1 className="text-2xl font-bold text-sky-400">Sailing Vocab</h1>
        <p className="text-slate-400 mt-2">Current view: {view}</p>
        <p className="text-slate-500 mt-4">App shell loaded ✓ — views coming soon</p>
      </main>
      <nav className="bg-slate-800 border-t border-slate-700 flex">
        {[
          { hash: '#search', label: 'Search' },
          { hash: '#flashcards', label: 'Cards' },
          { hash: '#quiz', label: 'Quiz' },
          { hash: '#cheatsheet', label: 'Sheet' },
        ].map(({ hash, label }) => (
          <a
            key={hash}
            href={hash}
            className={`flex-1 text-center py-3 text-sm font-medium transition-colors ${
              view === hash ? 'text-sky-400 bg-slate-700' : 'text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </a>
        ))}
      </nav>
    </div>
  )
}
