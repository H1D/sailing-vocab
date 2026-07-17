import type { Category, ManoeuvreSequence, Term } from '../types/index'
import { categoryLabel } from '../categories'

interface Props {
  terms: Term[]
  sequences?: ManoeuvreSequence[]
}

const SHEET_CATEGORIES: Category[] = ['commands', 'winch-work', 'mooring']

function rolePill(role: string) {
  const cfg: Record<string, { label: string; cls: string }> = {
    helm: { label: 'H', cls: 'text-blue-300' },
    crew: { label: 'C', cls: 'text-green-300' },
    both: { label: 'B', cls: 'text-purple-300' },
  }
  const c = cfg[role] ?? { label: role, cls: 'text-slate-400' }
  return (
    <span className={`font-bold text-xs ${c.cls}`} title={role.toUpperCase()}>
      [{c.label}]
    </span>
  )
}

export default function CheatSheet({ terms, sequences = [] }: Props) {
  const relevantTerms = terms.filter(t => SHEET_CATEGORIES.includes(t.category as Category))
  const hasSequences = sequences.length > 0

  const handlePrint = () => window.print()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 dark:border-slate-800 no-print">
        <h2 className="text-lg font-bold text-white dark:text-red-300">⚓ Cheat Sheet</h2>
        <button
          onClick={handlePrint}
          className="print-button bg-slate-700 hover:bg-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 text-white text-sm px-4 py-2 rounded-lg transition-colors min-h-[44px]"
        >
          🖨️ Print
        </button>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 flex gap-4 text-xs text-slate-500 dark:text-slate-600 no-print border-b border-slate-700 dark:border-slate-800">
        <span className="text-blue-400">[H] = Helm</span>
        <span className="text-green-400">[C] = Crew</span>
        <span className="text-purple-400">[B] = Both</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 cheat-sheet-content">
        {relevantTerms.length === 0 && !hasSequences ? (
          <div className="text-center py-16 text-slate-500">
            <div className="text-5xl mb-4">📋</div>
            <div>No commands or winch/mooring terms loaded</div>
          </div>
        ) : (
          <>
            {/* Manoeuvre call-and-response sequences */}
            {hasSequences && (
              <div className="mb-6 break-inside-avoid">
                <h3 className="text-xs font-bold uppercase tracking-widest text-sky-400 dark:text-red-400 mb-3 border-b border-slate-700 dark:border-slate-800 pb-1">
                  Manoeuvre Call &amp; Response
                </h3>
                <div className="space-y-4">
                  {sequences.map(seq => (
                    <SequenceCard key={seq.id} sequence={seq} />
                  ))}
                </div>
              </div>
            )}

            {/* Flat term reference by category */}
            {SHEET_CATEGORIES.map(cat => {
              const catTerms = relevantTerms.filter(t => t.category === cat)
              if (catTerms.length === 0) return null
              return (
                <div key={cat} className="mb-5 break-inside-avoid">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 border-b border-slate-700 dark:border-slate-800 pb-1">
                    {categoryLabel(cat)}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
                    {catTerms.map(term => (
                      <div
                        key={term.id}
                        className="flex items-baseline gap-1.5 py-1 border-b border-slate-800 dark:border-slate-900 last:border-0 text-sm leading-snug"
                      >
                        <span className="font-semibold text-white dark:text-red-300 whitespace-nowrap flex-shrink-0">
                          {term.term}
                        </span>
                        {term.role && rolePill(term.role)}
                        <span className="text-slate-500 dark:text-slate-600 flex-shrink-0">→</span>
                        <span className="text-slate-300 dark:text-red-200 min-w-0">
                          {term.definition}
                          <span className="text-slate-500 dark:text-slate-600 ml-1 text-xs">
                            ({term.ru})
                          </span>
                          {term.example && (
                            <span className="block text-sky-300/80 dark:text-red-300/80 text-xs italic mt-0.5">
                              "{term.example}"
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

function stepColour(by: string): string {
  switch (by) {
    case 'helm':
      return 'border-blue-500 text-blue-300'
    case 'crew':
      return 'border-green-500 text-green-300'
    default:
      return 'border-purple-500 text-purple-300'
  }
}

function stepLabel(by: string): string {
  switch (by) {
    case 'helm':
      return 'HELM'
    case 'crew':
      return 'CREW'
    case 'both':
      return 'BOTH'
    default:
      return by.toUpperCase()
  }
}

function SequenceCard({ sequence }: { sequence: ManoeuvreSequence }) {
  return (
    <div className="bg-slate-800 dark:bg-slate-950 rounded-xl border border-slate-700 dark:border-slate-800 p-4 break-inside-avoid">
      <div className="mb-3">
        <span className="font-bold text-white dark:text-red-300 text-base">{sequence.name}</span>
        {sequence.ru && (
          <span className="text-slate-400 dark:text-slate-500 text-sm ml-2">{sequence.ru}</span>
        )}
      </div>
      <ol className="space-y-2">
        {sequence.steps.map((step, i) => (
          <li key={`${step.by}-${i}`} className="flex items-start gap-3">
            <span className="text-slate-500 dark:text-slate-600 text-sm font-mono flex-shrink-0 mt-0.5">
              {i + 1}.
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-bold text-sky-200 dark:text-red-200">"{step.call}"</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${stepColour(step.by)}`}
                >
                  {stepLabel(step.by)}
                </span>
              </div>
              {step.ru && (
                <div className="text-slate-400 dark:text-slate-500 text-sm">{step.ru}</div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
