import { useState } from 'react'
import type { Category, LeitnerState, Term } from '../types/index'
import { CATEGORIES } from '../types/index'
import { CATEGORY_META } from '../categories'
import PointsOfSail from '../components/PointsOfSail'

interface Props {
  terms: Term[]
  leitnerState: LeitnerState
}

const ALL_CATEGORIES: readonly Category[] = CATEGORIES

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

function leitnerDot(termId: string, leitnerState: LeitnerState) {
  const entry = leitnerState[termId]
  if (!entry) return <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block flex-shrink-0" title="Not started" />
  if (entry.box === 3) return <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block flex-shrink-0" title="Known" />
  if (entry.box === 2) return <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block flex-shrink-0" title="Review" />
  return <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block flex-shrink-0" title="Learning" />
}

function TermCard({ term, leitnerState }: { term: Term; leitnerState: LeitnerState }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="bg-slate-800 dark:bg-slate-950 rounded-lg border border-slate-700 dark:border-slate-800 overflow-hidden"
    >
      <button
        className="w-full text-left px-4 py-3 flex items-center gap-3 min-h-[56px]"
        onClick={() => setExpanded(e => !e)}
      >
        {leitnerDot(term.id, leitnerState)}
        <div className="flex-1 min-w-0">
          <span className="font-bold text-white dark:text-red-300 text-base">{term.term}</span>
          {term.pron && (
            <span className="font-mono text-amber-300 dark:text-red-400 text-xs ml-2 whitespace-nowrap">
              {term.pron}
            </span>
          )}
          {term.aka && term.aka.length > 0 && (
            <span className="text-slate-400 dark:text-slate-500 text-xs ml-2">
              aka {term.aka.join(', ')}
            </span>
          )}
          <div className="text-slate-400 dark:text-red-400 text-sm truncate">{term.ru}</div>
        </div>
        <span className="text-slate-500 text-sm">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-700 dark:border-slate-800 pt-3 space-y-2">
          {term.pron && (
            <p className="text-sm">
              <span className="text-slate-500 dark:text-slate-600">Say it: </span>
              <span className="font-mono font-bold text-amber-300 dark:text-red-300 tracking-wide">{term.pron}</span>
            </p>
          )}
          <p className="text-slate-200 dark:text-red-200 text-sm leading-relaxed">{term.definition}</p>
          {term.example && (
            <p className="text-sky-200 dark:text-red-200 text-sm italic leading-relaxed border-l-2 border-sky-500/50 dark:border-red-500/50 pl-3">
              "{term.example}"
            </p>
          )}
          {term.aka && term.aka.length > 0 && (
            <p className="text-slate-400 dark:text-slate-500 text-xs">Also known as: {term.aka.join(', ')}</p>
          )}
          {term.role && roleBadge(term.role)}
        </div>
      )}
    </div>
  )
}

function CategorySection({
  category,
  terms,
  leitnerState,
  defaultExpanded = false,
}: {
  category: Category
  terms: Term[]
  leitnerState: LeitnerState
  defaultExpanded?: boolean
}) {
  const [open, setOpen] = useState(defaultExpanded)
  const meta = CATEGORY_META[category]

  return (
    <div className="bg-slate-800 dark:bg-slate-950 rounded-xl border border-slate-700 dark:border-slate-800 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-4 min-h-[60px] text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{meta.icon}</span>
          <div>
            <div className="font-semibold text-white dark:text-red-300">{meta.label}</div>
            <div className="text-slate-400 dark:text-slate-500 text-xs">{terms.length} terms</div>
          </div>
        </div>
        <span className="text-slate-400 text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-slate-700 dark:border-slate-800">
          {category === 'points-of-sail' && (
            <div className="py-4 bg-slate-900 dark:bg-black flex justify-center">
              <PointsOfSail />
            </div>
          )}
          <div className="divide-y divide-slate-700 dark:divide-slate-800">
            {terms.map(term => (
              <TermCard key={term.id} term={term} leitnerState={leitnerState} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Browse({ terms, leitnerState }: Props) {
  const [query, setQuery] = useState('')

  const q = query.toLowerCase().trim()

  const filteredTerms = q
    ? terms.filter(t =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        t.ru.toLowerCase().includes(q) ||
        (t.aka ?? []).some(a => a.toLowerCase().includes(q))
      )
    : []

  const byCategory = (cat: Category) => terms.filter(t => t.category === cat)

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-4 pb-2 sticky top-0 z-10 bg-slate-900 dark:bg-black">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="search"
            placeholder="Search terms, definitions, Russian…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-slate-800 dark:bg-slate-950 border border-slate-600 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white dark:text-red-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {query && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              onClick={() => setQuery('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {q ? (
          /* Search results */
          filteredTerms.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <div className="text-4xl mb-3">🔍</div>
              <div>No terms found for "{query}"</div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-slate-400 dark:text-slate-500 text-sm px-1">
                {filteredTerms.length} result{filteredTerms.length !== 1 ? 's' : ''}
              </div>
              {filteredTerms.map(term => (
                <TermCard key={term.id} term={term} leitnerState={leitnerState} />
              ))}
            </div>
          )
        ) : (
          /* Category grid */
          ALL_CATEGORIES.filter(cat => byCategory(cat).length > 0).map(cat => (
            <CategorySection
              key={cat}
              category={cat}
              terms={byCategory(cat)}
              leitnerState={leitnerState}
            />
          ))
        )}

        {terms.length === 0 && !q && (
          <div className="text-center py-16 text-slate-500">
            <div className="text-5xl mb-4">⚓</div>
            <div className="font-semibold">No vocabulary loaded yet</div>
            <div className="text-sm mt-2">Add terms to src/data/vocab.json to get started</div>
          </div>
        )}
      </div>
    </div>
  )
}
